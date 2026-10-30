-- WalletTracking 7.68 · serverseitiger Tagesjob: Service-Role-only.
-- Tabellen public nur, weil Edge/PostgREST sie serverseitig benötigt.
-- Kein Zugriff für anon/authenticated; RLS an. Keine Klartext-Walletadressen in diesen Tabellen.
CREATE TABLE IF NOT EXISTS public.wallet_daily_refresh_attempts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  scan_day date NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','running','failed','completed')),
  lease_until timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,wallet_id,scan_day)
);
CREATE TABLE IF NOT EXISTS public.wallet_daily_refresh_cache (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  scan_day date NOT NULL,
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='array'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,wallet_id)
);
CREATE TABLE IF NOT EXISTS public.wallet_daily_refresh_completed (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  scan_day date NOT NULL,
  snapshot_id uuid NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_daily_refresh_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_daily_refresh_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_daily_refresh_completed ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_daily_refresh_attempts, public.wallet_daily_refresh_cache, public.wallet_daily_refresh_completed FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.wallet_daily_refresh_attempts, public.wallet_daily_refresh_cache, public.wallet_daily_refresh_completed TO service_role;

-- One wallet per worker invocation; atomic row-level claim, bounded retries.
CREATE OR REPLACE FUNCTION public.wallettracking_daily_claim(p_day date)
RETURNS TABLE(user_id uuid,wallet_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid job day'; END IF;
 INSERT INTO public.wallet_daily_refresh_attempts(user_id,wallet_id,scan_day)
 SELECT w.user_id,w.id,p_day FROM public.wallets w
 ON CONFLICT DO NOTHING;
 RETURN QUERY
 WITH next AS (
  SELECT a.user_id,a.wallet_id,a.scan_day
  FROM public.wallet_daily_refresh_attempts a
  WHERE a.scan_day=p_day AND a.attempt_count<3
    AND (a.state IN('pending','failed') OR (a.state='running' AND a.lease_until<now()))
  ORDER BY a.attempt_count,a.updated_at,a.user_id,a.wallet_id
  FOR UPDATE SKIP LOCKED LIMIT 1
 )
 UPDATE public.wallet_daily_refresh_attempts a
 SET attempt_count=a.attempt_count+1,state='running',lease_until=now()+interval '4 minutes',updated_at=now()
 FROM next n WHERE (a.user_id,a.wallet_id,a.scan_day)=(n.user_id,n.wallet_id,n.scan_day)
 RETURNING a.user_id,a.wallet_id;
END $$;

CREATE OR REPLACE FUNCTION public.wallettracking_daily_fail(p_wallet uuid,p_user uuid,p_day date,p_error text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 UPDATE public.wallet_daily_refresh_attempts SET state='failed',lease_until=NULL,last_error=left(p_error,2000),updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND scan_day=p_day AND state='running';
END $$;

-- Completes a wallet and, if all currently registered wallets of that user have succeeded today,
-- commits a whole-user portfolio snapshot in the same database transaction.
CREATE OR REPLACE FUNCTION public.wallettracking_daily_complete(p_wallet uuid,p_user uuid,p_day date,p_items jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid; v_items jsonb; v_expected integer; v_ready integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid job day'; END IF;
 IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)>10000 THEN RAISE EXCEPTION 'Invalid positions'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text,781123));
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallet_daily_refresh_attempts WHERE user_id=p_user AND wallet_id=p_wallet AND scan_day=p_day AND state='running' AND lease_until>now()) THEN RAISE EXCEPTION 'Refresh lease expired or missing'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_items) AS i(chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric)
           WHERE chain IS NULL OR symbol IS NULL OR length(chain)>32 OR length(symbol)>120 OR amount IS NULL OR amount<0 OR amount::text IN('NaN','Infinity','-Infinity') OR (price_usd IS NOT NULL AND (price_usd<0 OR price_usd::text IN('NaN','Infinity','-Infinity')))) THEN RAISE EXCEPTION 'Invalid numeric position'; END IF;
 INSERT INTO public.wallet_daily_refresh_cache(user_id,wallet_id,scan_day,payload,updated_at)
 VALUES(p_user,p_wallet,p_day,p_items,now())
 ON CONFLICT(user_id,wallet_id) DO UPDATE SET scan_day=excluded.scan_day,payload=excluded.payload,updated_at=now();
 UPDATE public.wallet_daily_refresh_attempts SET state='completed',lease_until=NULL,last_error=NULL,updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND scan_day=p_day;
 SELECT count(*) INTO v_expected FROM public.wallets WHERE user_id=p_user;
 SELECT count(*) INTO v_ready FROM public.wallet_daily_refresh_cache c JOIN public.wallets w ON w.id=c.wallet_id AND w.user_id=c.user_id WHERE c.user_id=p_user AND c.scan_day=p_day;
 IF v_expected=0 OR v_ready<>v_expected THEN RETURN false; END IF;
 -- Snapshot for this day is final once: avoid repeating when retrying a job.
 IF EXISTS(SELECT 1 FROM public.wallet_daily_refresh_completed WHERE user_id=p_user AND scan_day=p_day) THEN RETURN false; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('wallet_id',c.wallet_id,'chain',i.chain,'symbol',i.symbol,'address',i.address,'is_native',i.is_native,'amount',i.amount,'price_usd',i.price_usd)),'[]'::jsonb)
 INTO v_items FROM public.wallet_daily_refresh_cache c JOIN public.wallets w ON w.id=c.wallet_id AND w.user_id=c.user_id
 CROSS JOIN LATERAL jsonb_to_recordset(c.payload) AS i(chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric)
 WHERE c.user_id=p_user AND c.scan_day=p_day;
 -- An entirely zero-balance portfolio still requires a day status, but must not erase the last valid snapshot.
 IF jsonb_array_length(v_items)=0 THEN RETURN false; END IF;
 INSERT INTO public.snapshots(user_id,is_automated) VALUES(p_user,true) RETURNING id INTO v_id;
 INSERT INTO public.snapshot_items(snapshot_id,user_id,wallet_id,chain,symbol,address,is_native,amount,price_usd)
 SELECT v_id,p_user,i.wallet_id,i.chain,i.symbol,i.address,coalesce(i.is_native,false),i.amount,i.price_usd
 FROM jsonb_to_recordset(v_items) AS i(wallet_id uuid,chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric);
 DELETE FROM public.snapshots WHERE user_id=p_user AND is_automated AND id<>v_id;
 INSERT INTO public.wallet_daily_refresh_completed(user_id,scan_day,snapshot_id,updated_at) VALUES(p_user,p_day,v_id,now())
 ON CONFLICT(user_id) DO UPDATE SET scan_day=excluded.scan_day,snapshot_id=excluded.snapshot_id,updated_at=now();
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_daily_claim(date),public.wallettracking_daily_fail(uuid,uuid,date,text),public.wallettracking_daily_complete(uuid,uuid,date,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_daily_claim(date),public.wallettracking_daily_fail(uuid,uuid,date,text),public.wallettracking_daily_complete(uuid,uuid,date,jsonb) TO service_role;
