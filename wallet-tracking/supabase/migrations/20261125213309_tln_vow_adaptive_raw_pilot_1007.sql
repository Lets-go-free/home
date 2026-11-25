-- 10.07: run ONLY after 25k read-only preview passes on deployed 10.06 edge.
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
  v_high constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-adaptive-chunk","chunkBlocks":25000}'::jsonb$body$;
  v_command text;
  v_literal text;
  v_previous_until timestamptz;
  v_previous_command text;
  v_until timestamptz := clock_timestamp() + interval '30 minutes';
  v_next text;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
    WHERE jobid=14 AND jobname='tln-vow-raw-catchup-1m' AND active AND schedule='* * * * *';
  v_literal := substring(v_command from $regex$CASE WHEN clock_timestamp\(\) < ('[0-9 :.+-]+')::timestamptz$regex$);
  IF v_literal IS NULL THEN RAISE EXCEPTION 'Expected 10.06 pilot deadline missing'; END IF;
  v_previous_until := trim(both chr(39) from v_literal)::timestamptz;
  IF clock_timestamp() < v_previous_until THEN RAISE EXCEPTION '10.06 pilot still running'; END IF;
  v_previous_command := replace(v_expected, v_legacy,
    format('CASE WHEN clock_timestamp() < %s::timestamptz THEN %s ELSE %s END', v_literal, v_adaptive, v_legacy));
  IF v_command <> v_previous_command THEN RAISE EXCEPTION 'Unexpected job 14 configuration (expected expired 10.06); do not override'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=7 AND active AND jobname='tln-vow-evidence-stage-5m'
      AND schedule='3-59/5 * * * *' AND position('rawCatchupWrite' IN command)=0
      AND position('clock_timestamp() <' IN command)=0) THEN RAISE EXCEPTION 'Evidence-only configuration missing'; END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 12 AND active) THEN RAISE EXCEPTION 'Unexpected active reward jobs'; END IF;
  v_next := replace(v_expected, v_legacy, format('CASE WHEN clock_timestamp() < %L::timestamptz THEN %s ELSE %s END',v_until,v_high,v_adaptive));
  IF v_next=v_expected OR v_next=v_command THEN RAISE EXCEPTION 'Pilot replacement failed'; END IF;
  PERFORM cron.alter_job(14, command := v_next);
  RAISE NOTICE 'Adaptive 25000-block pilot until %, then adaptive 10000-block body',v_until;
END;
$pilot$;
