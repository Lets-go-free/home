import { createClient } from 'npm:@supabase/supabase-js@2'

const ENCRYPTION_VERSION = 1
const KEY_VERSION = 1
const MASTER_SECRET_NAME = 'WALLET_ENCRYPTION_MASTER_KEY_V1'
const HKDF_SALT_TEXT = 'wallet-tracking/private-data/hkdf-salt/v1'
const TEST_FIELD = 'security_crypto_tests.test_ciphertext'

const encoder = new TextEncoder()
const decoder = new TextDecoder()


const TEAM_ALIAS_TABLE = 'user_team_aliases_private'
const TEAM_ALIAS_REF_FIELD = 'user_team_aliases_private.reference_ciphertext'
const TEAM_ALIAS_VALUE_FIELD = 'user_team_aliases_private.alias_ciphertext'

function normalizeTeamAliasReference(value: unknown): string {
  const ref = typeof value === 'string' ? value.trim() : ''
  if (!ref || ref.length > 160) throw new Error('Ungueltige Partner-Referenz.')
  if (/^id:\d{1,78}$/i.test(ref)) return `id:${ref.slice(3)}`
  if (/^wallet:0x[0-9a-fA-F]{40}$/.test(ref)) return `wallet:${ref.slice(7).toLowerCase()}`
  throw new Error('Partner-Referenz muss id:<TLN-ID> oder wallet:<EVM-Adresse> sein.')
}

function normalizeTeamAliasValue(value: unknown): string {
  const alias = typeof value === 'string' ? value.trim() : ''
  if (alias.length > 200) throw new Error('Partner-Name ist zu lang (max. 200 Zeichen).')
  return alias
}

async function teamAliasReferenceHash(userId: string, reference: string): Promise<string> {
  const rawSecret = Deno.env.get(MASTER_SECRET_NAME)
  if (!rawSecret) throw new Error(`${MASTER_SECRET_NAME} ist nicht gesetzt.`)
  const masterBytes = decodeMasterSecret(rawSecret)
  const hmacKey = await crypto.subtle.importKey(
    'raw', masterBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC', hmacKey,
    encoder.encode(`wallet-tracking|team-alias-ref|v1|user=${userId}|ref=${reference}`),
  )
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
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

  // Unser Setup erzeugt den Schluessel mit:
  //   openssl rand -hex 32
  // => exakt 64 Hex-Zeichen = 32 Byte.
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexDecode(trimmed)
  }

  // Zusaetzlich Base64/Base64URL akzeptieren, damit die Schluesselablage
  // spaeter ohne Datenmigration auf dieses Format wechseln koennte.
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

async function deriveUserKey(userId: string): Promise<CryptoKey> {
  const rawSecret = Deno.env.get(MASTER_SECRET_NAME)
  if (!rawSecret) {
    throw new Error(`${MASTER_SECRET_NAME} ist nicht gesetzt.`)
  }

  const masterBytes = decodeMasterSecret(rawSecret)

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

function randomTestPlaintext(): string {
  return `wallet-tracking-crypto-self-test:${crypto.randomUUID()}`
}


const WALLET_FIELDS = [
  ['label', 'label_ciphertext'],
  ['evm_address', 'evm_address_ciphertext'],
  ['btc_address', 'btc_address_ciphertext'],
  ['xrp_address', 'xrp_address_ciphertext'],
  ['sol_address', 'sol_address_ciphertext'],
  ['tron_address', 'tron_address_ciphertext'],
  ['akash_address', 'akash_address_ciphertext'],
] as const

type WalletPlainField = (typeof WALLET_FIELDS)[number][0]
type WalletCipherField = (typeof WALLET_FIELDS)[number][1]

function walletAadField(cipherField: WalletCipherField): string {
  return `wallets.${cipherField}`
}

function normalizeWalletInput(raw: unknown): Record<WalletPlainField, string> {
  const src =
    raw && typeof raw === 'object'
      ? (raw as Record<string, unknown>)
      : {}

  const out = {} as Record<WalletPlainField, string>

  for (const [plainField] of WALLET_FIELDS) {
    const value = src[plainField]
    out[plainField] =
      typeof value === 'string' ? value.trim() : ''
  }

  if (!out.label) out.label = 'Wallet'
  return out
}

async function encryptWalletValues(
  key: CryptoKey,
  userId: string,
  walletId: string,
  values: Record<WalletPlainField, string>,
): Promise<Record<WalletCipherField, string>> {
  const out = {} as Record<WalletCipherField, string>

  for (const [plainField, cipherField] of WALLET_FIELDS) {
    out[cipherField] = await encryptValue(
      key,
      userId,
      walletId,
      walletAadField(cipherField),
      values[plainField],
    )
  }

  return out
}

async function decryptWalletRow(
  key: CryptoKey,
  userId: string,
  row: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const walletId = String(row.id ?? '')
  if (!walletId) throw new Error('Wallet-Datensatz ohne ID.')

  const result: Record<string, unknown> = {
    id: walletId,
    created_at: row.created_at ?? null,
    encryption_version: row.encryption_version ?? null,
    key_version: row.key_version ?? null,
  }

  for (const [plainField, cipherField] of WALLET_FIELDS) {
    const ciphertext = row[cipherField]

    if (typeof ciphertext === 'string' && ciphertext.length > 0) {
      result[plainField] = await decryptValue(
        key,
        userId,
        walletId,
        walletAadField(cipherField),
        ciphertext,
      )
    } else {
      // Übergangsmodus für noch nicht migrierte bestehende Wallets.
      // Nach der produktiven Migration kann dieser Fallback entfernt werden.
      const legacy = row[plainField]
      result[plainField] = typeof legacy === 'string' ? legacy : ''
    }
  }

  return result
}

async function ensureWalletRowEncryptedForRead(
  userDb: any,
  key: CryptoKey,
  userId: string,
  sourceRow: Record<string, unknown>,
  selectColumns: string,
): Promise<Record<string, unknown>> {
  const walletId = String(sourceRow.id ?? '')
  if (!walletId) throw new Error('Wallet-Datensatz ohne ID.')

  const isEncrypted =
    sourceRow.encryption_version === ENCRYPTION_VERSION &&
    sourceRow.key_version === KEY_VERSION &&
    WALLET_FIELDS.every(([, cipherField]) =>
      typeof sourceRow[cipherField] === 'string' &&
      String(sourceRow[cipherField]).length > 0
    )

  if (isEncrypted) return sourceRow

  const originalValues = normalizeWalletInput(sourceRow)
  const originalMeta: Record<string, unknown> = {
    encryption_version: sourceRow.encryption_version ?? null,
    key_version: sourceRow.key_version ?? null,
  }
  for (const [, cipherField] of WALLET_FIELDS) {
    originalMeta[cipherField] = sourceRow[cipherField] ?? null
  }

  try {
    const encryptedValues = await encryptWalletValues(
      key, userId, walletId, originalValues,
    )

    const { error: stageError } = await userDb
      .from('wallets')
      .update({
        encryption_version: ENCRYPTION_VERSION,
        key_version: KEY_VERSION,
        ...encryptedValues,
      })
      .eq('id', walletId)

    if (stageError) {
      throw new Error(`Auto-Migration Stage 1 fehlgeschlagen: ${stageError.message}`)
    }

    const { data: stagedRow, error: stagedReadError } = await userDb
      .from('wallets')
      .select(selectColumns)
      .eq('id', walletId)
      .single()

    if (stagedReadError || !stagedRow) {
      throw new Error(
        `Auto-Migration Read fehlgeschlagen: ${stagedReadError?.message ?? 'keine Zeile'}`,
      )
    }

    const decoded = await decryptWalletRow(
      key, userId, stagedRow as Record<string, unknown>,
    )
    for (const [plainField] of WALLET_FIELDS) {
      if (decoded[plainField] !== originalValues[plainField]) {
        throw new Error(`Auto-Migration Verifikation fehlgeschlagen: ${plainField}`)
      }
    }

    const plaintextNulls: Record<string, null> = {}
    for (const [plainField] of WALLET_FIELDS) plaintextNulls[plainField] = null

    const { error: clearError } = await userDb
      .from('wallets')
      .update(plaintextNulls)
      .eq('id', walletId)

    if (clearError) {
      throw new Error(`Auto-Migration Plaintext-Cleanup fehlgeschlagen: ${clearError.message}`)
    }

    const { data: finalRow, error: finalReadError } = await userDb
      .from('wallets')
      .select(selectColumns)
      .eq('id', walletId)
      .single()

    if (finalReadError || !finalRow) {
      throw new Error(
        `Auto-Migration Final-Read fehlgeschlagen: ${finalReadError?.message ?? 'keine Zeile'}`,
      )
    }

    for (const [plainField] of WALLET_FIELDS) {
      if (finalRow[plainField] !== null) {
        throw new Error(`Auto-Migration Final-Check: ${plainField} ist nicht NULL.`)
      }
    }

    const finalDecoded = await decryptWalletRow(
      key, userId, finalRow as Record<string, unknown>,
    )
    for (const [plainField] of WALLET_FIELDS) {
      if (finalDecoded[plainField] !== originalValues[plainField]) {
        throw new Error(`Auto-Migration Final-Roundtrip fehlgeschlagen: ${plainField}`)
      }
    }

    return finalRow as Record<string, unknown>
  } catch (e) {
    const rollbackPayload: Record<string, unknown> = {...originalMeta}
    for (const [plainField] of WALLET_FIELDS) {
      rollbackPayload[plainField] = originalValues[plainField]
    }
    await userDb.from('wallets').update(rollbackPayload).eq('id', walletId)
    throw e
  }
}

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
        'access-control-allow-methods': 'POST, OPTIONS',
      },
    })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!accessToken) return json({ ok: false, error: 'Authorization Bearer Token fehlt.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKeysRaw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
  if (!supabaseUrl || !publishableKeysRaw) {
    return json({ ok: false, error: 'Supabase Runtime-Konfiguration fehlt.' }, 500)
  }

  let publishableKey: string
  try {
    const publishableKeys = JSON.parse(publishableKeysRaw)
    publishableKey = publishableKeys?.default
  } catch {
    return json({ ok: false, error: 'SUPABASE_PUBLISHABLE_KEYS ist kein gueltiges JSON.' }, 500)
  }
  if (!publishableKey || typeof publishableKey !== 'string') {
    return json({ ok: false, error: 'Default Publishable Key fehlt.' }, 500)
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken)
  if (authError || !authData.user?.id) {
    console.warn('wallet-private auth rejected:', authError?.message ?? 'kein User')
    return json({ ok: false, error: 'Ungueltige oder abgelaufene User-Session.' }, 401)
  }
  const userId = authData.user.id

  const userDb = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

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

      // Rein kryptografischer Test, ohne Datenbankzugriff.
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

      // Testet Verschluesselung + Speicherung + Lesen + Entschluesselung.
      // userDb respektiert bewusst die RLS-Policies des angemeldeten Users.
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

        const { error: insertError } = await userDb
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

        const { data: row, error: readError } = await userDb
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

        // Zusaetzliche Defense-in-Depth-Pruefung.
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
          const { error: deleteError } = await userDb
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


      // Produktiver Wallet-Leseweg: liefert dem authentifizierten Browser
      // ausschließlich die eigenen Wallets entschlüsselt zurück.
      // Bestehende Legacy-Zeilen werden bis zur Migration plaintext-fallback gelesen.
      if (action === 'wallet_list') {
        const selectColumns = [
          'id',
          'created_at',
          'encryption_version',
          'key_version',
          ...WALLET_FIELDS.flatMap(([plainField, cipherField]) => [
            plainField,
            cipherField,
          ]),
        ].join(',')

        const { data: rows, error } = await userDb
          .from('wallets')
          .select(selectColumns)
          .order('created_at', { ascending: true })

        if (error) {
          throw new Error(`Wallet-Lesen fehlgeschlagen: ${error.message}`)
        }

        const wallets = []
        let autoMigrated = 0
        for (const sourceRow of rows ?? []) {
          const wasLegacy = !(
            sourceRow.encryption_version === ENCRYPTION_VERSION &&
            sourceRow.key_version === KEY_VERSION &&
            WALLET_FIELDS.every(([, cipherField]) =>
              typeof sourceRow[cipherField] === 'string' &&
              String(sourceRow[cipherField]).length > 0
            )
          )

          const row = await ensureWalletRowEncryptedForRead(
            userDb,
            key,
            userId,
            sourceRow as Record<string, unknown>,
            selectColumns,
          )
          if (wasLegacy) autoMigrated++

          wallets.push(
            await decryptWalletRow(
              key,
              userId,
              row as Record<string, unknown>,
            ),
          )
        }

        return json({
          ok: true,
          action,
          wallets,
          count: wallets.length,
          auto_migrated: autoMigrated,
        })
      }


      // User-spezifische, verschluesselte Partnernamen/Aliase.
      // Weder Partner-Referenz noch Alias liegen im Klartext in der Datenbank.
      if (action === 'team_alias_list') {
        const { data: rows, error } = await userDb
          .from(TEAM_ALIAS_TABLE)
          .select('id,user_id,encryption_version,key_version,reference_ciphertext,alias_ciphertext,updated_at')
          .order('updated_at', { ascending: true })

        if (error) throw new Error(`Partner-Namen lesen fehlgeschlagen: ${error.message}`)

        const aliases: Record<string, string> = {}
        for (const row of rows ?? []) {
          if (row.user_id !== userId) throw new Error('Fremder Alias-Datensatz erhalten.')
          const recordId = String(row.id)
          const reference = await decryptValue(key, userId, recordId, TEAM_ALIAS_REF_FIELD, row.reference_ciphertext)
          const alias = await decryptValue(key, userId, recordId, TEAM_ALIAS_VALUE_FIELD, row.alias_ciphertext)
          if (reference && alias) aliases[reference] = alias
        }
        return json({ ok: true, action, aliases, count: Object.keys(aliases).length })
      }

      if (action === 'team_alias_save') {
        const reference = normalizeTeamAliasReference(body.reference)
        const alias = normalizeTeamAliasValue(body.alias)
        const referenceHash = await teamAliasReferenceHash(userId, reference)

        if (!alias) {
          const { error } = await userDb.from(TEAM_ALIAS_TABLE).delete().eq('reference_hash', referenceHash)
          if (error) throw new Error(`Partner-Name loeschen fehlgeschlagen: ${error.message}`)
          return json({ ok: true, action, reference, deleted: true })
        }

        const { data: existing, error: existingError } = await userDb
          .from(TEAM_ALIAS_TABLE).select('id').eq('reference_hash', referenceHash).maybeSingle()
        if (existingError) throw new Error(`Partner-Name pruefen fehlgeschlagen: ${existingError.message}`)

        const recordId = existing?.id ? String(existing.id) : crypto.randomUUID()
        const referenceCiphertext = await encryptValue(key, userId, recordId, TEAM_ALIAS_REF_FIELD, reference)
        const aliasCiphertext = await encryptValue(key, userId, recordId, TEAM_ALIAS_VALUE_FIELD, alias)
        const payload = {
          id: recordId,
          user_id: userId,
          reference_hash: referenceHash,
          encryption_version: ENCRYPTION_VERSION,
          key_version: KEY_VERSION,
          reference_ciphertext: referenceCiphertext,
          alias_ciphertext: aliasCiphertext,
          updated_at: new Date().toISOString(),
        }

        const { error } = await userDb.from(TEAM_ALIAS_TABLE).upsert(payload, { onConflict: 'user_id,reference_hash' })
        if (error) throw new Error(`Partner-Name speichern fehlgeschlagen: ${error.message}`)
        return json({ ok: true, action, reference, deleted: false, encryption_version: ENCRYPTION_VERSION, key_version: KEY_VERSION })
      }

      if (action === 'team_alias_replace_all') {
        const rawAliases = body.aliases && typeof body.aliases === 'object'
          ? body.aliases as Record<string, unknown>
          : {}
        const entries = Object.entries(rawAliases)
        if (entries.length > 1000) throw new Error('Zu viele Partner-Aliase in einem Request.')

        const desired = new Map<string, { reference: string; alias: string; hash: string }>()
        for (const [rawRef, rawAlias] of entries) {
          const reference = normalizeTeamAliasReference(rawRef)
          const alias = normalizeTeamAliasValue(rawAlias)
          if (!alias) continue
          const hash = await teamAliasReferenceHash(userId, reference)
          desired.set(hash, { reference, alias, hash })
        }

        const { data: existingRows, error: listError } = await userDb
          .from(TEAM_ALIAS_TABLE).select('id,reference_hash')
        if (listError) throw new Error(`Partner-Namen Bestand lesen fehlgeschlagen: ${listError.message}`)
        const existingByHash = new Map<string, string>((existingRows ?? []).map((r) => [String(r.reference_hash), String(r.id)] as [string, string]))

        const upserts = []
        for (const item of desired.values()) {
          const recordId = existingByHash.get(item.hash) ?? crypto.randomUUID()
          upserts.push({
            id: recordId,
            user_id: userId,
            reference_hash: item.hash,
            encryption_version: ENCRYPTION_VERSION,
            key_version: KEY_VERSION,
            reference_ciphertext: await encryptValue(key, userId, recordId, TEAM_ALIAS_REF_FIELD, item.reference),
            alias_ciphertext: await encryptValue(key, userId, recordId, TEAM_ALIAS_VALUE_FIELD, item.alias),
            updated_at: new Date().toISOString(),
          })
        }
        if (upserts.length) {
          const { error } = await userDb.from(TEAM_ALIAS_TABLE).upsert(upserts, { onConflict: 'user_id,reference_hash' })
          if (error) throw new Error(`Partner-Namen Bulk-Speichern fehlgeschlagen: ${error.message}`)
        }

        const staleIds = (existingRows ?? [])
          .filter((r) => !desired.has(String(r.reference_hash)))
          .map((r) => String(r.id))
        if (staleIds.length) {
          const { error } = await userDb.from(TEAM_ALIAS_TABLE).delete().in('id', staleIds)
          if (error) throw new Error(`Alte Partner-Namen loeschen fehlgeschlagen: ${error.message}`)
        }

        return json({ ok: true, action, count: desired.size, deleted: staleIds.length, encryption_version: ENCRYPTION_VERSION, key_version: KEY_VERSION })
      }

      // Produktiver verschlüsselter Save-Weg.
      // Noch nicht in app.js aktiviert; dadurch bleibt die bestehende Hauptseite
      // während Phase 3a unverändert.
      if (action === 'wallet_save') {
        const walletRaw =
          body.wallet && typeof body.wallet === 'object'
            ? (body.wallet as Record<string, unknown>)
            : {}

        const values = normalizeWalletInput(walletRaw)
        const requestedId =
          typeof walletRaw.id === 'string' && walletRaw.id.trim()
            ? walletRaw.id.trim()
            : null
        const walletId = requestedId ?? crypto.randomUUID()

        if (requestedId) {
          const { data: existing, error: existingError } = await userDb
            .from('wallets')
            .select('id')
            .eq('id', walletId)
            .maybeSingle()

          if (existingError) {
            throw new Error(
              `Wallet-Pruefung fehlgeschlagen: ${existingError.message}`,
            )
          }
          if (!existing) {
            return json({ ok: false, error: 'Wallet nicht gefunden.' }, 404)
          }
        }

        const encrypted = await encryptWalletValues(
          key,
          userId,
          walletId,
          values,
        )

        const encryptedPayload: Record<string, unknown> = {
          id: walletId,
          user_id: userId,
          encryption_version: ENCRYPTION_VERSION,
          key_version: KEY_VERSION,
          label: null,
          evm_address: null,
          btc_address: null,
          xrp_address: null,
          sol_address: null,
          tron_address: null,
          akash_address: null,
          ...encrypted,
        }

        if (requestedId) {
          const { error } = await userDb
            .from('wallets')
            .update(encryptedPayload)
            .eq('id', walletId)

          if (error) {
            throw new Error(`Wallet-Update fehlgeschlagen: ${error.message}`)
          }
        } else {
          const { error } = await userDb
            .from('wallets')
            .insert(encryptedPayload)

          if (error) {
            throw new Error(`Wallet-Insert fehlgeschlagen: ${error.message}`)
          }
        }

        return json({
          ok: true,
          action,
          id: walletId,
          created: !requestedId,
          encryption_version: ENCRYPTION_VERSION,
          key_version: KEY_VERSION,
        })
      }


      // Phase 3b Dry Run:
      // prueft alle eigenen Legacy-Wallets ohne DB-Aenderung.
      // Fuer jede Legacy-Zeile wird ein vollstaendiger Encrypt/Decrypt-Roundtrip
      // im Speicher ausgefuehrt. Erst wenn alle Legacy-Zeilen PASS sind, darf die
      // echte Migration gestartet werden.
      if (action === 'wallet_migration_dry_run') {
        const selectColumns = [
          'id',
          'created_at',
          'encryption_version',
          'key_version',
          ...WALLET_FIELDS.flatMap(([plainField, cipherField]) => [
            plainField,
            cipherField,
          ]),
        ].join(',')

        const { data: rows, error } = await userDb
          .from('wallets')
          .select(selectColumns)
          .order('created_at', { ascending: true })

        if (error) {
          throw new Error(
            `Wallet-Dry-Run Lesen fehlgeschlagen: ${error.message}`,
          )
        }

        const results: Array<Record<string, unknown>> = []
        let legacy = 0
        let encrypted = 0
        let failed = 0

        for (const row of rows ?? []) {
          const walletId = String(row.id ?? '')
          if (!walletId) {
            failed++
            results.push({
              id: null,
              status: 'FAIL',
              reason: 'Wallet-Datensatz ohne ID.',
            })
            continue
          }

          const isEncrypted =
            row.encryption_version === ENCRYPTION_VERSION &&
            row.key_version === KEY_VERSION &&
            WALLET_FIELDS.every(([, cipherField]) =>
              typeof row[cipherField] === 'string' &&
              String(row[cipherField]).length > 0
            )

          if (isEncrypted) {
            try {
              await decryptWalletRow(
                key,
                userId,
                row as Record<string, unknown>,
              )
              encrypted++
              results.push({
                id: walletId,
                status: 'ALREADY_ENCRYPTED',
              })
            } catch (e) {
              failed++
              results.push({
                id: walletId,
                status: 'FAIL',
                reason:
                  e instanceof Error ? e.message : 'Entschluesselung fehlgeschlagen.',
              })
            }
            continue
          }

          legacy++
          try {
            const values = normalizeWalletInput(row)
            const encryptedValues = await encryptWalletValues(
              key,
              userId,
              walletId,
              values,
            )

            const simulatedRow: Record<string, unknown> = {
              id: walletId,
              created_at: row.created_at ?? null,
              encryption_version: ENCRYPTION_VERSION,
              key_version: KEY_VERSION,
              ...encryptedValues,
            }

            const decoded = await decryptWalletRow(
              key,
              userId,
              simulatedRow,
            )

            for (const [plainField] of WALLET_FIELDS) {
              if (decoded[plainField] !== values[plainField]) {
                throw new Error(
                  `Roundtrip-Mismatch bei ${plainField}.`,
                )
              }
            }

            results.push({
              id: walletId,
              status: 'PASS',
            })
          } catch (e) {
            failed++
            results.push({
              id: walletId,
              status: 'FAIL',
              reason:
                e instanceof Error ? e.message : 'Dry Run fehlgeschlagen.',
            })
          }
        }

        return json({
          ok: failed === 0,
          action,
          total: (rows ?? []).length,
          legacy,
          already_encrypted: encrypted,
          failed,
          ready_to_migrate: failed === 0,
          results,
        })
      }

      // Phase 3b echte Migration.
      // Schutz gegen versehentliche Ausfuehrung: explizites confirm erforderlich.
      // Ablauf pro Wallet:
      // 1) Legacywerte lesen
      // 2) Ciphertext erzeugen und im Speicher verifizieren
      // 3) Ciphertext + Version speichern, Plaintext NOCH behalten
      // 4) aus DB lesen und entschluesseln/vergleichen
      // 5) erst danach Plaintext-Spalten auf NULL setzen
      // 6) final erneut lesen, Plaintext-NULL + Entschluesselung verifizieren
      // Bei Fehler wird fuer diese Wallet-Zeile soweit moeglich auf Legacy
      // zurueckgerollt. Andere Wallets werden nicht angefasst, wenn vorher
      // bereits ein Fehler aufgetreten ist.
      if (action === 'wallet_migrate') {
        if (body.confirm !== 'MIGRATE_WALLETS_V1') {
          return json(
            {
              ok: false,
              error:
                'Migration nicht bestaetigt. confirm=MIGRATE_WALLETS_V1 erforderlich.',
            },
            400,
          )
        }

        const selectColumns = [
          'id',
          'created_at',
          'encryption_version',
          'key_version',
          ...WALLET_FIELDS.flatMap(([plainField, cipherField]) => [
            plainField,
            cipherField,
          ]),
        ].join(',')

        const { data: rows, error } = await userDb
          .from('wallets')
          .select(selectColumns)
          .order('created_at', { ascending: true })

        if (error) {
          throw new Error(
            `Wallet-Migration Lesen fehlgeschlagen: ${error.message}`,
          )
        }

        // Safety gate: zuerst ALLE Zeilen genau wie im Dry Run pruefen.
        for (const row of rows ?? []) {
          const walletId = String(row.id ?? '')
          if (!walletId) {
            return json({
              ok: false,
              action,
              migrated: 0,
              error: 'Safety Gate fehlgeschlagen: Wallet ohne ID.',
            }, 409)
          }

          const isEncrypted =
            row.encryption_version === ENCRYPTION_VERSION &&
            row.key_version === KEY_VERSION &&
            WALLET_FIELDS.every(([, cipherField]) =>
              typeof row[cipherField] === 'string' &&
              String(row[cipherField]).length > 0
            )

          if (isEncrypted) {
            try {
              await decryptWalletRow(
                key,
                userId,
                row as Record<string, unknown>,
              )
            } catch (e) {
              return json({
                ok: false,
                action,
                migrated: 0,
                error: `Safety Gate: bereits verschluesseltes Wallet ${walletId} ist nicht lesbar: ${
                  e instanceof Error ? e.message : 'unbekannter Fehler'
                }`,
              }, 409)
            }
            continue
          }

          try {
            const values = normalizeWalletInput(row)
            const cipher = await encryptWalletValues(
              key,
              userId,
              walletId,
              values,
            )
            const simulatedRow: Record<string, unknown> = {
              id: walletId,
              created_at: row.created_at ?? null,
              encryption_version: ENCRYPTION_VERSION,
              key_version: KEY_VERSION,
              ...cipher,
            }
            const decoded = await decryptWalletRow(
              key,
              userId,
              simulatedRow,
            )
            for (const [plainField] of WALLET_FIELDS) {
              if (decoded[plainField] !== values[plainField]) {
                throw new Error(`Mismatch bei ${plainField}`)
              }
            }
          } catch (e) {
            return json({
              ok: false,
              action,
              migrated: 0,
              error: `Safety Gate: Legacy-Wallet ${walletId} ist nicht migrationsbereit: ${
                e instanceof Error ? e.message : 'unbekannter Fehler'
              }`,
            }, 409)
          }
        }

        const results: Array<Record<string, unknown>> = []
        let migrated = 0
        let skipped = 0

        for (const sourceRow of rows ?? []) {
          const walletId = String(sourceRow.id ?? '')

          const isEncrypted =
            sourceRow.encryption_version === ENCRYPTION_VERSION &&
            sourceRow.key_version === KEY_VERSION &&
            WALLET_FIELDS.every(([, cipherField]) =>
              typeof sourceRow[cipherField] === 'string' &&
              String(sourceRow[cipherField]).length > 0
            )

          if (isEncrypted) {
            skipped++
            results.push({
              id: walletId,
              status: 'ALREADY_ENCRYPTED',
            })
            continue
          }

          const originalValues = normalizeWalletInput(sourceRow)

          // Fuer Rollback die bisherigen technischen Encryption-Felder sichern.
          const originalMeta: Record<string, unknown> = {
            encryption_version: sourceRow.encryption_version ?? null,
            key_version: sourceRow.key_version ?? null,
          }
          for (const [, cipherField] of WALLET_FIELDS) {
            originalMeta[cipherField] = sourceRow[cipherField] ?? null
          }

          let plaintextCleared = false

          try {
            const encryptedValues = await encryptWalletValues(
              key,
              userId,
              walletId,
              originalValues,
            )

            // Stage 1: Ciphertext speichern, Legacy-Plaintext bewusst noch behalten.
            const { error: stageError } = await userDb
              .from('wallets')
              .update({
                encryption_version: ENCRYPTION_VERSION,
                key_version: KEY_VERSION,
                ...encryptedValues,
              })
              .eq('id', walletId)

            if (stageError) {
              throw new Error(
                `Stage-1-Update fehlgeschlagen: ${stageError.message}`,
              )
            }

            const { data: stagedRow, error: stagedReadError } = await userDb
              .from('wallets')
              .select(selectColumns)
              .eq('id', walletId)
              .single()

            if (stagedReadError || !stagedRow) {
              throw new Error(
                `Stage-1-Read fehlgeschlagen: ${
                  stagedReadError?.message ?? 'keine Zeile'
                }`,
              )
            }

            const stagedDecoded = await decryptWalletRow(
              key,
              userId,
              stagedRow as Record<string, unknown>,
            )

            for (const [plainField] of WALLET_FIELDS) {
              if (stagedDecoded[plainField] !== originalValues[plainField]) {
                throw new Error(
                  `Stage-1-Verifikation fehlgeschlagen: ${plainField}`,
                )
              }
            }

            // Stage 2: Erst nach erfolgreicher Ciphertext-Verifikation Plaintext entfernen.
            const plaintextNulls: Record<string, null> = {}
            for (const [plainField] of WALLET_FIELDS) {
              plaintextNulls[plainField] = null
            }

            const { error: clearError } = await userDb
              .from('wallets')
              .update(plaintextNulls)
              .eq('id', walletId)

            if (clearError) {
              throw new Error(
                `Stage-2-Plaintext-Cleanup fehlgeschlagen: ${clearError.message}`,
              )
            }
            plaintextCleared = true

            const { data: finalRow, error: finalReadError } = await userDb
              .from('wallets')
              .select(selectColumns)
              .eq('id', walletId)
              .single()

            if (finalReadError || !finalRow) {
              throw new Error(
                `Final-Read fehlgeschlagen: ${
                  finalReadError?.message ?? 'keine Zeile'
                }`,
              )
            }

            for (const [plainField] of WALLET_FIELDS) {
              if (finalRow[plainField] !== null) {
                throw new Error(
                  `Final-Check: Plaintext ${plainField} ist nicht NULL.`,
                )
              }
            }

            const finalDecoded = await decryptWalletRow(
              key,
              userId,
              finalRow as Record<string, unknown>,
            )

            for (const [plainField] of WALLET_FIELDS) {
              if (finalDecoded[plainField] !== originalValues[plainField]) {
                throw new Error(
                  `Final-Entschluesselung fehlgeschlagen: ${plainField}`,
                )
              }
            }

            migrated++
            results.push({
              id: walletId,
              status: 'MIGRATED',
            })
          } catch (e) {
            // Best-effort Rollback dieses Wallets auf den exakten Legacy-Inhalt.
            const rollbackPayload: Record<string, unknown> = {
              ...originalMeta,
            }
            for (const [plainField] of WALLET_FIELDS) {
              rollbackPayload[plainField] = originalValues[plainField]
            }

            const { error: rollbackError } = await userDb
              .from('wallets')
              .update(rollbackPayload)
              .eq('id', walletId)

            results.push({
              id: walletId,
              status: rollbackError ? 'FAIL_ROLLBACK_ERROR' : 'FAIL_ROLLED_BACK',
              plaintext_had_been_cleared: plaintextCleared,
              reason:
                e instanceof Error ? e.message : 'Migration fehlgeschlagen.',
              rollback_error: rollbackError?.message ?? null,
            })

            return json({
              ok: false,
              action,
              migrated,
              skipped,
              failed_wallet_id: walletId,
              rollback_ok: !rollbackError,
              results,
            }, 500)
          }
        }

        return json({
          ok: true,
          action,
          total: (rows ?? []).length,
          migrated,
          skipped,
          failed: 0,
          results,
        })
      }

      // Zeigt nur den Migrationsstatus; veraendert keine produktiven Wallets.
      if (action === 'wallet_migration_status') {
        const { data: rows, error } = await userDb
          .from('wallets')
          .select('id,encryption_version,key_version,label_ciphertext')

        if (error) {
          throw new Error(
            `Wallet-Migrationsstatus fehlgeschlagen: ${error.message}`,
          )
        }

        const allRows = rows ?? []
        const encrypted = allRows.filter(
          (row) =>
            row.encryption_version === ENCRYPTION_VERSION &&
            row.key_version === KEY_VERSION &&
            typeof row.label_ciphertext === 'string' &&
            row.label_ciphertext.length > 0,
        ).length

        return json({
          ok: true,
          action,
          total: allRows.length,
          encrypted,
          legacy: allRows.length - encrypted,
        })
      }

      // Sicherer Phase-3a-Roundtrip direkt gegen die produktive wallets-Tabelle.
      // Erzeugt nur eine temporaere Testzeile und loescht sie wieder.
      if (action === 'wallet_db_self_test') {
        const walletId = crypto.randomUUID()
        const testValues: Record<WalletPlainField, string> = {
          label: `WT encrypted test ${randomHex(4)}`,
          evm_address: `0x${randomHex(20)}`,
          btc_address: `wt-test-btc-${randomHex(8)}`,
          xrp_address: `wt-test-xrp-${randomHex(8)}`,
          sol_address: `wt-test-sol-${randomHex(8)}`,
          tron_address: `wt-test-tron-${randomHex(8)}`,
          akash_address: `wt-test-akash-${randomHex(8)}`,
        }

        const encrypted = await encryptWalletValues(
          key,
          userId,
          walletId,
          testValues,
        )

        const { error: insertError } = await userDb
          .from('wallets')
          .insert({
            id: walletId,
            user_id: userId,
            encryption_version: ENCRYPTION_VERSION,
            key_version: KEY_VERSION,
            label: null,
            evm_address: null,
            btc_address: null,
            xrp_address: null,
            sol_address: null,
            tron_address: null,
            akash_address: null,
            ...encrypted,
          })

        if (insertError) {
          throw new Error(
            `Wallet-DB-Test Insert fehlgeschlagen: ${insertError.message}`,
          )
        }

        try {
          const selectColumns = [
            'id',
            'created_at',
            'encryption_version',
            'key_version',
            ...WALLET_FIELDS.flatMap(([plainField, cipherField]) => [
              plainField,
              cipherField,
            ]),
          ].join(',')

          const { data: row, error: readError } = await userDb
            .from('wallets')
            .select(selectColumns)
            .eq('id', walletId)
            .single()

          if (readError || !row) {
            throw new Error(
              `Wallet-DB-Test Read fehlgeschlagen: ${
                readError?.message ?? 'keine Zeile'
              }`,
            )
          }

          for (const [plainField] of WALLET_FIELDS) {
            if (row[plainField] !== null) {
              throw new Error(
                `Wallet-DB-Test: Plaintext-Spalte ${plainField} ist nicht NULL.`,
              )
            }
          }

          const decoded = await decryptWalletRow(
            key,
            userId,
            row as Record<string, unknown>,
          )

          for (const [plainField] of WALLET_FIELDS) {
            if (decoded[plainField] !== testValues[plainField]) {
              throw new Error(
                `Wallet-DB-Test Roundtrip fehlgeschlagen: ${plainField}`,
              )
            }
          }
        } finally {
          const { error: deleteError } = await userDb
            .from('wallets')
            .delete()
            .eq('id', walletId)

          if (deleteError) {
            throw new Error(
              `Wallet-DB-Test Cleanup fehlgeschlagen: ${deleteError.message}`,
            )
          }
        }

        return json({
          ok: true,
          action,
          test_id: walletId,
          cleaned_up: true,
          plaintext_columns_null: true,
          encryption_version: ENCRYPTION_VERSION,
          key_version: KEY_VERSION,
          algorithm: 'AES-256-GCM',
          kdf: 'HKDF-SHA-256',
        })
      }

      // Loescht nur die eigenen Crypto-Testzeilen des angemeldeten Users.
      if (action === 'cleanup_tests') {
        const { error } = await userDb
          .from('security_crypto_tests')
          .delete()

        if (error) {
          throw new Error(`Cleanup fehlgeschlagen: ${error.message}`)
        }

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
})
