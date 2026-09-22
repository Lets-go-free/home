// Phase 5.93 · 22.09.2026 12:15:22 CEST: authentifizierter Apertum-RPC-Proxy mit gezielt freigegebenem eth_call für APTMDAO DID ownerOf/Parent. Build 20260922-121522.
import { withSupabase } from 'npm:@supabase/server@^1'

const RPC_URL = 'https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc'
const APTMDAO_NFT_CONTRACT = '0x0e1d3df5ce689df2c429216fb44caec064acbbaa'
const ETH_CALL_SELECTORS = new Set(['0x6352211e', '0x414533de']) // ownerOf(uint256), parent getter
const ALLOWED_METHODS = new Set(['eth_blockNumber', 'eth_getLogs', 'eth_getBlockByNumber', 'eth_call'])

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } })
}

function isHexBlockTag(value: unknown): boolean {
  const s = String(value ?? '')
  return s === 'latest' || s === 'earliest' || s === 'pending' || /^0x[0-9a-fA-F]+$/.test(s)
}

function isAddress(value: unknown): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value ?? ''))
}

function validateRequest(method: string, params: unknown[]): void {
  if (!ALLOWED_METHODS.has(method)) throw new Error(`RPC method not allowed: ${method}`)

  if (method === 'eth_blockNumber') {
    if (params.length !== 0) throw new Error('eth_blockNumber erwartet keine Parameter.')
    return
  }

  if (method === 'eth_getBlockByNumber') {
    if (params.length !== 2 || !isHexBlockTag(params[0]) || params[1] !== false) {
      throw new Error('Ungueltige eth_getBlockByNumber-Parameter.')
    }
    return
  }

  if (method === 'eth_getLogs') {
    if (params.length !== 1 || !params[0] || typeof params[0] !== 'object' || Array.isArray(params[0])) {
      throw new Error('Ungueltige eth_getLogs-Parameter.')
    }
    const filter = params[0] as Record<string, unknown>
    if (filter.address != null) {
      const addresses = Array.isArray(filter.address) ? filter.address : [filter.address]
      if (!addresses.length || addresses.length > 10 || addresses.some((a) => !isAddress(a))) {
        throw new Error('Ungueltige eth_getLogs-Adresse.')
      }
    }
    if (filter.fromBlock != null && !isHexBlockTag(filter.fromBlock)) throw new Error('Ungueltiger fromBlock.')
    if (filter.toBlock != null && !isHexBlockTag(filter.toBlock)) throw new Error('Ungueltiger toBlock.')
    return
  }

  if (method === 'eth_call') {
    if (params.length !== 2 || !params[0] || typeof params[0] !== 'object' || Array.isArray(params[0])) {
      throw new Error('Ungueltige eth_call-Parameter.')
    }
    const call = params[0] as Record<string, unknown>
    const to = String(call.to ?? '').toLowerCase()
    const data = String(call.data ?? '').toLowerCase()
    if (to !== APTMDAO_NFT_CONTRACT) throw new Error('eth_call Contract nicht erlaubt.')
    if (!/^0x[0-9a-f]+$/.test(data) || data.length < 10 || !ETH_CALL_SELECTORS.has(data.slice(0, 10))) {
      throw new Error('eth_call Funktionsselector nicht erlaubt.')
    }
    if (!isHexBlockTag(params[1])) throw new Error('Ungueltiger eth_call Block-Tag.')
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    try {
      if (req.method !== 'POST') return json({ ok: false, error: 'POST erforderlich.' }, 405)
      const body = await req.json().catch(() => ({})) as Record<string, unknown>
      const method = String(body.method ?? '')
      const params = Array.isArray(body.params) ? body.params : []
      validateRequest(method, params)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      let response: Response
      try {
        response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      if (!response.ok) {
        const text = (await response.text()).slice(0, 500)
        return json({ ok: false, error: `Apertum RPC HTTP ${response.status}: ${text || response.statusText}` }, 502)
      }

      const payload = await response.json() as { result?: unknown; error?: { message?: string; code?: number } }
      if (payload.error) {
        return json({ ok: false, error: payload.error.message || `Apertum RPC Fehler ${payload.error.code ?? ''}`.trim() })
      }
      return json({ ok: true, result: payload.result ?? null })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return json({ ok: false, error: message }, 400)
    }
  }),
}
