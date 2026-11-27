-- 10.27: permanent adaptive 100k raw scan; preserve audit collector and all other jobs.
BEGIN;
DO $install$
DECLARE
 v_command text;
 v_literal text;
 v_next text;
 v_activated timestamptz;
 v_template constant text := $job$
 WITH params AS MATERIALIZED (
   SELECT clock_timestamp() AS queued_at, %L::timestamptz AS pilot_end
 ), requested AS MATERIALIZED (
   SELECT *, CASE WHEN queued_at < pilot_end THEN 100000 ELSE 25000 END AS blocks FROM params
 ), queued AS MATERIALIZED (
   SELECT queued_at,pilot_end,blocks,net.http_post(
      url := regexp_replace(rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url'),'/'), '/functions/v1/.*$', '') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object('Content-Type','application/json','x-tln-reward-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')),
      body := jsonb_build_object('mode','encrypted-wallet-scan-guarded-stage-preview','commit',true,'confirm','single-raw-cache-adaptive-chunk','chunkBlocks',blocks),
      timeout_milliseconds := 45000
   ) AS request_id FROM requested
   WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url') AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')
 )
 INSERT INTO wallettracking_internal.tln_raw_scan_audit(request_id,queued_at,pilot_end,requested_blocks)
 SELECT request_id,queued_at,pilot_end,blocks FROM queued;
 $job$;
BEGIN
 PERFORM pg_advisory_xact_lock(17457, 1027);
 SELECT command INTO STRICT v_command FROM cron.job
 WHERE jobid=14 AND jobname='tln-vow-raw-catchup-1m' AND active AND schedule='* * * * *' AND username=current_user;
 v_literal := substring(v_command FROM $regex$('\d{4}-\d{2}-\d{2} [0-9:.+-]+')::timestamptz AS pilot_end$regex$);
 IF v_literal IS NULL THEN RAISE EXCEPTION 'Missing 10.21 pilot deadline'; END IF;
 IF clock_timestamp() < trim(both chr(39) from v_literal)::timestamptz THEN RAISE EXCEPTION 'Prior pilot still active'; END IF;
 IF v_command IS DISTINCT FROM format(v_template,trim(both chr(39) from v_literal)) THEN RAISE EXCEPTION 'Unexpected job 14 command'; END IF;
 IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=15 AND jobname='tln-vow-raw-audit-1m' AND active AND schedule='* * * * *' AND username=current_user) OR EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 13 AND active) THEN RAISE EXCEPTION 'Unexpected audit/reward configuration'; END IF;
 IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url') OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth') THEN RAISE EXCEPTION 'Missing required Vault entries'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='wallettracking_internal.tln_raw_scan_audit'::regclass AND conname='tln_raw_scan_audit_requested_blocks_check' AND convalidated AND pg_get_constraintdef(oid) LIKE '%100000%') THEN RAISE EXCEPTION 'Missing validated 100k audit constraint'; END IF;
 v_activated := clock_timestamp();
 -- Keep the mandatory pilot_end column as a new release epoch marker, not a deadline.
 v_next := format(replace(v_template,'CASE WHEN queued_at < pilot_end THEN 100000 ELSE 25000 END','100000'),v_activated);
 PERFORM cron.alter_job(14,command:=v_next);
 RAISE NOTICE '10.27 permanent 100k activated at % CH', v_activated AT TIME ZONE 'Europe/Zurich';
END;
$install$;
COMMIT;
