-- 10.21: retain audit history and collector; expand allowed request sizes.
BEGIN;
DO $install$
DECLARE
 v_command text;
 v_literal text;
 v_until timestamptz;
 v_expected text;
 v_next text;
 v_template constant text := $job$
 WITH params AS MATERIALIZED (
   SELECT clock_timestamp() AS queued_at, %L::timestamptz AS pilot_end
 ), requested AS MATERIALIZED (
   SELECT *, CASE WHEN queued_at < pilot_end THEN 50000 ELSE 25000 END AS blocks FROM params
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
 PERFORM pg_advisory_xact_lock(17457, 1021);
 SELECT command INTO STRICT v_command FROM cron.job
 WHERE jobid=14 AND jobname='tln-vow-raw-catchup-1m' AND active AND schedule='* * * * *' AND username=current_user;
 v_literal := substring(v_command FROM $regex$('\d{4}-\d{2}-\d{2} [0-9:.+-]+')::timestamptz AS pilot_end$regex$);
 IF v_literal IS NULL THEN RAISE EXCEPTION 'Missing 10.20 pilot deadline'; END IF;
 IF clock_timestamp() < trim(both chr(39) from v_literal)::timestamptz THEN RAISE EXCEPTION 'Prior pilot still active'; END IF;
 v_expected := format(v_template,trim(both chr(39) from v_literal));
 IF v_command IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Unexpected job 14 command'; END IF;
 IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=15 AND jobname='tln-vow-raw-audit-1m' AND active AND schedule='* * * * *' AND username=current_user) OR EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 13 AND active) THEN RAISE EXCEPTION 'Unexpected audit/reward configuration'; END IF;
 IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')
    OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth') THEN
   RAISE EXCEPTION 'Missing required Vault entries';
 END IF;
 ALTER TABLE wallettracking_internal.tln_raw_scan_audit DROP CONSTRAINT tln_raw_scan_audit_requested_blocks_check;
 ALTER TABLE wallettracking_internal.tln_raw_scan_audit ADD CONSTRAINT tln_raw_scan_audit_requested_blocks_check CHECK (requested_blocks IN (10000,25000,50000,100000));
 v_until := date_trunc('minute',clock_timestamp()) + interval '31 minutes';
 v_next := format(replace(v_template,'THEN 50000 ELSE 25000','THEN 100000 ELSE 25000'),v_until);
 PERFORM cron.alter_job(14,command:=v_next);
 RAISE NOTICE '10.21: first pilot minute % CH, fallback starts % CH',
   (v_until - interval '30 minutes') AT TIME ZONE 'Europe/Zurich',
   v_until AT TIME ZONE 'Europe/Zurich';
END;
$install$;
COMMIT;
