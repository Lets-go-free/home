-- 10.05: atomic permanent separation of the expired 10.04 pilot.
DO $permanent$
DECLARE
  v_command text;
  v_raw_command text;
  v_combined constant text := $body$jsonb_build_object('mode','delta-work-cycle',
        'rawCatchupAfterEvidence',true, 'rawCatchupWrite',true,
        'rawCatchupChunkBlocks',5000, 'commit',true,
        'confirm','evidence-and-one-raw-chunk')$body$;
  v_new_raw constant text := $job$
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
  v_old_raw constant text := $job$
    SELECT net.http_post(
      url := regexp_replace(rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name='tln_vow_trade_sync_url'),'/'), '/functions/v1/.*$', '') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object('Content-Type','application/json','x-tln-reward-secret',
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-large-chunk","chunkBlocks":5000}'::jsonb,
      timeout_milliseconds := 25000
    ) WHERE clock_timestamp() < %L::timestamptz
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth');
  $job$;
  v_prefix constant text := 'CASE WHEN clock_timestamp() < ';
  v_suffix constant text := '::timestamptz';
  v_literal text;
  v_until timestamptz;
  v_old_expr text;
  v_new_evidence text;
  v_id bigint;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
    WHERE jobid=7 AND jobname='tln-vow-evidence-stage-5m' AND active
      AND schedule='3-59/5 * * * *' FOR UPDATE;
  SELECT jobid, command INTO STRICT v_id, v_raw_command FROM cron.job
    WHERE jobname='tln-vow-raw-catchup-1m' AND active
      AND schedule='* * * * *' FOR UPDATE;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 12 AND active) THEN
    RAISE EXCEPTION 'Unexpected active TLN reward job';
  END IF;
  IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')<>1
     OR (SELECT count(*) FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')<>1 THEN
    RAISE EXCEPTION 'Missing or ambiguous Vault configuration';
  END IF;
  IF v_raw_command = v_new_raw AND position(v_prefix in v_command)=0
     AND position(v_combined in v_command)=0
     AND position($json$'{"mode":"delta-work-cycle"}'::jsonb$json$ in v_command)>0 THEN
    RAISE NOTICE 'Permanent separation already configured'; RETURN;
  END IF;
  v_literal := substring(v_command from $regex$CASE WHEN clock_timestamp\(\) < ('[0-9 :.+-]+')::timestamptz$regex$);
  IF v_literal IS NULL THEN RAISE EXCEPTION 'Expected 10.04 pilot deadline missing'; END IF;
  v_until := trim(both chr(39) from v_literal)::timestamptz;
  IF clock_timestamp() < v_until THEN RAISE EXCEPTION 'Pilot still running'; END IF;
  v_old_expr := format($expr$CASE WHEN clock_timestamp() < %L::timestamptz
      THEN '{"mode":"delta-work-cycle"}'::jsonb ELSE %s END$expr$,v_until,v_combined);
  -- Use the stored literal to avoid timezone-format differences across sessions.
  v_old_expr := replace(v_old_expr, quote_literal(v_until), v_literal);
  IF position(v_old_expr in v_command)=0 THEN RAISE EXCEPTION 'Unexpected evidence pilot body'; END IF;
  IF v_raw_command <> replace(format(v_old_raw,v_until), quote_literal(v_until),v_literal) THEN
    RAISE EXCEPTION 'Unexpected raw pilot command';
  END IF;
  v_new_evidence := replace(v_command,v_old_expr,$json$'{"mode":"delta-work-cycle"}'::jsonb$json$);
  IF v_new_evidence=v_command OR position(v_prefix in v_new_evidence)>0 OR position(v_combined in v_new_evidence)>0 THEN
    RAISE EXCEPTION 'Evidence replacement failed';
  END IF;
  PERFORM cron.alter_job(7, command := v_new_evidence);
  PERFORM cron.alter_job(v_id, command := v_new_raw);
  RAISE NOTICE 'Permanent raw separation enabled for job %; 45s HTTP timeout',v_id;
END;
$permanent$;
