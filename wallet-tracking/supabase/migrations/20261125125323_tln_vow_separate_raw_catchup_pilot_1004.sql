-- 10.04: atomic 30-minute separation pilot; then restore combined cadence.
DO $pilot$
DECLARE
  v_command text;
  v_until timestamptz := clock_timestamp() + interval '30 minutes';
  v_combined constant text := $body$jsonb_build_object('mode','delta-work-cycle',
        'rawCatchupAfterEvidence',true, 'rawCatchupWrite',true,
        'rawCatchupChunkBlocks',5000, 'commit',true,
        'confirm','evidence-and-one-raw-chunk')$body$;
  v_evidence text;
  v_raw text;
  v_id bigint;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
   WHERE jobid=7 AND jobname='tln-vow-evidence-stage-5m' AND active
     AND schedule='3-59/5 * * * *';
  IF position(v_combined in v_command)=0 OR position('CASE WHEN clock_timestamp()' in v_command)>0 THEN
    RAISE EXCEPTION 'Expected permanent 10.01 body not found';
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='tln-vow-raw-catchup-1m') THEN
    RAISE EXCEPTION 'Separate job already exists; inspect before changing';
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 12 AND active) THEN
    RAISE EXCEPTION 'Unexpected active TLN reward job';
  END IF;
  IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')<>1
     OR (SELECT count(*) FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')<>1 THEN
    RAISE EXCEPTION 'Missing or ambiguous Vault configuration';
  END IF;
  v_evidence := replace(v_command, v_combined, format(
    $expr$CASE WHEN clock_timestamp() < %L::timestamptz
      THEN '{"mode":"delta-work-cycle"}'::jsonb ELSE %s END$expr$, v_until,v_combined));
  v_raw := format($job$
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
  $job$,v_until);
  v_id := cron.schedule('tln-vow-raw-catchup-1m','* * * * *',v_raw);
  PERFORM cron.alter_job(v_id, active := true);
  PERFORM cron.alter_job(7, command := v_evidence);
  RAISE NOTICE 'Raw separation pilot job %, until %; automatic fallback to combined job 7',v_id,v_until;
END;
$pilot$;
