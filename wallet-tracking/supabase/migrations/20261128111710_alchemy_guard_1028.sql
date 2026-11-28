BEGIN;
CREATE SCHEMA IF NOT EXISTS wallettracking_internal;
CREATE TABLE wallettracking_internal.alchemy_guard_1028 (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 manual_hold boolean NOT NULL DEFAULT true,
 quota_hold boolean NOT NULL DEFAULT false,
 blocked_until timestamptz,
 consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
 last_event text NOT NULL DEFAULT 'operator-hold',
 updated_at timestamptz NOT NULL DEFAULT now(),
 limit_percent numeric NOT NULL DEFAULT 95 CHECK (limit_percent > 0 AND limit_percent <= 100),
 period_start timestamptz, period_end timestamptz, usage_through timestamptz,
 cu_limit numeric, cu_used numeric, cu_remaining numeric, percent_used numeric
);
ALTER TABLE wallettracking_internal.alchemy_guard_1028 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wallettracking_internal.alchemy_guard_1028 FROM PUBLIC, anon, authenticated, service_role;
INSERT INTO wallettracking_internal.alchemy_guard_1028(id) VALUES(true);
CREATE FUNCTION public.wallettracking_alchemy_gate_1028() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
 SELECT jsonb_build_object('allowed', NOT manual_hold AND NOT quota_hold AND (blocked_until IS NULL OR blocked_until <= now()),
 'reason', CASE WHEN manual_hold THEN 'operator-hold' WHEN quota_hold THEN 'quota-hold' WHEN blocked_until > now() THEN 'cooldown' ELSE 'available' END)
 FROM wallettracking_internal.alchemy_guard_1028 WHERE id
$$;
CREATE FUNCTION public.wallettracking_alchemy_event_1028(p_event text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF p_event IS NULL OR p_event NOT IN ('success','monthly-limit','rate-limit','temporary','forbidden') THEN RAISE EXCEPTION 'Invalid guard event'; END IF;
 UPDATE wallettracking_internal.alchemy_guard_1028 SET
 quota_hold = quota_hold OR p_event = 'monthly-limit',
 consecutive_failures = CASE WHEN p_event='success' THEN 0 ELSE least(consecutive_failures+1,1000) END,
 blocked_until = CASE WHEN p_event='rate-limit' THEN greatest(blocked_until,now()+interval '2 minutes')
 WHEN p_event='forbidden' THEN greatest(blocked_until,now()+interval '15 minutes')
 WHEN p_event='temporary' AND consecutive_failures>=2 THEN greatest(blocked_until,now()+interval '5 minutes') ELSE blocked_until END,
 last_event=p_event,updated_at=now() WHERE id;
END $$;
CREATE FUNCTION public.wallettracking_alchemy_usage_1028(p_start timestamptz,p_end timestamptz,p_through timestamptz,p_limit numeric,p_used numeric,p_remaining numeric,p_percent numeric) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r wallettracking_internal.alchemy_guard_1028%ROWTYPE;
BEGIN
 IF p_start IS NULL OR p_end IS NULL OR p_through IS NULL OR p_limit IS NULL OR p_used IS NULL OR p_remaining IS NULL OR p_percent IS NULL OR p_start>=p_end OR p_end<=now() OR p_start>now() OR p_through<p_start OR p_through>now()+interval '5 minutes' OR p_limit<=0 OR p_used<0 OR p_remaining<0 OR p_percent<0 OR p_used/p_limit*100 < p_percent-1 OR p_used/p_limit*100 > p_percent+1 THEN RAISE EXCEPTION 'Invalid usage summary'; END IF;
 UPDATE wallettracking_internal.alchemy_guard_1028 SET
 quota_hold = CASE WHEN p_percent>=limit_percent OR p_remaining=0 OR p_used>=p_limit THEN true WHEN period_end IS NOT NULL AND p_start>=period_end AND p_through>=p_start THEN false ELSE quota_hold END,
 period_start=p_start,period_end=p_end,usage_through=p_through,cu_limit=p_limit,cu_used=p_used,cu_remaining=p_remaining,percent_used=p_percent,updated_at=now()
 WHERE id AND (usage_through IS NULL OR p_through>=usage_through) RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Stale usage summary'; END IF;
 RETURN jsonb_build_object('manualHold',r.manual_hold,'quotaHold',r.quota_hold,'limitPercent',r.limit_percent,'periodEnd',r.period_end,'usageThrough',r.usage_through,'cuLimit',r.cu_limit,'cuUsed',r.cu_used,'cuRemaining',r.cu_remaining,'percentUsed',r.percent_used);
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_alchemy_gate_1028() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.wallettracking_alchemy_gate_1028() TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.wallettracking_alchemy_event_1028(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.wallettracking_alchemy_event_1028(text) TO service_role;
REVOKE ALL ON FUNCTION public.wallettracking_alchemy_usage_1028(timestamptz,timestamptz,timestamptz,numeric,numeric,numeric,numeric) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.wallettracking_alchemy_usage_1028(timestamptz,timestamptz,timestamptz,numeric,numeric,numeric,numeric) TO service_role;
COMMIT;
