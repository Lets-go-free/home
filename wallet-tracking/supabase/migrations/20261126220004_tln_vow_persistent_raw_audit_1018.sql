-- 10.18: atomic install; no changes to Edge code, rewards or other jobs.
BEGIN;
CREATE TABLE wallettracking_internal.tln_raw_scan_audit (
 request_id bigint PRIMARY KEY,
 queued_at timestamptz NOT NULL,
 pilot_end timestamptz NOT NULL,
 requested_blocks integer NOT NULL CHECK (requested_blocks IN (10000,25000)),
 response_at timestamptz,
 outcome text NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','saved','timeout','transport_error','http_error','edge_error','unverified_response','response_missing')),
 http_status integer,
 timed_out boolean,
 error_category text,
 reported_requested_blocks bigint,
 dry_run boolean,
 ok boolean,
 executed boolean,
 persisted boolean,
 incoming_complete boolean,
 outgoing_complete boolean,
 from_block bigint,
 to_block bigint,
 scanned_blocks bigint,
 overlap_blocks bigint,
 adaptive_attempts bigint,
 adaptive_reduced boolean,
 conflict_retries bigint,
 raw_rows bigint,
 pagination_pages bigint
);
ALTER TABLE wallettracking_internal.tln_raw_scan_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wallettracking_internal.tln_raw_scan_audit FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX tln_raw_scan_audit_pending_idx ON wallettracking_internal.tln_raw_scan_audit (queued_at) WHERE outcome='pending';
CREATE INDEX tln_raw_scan_audit_pilot_idx ON wallettracking_internal.tln_raw_scan_audit (pilot_end, requested_blocks, queued_at);
DO $install$
DECLARE
 v_expected constant text := $old$
    SELECT net.http_post(
      url := regexp_replace(rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name='tln_vow_trade_sync_url'),'/'), '/functions/v1/.*$', '') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object('Content-Type','application/json','x-tln-reward-secret',
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-large-chunk","chunkBlocks":5000}'::jsonb,
      timeout_milliseconds := 45000
    ) WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url')
      AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth');
  $old$;
 v_legacy constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-large-chunk","chunkBlocks":5000}'::jsonb$body$;
 v_low constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-adaptive-chunk","chunkBlocks":10000}'::jsonb$body$;
 v_high constant text := $body$'{"mode":"encrypted-wallet-scan-guarded-stage-preview","commit":true,"confirm":"single-raw-cache-adaptive-chunk","chunkBlocks":25000}'::jsonb$body$;
 v_command text;
 v_literal text;
 v_until timestamptz;
 v_next text;
BEGIN
 SELECT command INTO STRICT v_command FROM cron.job WHERE jobid=14 AND jobname='tln-vow-raw-catchup-1m' AND active AND schedule='* * * * *' AND username=current_user;
 v_literal := substring(v_command FROM $regex$CASE WHEN clock_timestamp\(\) < ('[0-9 :.+-]+')::timestamptz$regex$);
 IF v_literal IS NULL OR clock_timestamp() < trim(both chr(39) from v_literal)::timestamptz THEN RAISE EXCEPTION 'Expected expired 10.07 pilot'; END IF;
 IF v_command IS DISTINCT FROM replace(v_expected,v_legacy,format('CASE WHEN clock_timestamp() < %s::timestamptz THEN %s ELSE %s END',v_literal,v_high,v_low)) THEN RAISE EXCEPTION 'Unexpected job 14 command'; END IF;
 IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=7 AND active AND jobname='tln-vow-evidence-stage-5m' AND schedule='3-59/5 * * * *' AND position('rawCatchupWrite' IN command)=0 AND position('clock_timestamp() <' IN command)=0) OR NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=8 AND active) OR EXISTS (SELECT 1 FROM cron.job WHERE jobid BETWEEN 9 AND 13 AND active) THEN RAISE EXCEPTION 'Unexpected evidence/reward/DAO configuration'; END IF;
 IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='tln-vow-raw-audit-1m') THEN RAISE EXCEPTION 'Audit cron already exists'; END IF;
 IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_trade_sync_url') OR NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name='tln_vow_reward_refresh_auth') THEN RAISE EXCEPTION 'Missing raw scan vault configuration'; END IF;
 v_until := date_trunc('minute',clock_timestamp()) + interval '31 minutes';
 v_next := format($job$
 WITH params AS MATERIALIZED (
   SELECT clock_timestamp() AS queued_at, %L::timestamptz AS pilot_end
 ), requested AS MATERIALIZED (
   SELECT *, CASE WHEN queued_at < pilot_end THEN 25000 ELSE 10000 END AS blocks FROM params
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
 $job$,v_until);
 PERFORM cron.alter_job(14,command:=v_next);
 PERFORM cron.schedule('tln-vow-raw-audit-1m','* * * * *',$collect$
 WITH responses AS MATERIALIZED (
   SELECT a.request_id,a.requested_blocks,r.created,r.status_code,r.timed_out,r.error_msg IS NOT NULL AS transport_error,
     CASE WHEN r.content IS JSON OBJECT THEN r.content::jsonb END AS p,
     CASE WHEN r.error_msg ILIKE '%DNS time:%' AND r.timed_out THEN 'timeout_with_dns_timing' WHEN r.timed_out THEN 'timeout' WHEN r.error_msg IS NOT NULL THEN 'transport_error' END AS transport_category
   FROM wallettracking_internal.tln_raw_scan_audit a JOIN net._http_response r ON r.id=a.request_id
   WHERE a.outcome='pending'
 ), parsed AS (
 SELECT *,
   CASE WHEN p->>'adaptiveRequestedBlocks' ~ '^[0-9]{1,15}$' THEN (p->>'adaptiveRequestedBlocks')::bigint END AS reported,
   CASE WHEN p->>'dryRun' IN ('true','false') THEN (p->>'dryRun')::boolean END AS dry,
   CASE WHEN p->>'ok' IN ('true','false') THEN (p->>'ok')::boolean END AS ok_flag,
   CASE WHEN p->>'executed' IN ('true','false') THEN (p->>'executed')::boolean END AS executed_flag,
   CASE WHEN p->>'persisted' IN ('true','false') THEN (p->>'persisted')::boolean END AS persisted_flag,
   CASE WHEN p->>'incomingComplete' IN ('true','false') THEN (p->>'incomingComplete')::boolean END AS inc,
   CASE WHEN p->>'outgoingComplete' IN ('true','false') THEN (p->>'outgoingComplete')::boolean END AS outg,
   CASE WHEN p#>>'{chunk,fromBlock}' ~ '^[0-9]{1,15}$' THEN (p#>>'{chunk,fromBlock}')::bigint END AS lo,
   CASE WHEN p#>>'{chunk,toBlock}' ~ '^[0-9]{1,15}$' THEN (p#>>'{chunk,toBlock}')::bigint END AS hi,
   CASE WHEN p#>>'{chunk,blocks}' ~ '^[0-9]{1,15}$' THEN (p#>>'{chunk,blocks}')::bigint END AS blocks,
   CASE WHEN p#>>'{chunk,overlapBlocks}' ~ '^[0-9]{1,15}$' THEN (p#>>'{chunk,overlapBlocks}')::bigint END AS overlap,
   CASE WHEN p->>'adaptiveAttempts' ~ '^[0-9]{1,15}$' THEN (p->>'adaptiveAttempts')::bigint END AS attempts,
   CASE WHEN p->>'adaptiveReduced' IN ('true','false') THEN (p->>'adaptiveReduced')::boolean END AS reduced,
   CASE WHEN p->>'conflictRetries' ~ '^[0-9]{1,15}$' THEN (p->>'conflictRetries')::bigint END AS conflicts,
   CASE WHEN p->>'rawRowsCaptured' ~ '^[0-9]{1,15}$' THEN (p->>'rawRowsCaptured')::bigint END AS rows_captured,
   CASE WHEN p->>'paginationPages' ~ '^[0-9]{1,15}$' THEN (p->>'paginationPages')::bigint END AS pages
 FROM responses
 )
 UPDATE wallettracking_internal.tln_raw_scan_audit a SET
 response_at=s.created,http_status=s.status_code,timed_out=s.timed_out,
 outcome=CASE WHEN s.timed_out THEN 'timeout' WHEN s.transport_error THEN 'transport_error'
   WHEN s.status_code NOT BETWEEN 200 AND 299 THEN 'http_error' WHEN s.ok_flag IS FALSE THEN 'edge_error'
   WHEN s.status_code BETWEEN 200 AND 299 AND s.p->>'mode'='encrypted-wallet-scan-guarded-stage-preview' AND s.p->>'status'='guarded-raw-cache-chunk-saved'
     AND s.reported=s.requested_blocks AND s.dry IS FALSE AND s.ok_flag AND s.executed_flag AND s.persisted_flag AND s.inc AND s.outg
     AND s.blocks=s.hi-s.lo+1 AND s.blocks BETWEEN 1 AND s.requested_blocks AND s.overlap IN (0,24) AND s.attempts BETWEEN 1 AND 5 AND s.reduced=(s.attempts>1) AND s.conflicts BETWEEN 0 AND 2 THEN 'saved'
   ELSE 'unverified_response' END,
 error_category=coalesce(s.transport_category,CASE
   WHEN s.p#>>'{diagnostic,category}' IN ('raw_cache_row_budget_exceeded','too_many_transfers','incomplete_pagination','rpc_error','timeout','http_error','adaptive_deadline') THEN s.p#>>'{diagnostic,category}'
   WHEN s.p->>'error'='Wallet selection, cache validation or RPC incomplete' THEN 'selection_cache_or_rpc_incomplete'
   WHEN s.p->>'error'='Guarded scan/stage failed; no coverage progress claimed' THEN 'guarded_stage_failed'
   WHEN s.p->>'error' IS NOT NULL THEN 'other_edge_error' END),
 reported_requested_blocks=s.reported,dry_run=s.dry,ok=s.ok_flag,executed=s.executed_flag,persisted=s.persisted_flag,incoming_complete=s.inc,outgoing_complete=s.outg,
 from_block=s.lo,to_block=s.hi,scanned_blocks=s.blocks,overlap_blocks=s.overlap,adaptive_attempts=s.attempts,adaptive_reduced=s.reduced,conflict_retries=s.conflicts,raw_rows=s.rows_captured,pagination_pages=s.pages
 FROM parsed s WHERE a.request_id=s.request_id AND a.outcome='pending';
 UPDATE wallettracking_internal.tln_raw_scan_audit SET outcome='response_missing'
 WHERE outcome='pending' AND queued_at < clock_timestamp()-interval '7 hours';
 $collect$);
 RAISE NOTICE '10.18 pilot ends at %, then 10000 blocks; audit collector scheduled',v_until;
END;
$install$;
COMMIT;
