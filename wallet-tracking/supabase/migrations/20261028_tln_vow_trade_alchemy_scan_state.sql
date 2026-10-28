-- WalletTracking 7.62 hotfix: Alchemy scan checkpoints are blocked by the
-- group_key CHECK constraint introduced in 7.59 and extended in 7.61.
-- No trade rows or scan state rows are deleted.
BEGIN;
ALTER TABLE public.tln_vow_trade_scan_state
  DROP CONSTRAINT IF EXISTS tln_vow_trade_scan_state_group_key_check;
ALTER TABLE public.tln_vow_trade_scan_state
  ADD CONSTRAINT tln_vow_trade_scan_state_group_key_check
  CHECK (
    group_key IN ('v2', 'v3', 'alchemy:transfers-v1')
    OR group_key LIKE 'discover:0x%'
    OR group_key LIKE 'pool:v2:0x%'
    OR group_key LIKE 'pool:v3:0x%'
  );
COMMIT;
