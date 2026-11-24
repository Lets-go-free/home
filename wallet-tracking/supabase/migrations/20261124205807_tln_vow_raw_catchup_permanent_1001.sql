-- WalletTracking 10.01: replace only the expired 9.99 pilot body.
DO $permanent$
DECLARE
  v_command text;
  v_new text;
  v_prefix constant text := $prefix$CASE WHEN clock_timestamp() < $prefix$;
  v_suffix constant text := $suffix$::timestamptz
      THEN jsonb_build_object('mode','delta-work-cycle',
        'rawCatchupAfterEvidence',true, 'rawCatchupWrite',true,
        'rawCatchupChunkBlocks',5000, 'commit',true,
        'confirm','evidence-and-one-raw-chunk')
      ELSE '{"mode":"delta-work-cycle"}'::jsonb END$suffix$;
  v_body constant text := $body$jsonb_build_object('mode','delta-work-cycle',
        'rawCatchupAfterEvidence',true, 'rawCatchupWrite',true,
        'rawCatchupChunkBlocks',5000, 'commit',true,
        'confirm','evidence-and-one-raw-chunk')$body$;
  v_start integer;
  v_rest text;
  v_end integer;
  v_literal text;
  v_until timestamptz;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
  WHERE jobid = 7 AND jobname = 'tln-vow-evidence-stage-5m' AND active
    AND schedule = '3-59/5 * * * *';
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 12 AND active) THEN
    RAISE EXCEPTION 'Reward jobs active; no changes';
  END IF;
  IF position(v_body in v_command) > 0 AND position(v_prefix in v_command) = 0 THEN
    RAISE NOTICE 'Permanent body already present; no changes'; RETURN;
  END IF;
  v_start := position(v_prefix in v_command);
  IF v_start = 0 THEN RAISE EXCEPTION 'Expected pilot not found'; END IF;
  v_rest := substr(v_command, v_start + length(v_prefix));
  v_end := position(v_suffix in v_rest);
  IF v_end = 0 THEN RAISE EXCEPTION 'Unexpected pilot body'; END IF;
  v_literal := left(v_rest, v_end - 1);
  IF v_literal !~ $regex$^'[0-9 :.+-]+'$$regex$ THEN
    RAISE EXCEPTION 'Unexpected pilot timestamp literal';
  END IF;
  v_until := trim(both '''' from v_literal)::timestamptz;
  IF clock_timestamp() < v_until THEN RAISE EXCEPTION 'Pilot still running'; END IF;
  v_new := replace(v_command, v_prefix || v_literal || v_suffix, v_body);
  IF v_new = v_command OR position(v_prefix in v_new) > 0 THEN
    RAISE EXCEPTION 'Replacement failed';
  END IF;
  PERFORM cron.alter_job(7, command := v_new);
  RAISE NOTICE 'Permanent raw catch-up enabled for job 7';
END;
$permanent$;
