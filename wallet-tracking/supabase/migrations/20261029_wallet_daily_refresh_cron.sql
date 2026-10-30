-- WalletTracking 7.68 – korrigierter Tagesjob (zeitversetzt zu VOW/v$).
-- Ersetzt die gleichnamige Migration im lokalen Repository.
-- Falls der alte Cron-Job bereits aktiv ist, wird er durch diese Migration
-- unter demselben Namen ersetzt; es wird kein zweiter Job angelegt.
-- Voraussetzungen: pg_cron, pg_net und Vault-Secrets
-- wallet_daily_refresh_url sowie wallet_daily_refresh_auth.
--
-- Cron: Minuten 02,07,12,...,57 jeder Stunde (auch in UTC).
-- SQL-Zeitfenster: ausschliesslich 03:00 <= lokale Zeit < 06:00
-- in Europe/Zurich, automatisch mit Sommer-/Winterzeit.
-- Die Minuten sind unabhängig vom ganzstündigen UTC-Offset von Zürich.
-- Hinweis: Zeitlicher Versatz verhindert nur gleiche Startminuten;
-- länger laufende Aufrufe können sich zeitlich trotzdem überschneiden.

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'wallet-daily-refresh-5m'
  ) THEN
    PERFORM cron.unschedule('wallet-daily-refresh-5m');
  END IF;
END
$do$;

SELECT cron.schedule(
  'wallet-daily-refresh-5m',
  '2-59/5 * * * *',
  $job$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'wallet_daily_refresh_url'
      ) || '/functions/v1/wallet-daily-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-wallet-refresh-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'wallet_daily_refresh_auth'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    )
    WHERE (now() AT TIME ZONE 'Europe/Zurich')::time >= TIME '03:00:00'
      AND (now() AT TIME ZONE 'Europe/Zurich')::time < TIME '06:00:00';
  $job$
) AS job_id;
