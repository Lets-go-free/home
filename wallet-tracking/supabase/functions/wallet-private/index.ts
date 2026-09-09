import { withSupabase } from 'npm:@supabase/server'

const ENCRYPTION_VERSION = 1
const KEY_VERSION = 1
const MASTER_SECRET_NAME = 'WT_ENCRYPTION_MASTER_KEY_V1'
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
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function decodeMasterSecret(raw: string): Uint8Array {
  const trimmed = raw.trim()
  let bytes: Uint8Array
  try {
    bytes = b64urlDecode(trimmed)
  } catch {
    throw new Error(`${MASTER_SECRET_NAME} ist kein gueltiger Base64-/Base64URL-Wert.`)
  }
  if (bytes.byteLength !== 32) {
    throw new Error(`${MASTER_SECRET_NAME} muss exakt 32 Byte enthalten.`)
  }
  return bytes
}

async function deriveUserKey(userId: string): Promise<CryptoKey> {
  const rawSecret = Deno.env.get(MASTER_SECRET_NAME)
  if (!rawSecret) throw new Error(`${MASTER_SECRET_NAME} ist nicht gesetzt.`)

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
      info: encoder.encode(`wallet-tracking:user:${userId}:key-version:${KEY_VERSION}`),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function aad(userId: string, recordId: string, field: string): Uint8Array {
  return encoder.encode(
    `wallet-tracking|enc=${ENCRYPTION_VERSION}|key=${KEY_VERSION}|user=${userId}|record=${recordId}|field=${field}`,
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

  return `wt1.k${KEY_VERSION}.${b64urlEncode(iv)}.${b64urlEncode(new Uint8Array(encrypted))}`
}

async function decryptValue(
  key: CryptoKey,
  userId: string,
  recordId: string,
  field: string,
  envelope: string,
): Promise<string> {
  const parts = envelope.split('.')
  if (parts.length !== 4 || parts[0] !== 'wt1' || parts[1] !== `k${KEY_VERSION}`) {
    throw new Error('Unbekanntes Ciphertext-Format oder Key-Version.')
  }

  const iv = b64urlDecode(parts[2])
  const ciphertext = b64urlDecode(parts[3])
  if (iv.byteLength !== 12) throw new Error('Ungueltiger AES-GCM Nonce.')

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

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const userId = ctx.userClaims?.sub ?? ctx.userClaims?.id
    if (!userId || typeof userId !== 'string') {
      return json({ error: 'Authentifizierter User konnte nicht bestimmt werden.' }, 401)
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const action = typeof body.action === 'string' ? body.action : 'self_test'

    try {
      const key = await deriveUserKey(userId)

      if (action === 'self_test') {
        const recordId = crypto.randomUUID()
        const plain = randomTestPlaintext()
        const ciphertext = await encryptValue(key, userId, recordId, TEST_FIELD, plain)
        const roundtrip = await decryptValue(key, userId, recordId, TEST_FIELD, ciphertext)

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
        const ciphertext = await encryptValue(key, userId, recordId, TEST_FIELD, plain)

        const { error: insertError } = await ctx.supabaseAdmin
          .from('security_crypto_tests')
          .insert({
            id: recordId,
            user_id: userId,
            encryption_version: ENCRYPTION_VERSION,
            key_version: KEY_VERSION,
            test_ciphertext: ciphertext,
          })

        if (insertError) throw new Error(`DB-Test Insert fehlgeschlagen: ${insertError.message}`)

        const { data: row, error: readError } = await ctx.supabaseAdmin
          .from('security_crypto_tests')
          .select('id,user_id,encryption_version,key_version,test_ciphertext')
          .eq('id', recordId)
          .eq('user_id', userId)
          .single()

        if (readError || !row) {
          throw new Error(`DB-Test Read fehlgeschlagen: ${readError?.message ?? 'keine Zeile'}`)
        }

        const roundtrip = await decryptValue(
          key,
          userId,
          recordId,
          TEST_FIELD,
          row.test_ciphertext,
        )

        if (!keep) {
          const { error: deleteError } = await ctx.supabaseAdmin
            .from('security_crypto_tests')
            .delete()
            .eq('id', recordId)
            .eq('user_id', userId)
          if (deleteError) throw new Error(`DB-Test Cleanup fehlgeschlagen: ${deleteError.message}`)
        }

        return json({
          ok: roundtrip === plain,
          action,
          kept: keep,
          test_id: recordId,
          encryption_version: row.encryption_version,
          key_version: row.key_version,
          ciphertext_prefix: row.test_ciphertext.slice(0, 16),
        })
      }

      if (action === 'cleanup_tests') {
        const { error } = await ctx.supabaseAdmin
          .from('security_crypto_tests')
          .delete()
          .eq('user_id', userId)
        if (error) throw new Error(`Cleanup fehlgeschlagen: ${error.message}`)
        return json({ ok: true, action })
      }

      return json({ error: 'Unbekannte action.' }, 400)
    } catch (error) {
      console.error('wallet-private:', error)
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }, 500)
    }
  }),
}
