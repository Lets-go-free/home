const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APERTUM_RPC_URL =
  "https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc";

const ALLOWED_METHODS = new Set([
  "eth_blockNumber",
  "eth_getLogs",
  "eth_getBlockByNumber",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const method = String(body?.method ?? "");
    const params = Array.isArray(body?.params) ? body.params : [];

    if (!ALLOWED_METHODS.has(method)) {
      return json({ ok: false, error: "RPC method not allowed" }, 400);
    }

    // Defensive input limits: this is intentionally not a generic RPC proxy.
    if (JSON.stringify(params).length > 20000) {
      return json({ ok: false, error: "RPC params too large" }, 400);
    }

    const upstream = await fetch(APERTUM_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });

    const text = await upstream.text();
    let payload: any = null;
    try { payload = JSON.parse(text); } catch {}

    if (!upstream.ok) {
      return json({
        ok: false,
        error: `Apertum RPC HTTP ${upstream.status}`,
        detail: text.slice(0, 500),
        retryable: true,
      }, 200);
    }

    if (payload?.error) {
      return json({
        ok: false,
        error: payload.error?.message || "Apertum RPC error",
        code: payload.error?.code ?? null,
        retryable: true,
      }, 200);
    }

    return json({ ok: true, result: payload?.result ?? null });
  } catch (e) {
    return json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    }, 500);
  }
});
