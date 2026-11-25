-- 10.06: run ONLY after the new TLN edge index.ts is deployed and preview tested.
-- No direct table writes or row locks; only existing job 14 is changed.
DO $pilot$
DECLARE
  v_expected constant text := $job$
    SELECT net.http_post(
      url := regexp_replace(rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name='tln_vow_trade_sync_url'),'/'), '/functions/v1/.*$', '') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object('Content-Type','application/json','x-tln-reward-secret',
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-large-chunk","chunkBlocks":5000}'::jsonb,
      timeout_milliseconds := 45000
    ) WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth');
  $job$;
  v_legacy constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-large-chunk","chunkBlocks":5000}'::jsonb$body$;
  v_adaptive constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-adaptive-chunk","chunkBlocks":10000}'::jsonb$body$;
  v_command text;
  v_until timestamptz := clock_timestamp() + interval '30 minutes';
  v_next text;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
    WHERE jobid=14 AND jobname='tln-vow-raw-catchup-1m' AND active AND schedule='* * * * *';
  IF v_command <> v_expected THEN RAISE EXCEPTION 'Unexpected job 14 configuration (expected permanent 10.05); do not override'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=7 AND active AND jobname='tln-vow-evidence-stage-5m'
      AND schedule='3-59/5 * * * *' AND position('rawCatchupWrite' IN command)=0
      AND position('clock_timestamp() <' IN command)=0) THEN RAISE EXCEPTION 'Evidence-only configuration missing'; END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 12 AND active) THEN RAISE EXCEPTION 'Unexpected active reward jobs'; END IF;
  v_next := replace(v_command, v_legacy, format('CASE WHEN clock_timestamp() < %L::timestamptz THEN %s ELSE %s END',v_until,v_adaptive,v_legacy));
  IF v_next=v_command THEN RAISE EXCEPTION 'Pilot replacement failed'; END IF;
  PERFORM cron.alter_job(14, command := v_next);
  RAISE NOTICE 'Adaptive 10000-block pilot until %, then legacy 5000-block body',v_until;
END;
$pilot$;
