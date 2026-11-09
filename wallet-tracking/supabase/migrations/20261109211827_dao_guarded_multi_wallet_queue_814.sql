-- 8.14: Isolated, lease-token-bound DAO staging queue. Does NOT schedule a cron.
-- Does NOT complete canonical rewards; no wallet plaintext or reward amounts stored.
ALTER TABLE public.wallet_reward_refresh_attempts
 ADD COLUMN IF NOT EXISTS lease_token uuid,
 ADD COLUMN IF NOT EXISTS step_count integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0;

-- Separate versioned RPCs: preserve TLN/VOW and prior queue contracts.
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
   AND a.step_count < 8 AND a.failure_count < 3
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

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_transition_v2(
 p_day date,p_user uuid,p_wallet uuid,p_lease uuid,p_state text,p_error text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_state NOT IN ('partial','staged','failed') THEN RAISE EXCEPTION 'Invalid staging transition'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state=p_state, lease_until=NULL, lease_token=NULL,
     last_error=CASE WHEN p_state='failed' THEN left(coalesce(p_error,'Unknown staging error'),2000) ELSE NULL END,
     failure_count=failure_count+CASE WHEN p_state='failed' THEN 1 ELSE 0 END,
     updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='dao1' AND scan_day=p_day
   AND state='running' AND lease_token=p_lease AND lease_until>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'DAO reward lease expired or owned by another worker'; END IF;
END $function$;

REVOKE ALL ON FUNCTION public.wallettracking_dao_reward_claim_v2(date),
 public.wallettracking_dao_reward_transition_v2(date,uuid,uuid,uuid,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reward_claim_v2(date),
 public.wallettracking_dao_reward_transition_v2(date,uuid,uuid,uuid,text,text) TO service_role;
