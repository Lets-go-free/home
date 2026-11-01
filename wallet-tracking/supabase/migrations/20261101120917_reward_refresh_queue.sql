-- Reward job queue: staging infrastructure only, NO CRON enabled by this migration.
-- Security: user-owned IDs only, no decrypted addresses in this table.
CREATE TABLE IF NOT EXISTS public.wallet_reward_refresh_attempts (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
 project_key text NOT NULL CHECK (project_key IN ('dao1','tln-vow')),
 scan_day date NOT NULL,
 attempt_count integer NOT NULL DEFAULT 0,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','running','failed','completed')),
 lease_until timestamptz,
 last_error text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,wallet_id,project_key,scan_day)
);
ALTER TABLE public.wallet_reward_refresh_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_reward_refresh_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.wallet_reward_refresh_attempts TO service_role;

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
    AND (a.state IN ('pending','failed') OR (a.state='running' AND a.lease_until<now()))
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

CREATE OR REPLACE FUNCTION public.wallettracking_reward_finish(p_day date,p_project text,p_user uuid,p_wallet uuid,p_error text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state=CASE WHEN p_error IS NULL THEN 'completed' ELSE 'failed' END,
     last_error=left(p_error,2000),lease_until=NULL,updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key=p_project AND scan_day=p_day
   AND state='running';
 IF NOT FOUND THEN RAISE EXCEPTION 'Reward job lease missing'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_reward_claim(date,text),public.wallettracking_reward_finish(date,text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_reward_claim(date,text),public.wallettracking_reward_finish(date,text,uuid,uuid,text) TO service_role;
