-- WalletTracking 8.16: separate guarded phase for DAO1 wallets whose raw scans are staged.
-- No automatic cron or data backfill. TLN/VOW legacy RPC contracts untouched.
-- A staged wallet is never called completed merely because no new claim was created.
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
   AND a.step_count<8 AND a.failure_count<3
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

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_finish_staged_v3(
 p_day date,p_user uuid,p_wallet uuid,p_lease uuid,p_state text,p_error text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 IF p_state NOT IN ('staged','completed','failed') THEN RAISE EXCEPTION 'Invalid reward transition'; END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state=p_state,lease_until=NULL,lease_token=NULL,
     last_error=CASE WHEN p_state='failed' THEN left(coalesce(p_error,'Unknown reward error'),2000) ELSE NULL END,
     failure_count=failure_count+CASE WHEN p_state='failed' THEN 1 ELSE 0 END,updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='dao1' AND scan_day=p_day
  AND state='reward_running' AND lease_token=p_lease AND lease_until>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'DAO reward lease expired or owned by another worker'; END IF;
END $fn$;

-- Can be called only server-side and cannot modify any canonical record.
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_readiness_v3(p_user uuid,p_wallet uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE total_candidates integer; unresolved integer; invalid_reference integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch'; END IF;
 SELECT count(*),count(*) FILTER (
  WHERE canonical_existing_verified IS DISTINCT FROM true
   AND audit_classification IS NULL
   AND payout_status IS DISTINCT FROM 'no_payout_evidence'
   AND claim_pipeline_status IS DISTINCT FROM 'completed'
 ), count(*) FILTER (WHERE audit_classification IS NOT NULL AND audit_classification<>'unpriced_before_exact_anchor')
 INTO total_candidates,unresolved,invalid_reference
 FROM public.dao_reward_claim_candidates
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='dao1' AND chain_key='apertum';
 RETURN jsonb_build_object('candidates',total_candidates,'unresolved',unresolved,'unrecognizedExceptions',invalid_reference);
END $fn$;

REVOKE ALL ON FUNCTION public.wallettracking_dao_reward_claim_staged_v3(date),
 public.wallettracking_dao_reward_finish_staged_v3(date,uuid,uuid,uuid,text,text),
 public.wallettracking_dao_reward_readiness_v3(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reward_claim_staged_v3(date),
 public.wallettracking_dao_reward_finish_staged_v3(date,uuid,uuid,uuid,text,text),
 public.wallettracking_dao_reward_readiness_v3(uuid,uuid) TO service_role;
