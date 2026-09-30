// Phase 6.90 · 01.10.2026 00:53:21 CEST: CoinGecko-Demo-Proxy erweitert um contract-basierten /simple/token_price-Fallback fuer eigene sichere Token.
// Der API-Key bleibt ausschließlich serverseitig im Supabase-Secret COINGECKO_DEMO_API_KEY.
import { withSupabase } from 'npm:@supabase/server@^1'

const API_BASE = 'https://api.coingecko.com/api/v3'
const SECRET_NAME = 'COINGECKO_DEMO_API_KEY'
const MAX_IDS = 250
const ID_RE = /^[a-z0-9._-]{1,100}$/i

const PLATFORM_RE = /^[a-z0-9._-]{1,100}$/i
const CONTRACT_RE = /^(?:0x[a-f0-9]{40}|[A-Za-z0-9]{20,100})$/i
const MAX_CONTRACTS = 50

function safePlatform(value: unknown): string {
  const platform = String(value ?? '').trim()
  if (!PLATFORM_RE.test(platform)) throw new Error('Ungueltige CoinGecko Asset-Platform.')
  return platform
}

function safeContracts(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('contractAddresses muss ein Array sein.')
  const addresses = [...new Set(value.map((v) => String(v ?? '').trim()).filter(Boolean))]
  if (!addresses.length) throw new Error('Mindestens eine Contract-Adresse ist erforderlich.')
  if (addresses.length > MAX_CONTRACTS) throw new Error(`Maximal ${MAX_CONTRACTS} Contract-Adressen pro Request.`)
  if (addresses.some((address) => !CONTRACT_RE.test(address))) throw new Error('Ungueltige Contract-Adresse.')
  return addresses
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  })
}

function apiKey(): string {
  const key = Deno.env.get(SECRET_NAME)?.trim()
  if (!key) throw new Error(`${SECRET_NAME} ist nicht gesetzt.`)
  return key
}

function safeIds(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('ids muss ein Array sein.')
  const ids = [...new Set(value.map((v) => String(v ?? '').trim()).filter(Boolean))]
  if (!ids.length) throw new Error('Mindestens eine CoinGecko-ID ist erforderlich.')
  if (ids.length > MAX_IDS) throw new Error(`Maximal ${MAX_IDS} CoinGecko-IDs pro Request.`)
  if (ids.some((id) => !ID_RE.test(id))) throw new Error('Ungueltige CoinGecko-ID.')
  return ids
}

function safeId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (!ID_RE.test(id)) throw new Error('Ungueltige CoinGecko-ID.')
  return id
}

function safeDate(value: unknown): string {
  const date = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Datum muss YYYY-MM-DD sein.')
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Ungueltiges Datum.')
  }
  return date
}

function coinGeckoDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}-${m}-${y}`
}

async function upstream(url: URL): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    return await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': apiKey(),
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function readUpstream(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.length > 2_000_000) throw new Error('CoinGecko-Antwort ist unerwartet gross.')
  try {
    return text ? JSON.parse(text) : null
  } catch {
    throw new Error('CoinGecko lieferte keine gueltige JSON-Antwort.')
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    try {
      if (req.method !== 'POST') return json({ ok: false, error: 'POST erforderlich.' }, 405)
      const body = await req.json().catch(() => ({})) as Record<string, unknown>
      const action = String(body.action ?? '')
      let url: URL

      if (action === 'simple_price') {
        const ids = safeIds(body.ids)
        url = new URL(`${API_BASE}/simple/price`)
        url.searchParams.set('ids', ids.join(','))
        url.searchParams.set('vs_currencies', 'usd')
        url.searchParams.set('include_24hr_change', 'true')
        url.searchParams.set('include_last_updated_at', 'true')
      } else if (action === 'simple_token_price') {
        const platform = safePlatform(body.platform)
        const contractAddresses = safeContracts(body.contractAddresses)
        url = new URL(`${API_BASE}/simple/token_price/${encodeURIComponent(platform)}`)
        url.searchParams.set('contract_addresses', contractAddresses.join(','))
        url.searchParams.set('vs_currencies', 'usd')
        url.searchParams.set('include_24hr_change', 'true')
        url.searchParams.set('include_last_updated_at', 'true')
      } else if (action === 'history') {
        const id = safeId(body.id)
        const date = safeDate(body.date)
        url = new URL(`${API_BASE}/coins/${encodeURIComponent(id)}/history`)
        url.searchParams.set('date', coinGeckoDate(date))
        url.searchParams.set('localization', 'false')
      } else {
        return json({ ok: false, error: 'Unbekannte Aktion.' }, 400)
      }

      const response = await upstream(url)
      const payload = await readUpstream(response)
      if (!response.ok) {
        const upstreamMessage = typeof payload === 'object' && payload
          ? String((payload as Record<string, unknown>).error ?? (payload as Record<string, unknown>).status ?? '')
          : ''
        return json({
          ok: false,
          upstreamStatus: response.status,
          error: `CoinGecko HTTP ${response.status}${upstreamMessage ? `: ${upstreamMessage.slice(0, 300)}` : ''}`,
        })
      }

      return json({ ok: true, data: payload })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return json({ ok: false, error: message }, 400)
    }
  }),
}
