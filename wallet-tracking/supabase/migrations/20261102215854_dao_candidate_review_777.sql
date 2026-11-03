-- WalletTracking 7.77: Preserve inconclusive historical NFT ownership cases for review.
-- No reward calculation, snapshot, browser cursor or cron changes.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
  DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_status_check;
ALTER TABLE public.dao_reward_claim_candidates
  ADD CONSTRAINT dao_reward_claim_candidates_status_check
  CHECK (status IN ('pending','ownership_verified','unverified','needs_review'));
UPDATE public.dao_reward_claim_candidates
SET status='needs_review'
WHERE status='unverified'
  AND proof_reason IS DISTINCT FROM 'owned-by-other-wallet';
COMMIT;
