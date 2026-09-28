// Phase 6.54 · 28.09.2026 03:44:15 CEST: TLN Fresh-User Detail-Backfill robust gegen fehlende/inkompatible Step-6-Valuation-Caches: Bewertungs-Lookup ist optional und darf den bereits verifizierten Staking/Reward/Referral/Bonus-Detailbackfill nicht mehr komplett abbrechen. Build 20260928-034415.
// Phase 6.53 · 28.09.2026 02:44:40 CEST: TLN globaler Detailcache v2. Beim sanitisierten Fresh-User-Backfill werden vorhandene Step-6-USD-Bewertungen aus dem privaten technischen snapshot-valuation-Cache derselben Source-Wallet in die öffentlichen On-Chain-Lots übernommen. Build 20260928-024440.
// Phase 6.52 · 28.09.2026 02:20:05 CEST: TLN Fresh-User Detail-Reuse. Neue geschützte Aktion tln_detail_snapshot übernimmt nur rein on-chain abgeleitete Staking-/Reward-/Referral-/Bonus-Details aus einem bereits verifizierten Discovery-Snapshot derselben eigenen Wallet, entfernt userbezogene/private Felder, persistiert das Ergebnis im globalen technischen Cache und liefert es cache-only zurück. Kein Blockchain-Scan. Build 20260928-022005.
// Phase 6.49 · 28.09.2026 01:01:15 CEST: TLN Fresh-User Reward-Backfill v2. Zentrale Raw→Human-Normalisierung für Staking/Bonus/Referral; verifizierte TLN/TLN+/TLNX-Decimale; Legacy raw-scaled amount als JS-Number/Scientific-Notation wird tokengebunden erkannt. Ausgabe trägt amountUnit=human/schemaVersion=2. Build 20260928-010115.
// Phase 5.94 Rebuild · 22.09.2026 14:03:48 CEST: Unveränderte 5.94-Userdaten-Löschlogik, Release-Paketstruktur korrigiert. Build 20260922-140348.
// Phase 5.94 · 22.09.2026 14:03:48 CEST: Neue geschützte Aktion user_data_delete ruft die transaktionale Komplettlöschung aller userbezogenen WalletTracking-Daten auf. Build 20260922-140348.
// Phase 5.92 · 22.09.2026 11:01:30 CEST: Authentifizierter NFT-Metadata-Proxy für api.aptmdao.io/nft/<ID> mit enger Allowlist, Timeout und Größenlimit. Build 20260922-110130.
// Phase 5.81 · 21.09.2026 23:36:49 CEST · vollständige Einzel-Wallet-Löschung via transaktionaler DB-RPC · Build 20260921-233649
import { withSupabase } from 'npm:@supabase/server@^1'
import { createClient } from 'npm:@supabase/supabase-js@^2'

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

async function fetchAllowedNftMetadata(rawUrl: unknown): Promise<{found: boolean; status: number; metadata: Record<string, unknown> | null; source_url: string}> {
  const value = cleanString(rawUrl, 1000)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Ungueltige NFT-Metadaten-URL.')
  }

  if (url.protocol !== 'https:') {
    throw new Error('NFT-Metadaten duerfen nur ueber HTTPS geladen werden.')
  }

  const host = url.hostname.toLowerCase()
  const allowed = host === 'api.aptmdao.io' && /^\/nft\/\d+\/?$/.test(url.pathname)
  if (!allowed) {
    throw new Error('NFT-Metadaten-Domain oder Pfad ist nicht freigegeben.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'accept': 'application/json' },
      signal: controller.signal,
      redirect: 'error',
    })

    if (response.status === 404) {
      return { found: false, status: 404, metadata: null, source_url: url.toString() }
    }

    if (!response.ok) {
      throw new Error(`NFT-Metadatenquelle antwortete mit HTTP ${response.status}.`)
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > 1_000_000) {
      throw new Error('NFT-Metadatenantwort ist groesser als 1 MB.')
    }

    const text = await response.text()
    if (text.length > 1_000_000) {
      throw new Error('NFT-Metadatenantwort ist groesser als 1 MB.')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('NFT-Metadatenquelle lieferte kein gueltiges JSON.')
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('NFT-Metadatenquelle lieferte kein JSON-Objekt.')
    }

    return {
      found: true,
      status: response.status,
      metadata: parsed as Record<string, unknown>,
      source_url: url.toString(),
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('NFT-Metadatenquelle hat das Zeitlimit von 10 Sekunden ueberschritten.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
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



type DashboardRewardItem = {
  chain: string
  address: string | null
  assetId: string
  symbol: string
  amount: number
}

type DashboardRewardPeriods = {
  rewards: Record<string, DashboardRewardItem[]>
  referralRewards: Record<string, DashboardRewardItem[]>
  bonusRewards: Record<string, DashboardRewardItem[]>
}

function normalizeEvmAddress(value: unknown): string {
  const v = String(value ?? '').trim().toLowerCase()
  return /^0x[0-9a-f]{40}$/.test(v) ? v : ''
}

function rewardTimestampMs(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000
  }
  const text = String(value).trim()
  if (/^0x[0-9a-f]+$/i.test(text)) {
    const n = Number.parseInt(text, 16)
    return Number.isFinite(n) ? (n > 1e12 ? n : n * 1000) : null
  }
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const n = Number(text)
    return Number.isFinite(n) ? (n > 1e12 ? n : n * 1000) : null
  }
  const parsed = Date.parse(text)
  return Number.isFinite(parsed) ? parsed : null
}

function rewardPeriodKeys(value: unknown): string[] {
  const ms = rewardTimestampMs(value)
  if (!ms) return []
  const d = new Date(ms)
  if (!Number.isFinite(d.getTime())) return []
  const now = new Date()
  const year = now.getUTCFullYear()
  const previousYear = year - 1
  const month = now.getUTCMonth()
  const out = ['total']
  if (d.getUTCFullYear() === previousYear) out.push('previousYear')
  if (d.getUTCFullYear() === year) {
    out.push('year')
    if (d.getUTCMonth() === month) out.push('month')
  }
  return out
}

function emptyDashboardRewardPeriods(): DashboardRewardPeriods {
  const make = () => ({ total: [], previousYear: [], year: [], month: [] })
  return { rewards: make(), referralRewards: make(), bonusRewards: make() }
}

function addDashboardReward(
  target: Record<string, DashboardRewardItem[]>,
  timeValue: unknown,
  addressValue: unknown,
  symbolValue: unknown,
  amountValue: unknown,
) {
  const amount = Number(amountValue ?? 0)
  if (!Number.isFinite(amount) || amount === 0) return
  const keys = rewardPeriodKeys(timeValue)
  if (!keys.length) return
  const address = normalizeEvmAddress(addressValue) || null
  const symbol = String(symbolValue || 'TOKEN')
  const assetId = address || `symbol:${symbol.toLowerCase()}`
  for (const period of keys) {
    const rows = target[period] ?? (target[period] = [])
    let row = rows.find((x) => x.assetId === assetId && x.chain === 'bsc')
    if (!row) {
      row = { chain: 'bsc', address, assetId, symbol, amount: 0 }
      rows.push(row)
    }
    row.amount += amount
  }
}

const BONUS_SELECTORS = new Set(['0x0e99f5e6'])
const REFERRAL_DECIMALS: Record<string, number> = {
  '0xf7d142a354322c7560250caa0e2a06c89649e4c2': 18,
  '0x29280091fa7f3abe4739ad5f1f7c5287feaf7736': 18,
  '0x3dda9ea88136ecede768cd374a2af37219da55e7': 18,
}

function isBonusClaim(claim: any): boolean {
  return BONUS_SELECTORS.has(String(claim?.selector || '').toLowerCase())
}

function rawUnitsToNumber(rawValue: unknown, decimalsValue: unknown): number | null {
  const raw = String(rawValue ?? '').trim()
  const decimals = Number(decimalsValue)
  if (!/^-?\d+$/.test(raw) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null
  const negative = raw.startsWith('-')
  const digits = negative ? raw.slice(1) : raw
  const padded = digits.padStart(decimals + 1, '0')
  const whole = decimals ? padded.slice(0, -decimals) : padded
  const frac = decimals ? padded.slice(-decimals).replace(/0+$/, '') : ''
  const value = Number(`${negative ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`)
  return Number.isFinite(value) ? value : null
}

function verifiedTokenDecimals(addressValue: unknown, fallback: unknown = null): number | null {
  const address = normalizeEvmAddress(addressValue)
  const verified = REFERRAL_DECIMALS[address]
  if (Number.isInteger(verified) && verified >= 0 && verified <= 36) return verified
  const n = Number(fallback)
  return Number.isInteger(n) && n >= 0 && n <= 36 ? n : null
}

// Canonical reward amount boundary for the Edge backfill. The result of this
// function is ALWAYS human-token units. Never pass raw ERC-20 units beyond here.
// Older Discovery snapshots used several shapes:
//   * netRaw / amountRaw / rawAmount + decimals (preferred, lossless)
//   * amountHuman (already normalized)
//   * amount as an integer-like raw value; after JSON parsing very large values may
//     become a JS Number rendered in scientific notation, so /^\d+$/ is NOT enough.
function rewardHumanAmount(row: any): number {
  const address = normalizeEvmAddress(row?.token)
  const decimals = verifiedTokenDecimals(address, row?.decimals ?? row?.tokenDecimals ?? row?.token_decimals)

  for (const key of ['netRaw', 'amountRaw', 'rawAmount']) {
    if (row?.[key] == null || decimals == null) continue
    const n = rawUnitsToNumber(row[key], decimals)
    if (n != null) return n
  }

  if (row?.amountHuman != null) {
    const explicitHuman = Number(row.amountHuman)
    if (Number.isFinite(explicitHuman)) return explicitHuman
  }

  const rawCandidate = row?.amount
  const amount = Number(rawCandidate ?? 0)
  if (!Number.isFinite(amount)) return 0
  if (decimals == null || decimals <= 0) return amount

  // Exact integer strings can still be scaled losslessly.
  const text = String(rawCandidate ?? '').trim()
  if (/^-?\d+$/.test(text)) {
    const scaled = rawUnitsToNumber(text, decimals)
    if (scaled != null && Math.abs(amount) >= 10 ** Math.min(decimals, 12)) return scaled
  }

  // Legacy compatibility: JSON may already have parsed a 20+ digit raw integer into
  // a Number (e.g. 9.9578e+22), which String() renders in scientific notation.
  // This is the repeated failure mode that the old /^\d+$/ test missed. Only scale
  // this Number fallback when scientific notation is actually present and the value
  // has the raw-unit magnitude expected for the token decimals. Low-decimal tokens
  // such as wUSDT therefore keep normal human values such as 10'197.25 untouched.
  const rawScaledThreshold = 10 ** Math.min(decimals, 15)
  if (/[eE][+-]?\d+/.test(text) && Math.abs(amount) >= rawScaledThreshold) {
    return amount / (10 ** decimals)
  }

  return amount
}

function referralMintHumanAmount(mint: any): number {
  return rewardHumanAmount(mint)
}

function sanitizedRewardPeriodsFromSnapshot(payload: any): DashboardRewardPeriods {
  const out = emptyDashboardRewardPeriods()
  const lots = Array.isArray(payload?.process?.lots) ? payload.process.lots : []
  const stakingSeen = new Set<string>()

  for (const lot of lots) {
    const candidates = [
      ...(Array.isArray(lot?.transactions) ? lot.transactions : []),
      ...(Array.isArray(lot?.rewardClaims) ? lot.rewardClaims : []),
    ]
    for (const claim of candidates) {
      if (!['stake_reward', 'distribution', 'claim'].includes(String(claim?.eventType || ''))) continue
      if (isBonusClaim(claim)) continue
      const hash = String(claim?.hash || '').toLowerCase()
      const token = normalizeEvmAddress(claim?.token)
      const amount = rewardHumanAmount(claim)
      if (!hash || !token || !Number.isFinite(amount) || amount <= 0) continue
      const key = `${hash}|${token}|${String(claim?.symbol || claim?.tokenSymbol || '')}|${amount}`
      if (stakingSeen.has(key)) continue
      stakingSeen.add(key)
      addDashboardReward(out.rewards, claim?.time ?? claim?.timeStamp ?? claim?.timestamp, token, claim?.symbol || claim?.tokenSymbol, amount)
    }
  }

  const bonusSeen = new Set<string>()
  const proven = Array.isArray(payload?.globals?.provenRewardRows) ? payload.globals.provenRewardRows : []
  for (const claim of proven) {
    if (!isBonusClaim(claim)) continue
    const hash = String(claim?.hash || '').toLowerCase()
    const token = normalizeEvmAddress(claim?.token)
    const amount = rewardHumanAmount(claim)
    if (!hash || !token || !Number.isFinite(amount) || amount <= 0) continue
    const key = `${hash}|${token}|${amount}`
    if (bonusSeen.has(key)) continue
    bonusSeen.add(key)
    addDashboardReward(out.bonusRewards, claim?.time ?? claim?.timeStamp ?? claim?.timestamp, token, claim?.symbol || claim?.tokenSymbol, amount)
  }

  const strong = Array.isArray(payload?.globals?.claimReferenceResult?.strong)
    ? payload.globals.claimReferenceResult.strong
    : []
  const referralSeen = new Set<string>()
  for (const row of strong) {
    const hash = String(row?.hash || '').toLowerCase()
    for (const mint of (Array.isArray(row?.mints) ? row.mints : [])) {
      const token = normalizeEvmAddress(mint?.token)
      if (!token) continue
      const amount = referralMintHumanAmount(mint)
      if (!Number.isFinite(amount) || amount === 0) continue
      const key = `${hash}|${token}|${amount}`
      if (referralSeen.has(key)) continue
      referralSeen.add(key)
      addDashboardReward(out.referralRewards, row?.timestamp ?? row?.time, token, mint?.symbol, amount)
    }
  }

  return out
}

const TLN_GLOBAL_TECH_CACHE_TABLE = 'tln_vow_technical_global_cache'
const TLN_GLOBAL_DETAIL_CACHE_KEY = 'global-onchain-detail'
const TLN_GLOBAL_DETAIL_CACHE_VERSION = 'global-onchain-detail-v2'

const TLN_DETAIL_PRIVATE_KEYS = new Set([
  'user_id','userid','userId','wallet_id','walletId','owner_name','ownerName','owner_label','ownerLabel',
  'wallet_alias','walletAlias','alias','partnerAlias','created_by','updated_by','createdBy','updatedBy',
  'email','display_name','displayName','encrypted','ciphertext','reference_ciphertext','alias_ciphertext',
])

function sanitizeTlnPublicOnchainValue(value: any, depth = 0): any {
  if (depth > 24 || value == null) return value == null ? null : undefined
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((v) => sanitizeTlnPublicOnchainValue(v, depth + 1)).filter((v) => v !== undefined)
  if (typeof value !== 'object') return undefined
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (TLN_DETAIL_PRIVATE_KEYS.has(key) || /^private/i.test(key) || /ciphertext/i.test(key)) continue
    const v = sanitizeTlnPublicOnchainValue(raw, depth + 1)
    if (v !== undefined) out[key] = v
  }
  return out
}

function tlnDetailLotKey(lot: any, index = 0) {
  const tx = String(lot?.stakeTx || lot?.stakeHash || '').toLowerCase()
  if (/^0x[0-9a-f]{64}$/.test(tx)) return `stake:${tx}`
  const key = String(lot?.key || '')
  if (key) return `key:${key}`
  const contract = normalizeEvmAddress(lot?.staking?.contract_address || lot?.counterparty || '') || ''
  return `fallback:${contract}|${String(lot?.stakeTime || '')}|${Number(lot?.original || 0)}|${index}`
}

const TLN_DETAIL_VALUATION_FIELDS = [
  'stakeUsd','stakeUsdSource','stakeUsdOrigin','stakeValuation',
  'contractEndBlockHex','contractEndValuation','contractEndUsd','contractEndUsdSource',
  'unstakeBlockHex','unstakeValuation','unstakeUsd','unstakeUsdSource','snapshotValuation',
]

function mergeTlnValuationsIntoLots(lots: any[], valuationPayload: any) {
  if (!Array.isArray(lots) || !Array.isArray(valuationPayload?.lots)) return lots
  const byKey = new Map<string, any>()
  for (const row of valuationPayload.lots) if (row?.key) byKey.set(String(row.key), row)
  return lots.map((lot, index) => {
    const row = byKey.get(tlnDetailLotKey(lot, index))
    if (!row) return lot
    const merged = { ...lot }
    for (const field of TLN_DETAIL_VALUATION_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(row, field)) merged[field] = row[field]
    }
    return merged
  })
}

function sanitizedTlnDetailSnapshot(payload: any, wallet: string, row: any, valuationPayload: any = null) {
  const process = payload?.process || {}
  const globals = payload?.globals || {}
  return {
    kind: 'global_onchain_detail_snapshot',
    schemaVersion: 2,
    wallet,
    completedStep: Number(payload?.completedStep || 0),
    sourceBuildId: String(payload?.buildId || ''),
    sourceSavedAt: payload?.lastCheckedAt || payload?.savedAt || row?.updated_at || null,
    sourceLastBlock: Number(payload?.lastCheckedBlock || payload?.sourceLastBlock || row?.last_scanned_block || 0),
    sanitizedAt: new Date().toISOString(),
    process: {
      lots: sanitizeTlnPublicOnchainValue(mergeTlnValuationsIntoLots(Array.isArray(process?.lots) ? process.lots : [], valuationPayload)),
      done: {
        base: !!process?.done?.base,
        staking: !!process?.done?.staking,
        duration: !!process?.done?.duration,
        rewards: !!process?.done?.rewards,
        referral: !!process?.done?.referral,
      },
    },
    globals: {
      provenRewardRows: sanitizeTlnPublicOnchainValue(Array.isArray(globals?.provenRewardRows) ? globals.provenRewardRows : []),
      claimReferenceResult: sanitizeTlnPublicOnchainValue(globals?.claimReferenceResult || null),
      unassignedRewards: sanitizeTlnPublicOnchainValue(Array.isArray(globals?.unassignedRewards) ? globals.unassignedRewards : []),
    },
  }
}

async function loadSanitizedTlnDetailSnapshots(
  supabase: any,
  key: CryptoKey,
  userId: string,
  requestedValue: unknown,
) {
  const requested = Array.isArray(requestedValue)
    ? [...new Set(requestedValue.map(normalizeEvmAddress).filter(Boolean))].slice(0, 20)
    : []
  if (!requested.length) return { details: [], missing: [] }

  // Identical security boundary to the Reward-Summary backfill: only addresses that
  // are currently stored as *own* wallets of this authenticated user are eligible.
  const ownWallets = (await loadWallets(supabase, key, userId))
    .filter((w) => w?.is_own_wallet !== false)
    .map((w) => normalizeEvmAddress(w?.evm_address))
    .filter(Boolean)
  const allowed = new Set(ownWallets)
  const wallets = requested.filter((w) => allowed.has(w))
  if (!wallets.length) return { details: [], missing: requested }

  const service = serviceSupabaseClient()
  const details: any[] = []
  const missing: string[] = []

  for (const wallet of wallets) {
    // Global cache first. Once sanitized, no private source snapshot is needed again.
    const { data: globalRows, error: globalError } = await service
      .from(TLN_GLOBAL_TECH_CACHE_TABLE)
      .select('payload,scanner_version,updated_at,last_scanned_block')
      .eq('chain_key', 'bsc')
      .eq('scope_address', wallet)
      .eq('cache_key', TLN_GLOBAL_DETAIL_CACHE_KEY)
      .limit(1)
    if (globalError) throw new Error(`TLN Detailcache ${wallet}: ${globalError.message}`)
    const globalRow = globalRows?.[0]
    if (globalRow?.scanner_version === TLN_GLOBAL_DETAIL_CACHE_VERSION && globalRow?.payload?.kind === 'global_onchain_detail_snapshot') {
      details.push({ wallet, payload: globalRow.payload, source: 'global-cache' })
      continue
    }

    const { data, error } = await service
      .from('tln_vow_staking_scan_cache')
      .select('user_id,wallet_id,payload,last_scanned_block,updated_at,scanner_version')
      .eq('chain_key', 'bsc')
      .eq('cache_key', 'verified-discovery-results')
      .eq('payload->>wallet', wallet)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw new Error(`TLN Detail-Snapshot ${wallet}: ${error.message}`)
    const row = data?.[0]
    const payload = row?.payload
    // Step 5 is the first state in which staking/rewards + referral detail are both
    // expected to be complete. Lower steps must not be presented as definitive zeros.
    if (!payload || payload?.kind !== 'verified_discovery_results' || Number(payload?.completedStep || 0) < 5) {
      missing.push(wallet)
      continue
    }

    let valuationPayload = null
    if (row?.user_id && row?.wallet_id) {
      const { data: valuationRows, error: valuationError } = await service
        .from('tln_vow_staking_scan_cache')
        .select('payload,updated_at,cache_key')
        .eq('user_id', row.user_id)
        .eq('chain_key', 'bsc')
        .eq('wallet_id', row.wallet_id)
        .like('cache_key', 'snapshot-valuation:%')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (valuationError) {
        console.warn(`TLN Step-6-Bewertung ${wallet} nicht verfügbar; Detailbackfill läuft ohne Bewertung weiter: ${valuationError.message}`)
      } else {
        const candidate = valuationRows?.[0]?.payload
        if (candidate?.kind === 'snapshot_valuation_result') valuationPayload = candidate
      }
    }

    const sanitized = sanitizedTlnDetailSnapshot(payload, wallet, row, valuationPayload)
    const { error: upsertError } = await service
      .from(TLN_GLOBAL_TECH_CACHE_TABLE)
      .upsert({
        chain_key: 'bsc',
        scope_address: wallet,
        cache_key: TLN_GLOBAL_DETAIL_CACHE_KEY,
        scanner_version: TLN_GLOBAL_DETAIL_CACHE_VERSION,
        complete_from_block: 0,
        last_scanned_block: Number(sanitized.sourceLastBlock || 0),
        payload: sanitized,
        created_by: null,
        updated_by: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'chain_key,scope_address,cache_key' })
    if (upsertError) throw new Error(`TLN globaler Detailcache ${wallet}: ${upsertError.message}`)

    details.push({ wallet, payload: sanitized, source: 'private-snapshot-backfill' })
  }

  for (const wallet of requested) if (!wallets.includes(wallet) && !missing.includes(wallet)) missing.push(wallet)
  return { details, missing }
}

function serviceSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) throw new Error('Supabase Service-Role-Konfiguration fehlt.')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function loadSanitizedTlnRewardSummaries(
  supabase: any,
  key: CryptoKey,
  userId: string,
  requestedValue: unknown,
) {
  const requested = Array.isArray(requestedValue)
    ? [...new Set(requestedValue.map(normalizeEvmAddress).filter(Boolean))].slice(0, 50)
    : []
  if (!requested.length) return { summaries: [], missing: [] }

  // Security boundary: only addresses currently stored as *own* wallets by this
  // authenticated user may use the cross-user cache reuse path. The response is
  // additionally reduced to chain-derived reward totals only; no foreign user_id,
  // wallet_id, alias, owner name or raw discovery payload leaves this Edge Function.
  const ownWallets = (await loadWallets(supabase, key, userId))
    .filter((w) => w?.is_own_wallet !== false)
    .map((w) => normalizeEvmAddress(w?.evm_address))
    .filter(Boolean)
  const allowed = new Set(ownWallets)
  const wallets = requested.filter((w) => allowed.has(w))
  if (!wallets.length) return { summaries: [], missing: requested }

  const service = serviceSupabaseClient()
  const summaries: any[] = []
  const missing: string[] = []

  for (const wallet of wallets) {
    const { data, error } = await service
      .from('tln_vow_staking_scan_cache')
      .select('user_id,wallet_id,payload,last_scanned_block,updated_at,scanner_version')
      .eq('chain_key', 'bsc')
      .eq('cache_key', 'verified-discovery-results')
      .eq('payload->>wallet', wallet)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw new Error(`TLN Reward-Snapshot ${wallet}: ${error.message}`)
    const row = data?.[0]
    const payload = row?.payload
    if (!payload || payload?.kind !== 'verified_discovery_results' || Number(payload?.completedStep || 0) < 4) {
      missing.push(wallet)
      continue
    }

    summaries.push({
      wallet,
      completedStep: Number(payload.completedStep || 0),
      sourceSavedAt: payload?.lastCheckedAt || payload?.savedAt || row?.updated_at || null,
      sourceLastBlock: Number(payload?.lastCheckedBlock || payload?.sourceLastBlock || row?.last_scanned_block || 0),
      schemaVersion: 2,
      amountUnit: 'human',
      normalizationVersion: 2,
      periods: sanitizedRewardPeriodsFromSnapshot(payload),
    })
  }

  for (const wallet of requested) if (!wallets.includes(wallet) && !missing.includes(wallet)) missing.push(wallet)
  return { summaries, missing }
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

      if (action === 'nft_metadata_fetch') {
        const result = await fetchAllowedNftMetadata(body.url)
        return json({ ok: true, action, ...result })
      }

      if (action === 'wallet_list') {
        const wallets = await loadWallets(ctx.supabase, key, userId)
        return json({ ok: true, action, wallets })
      }

      if (action === 'tln_reward_summary') {
        const result = await loadSanitizedTlnRewardSummaries(
          ctx.supabase,
          key,
          userId,
          body.wallets,
        )
        return json({ ok: true, action, ...result })
      }

      if (action === 'tln_detail_snapshot') {
        const result = await loadSanitizedTlnDetailSnapshots(
          ctx.supabase,
          key,
          userId,
          body.wallets,
        )
        return json({ ok: true, action, ...result })
      }

      if (action === 'wallet_save') {
        const id = await saveWallet(ctx.supabase, key, userId, body.wallet)
        return json({ ok: true, action, id })
      }

      if (action === 'user_data_delete') {
        const { data: result, error } = await ctx.supabase.rpc(
          'wallettracking_delete_all_user_data',
        )

        if (error) {
          const hint = /wallettracking_delete_all_user_data|function .* does not exist/i.test(error.message || '')
            ? ' Migration 073-user-complete-delete.sql zuerst in Supabase ausfuehren.'
            : ''
          throw new Error(`Alle WalletTracking-Userdaten loeschen fehlgeschlagen: ${error.message}${hint}`)
        }

        return json({ ok: true, action, result })
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
