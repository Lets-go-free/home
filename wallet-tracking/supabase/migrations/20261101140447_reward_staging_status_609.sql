-- Reward imports are not completed rewards. Separate the staging state.
-- Existing completed rows are NOT reset: no worker has been deployed yet.
ALTER TABLE public.wallet_reward_refresh_attempts
 DROP CONSTRAINT IF EXISTS wallet_reward_refresh_attempts_state_check;
ALTER TABLE public.wallet_reward_refresh_attempts
 ADD CONSTRAINT wallet_reward_refresh_attempts_state_check
 CHECK (state IN ('pending','running','staged','failed','completed'));

CREATE OR REPLACE FUNCTION public.wallettracking_reward_stage(
 p_day date, p_project text, p_user uuid, p_wallet uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role only';
 END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state='staged', lease_until=NULL, last_error=NULL, updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key=p_project
   AND scan_day=p_day AND state='running' AND lease_until>now();
 IF NOT FOUND THEN
   RAISE EXCEPTION 'Reward job lease missing or expired';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_reward_stage(date,text,uuid,uuid)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_reward_stage(date,text,uuid,uuid)
 TO service_role;
