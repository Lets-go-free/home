-- WalletTracking 7.89: one read-only resultset for DAO live readiness.
-- Run in Supabase SQL Editor. No wallet addresses, hashes, user IDs or secrets output.
-- This is an aggregate diagnostic, NOT a replacement for a live worker run.
WITH required_functions(name) AS (
  VALUES
  ('wallettracking_reward_claim'),
  ('wallettracking_reward_stage'),
  ('wallettracking_reward_continue'),
  ('wallettracking_dao_apply_exact_target_anchors'),
  ('wallettracking_dao_reuse_exact_block_prices'),
  ('wallettracking_dao_reconcile_verified_claims'),
  ('wallettracking_dao_create_verified_legacy_claims'),
  ('wallettracking_dao_create_verified_unassigned_miner_claims')
), function_check AS (
 SELECT r.name, EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=r.name
 ) AS installed FROM required_functions r
), candidate_counts AS (
 SELECT count(*) AS total,
   count(*) FILTER (WHERE status='pending') AS ownership_pending,
   count(*) FILTER (WHERE status='ownership_verified') AS ownership_verified,
   count(*) FILTER (WHERE status='needs_review') AS ownership_needs_review,
   count(*) FILTER (WHERE status='unassigned_legacy') AS legacy_unassigned,
   count(*) FILTER (WHERE status='unassigned_miner') AS miner_unassigned,
   count(*) FILTER (WHERE payout_status='verified') AS payout_verified,
   count(*) FILTER (WHERE payout_status='pending') AS payout_pending,
   count(*) FILTER (WHERE payout_status='needs_review') AS payout_needs_review,
   count(*) FILTER (WHERE payout_status='verified' AND payout_amount_raw IS NULL) AS payout_verified_without_amount
 FROM public.dao_reward_claim_candidates
 WHERE project_key='dao1' AND chain_key='apertum'
), flow_counts AS (
 SELECT count(*) AS total,
   count(*) FILTER (WHERE direction='eingang') AS incoming,
   count(*) FILTER (WHERE direction='eingang' AND (price_usd IS NULL OR value_usd IS NULL)) AS incoming_unpriced,
   count(*) FILTER (WHERE direction='eingang' AND price_usd IS NOT NULL AND value_usd IS NOT NULL) AS incoming_priced
 FROM public.project_transaction_asset_flows
 WHERE project_key='dao1' AND chain_key='apertum'
), queue_counts AS (
 SELECT count(*) AS total,
   count(*) FILTER (WHERE state='failed') AS failed,
   count(*) FILTER (WHERE state='partial') AS partial,
   count(*) FILTER (WHERE state='staged') AS staged,
   count(*) FILTER (WHERE state='completed') AS completed,
   max(scan_day) AS last_scan_day
 FROM public.wallet_reward_refresh_attempts WHERE project_key='dao1'
), anchor_counts AS (
 SELECT count(*) AS total,
   count(*) FILTER (WHERE aptm_usd>0 AND sync_block IS NOT NULL) AS priced
 FROM public.aptm_price_anchors
 WHERE project_key='dao1' AND chain_key='apertum'
   AND lower(pool_address)='0x38acbfa5108d3c76d6cea4d380182e832a289b57'
   AND parser_version=1
)
SELECT jsonb_pretty(jsonb_build_object(
  'audit','dao-reward-live-readiness-789',
  'checked_at_utc',now(),
  'functions', (SELECT jsonb_object_agg(name,installed) FROM function_check),
  'all_required_functions_installed',(SELECT bool_and(installed) FROM function_check),
  'candidates',(SELECT to_jsonb(candidate_counts) FROM candidate_counts),
  'flows',(SELECT to_jsonb(flow_counts) FROM flow_counts),
  'queue',(SELECT to_jsonb(queue_counts) FROM queue_counts),
  'canonical_aptm_anchors',(SELECT to_jsonb(anchor_counts) FROM anchor_counts),
  'note','Read-only aggregate; cannot prove blockchain completeness or live worker correctness'
)) AS dao_reward_readiness_audit;
