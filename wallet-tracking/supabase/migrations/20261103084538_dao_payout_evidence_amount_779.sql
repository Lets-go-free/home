-- WalletTracking 7.79: Store precise, independently verified DAO payout evidence.
-- This does NOT create rewards, USD values, snapshots or change existing claims.
-- Run once AFTER the migrations for 7.77 and 7.78.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
  ADD COLUMN IF NOT EXISTS payout_reason text,
  ADD COLUMN IF NOT EXISTS payout_token_address text,
  ADD COLUMN IF NOT EXISTS payout_amount_raw text,
  ADD COLUMN IF NOT EXISTS payout_token_decimals integer,
  ADD COLUMN IF NOT EXISTS payout_flow_count integer;
ALTER TABLE public.dao_reward_claim_candidates
  DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_payout_evidence_check;
ALTER TABLE public.dao_reward_claim_candidates
  ADD CONSTRAINT dao_reward_claim_candidates_payout_evidence_check CHECK (
    (payout_status <> 'verified') OR
    (payout_token_address IS NOT NULL
     AND payout_amount_raw ~ '^[0-9]+$'
     AND length(payout_amount_raw) <= 100
     AND payout_token_decimals BETWEEN 0 AND 36
     AND payout_flow_count BETWEEN 1 AND 10000)
  ) NOT VALID;
-- Previously verified rows (7.78) have no evidence amount; re-evaluate them.
-- No canonical transaction, reward, price or snapshot data is modified.
UPDATE public.dao_reward_claim_candidates
SET payout_status='pending', payout_checked_at=NULL
WHERE payout_status='verified' AND payout_amount_raw IS NULL;
ALTER TABLE public.dao_reward_claim_candidates
  VALIDATE CONSTRAINT dao_reward_claim_candidates_payout_evidence_check;
COMMIT;
