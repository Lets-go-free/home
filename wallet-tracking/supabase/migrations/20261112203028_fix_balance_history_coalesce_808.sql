-- WalletTracking – Korrektur des Snapshot-History-Triggers.
-- Datenbankkorrektur am 12.11.2026 bereits manuell angewendet.
-- Diese Migration synchronisiert den Projektquellstand; erneute Ausführung ist idempotent.
-- Ursache: pg_catalog.coalesce(...) ist kein gueltiger PostgreSQL-Funktionsaufruf.
-- Nur COALESCE-Ausdruecke korrigiert, sonstige Trigger-Logik unveraendert.
CREATE OR REPLACE FUNCTION public.wallettracking_capture_balance_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_positions jsonb;
  v_count integer;
  v_wallets integer;
  v_total numeric;
  v_unpriced integer;
BEGIN
  IF NEW.snapshot_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.snapshots s
    WHERE s.id = NEW.snapshot_id
      AND s.user_id = NEW.user_id
      AND s.is_automated = true
  ) THEN
    RAISE EXCEPTION 'Daily history source must be an automated snapshot';
  END IF;

  SELECT
    COALESCE(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'wallet_id', i.wallet_id,
          'chain', i.chain,
          'symbol', i.symbol,
          'address', i.address,
          'is_native', i.is_native,
          'amount', i.amount,
          'price_usd', i.price_usd
        ) ORDER BY i.wallet_id, i.chain, i.symbol, i.address
      ),
      '[]'::jsonb
    ),
    pg_catalog.count(*)::integer,
    pg_catalog.count(DISTINCT i.wallet_id)::integer,
    COALESCE(pg_catalog.sum(i.amount * i.price_usd), 0),
    pg_catalog.count(*) FILTER (WHERE i.price_usd IS NULL)::integer
  INTO v_positions, v_count, v_wallets, v_total, v_unpriced
  FROM public.snapshot_items i
  WHERE i.snapshot_id = NEW.snapshot_id
    AND i.user_id = NEW.user_id;

  INSERT INTO public.wallet_daily_balance_history (
    user_id, sample_day, captured_at, wallet_count,
    position_count, total_usd, unpriced_positions, positions
  ) VALUES (
    NEW.user_id, NEW.scan_day, NEW.updated_at, v_wallets,
    v_count, v_total, v_unpriced, v_positions
  )
  ON CONFLICT (user_id, sample_day) DO UPDATE SET
    captured_at = EXCLUDED.captured_at,
    wallet_count = EXCLUDED.wallet_count,
    position_count = EXCLUDED.position_count,
    total_usd = EXCLUDED.total_usd,
    unpriced_positions = EXCLUDED.unpriced_positions,
    positions = EXCLUDED.positions;

  PERFORM public.wallettracking_compact_balance_history(
    (now() AT TIME ZONE 'Europe/Zurich')::date
  );

  RETURN NEW;
END
$function$;
