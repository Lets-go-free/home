-- DAO reward staging: a partial raw-import pass must remain claimable.
-- No CRON enabled. No reward sums or claim assignments modified.
ALTER TABLE public.wallet_reward_refresh_attempts
 DROP CONSTRAINT IF EXISTS wallet_reward_refresh_attempts_state_check;
ALTER TABLE public.wallet_reward_refresh_attempts
 ADD CONSTRAINT wallet_reward_refresh_attempts_state_check
 CHECK (state IN ('pending','running','partial','staged','failed','completed'));

CREATE OR REPLACE FUNCTION public.wallettracking_reward_claim(p_day date,p_project text)
RETURNS TABLE(user_id uuid,wallet_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_project NOT IN ('dao1','tln-vow') THEN RAISE EXCEPTION 'Invalid project'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 INSERT INTO public.wallet_reward_refresh_attempts(user_id,wallet_id,project_key,scan_day)
 SELECT w.user_id,w.id,p_project,p_day FROM public.wallets w
 WHERE w.evm_address_ciphertext IS NOT NULL
 ON CONFLICT DO NOTHING;
 RETURN QUERY
 WITH next AS (
  SELECT a.user_id,a.wallet_id,a.project_key,a.scan_day
  FROM public.wallet_reward_refresh_attempts a
  WHERE a.project_key=p_project AND a.scan_day=p_day AND a.attempt_count<3
    AND (a.state IN ('pending','failed','partial')
         OR (a.state='running' AND a.lease_until<now()))
  ORDER BY a.attempt_count,a.updated_at,a.user_id,a.wallet_id
  FOR UPDATE SKIP LOCKED LIMIT 1
 )
 UPDATE public.wallet_reward_refresh_attempts a
 SET state='running',attempt_count=a.attempt_count+1,
     lease_until=now()+interval '4 minutes',updated_at=now()
 FROM next n
 WHERE (a.user_id,a.wallet_id,a.project_key,a.scan_day)=(n.user_id,n.wallet_id,n.project_key,n.scan_day)
 RETURNING a.user_id,a.wallet_id;
END $$;

-- Explicit continuation: release lease but keep work in the queue.
-- Reset retry budget only after a successful bounded chunk, never on errors.
CREATE OR REPLACE FUNCTION public.wallettracking_reward_continue(
 p_day date,p_project text,p_user uuid,p_wallet uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state='partial',attempt_count=0,lease_until=NULL,last_error=NULL,updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key=p_project AND scan_day=p_day
   AND state='running' AND lease_until>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'Reward job lease missing or expired'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_reward_claim(date,text),
 public.wallettracking_reward_continue(date,text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_reward_claim(date,text),
 public.wallettracking_reward_continue(date,text,uuid,uuid) TO service_role;
