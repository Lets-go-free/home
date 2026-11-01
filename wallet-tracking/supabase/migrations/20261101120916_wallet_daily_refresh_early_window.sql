-- WalletTracking: Tagesbestände nur 01:00–04:00 Europe/Zurich.
-- Ersetzt bestehenden Job mit derselben Kennung, kein doppelter Cron.
-- Zeitverschiebung in SQL UND Edge Function erforderlich.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='wallet-daily-refresh-5m') THEN
    PERFORM cron.unschedule('wallet-daily-refresh-5m');
  END IF;
END $do$;
SELECT cron.schedule(
 'wallet-daily-refresh-5m',
 '2-59/5 * * * *',
 $job$
 SELECT net.http_post(
  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='wallet_daily_refresh_url') || '/functions/v1/wallet-daily-refresh',
  headers := jsonb_build_object(
    'Content-Type','application/json',
    'x-wallet-refresh-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='wallet_daily_refresh_auth')
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 25000
 )
 WHERE (now() AT TIME ZONE 'Europe/Zurich')::time >= TIME '01:00:00'
   AND (now() AT TIME ZONE 'Europe/Zurich')::time < TIME '04:00:00';
 $job$
);
