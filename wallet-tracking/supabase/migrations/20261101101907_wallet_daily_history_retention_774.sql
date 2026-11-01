-- WalletTracking 7.74: Historie automatischer Wallet-Bestaende.
-- Letzte 7 Kalendertage taeglich; Tage 8-365 wochenweise; aelter monatlich.
-- Die jeweils letzte vorhandene Aufnahme pro ISO-Woche / Kalendermonat bleibt erhalten.
-- Manuelle Snapshots (is_automated=false) werden NIE veraendert.
-- Der aktuelle automatische Portfolio-Snapshot bleibt wie bisher separat erhalten.
CREATE TABLE IF NOT EXISTS public.wallet_daily_balance_history (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sample_day date NOT NULL,
  captured_at timestamptz NOT NULL,
  wallet_count integer NOT NULL CHECK (wallet_count >= 0),
  position_count integer NOT NULL CHECK (position_count >= 0),
  total_usd numeric NOT NULL,
  unpriced_positions integer NOT NULL DEFAULT 0,
  positions jsonb NOT NULL CHECK (jsonb_typeof(positions) = 'array'),
  PRIMARY KEY (user_id, sample_day)
);
CREATE INDEX IF NOT EXISTS wallet_daily_balance_history_day_idx
 ON public.wallet_daily_balance_history(sample_day);
ALTER TABLE public.wallet_daily_balance_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wallet_daily_balance_history FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.wallet_daily_balance_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallet_daily_balance_history TO service_role;
DROP POLICY IF EXISTS wallet_balance_history_own_read ON public.wallet_daily_balance_history;
CREATE POLICY wallet_balance_history_own_read ON public.wallet_daily_balance_history
 FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Retention wird beim Tagesabschluss ausgefuehrt, nicht bei Browser-Aufrufen.
CREATE OR REPLACE FUNCTION public.wallettracking_compact_balance_history(p_today date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role required';
 END IF;
 -- Retention nach dem *Schweizer Kalendertag*, keine festen 24h-Abstaende.
 -- 8-365 Tage: neueste verfuegbare Aufnahme je ISO-Woche behalten.
 -- Jenseits 365 Tagen: neueste verfuegbare Aufnahme je Kalendermonat behalten.
 DELETE FROM public.wallet_daily_balance_history h
 WHERE h.sample_day < p_today - 7
   AND (
     (h.sample_day >= p_today - 365 AND EXISTS (
       SELECT 1 FROM public.wallet_daily_balance_history newer
       WHERE newer.user_id=h.user_id
         AND newer.sample_day > h.sample_day
         AND newer.sample_day < p_today - 7
         AND pg_catalog.date_trunc('week',newer.sample_day::timestamp)=pg_catalog.date_trunc('week',h.sample_day::timestamp)
     ))
     OR
     (h.sample_day < p_today - 365 AND EXISTS (
       SELECT 1 FROM public.wallet_daily_balance_history newer
       WHERE newer.user_id=h.user_id
         AND newer.sample_day > h.sample_day
         AND pg_catalog.date_trunc('month',newer.sample_day::timestamp)=pg_catalog.date_trunc('month',h.sample_day::timestamp)
     ))
   );
END $$;

-- Completion-Trigger: wird automatisch und transaktional durch den vorhandenen
-- wallettracking_daily_complete() aufgerufen, nachdem Snapshot-Items geschrieben wurden.
CREATE OR REPLACE FUNCTION public.wallettracking_capture_balance_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_positions jsonb; v_count integer; v_wallets integer; v_total numeric; v_unpriced integer;
BEGIN
 IF NEW.snapshot_id IS NULL THEN RETURN NEW; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.snapshots s
   WHERE s.id=NEW.snapshot_id AND s.user_id=NEW.user_id AND s.is_automated=true) THEN
   RAISE EXCEPTION 'Daily history source must be an automated snapshot';
 END IF;
 SELECT pg_catalog.coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'wallet_id',i.wallet_id,'chain',i.chain,'symbol',i.symbol,
    'address',i.address,'is_native',i.is_native,'amount',i.amount,'price_usd',i.price_usd
 ) ORDER BY i.wallet_id,i.chain,i.symbol,i.address),'[]'::jsonb),
 pg_catalog.count(*)::integer, pg_catalog.count(DISTINCT i.wallet_id)::integer,
 pg_catalog.coalesce(pg_catalog.sum(i.amount * i.price_usd),0),
 pg_catalog.count(*) FILTER(WHERE i.price_usd IS NULL)::integer
 INTO v_positions,v_count,v_wallets,v_total,v_unpriced
 FROM public.snapshot_items i WHERE i.snapshot_id=NEW.snapshot_id AND i.user_id=NEW.user_id;
 INSERT INTO public.wallet_daily_balance_history
 (user_id,sample_day,captured_at,wallet_count,position_count,total_usd,unpriced_positions,positions)
 VALUES(NEW.user_id,NEW.scan_day,NEW.updated_at,v_wallets,v_count,v_total,v_unpriced,v_positions)
 ON CONFLICT (user_id,sample_day) DO UPDATE SET
 captured_at=EXCLUDED.captured_at,wallet_count=EXCLUDED.wallet_count,
 position_count=EXCLUDED.position_count,total_usd=EXCLUDED.total_usd,
 unpriced_positions=EXCLUDED.unpriced_positions,positions=EXCLUDED.positions;
 PERFORM public.wallettracking_compact_balance_history((now() AT TIME ZONE 'Europe/Zurich')::date);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS wallettracking_capture_daily_balance_history ON public.wallet_daily_refresh_completed;
CREATE TRIGGER wallettracking_capture_daily_balance_history
 AFTER INSERT OR UPDATE OF snapshot_id ON public.wallet_daily_refresh_completed
 FOR EACH ROW EXECUTE FUNCTION public.wallettracking_capture_balance_history();
REVOKE ALL ON FUNCTION public.wallettracking_compact_balance_history(date),public.wallettracking_capture_balance_history() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_compact_balance_history(date) TO service_role;

-- Einmalige Uebernahme des aktuell noch verfuegbaren automatischen Snapshots.
-- Keine Rekonstruktion bereits ersetzter historischer Tagesstaende.
INSERT INTO public.wallet_daily_balance_history
(user_id,sample_day,captured_at,wallet_count,position_count,total_usd,unpriced_positions,positions)
SELECT s.user_id,c.scan_day,c.updated_at,
 count(DISTINCT i.wallet_id)::integer,count(i.id)::integer,
 coalesce(sum(i.amount*i.price_usd),0),count(i.id) FILTER(WHERE i.price_usd IS NULL)::integer,
 coalesce(jsonb_agg(jsonb_build_object('wallet_id',i.wallet_id,'chain',i.chain,'symbol',i.symbol,
  'address',i.address,'is_native',i.is_native,'amount',i.amount,'price_usd',i.price_usd)
  ORDER BY i.wallet_id,i.chain,i.symbol) FILTER(WHERE i.id IS NOT NULL),'[]'::jsonb)
FROM public.wallet_daily_refresh_completed c
JOIN public.snapshots s ON s.id=c.snapshot_id AND s.user_id=c.user_id AND s.is_automated=true
LEFT JOIN public.snapshot_items i ON i.snapshot_id=s.id AND i.user_id=s.user_id
GROUP BY s.user_id,c.scan_day,c.updated_at
ON CONFLICT(user_id,sample_day) DO NOTHING;
