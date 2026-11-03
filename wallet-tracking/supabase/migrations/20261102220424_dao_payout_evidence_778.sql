-- WalletTracking 7.78: Independent payout proof on historically verified DAO claims.
-- Staging evidence only; does not change any canonical reward sums or snapshots.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
 ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.dao_reward_claim_candidates
 ADD COLUMN IF NOT EXISTS payout_checked_at timestamptz;
ALTER TABLE public.dao_reward_claim_candidates
 DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_payout_status_check;
ALTER TABLE public.dao_reward_claim_candidates
 ADD CONSTRAINT dao_reward_claim_candidates_payout_status_check
 CHECK (payout_status IN ('pending','verified','needs_review'));
CREATE INDEX IF NOT EXISTS dao_reward_claim_candidates_payout_pending_idx
 ON public.dao_reward_claim_candidates (user_id,wallet_id,claim_block)
 WHERE status='ownership_verified' AND payout_status='pending';
COMMIT;
