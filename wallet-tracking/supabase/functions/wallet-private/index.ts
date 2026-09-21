// Phase 5.81 · 21.09.2026 23:36:49 CEST · vollständige Einzel-Wallet-Löschung via transaktionaler DB-RPC · Build 20260921-233649
import { withSupabase } from 'npm:@supabase/server@^1'

const ENCRYPTION_VERSION = 1
const KEY_VERSION = 1
const MASTER_SECRET_NAME = 'WALLET_ENCRYPTION_MASTER_KEY_V1'
const HKDF_SALT_TEXT = 'wallet-tracking/private-data/hkdf-salt/v1'
const TEST_FIELD = 'security_crypto_tests.test_ciphertext'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  })
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '')
}

function b64urlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }

  return out
}

function hexDecode(value: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(value) || value.length % 2 !== 0) {
    throw new Error('Ungueltiger Hex-Wert.')
  }

  const out = new Uint8Array(value.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function decodeMasterSecret(raw: string): Uint8Array {
  const trimmed = raw.trim()

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexDecode(trimmed)
  }

  try {
    const bytes = b64urlDecode(trimmed)
    if (bytes.byteLength === 32) return bytes
  } catch {
    // Einheitliche Fehlermeldung unten.
  }

  throw new Error(
    `${MASTER_SECRET_NAME} muss exakt 32 Byte enthalten ` +
      '(64 Hex-Zeichen oder entsprechender Base64/Base64URL-Wert).',
  )
}

function masterSecretBytes(): Uint8Array {
  const rawSecret = Deno.env.get(MASTER_SECRET_NAME)
  if (!rawSecret) {
    throw new Error(`${MASTER_SECRET_NAME} ist nicht gesetzt.`)
  }
  return decodeMasterSecret(rawSecret)
}

async function deriveUserKey(userId: string): Promise<CryptoKey> {
  const masterBytes = masterSecretBytes()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterBytes,
    'HKDF',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(HKDF_SALT_TEXT),
      info: encoder.encode(
        `wallet-tracking:user:${userId}:key-version:${KEY_VERSION}`,
      ),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function aad(userId: string, recordId: string, field: string): Uint8Array {
  return encoder.encode(
    `wallet-tracking|enc=${ENCRYPTION_VERSION}|key=${KEY_VERSION}` +
      `|user=${userId}|record=${recordId}|field=${field}`,
  )
}

async function encryptValue(
  key: CryptoKey,
  userId: string,
  recordId: string,
  field: string,
  plaintext: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad(userId, recordId, field),
      tagLength: 128,
    },
    key,
    encoder.encode(plaintext),
  )

  return [
    'wt1',
    `k${KEY_VERSION}`,
    b64urlEncode(iv),
    b64urlEncode(new Uint8Array(encrypted)),
  ].join('.')
}

async function decryptValue(
  key: CryptoKey,
  userId: string,
  recordId: string,
  field: string,
  envelope: string,
): Promise<string> {
  const parts = envelope.split('.')

  if (
    parts.length !== 4 ||
    parts[0] !== 'wt1' ||
    parts[1] !== `k${KEY_VERSION}`
  ) {
    throw new Error('Unbekanntes Ciphertext-Format oder Key-Version.')
  }

  const iv = b64urlDecode(parts[2])
  const ciphertext = b64urlDecode(parts[3])

  if (iv.byteLength !== 12) {
    throw new Error('Ungueltiger AES-GCM Nonce.')
  }

  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad(userId, recordId, field),
      tagLength: 128,
    },
    key,
    ciphertext,
  )

  return decoder.decode(plain)
}

async function decryptKnownField(
  key: CryptoKey,
  userId: string,
  recordId: string,
  envelope: unknown,
  fields: string[],
): Promise<string> {
  if (envelope == null || envelope === '') return ''
  if (typeof envelope !== 'string') throw new Error('Ciphertext ist kein String.')

  let lastError: unknown = null
  for (const field of fields) {
    try {
      return await decryptValue(key, userId, recordId, field, envelope)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Ciphertext konnte nicht entschluesselt werden.')
}

function randomTestPlaintext(): string {
  return `wallet-tracking-crypto-self-test:${crypto.randomUUID()}`
}

function cleanString(value: unknown, maxLength: number): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length > maxLength) {
    throw new Error(`Wert ist laenger als ${maxLength} Zeichen.`)
  }
  return text
}

function normalizeTeamAliasReference(value: unknown): string {
  const ref = typeof value === 'string' ? value.trim() : ''

  if (!ref || ref.length > 160) {
    throw new Error('Ungueltige Partner-Referenz.')
  }

  // TLN/VOW – bestehendes Format beibehalten.
  if (/^id:\d{1,78}$/i.test(ref)) {
    return `id:${ref.slice(3)}`
  }

  // DAO1 und APTMDAO – getrennte Namespaces; keine Alias-Zusammenführung.
  if (/^dao1:did:\d{1,78}$/i.test(ref)) {
    return `dao1:did:${ref.slice(9)}`
  }

  if (/^aptmdao:did:\d{1,78}$/i.test(ref)) {
    return `aptmdao:did:${ref.slice(12)}`
  }

  // Bestehende Wallet-Referenzen weiter lesen/speichern.
  if (/^wallet:0x[0-9a-fA-F]{40}$/.test(ref)) {
    return `wallet:${ref.slice(7).toLowerCase()}`
  }

  throw new Error(
    'Partner-Referenz muss id:<TLN-ID>, dao1:did:<DID>, aptmdao:did:<DID> oder wallet:<EVM-Adresse> sein.',
  )
}

async function referenceHmac(userId: string, reference: string): Promise<string> {
  // Der HMAC ist nur Lookup-Schluessel; Referenz und Alias bleiben verschluesselt.
  // Bestehende Alias-Zeilen werden beim Update ueber ihre entschluesselte Referenz gefunden.
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    masterSecretBytes(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      encoder.encode(`wallet-tracking:alias:${userId}:${reference}`),
    ),
  )
  return [...signature].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const WALLET_FIELDS = [
  {
    plain: 'label',
    column: 'label_ciphertext',
    aadFields: ['wallets.label_ciphertext', 'wallets.label'],
    max: 200,
  },
  {
    plain: 'owner_name',
    column: 'owner_name_ciphertext',
    aadFields: ['wallets.owner_name_ciphertext', 'wallets.owner_name'],
    max: 200,
  },
  {
    plain: 'evm_address',
    column: 'evm_address_ciphertext',
    aadFields: ['wallets.evm_address_ciphertext', 'wallets.evm_address'],
    max: 512,
  },
  {
    plain: 'btc_address',
    column: 'btc_address_ciphertext',
    aadFields: ['wallets.btc_address_ciphertext', 'wallets.btc_address'],
    max: 512,
  },
  {
    plain: 'xrp_address',
    column: 'xrp_address_ciphertext',
    aadFields: ['wallets.xrp_address_ciphertext', 'wallets.xrp_address'],
    max: 512,
  },
  {
    plain: 'sol_address',
    column: 'sol_address_ciphertext',
    aadFields: ['wallets.sol_address_ciphertext', 'wallets.sol_address'],
    max: 512,
  },
  {
    plain: 'tron_address',
    column: 'tron_address_ciphertext',
    aadFields: ['wallets.tron_address_ciphertext', 'wallets.tron_address'],
    max: 512,
  },
  {
    plain: 'akash_address',
    column: 'akash_address_ciphertext',
    aadFields: ['wallets.akash_address_ciphertext', 'wallets.akash_address'],
    max: 512,
  },
] as const

const ALIAS_REFERENCE_AAD = [
  'user_team_aliases_private.reference_ciphertext',
  'user_team_aliases_private.reference',
]
const ALIAS_VALUE_AAD = [
  'user_team_aliases_private.alias_ciphertext',
  'user_team_aliases_private.alias',
]

async function loadWallets(
  supabase: any,
  key: CryptoKey,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const columns = [
    'id',
    'user_id',
    'is_own_wallet',
    'encryption_version',
    'key_version',
    ...WALLET_FIELDS.map((f) => f.column),
  ].join(',')

  const { data, error } = await supabase
    .from('wallets')
    .select(columns)
    .eq('user_id', userId)
    .order('id', { ascending: true })

  if (error) throw new Error(`Wallets lesen fehlgeschlagen: ${error.message}`)

  const out: Record<string, unknown>[] = []

  for (const row of data ?? []) {
    if (row.user_id !== userId) {
      throw new Error('Wallet-Abfrage lieferte einen fremden User-Datensatz.')
    }

    if (
      Number(row.encryption_version) !== ENCRYPTION_VERSION ||
      Number(row.key_version) !== KEY_VERSION
    ) {
      throw new Error(`Wallet ${row.id}: unbekannte Encryption-/Key-Version.`)
    }

    const wallet: Record<string, unknown> = {
      id: row.id,
      is_own_wallet: row.is_own_wallet !== false,
    }

    for (const field of WALLET_FIELDS) {
      wallet[field.plain] = await decryptKnownField(
        key,
        userId,
        String(row.id),
        row[field.column],
        field.aadFields as unknown as string[],
      )
    }

    out.push(wallet)
  }

  return out
}

async function saveWallet(
  supabase: any,
  key: CryptoKey,
  userId: string,
  walletValue: unknown,
): Promise<string> {
  if (!walletValue || typeof walletValue !== 'object' || Array.isArray(walletValue)) {
    throw new Error('Wallet-Daten fehlen.')
  }

  const wallet = walletValue as Record<string, unknown>
  const suppliedId = typeof wallet.id === 'string' ? wallet.id.trim() : ''
  const recordId = suppliedId || crypto.randomUUID()

  if (suppliedId) {
    const { data: existing, error: existingError } = await supabase
      .from('wallets')
      .select('id,user_id')
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      throw new Error(`Wallet-Pruefung fehlgeschlagen: ${existingError.message}`)
    }
    if (!existing) {
      throw new Error('Wallet existiert nicht oder gehoert nicht zum angemeldeten User.')
    }
  }

  const encrypted: Record<string, unknown> = {
    id: recordId,
    user_id: userId,
    encryption_version: ENCRYPTION_VERSION,
    key_version: KEY_VERSION,
    is_own_wallet: wallet.is_own_wallet !== false,
  }

  for (const field of WALLET_FIELDS) {
    encrypted[field.column] = await encryptValue(
      key,
      userId,
      recordId,
      field.aadFields[0],
      cleanString(wallet[field.plain], field.max),
    )
  }

  let result
  if (suppliedId) {
    result = await supabase
      .from('wallets')
      .update(encrypted)
      .eq('id', recordId)
      .eq('user_id', userId)
  } else {
    result = await supabase.from('wallets').insert(encrypted)
  }

  if (result.error) {
    throw new Error(`Wallet speichern fehlgeschlagen: ${result.error.message}`)
  }

  return recordId
}

async function loadAliasRows(supabase: any, userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_team_aliases_private')
    .select(
      'id,user_id,encryption_version,key_version,reference_ciphertext,alias_ciphertext',
    )
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Partnernamen lesen fehlgeschlagen: ${error.message}`)
  }

  return data ?? []
}

async function decryptAliasRow(
  key: CryptoKey,
  userId: string,
  row: any,
): Promise<{ reference: string; alias: string }> {
  if (row.user_id !== userId) {
    throw new Error('Alias-Abfrage lieferte einen fremden User-Datensatz.')
  }

  if (
    Number(row.encryption_version) !== ENCRYPTION_VERSION ||
    Number(row.key_version) !== KEY_VERSION
  ) {
    throw new Error(`Alias ${row.id}: unbekannte Encryption-/Key-Version.`)
  }

  const recordId = String(row.id)
  const reference = await decryptKnownField(
    key,
    userId,
    recordId,
    row.reference_ciphertext,
    ALIAS_REFERENCE_AAD,
  )
  const alias = await decryptKnownField(
    key,
    userId,
    recordId,
    row.alias_ciphertext,
    ALIAS_VALUE_AAD,
  )

  return { reference, alias }
}

async function listAliases(
  supabase: any,
  key: CryptoKey,
  userId: string,
): Promise<Record<string, string>> {
  const rows = await loadAliasRows(supabase, userId)
  const aliases: Record<string, string> = {}

  for (const row of rows) {
    const item = await decryptAliasRow(key, userId, row)
    if (item.reference && item.alias) {
      aliases[item.reference] = item.alias
    }
  }

  return aliases
}

async function saveAlias(
  supabase: any,
  key: CryptoKey,
  userId: string,
  referenceValue: unknown,
  aliasValue: unknown,
): Promise<void> {
  const reference = normalizeTeamAliasReference(referenceValue)
  const alias = cleanString(aliasValue, 300)
  const rows = await loadAliasRows(supabase, userId)

  let existing: any = null

  for (const row of rows) {
    const item = await decryptAliasRow(key, userId, row)
    if (item.reference === reference) {
      existing = row
      break
    }
  }

  if (!alias) {
    if (!existing) return

    const { error } = await supabase
      .from('user_team_aliases_private')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', userId)

    if (error) throw new Error(`Partnername loeschen fehlgeschlagen: ${error.message}`)
    return
  }

  const recordId = existing ? String(existing.id) : crypto.randomUUID()
  const values = {
    id: recordId,
    user_id: userId,
    encryption_version: ENCRYPTION_VERSION,
    key_version: KEY_VERSION,
    reference_ciphertext: await encryptValue(
      key,
      userId,
      recordId,
      ALIAS_REFERENCE_AAD[0],
      reference,
    ),
    alias_ciphertext: await encryptValue(
      key,
      userId,
      recordId,
      ALIAS_VALUE_AAD[0],
      alias,
    ),
    // DB-Lookup-Schlüssel ist Pflicht (NOT NULL). Namespaced Referenz wird vollständig
    // gehasht, damit dao1:did:7803 und aptmdao:did:7803 garantiert getrennt bleiben.
    reference_hash: await referenceHmac(userId, reference),
  }

  const result = existing
    ? await supabase
        .from('user_team_aliases_private')
        .update(values)
        .eq('id', existing.id)
        .eq('user_id', userId)
    : await supabase.from('user_team_aliases_private').insert(values)

  if (result.error) {
    throw new Error(`Partnername speichern fehlgeschlagen: ${result.error.message}`)
  }
}

async function replaceAllAliases(
  supabase: any,
  key: CryptoKey,
  userId: string,
  aliasesValue: unknown,
): Promise<void> {
  if (!aliasesValue || typeof aliasesValue !== 'object' || Array.isArray(aliasesValue)) {
    throw new Error('aliases muss ein Objekt sein.')
  }

  const wanted = new Map<string, string>()

  for (const [rawReference, rawAlias] of Object.entries(
    aliasesValue as Record<string, unknown>,
  )) {
    const reference = normalizeTeamAliasReference(rawReference)
    const alias = cleanString(rawAlias, 300)
    if (alias) wanted.set(reference, alias)
  }

  // Absichtlich kein "alles loeschen und neu anlegen":
  // bestehende Record-IDs bleiben erhalten und damit auch ihre AAD-Bindung.
  const rows = await loadAliasRows(supabase, userId)
  const existingByReference = new Map<string, any>()

  for (const row of rows) {
    const item = await decryptAliasRow(key, userId, row)
    existingByReference.set(item.reference, row)
  }

  for (const [reference, row] of existingByReference.entries()) {
    if (!wanted.has(reference)) {
      const { error } = await supabase
        .from('user_team_aliases_private')
        .delete()
        .eq('id', row.id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Partnername loeschen fehlgeschlagen: ${error.message}`)
      }
    }
  }

  for (const [reference, alias] of wanted.entries()) {
    await saveAlias(supabase, key, userId, reference, alias)
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    // @supabase/server v1: userClaims is the normalized identity object.
    // The user UUID is `id`; the raw JWT subject is available as jwtClaims.sub.
    const userId =
      typeof ctx.userClaims?.id === 'string'
        ? ctx.userClaims.id
        : typeof ctx.jwtClaims?.sub === 'string'
          ? ctx.jwtClaims.sub
          : null

    if (!userId) {
      return json(
        { error: 'Authentifizierter User konnte nicht bestimmt werden.' },
        401,
      )
    }

    let body: Record<string, unknown>

    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const action =
      typeof body.action === 'string' ? body.action : 'self_test'

    try {
      const key = await deriveUserKey(userId)

      if (action === 'self_test') {
        const recordId = crypto.randomUUID()
        const plain = randomTestPlaintext()

        const ciphertext = await encryptValue(
          key,
          userId,
          recordId,
          TEST_FIELD,
          plain,
        )

        const roundtrip = await decryptValue(
          key,
          userId,
          recordId,
          TEST_FIELD,
          ciphertext,
        )

        return json({
          ok: roundtrip === plain,
          action,
          encryption_version: ENCRYPTION_VERSION,
          key_version: KEY_VERSION,
          algorithm: 'AES-256-GCM',
          kdf: 'HKDF-SHA-256',
          ciphertext_prefix: ciphertext.slice(0, 16),
        })
      }

      if (action === 'db_self_test') {
        const keep = body.keep === true
        const recordId = crypto.randomUUID()
        const plain = randomTestPlaintext()

        const ciphertext = await encryptValue(
          key,
          userId,
          recordId,
          TEST_FIELD,
          plain,
        )

        const { error: insertError } = await ctx.supabase
          .from('security_crypto_tests')
          .insert({
            id: recordId,
            user_id: userId,
            encryption_version: ENCRYPTION_VERSION,
            key_version: KEY_VERSION,
            test_ciphertext: ciphertext,
          })

        if (insertError) {
          throw new Error(
            `DB-Test Insert fehlgeschlagen: ${insertError.message}`,
          )
        }

        const { data: row, error: readError } = await ctx.supabase
          .from('security_crypto_tests')
          .select(
            'id,user_id,encryption_version,key_version,test_ciphertext',
          )
          .eq('id', recordId)
          .single()

        if (readError || !row) {
          throw new Error(
            `DB-Test Read fehlgeschlagen: ${
              readError?.message ?? 'keine Zeile'
            }`,
          )
        }

        if (row.user_id !== userId) {
          throw new Error('DB-Test lieferte einen fremden User-Datensatz.')
        }

        const roundtrip = await decryptValue(
          key,
          userId,
          recordId,
          TEST_FIELD,
          row.test_ciphertext,
        )

        if (!keep) {
          const { error: deleteError } = await ctx.supabase
            .from('security_crypto_tests')
            .delete()
            .eq('id', recordId)

          if (deleteError) {
            throw new Error(
              `DB-Test Cleanup fehlgeschlagen: ${deleteError.message}`,
            )
          }
        }

        return json({
          ok: roundtrip === plain,
          action,
          kept: keep,
          test_id: recordId,
          encryption_version: row.encryption_version,
          key_version: row.key_version,
          algorithm: 'AES-256-GCM',
          kdf: 'HKDF-SHA-256',
          ciphertext_prefix: row.test_ciphertext.slice(0, 16),
        })
      }

      if (action === 'cleanup_tests') {
        const { error } = await ctx.supabase
          .from('security_crypto_tests')
          .delete()

        if (error) {
          throw new Error(`Cleanup fehlgeschlagen: ${error.message}`)
        }

        return json({ ok: true, action })
      }

      if (action === 'wallet_list') {
        const wallets = await loadWallets(ctx.supabase, key, userId)
        return json({ ok: true, action, wallets })
      }

      if (action === 'wallet_save') {
        const id = await saveWallet(ctx.supabase, key, userId, body.wallet)
        return json({ ok: true, action, id })
      }

      if (action === 'wallet_delete') {
        const walletId = cleanString(body.wallet_id, 64)
        if (!/^[0-9a-fA-F-]{36}$/.test(walletId)) {
          throw new Error('Ungueltige Wallet-ID.')
        }

        // Zielwallet vor dem Purge sicher entschluesseln. So kann ein eventuell
        // vorhandener wallet:<adresse>-Alias über seinen usergebundenen HMAC-Key
        // im selben DB-Purge entfernt werden, ohne die Klartextadresse an SQL zu geben.
        const wallets = await loadWallets(ctx.supabase, key, userId)
        const target = wallets.find((w) => String(w.id) === walletId)
        if (!target) {
          throw new Error('Wallet existiert nicht oder gehoert nicht zum angemeldeten User.')
        }

        const evm = String(target.evm_address ?? '').trim().toLowerCase()
        const aliasHash = /^0x[0-9a-f]{40}$/.test(evm)
          ? await referenceHmac(userId, `wallet:${evm}`)
          : null

        const { data: result, error } = await ctx.supabase.rpc(
          'wallettracking_delete_wallet_complete',
          {
            p_wallet_id: walletId,
            p_wallet_alias_hash: aliasHash,
          },
        )

        if (error) {
          const hint = /wallettracking_delete_wallet_complete|function .* does not exist/i.test(error.message || '')
            ? ' Migration 069-wallet-complete-delete.sql zuerst in Supabase ausfuehren.'
            : ''
          throw new Error(`Wallet vollstaendig loeschen fehlgeschlagen: ${error.message}${hint}`)
        }

        return json({ ok: true, action, result })
      }

      if (action === 'team_alias_list') {
        const aliases = await listAliases(ctx.supabase, key, userId)
        return json({ ok: true, action, aliases })
      }

      if (action === 'team_alias_save') {
        await saveAlias(
          ctx.supabase,
          key,
          userId,
          body.reference,
          body.alias,
        )
        return json({ ok: true, action })
      }

      if (action === 'team_alias_replace_all') {
        await replaceAllAliases(
          ctx.supabase,
          key,
          userId,
          body.aliases,
        )
        return json({ ok: true, action })
      }

      return json({ error: 'Unbekannte action.' }, 400)
    } catch (error) {
      console.error('wallet-private:', error)

      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      )
    }
  }),
}
