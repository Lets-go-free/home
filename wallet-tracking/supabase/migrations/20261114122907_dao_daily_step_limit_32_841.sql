-- WalletTracking 8.41 — DAO1 daily wallet step limit: 8 -> 32.
-- No cron setup, no job launch, no queue reset, no canonical reward/price/NFT writes.
-- Keep existing service_role checks, Zurich date guard, SKIP LOCKED, leases and failure cap (3).
-- These definitions preserve the code of the existing 8.14 and 8.16 RPCs except for step_count < 32.

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_claim_v2(p_day date)
RETURNS TABLE(user_id uuid,wallet_id uuid,lease_token uuid,step_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 INSERT INTO public.wallet_reward_refresh_attempts(user_id,wallet_id,project_key,scan_day)
 SELECT w.user_id,w.id,'dao1',p_day FROM public.wallets w
 WHERE w.evm_address_ciphertext IS NOT NULL AND w.encryption_version=1 AND w.key_version=1
 ON CONFLICT DO NOTHING;
 RETURN QUERY
 WITH next AS (
  SELECT a.user_id,a.wallet_id,a.scan_day
  FROM public.wallet_reward_refresh_attempts a
  JOIN public.wallets w ON w.id=a.wallet_id AND w.user_id=a.user_id
  WHERE a.project_key='dao1' AND a.scan_day=p_day
   AND w.evm_address_ciphertext IS NOT NULL AND w.encryption_version=1 AND w.key_version=1
   AND a.step_count < 32 AND a.failure_count < 3
   AND (a.state IN ('pending','failed','partial') OR (a.state='running' AND a.lease_until < now()))
  ORDER BY a.step_count,a.updated_at,a.user_id,a.wallet_id
  FOR UPDATE OF a SKIP LOCKED LIMIT 1
 )
 UPDATE public.wallet_reward_refresh_attempts a
 SET state='running',attempt_count=a.attempt_count+1,step_count=a.step_count+1,
     lease_token=gen_random_uuid(), lease_until=now()+interval '4 minutes',updated_at=now()
 FROM next n
 WHERE (a.user_id,a.wallet_id,a.scan_day)=(n.user_id,n.wallet_id,n.scan_day)
  AND a.project_key='dao1'
 RETURNING a.user_id,a.wallet_id,a.lease_token,a.step_count;
END $function$;

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_claim_staged_v3(p_day date)
RETURNS TABLE(user_id uuid,wallet_id uuid,lease_token uuid,step_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 RETURN QUERY
 WITH next AS (
  SELECT a.user_id,a.wallet_id,a.scan_day
  FROM public.wallet_reward_refresh_attempts a
  JOIN public.wallets w ON w.id=a.wallet_id AND w.user_id=a.user_id
  WHERE a.project_key='dao1' AND a.scan_day=p_day
   AND w.evm_address_ciphertext IS NOT NULL AND w.encryption_version=1 AND w.key_version=1
   AND a.step_count<32 AND a.failure_count<3
   AND (a.state='staged' OR (a.state='reward_running' AND a.lease_until<now()))
  ORDER BY a.step_count,a.updated_at,a.user_id,a.wallet_id
  FOR UPDATE OF a SKIP LOCKED LIMIT 1
 )
 UPDATE public.wallet_reward_refresh_attempts a
 SET state='reward_running',attempt_count=a.attempt_count+1,step_count=a.step_count+1,
     lease_token=gen_random_uuid(),lease_until=now()+interval '4 minutes',updated_at=now()
 FROM next n
 WHERE (a.user_id,a.wallet_id,a.scan_day)=(n.user_id,n.wallet_id,n.scan_day)
  AND a.project_key='dao1'
 RETURNING a.user_id,a.wallet_id,a.lease_token,a.step_count;
END $fn$;

-- Keep restricted permissions explicit after replacement.
REVOKE ALL ON FUNCTION public.wallettracking_dao_reward_claim_v2(date),
 public.wallettracking_dao_reward_claim_staged_v3(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reward_claim_v2(date),
 public.wallettracking_dao_reward_claim_staged_v3(date) TO service_role;
