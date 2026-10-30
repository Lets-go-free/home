-- WalletTracking 7.68 (Entwicklungsstand): atomarer, usergebundener Snapshot-Ersatz.
-- Eine Anweisung, ein Resultset. Keine Produktionsfreigabe vor Gesamtintegration.
CREATE OR REPLACE FUNCTION public.wallettracking_replace_own_automated_snapshot(p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
 v_user uuid := auth.uid();
 v_snapshot uuid;
 v_count integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Authentifizierung erforderlich'; END IF;
 IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Positionen müssen Array sein'; END IF;
 v_count := jsonb_array_length(p_items);
 IF v_count < 1 OR v_count > 10000 THEN RAISE EXCEPTION 'Ungültige Positionsanzahl'; END IF;
 -- Transaktionsbezogene advisory lock, kein dauerhaftes Lock und keine sessionweite Sperre.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 781123));
 IF EXISTS (
   SELECT 1 FROM jsonb_to_recordset(p_items) AS i(wallet_id uuid,chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric)
   WHERE i.wallet_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=i.wallet_id AND w.user_id=v_user)
      OR i.chain IS NULL OR length(i.chain) NOT BETWEEN 1 AND 32
      OR i.symbol IS NULL OR length(i.symbol) NOT BETWEEN 1 AND 120
      OR i.amount IS NULL OR i.amount < 0 OR i.amount::text IN ('NaN','Infinity','-Infinity')
      OR (i.price_usd IS NOT NULL AND (i.price_usd < 0 OR i.price_usd::text IN ('NaN','Infinity','-Infinity')))
 ) THEN RAISE EXCEPTION 'Ungültige oder fremde Snapshot-Position'; END IF;
 IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_items) AS i(wallet_id uuid,chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric)
    GROUP BY wallet_id,chain,coalesce(lower(address),''),is_native,symbol HAVING count(*)>1
 ) THEN RAISE EXCEPTION 'Doppelte Position im Snapshot'; END IF;
 INSERT INTO public.snapshots(user_id,is_automated) VALUES(v_user,true) RETURNING id INTO v_snapshot;
 INSERT INTO public.snapshot_items(snapshot_id,user_id,wallet_id,wallet_label,chain,symbol,address,is_native,amount,price_usd)
 SELECT v_snapshot,v_user,i.wallet_id,NULL,i.chain,i.symbol,i.address,coalesce(i.is_native,false),i.amount,i.price_usd
 FROM jsonb_to_recordset(p_items) AS i(wallet_id uuid,chain text,symbol text,address text,is_native boolean,amount numeric,price_usd numeric);
 DELETE FROM public.snapshots WHERE user_id=v_user AND is_automated=true AND id<>v_snapshot;
 RETURN v_snapshot;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_replace_own_automated_snapshot(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallettracking_replace_own_automated_snapshot(jsonb) TO authenticated;
