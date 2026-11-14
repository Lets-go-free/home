-- WalletTracking 8.37: GoPlus Contract-Cache + globales Rate-Gate.
-- Keine Wallet-Adressen oder personenbezogenen Daten speichern.
-- Vor Deployment von token-risk/index.ts ausfuehren.
CREATE TABLE IF NOT EXISTS public.wallet_token_risk_cache (
  chain_id text NOT NULL,
  address text NOT NULL,
  assessment jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_token_risk_cache_pk PRIMARY KEY (chain_id,address),
  CONSTRAINT wallet_token_risk_chain_len CHECK (length(chain_id) BETWEEN 1 AND 12),
  CONSTRAINT wallet_token_risk_addr_check CHECK (address ~ '^0x[0-9a-f]{40}$')
);
CREATE INDEX IF NOT EXISTS wallet_token_risk_cache_expiry_idx
  ON public.wallet_token_risk_cache(expires_at);
ALTER TABLE public.wallet_token_risk_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_token_risk_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallet_token_risk_cache TO service_role;

CREATE TABLE IF NOT EXISTS public.wallet_token_risk_provider_state (
  provider text PRIMARY KEY,
  next_request_at timestamptz NOT NULL DEFAULT '-infinity'::timestamptz,
  blocked_until timestamptz NOT NULL DEFAULT '-infinity'::timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_token_risk_provider_only_goplus CHECK (provider='goplus')
);
ALTER TABLE public.wallet_token_risk_provider_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_token_risk_provider_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallet_token_risk_provider_state TO service_role;

CREATE OR REPLACE FUNCTION public.wallettracking_token_risk_provider_gate(
  p_provider text,
  p_cooldown_seconds integer DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_state record;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  IF p_provider IS DISTINCT FROM 'goplus'
     OR p_cooldown_seconds IS NULL
     OR p_cooldown_seconds < 0
     OR p_cooldown_seconds > 7200 THEN
    RAISE EXCEPTION 'Invalid rate-gate parameters';
  END IF;
  INSERT INTO public.wallet_token_risk_provider_state(provider)
    VALUES('goplus') ON CONFLICT DO NOTHING;
  SELECT next_request_at,blocked_until INTO v_state
    FROM public.wallet_token_risk_provider_state
    WHERE provider='goplus' FOR UPDATE;
  IF p_cooldown_seconds > 0 THEN
    UPDATE public.wallet_token_risk_provider_state
      SET blocked_until=GREATEST(blocked_until,now()+make_interval(secs=>p_cooldown_seconds)),
          updated_at=now()
      WHERE provider='goplus';
    RETURN 'cooldown';
  END IF;
  IF v_state.blocked_until > now() THEN RETURN 'cooldown'; END IF;
  IF v_state.next_request_at > now() THEN RETURN 'throttled'; END IF;
  UPDATE public.wallet_token_risk_provider_state
    SET next_request_at=now()+interval '3 seconds',updated_at=now()
    WHERE provider='goplus';
  -- Abgelaufene Cache-Eintraege werden nicht unbegrenzt gespeichert.
  DELETE FROM public.wallet_token_risk_cache
    WHERE expires_at < now()-interval '7 days';
  RETURN 'allowed';
END
$function$;
REVOKE ALL ON FUNCTION public.wallettracking_token_risk_provider_gate(text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_token_risk_provider_gate(text,integer)
  TO service_role;
