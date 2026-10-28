-- WalletTracking 7.61: Allow independently resumable scan checkpoints per token and per pool.
-- Run ONCE after the 7.59 trade-cache migration.
ALTER TABLE public.tln_vow_trade_scan_state
  DROP CONSTRAINT IF EXISTS tln_vow_trade_scan_state_group_key_check;
ALTER TABLE public.tln_vow_trade_scan_state
  ADD CONSTRAINT tln_vow_trade_scan_state_group_key_check
  CHECK (group_key IN ('v2','v3') OR group_key LIKE 'discover:0x%' OR group_key LIKE 'pool:v2:0x%' OR group_key LIKE 'pool:v3:0x%');
-- Older v2/v3 group checkpoints are intentionally ignored by schema_version 4.
-- The 30-day retention policy for trade rows is unchanged.
