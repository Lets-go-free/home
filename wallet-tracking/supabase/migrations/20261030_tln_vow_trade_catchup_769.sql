-- WalletTracking 7.69: VOW/v$ catch-up and honest chain-tip completeness.
-- Reihenfolge: zuerst diese Migration, dann Edge Function, dann Website.
-- Bestehende Checkpoints und alle Handelsdaten bleiben erhalten.
ALTER TABLE public.tln_vow_trade_scan_state
  ADD COLUMN IF NOT EXISTS latest_observed_block bigint,
  ADD COLUMN IF NOT EXISTS latest_observed_at timestamptz;

-- Existing 30-minute job is replaced, not duplicated. Succeeds only when pg_cron exists.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='tln-vow-trade-sync-30m') THEN
    PERFORM cron.unschedule('tln-vow-trade-sync-30m');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='tln-vow-trade-sync-5m') THEN
    PERFORM cron.unschedule('tln-vow-trade-sync-5m');
  END IF;
END $do$;

SELECT cron.schedule('tln-vow-trade-sync-5m', '1-59/5 * * * *', $job$
 SELECT net.http_post(
   url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-trade-sync',
   headers := jsonb_build_object('Content-Type','application/json',
      'x-trade-sync-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_auth')),
   body := '{}'::jsonb,
   timeout_milliseconds := 25000
 );
$job$) AS job_id;
