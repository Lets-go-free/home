-- WalletTracking Phase 8.27 – Bestandsverlauf: 7 Kalendertage inklusive Stichtag.
-- Dokumentations-/Projekt-Nachlieferung der am 13.11.2026 bereits manuell
-- im Supabase SQL Editor installierten Funktionskorrektur.
-- Idempotent: CREATE OR REPLACE FUNCTION, kein direkter DELETE-/Datenlauf.
-- Wichtig: Bei Ausführung durch den regulären Service-Role-Job verdichtet
-- die Funktion ausschliesslich historische automatische Bestandsverläufe.
-- Manuelle Snapshots in public.snapshots werden nicht verändert.
CREATE OR REPLACE FUNCTION public.wallettracking_compact_balance_history(p_today date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  -- 0–6 Tage alt: alle Tageswerte behalten (heute inklusive).
  -- 7–365 Tage alt: neuesten verfügbaren Wert je ISO-Woche behalten.
  -- Mehr als 365 Tage alt: neuesten verfügbaren Wert je Monat behalten.
  DELETE FROM public.wallet_daily_balance_history h
  WHERE h.sample_day < p_today - 6
    AND (
      (
        h.sample_day >= p_today - 365
        AND EXISTS (
          SELECT 1
          FROM public.wallet_daily_balance_history newer
          WHERE newer.user_id = h.user_id
            AND newer.sample_day > h.sample_day
            AND newer.sample_day < p_today - 6
            AND pg_catalog.date_trunc('week', newer.sample_day::timestamp)
                = pg_catalog.date_trunc('week', h.sample_day::timestamp)
        )
      )
      OR
      (
        h.sample_day < p_today - 365
        AND EXISTS (
          SELECT 1
          FROM public.wallet_daily_balance_history newer
          WHERE newer.user_id = h.user_id
            AND newer.sample_day > h.sample_day
            AND pg_catalog.date_trunc('month', newer.sample_day::timestamp)
                = pg_catalog.date_trunc('month', h.sample_day::timestamp)
        )
      )
    );
END
$function$;
