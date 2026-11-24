-- WalletTracking 9.99: 30-minute limited trial, existing cron 7 only.
DO $pilot$
DECLARE
  v_command text;
  v_until timestamptz := clock_timestamp() + interval '30 minutes';
  v_body text;
  v_new text;
BEGIN
  SELECT command INTO STRICT v_command FROM cron.job
  WHERE jobid = 7 AND jobname = 'tln-vow-evidence-stage-5m' AND active;
  IF position('rawCatchupAfterEvidence' in v_command) > 0 THEN
    RAISE EXCEPTION 'Already configured; no changes';
  END IF;
  IF position($old$'{"mode":"delta-work-cycle"}'::jsonb$old$ in v_command) = 0 THEN
    RAISE EXCEPTION 'Unexpected job 7 body; no changes';
  END IF;
  v_body := format(
    $expr$CASE WHEN clock_timestamp() < %L::timestamptz
      THEN jsonb_build_object('mode','delta-work-cycle',
        'rawCatchupAfterEvidence',true, 'rawCatchupWrite',true,
        'rawCatchupChunkBlocks',5000, 'commit',true,
        'confirm','evidence-and-one-raw-chunk')
      ELSE '{"mode":"delta-work-cycle"}'::jsonb END$expr$, v_until);
  v_new := replace(v_command, $old$'{"mode":"delta-work-cycle"}'::jsonb$old$, v_body);
  IF v_new = v_command THEN RAISE EXCEPTION 'Replacement failed'; END IF;
  PERFORM cron.alter_job(7, command := v_new);
  RAISE NOTICE 'Limited raw catch-up enabled until %; normal body after cutoff', v_until;
END;
$pilot$;
