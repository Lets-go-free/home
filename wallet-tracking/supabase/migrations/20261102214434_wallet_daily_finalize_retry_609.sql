-- WalletTracking 6.09: Tagesabschluss strikt von Wallet-Aktualisierung trennen.
-- Wallet-Cache/Job-Status werden zuerst atomar gespeichert; Snapshot läuft in eigener,
-- unabhängig wiederholbarer Transaktion. Historien-Trigger und Retention bleiben bestehen.
-- Diese Migration liefert keine SELECT-Resultsets.
CREATE TABLE IF NOT EXISTS public.wallet_daily_finalize_errors (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_day date NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,scan_day)
);
ALTER TABLE public.wallet_daily_finalize_errors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_daily_finalize_errors FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.wallet_daily_finalize_errors TO service_role;

CREATE OR REPLACE FUNCTION public.wallettracking_daily_complete(p_wallet uuid,p_user uuid,p_day date,p_items jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_expected integer; v_ready integer;
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
 -- The wallet transaction commits independently of final snapshot creation.
 -- Snapshot finalization is retried by the Edge worker through a separate RPC.
 RETURN v_expected > 0 AND v_ready = v_expected;
END $$;

CREATE OR REPLACE FUNCTION public.wallettracking_daily_finalize(p_user uuid,p_day date)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid; v_items jsonb; v_expected integer; v_ready integer; v_attempts integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid job day'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text,781123));
 IF EXISTS(SELECT 1 FROM public.wallet_daily_refresh_completed WHERE user_id=p_user AND scan_day=p_day) THEN RETURN false; END IF;
 SELECT count(*) INTO v_expected FROM public.wallets WHERE user_id=p_user;
 SELECT count(*) INTO v_ready FROM public.wallet_daily_refresh_cache c
 JOIN public.wallets w ON w.id=c.wallet_id AND w.user_id=c.user_id
 JOIN public.wallet_daily_refresh_attempts a ON a.wallet_id=w.id AND a.user_id=w.user_id AND a.scan_day=p_day
 WHERE c.user_id=p_user AND c.scan_day=p_day AND a.state='completed';
 IF v_expected=0 OR v_ready<>v_expected THEN RETURN false; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('wallet_id',c.wallet_id,'chain',i.chain,'symbol',i.symbol,
   'address',i.address,'is_native',i.is_native,'amount',i.amount,'price_usd',i.price_usd)),'[]'::jsonb)
 INTO v_items FROM public.wallet_daily_refresh_cache c
 JOIN public.wallets w ON w.id=c.wallet_id AND w.user_id=c.user_id
 CROSS JOIN LATERAL jsonb_to_recordset(c.payload)
 AS i(chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric)
 WHERE c.user_id=p_user AND c.scan_day=p_day;
 -- Leeres Gesamtportfolio nicht als vorhandenen historischen Wert ausgeben.
 IF jsonb_array_length(v_items)=0 THEN RETURN false; END IF;
 INSERT INTO public.snapshots(user_id,is_automated) VALUES(p_user,true) RETURNING id INTO v_id;
 INSERT INTO public.snapshot_items(snapshot_id,user_id,wallet_id,chain,symbol,address,is_native,amount,price_usd)
 SELECT v_id,p_user,i.wallet_id,i.chain,i.symbol,i.address,coalesce(i.is_native,false),i.amount,i.price_usd
 FROM jsonb_to_recordset(v_items)
 AS i(wallet_id uuid,chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric);
 -- Der vorhandene Trigger auf wallet_daily_refresh_completed archiviert diesen Snapshot.
 -- Reihenfolge beibehalten: bestehende automatisierte Snapshot-Ansicht erst danach ersetzen.
 INSERT INTO public.wallet_daily_refresh_completed(user_id,scan_day,snapshot_id,updated_at)
 VALUES(p_user,p_day,v_id,now())
 ON CONFLICT(user_id) DO UPDATE SET scan_day=excluded.scan_day,snapshot_id=excluded.snapshot_id,updated_at=now();
 DELETE FROM public.snapshots WHERE user_id=p_user AND is_automated AND id<>v_id;
 DELETE FROM public.wallet_daily_finalize_errors WHERE user_id=p_user AND scan_day=p_day;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.wallettracking_daily_finalize_next(p_day date)
RETURNS TABLE(user_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid job day'; END IF;
 RETURN QUERY
 SELECT w.user_id FROM public.wallets w
 LEFT JOIN public.wallet_daily_finalize_errors e ON e.user_id=w.user_id AND e.scan_day=p_day
 WHERE (e.updated_at IS NULL OR e.updated_at < now()-interval '10 minutes')
 AND NOT EXISTS (SELECT 1 FROM public.wallet_daily_refresh_completed c WHERE c.user_id=w.user_id AND c.scan_day=p_day)
 GROUP BY w.user_id
 HAVING count(*)>0 AND count(*) = (
  SELECT count(*) FROM public.wallet_daily_refresh_attempts a
  JOIN public.wallet_daily_refresh_cache cc ON cc.user_id=a.user_id AND cc.wallet_id=a.wallet_id AND cc.scan_day=a.scan_day
  WHERE a.user_id=w.user_id AND a.scan_day=p_day AND a.state='completed'
 )
 ORDER BY w.user_id LIMIT 1;
END $$;

CREATE OR REPLACE FUNCTION public.wallettracking_daily_finalize_fail(p_user uuid,p_day date,p_error text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid job day'; END IF;
 INSERT INTO public.wallet_daily_finalize_errors(user_id,scan_day,attempt_count,last_error,updated_at)
 VALUES(p_user,p_day,1,left(p_error,2000),now())
 ON CONFLICT(user_id,scan_day) DO UPDATE SET
 attempt_count=public.wallet_daily_finalize_errors.attempt_count+1,last_error=excluded.last_error,updated_at=now();
END $$;

REVOKE ALL ON FUNCTION public.wallettracking_daily_complete(uuid,uuid,date,jsonb),
 public.wallettracking_daily_finalize(uuid,date),public.wallettracking_daily_finalize_next(date),
 public.wallettracking_daily_finalize_fail(uuid,date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_daily_complete(uuid,uuid,date,jsonb),
 public.wallettracking_daily_finalize(uuid,date),public.wallettracking_daily_finalize_next(date),
 public.wallettracking_daily_finalize_fail(uuid,date,text) TO service_role;
