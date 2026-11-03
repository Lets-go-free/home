-- WalletTracking 7.82: keep legacy claimReward transactions without unique NFT identity.
-- Staging only; zero modifications to existing canonical reward fields.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
 DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_status_check;
ALTER TABLE public.dao_reward_claim_candidates
 ADD CONSTRAINT dao_reward_claim_candidates_status_check
 CHECK (status IN ('pending','ownership_verified','unverified','needs_review','unassigned_miner','unassigned_legacy'));
ALTER TABLE public.dao_reward_claim_candidates
 DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_nft_evidence_check;
ALTER TABLE public.dao_reward_claim_candidates
 ADD CONSTRAINT dao_reward_claim_candidates_nft_evidence_check CHECK (
  (status IN ('unassigned_miner','unassigned_legacy') AND nft_contract IS NULL AND nft_id IS NULL)
  OR
  (status NOT IN ('unassigned_miner','unassigned_legacy') AND nft_contract IS NOT NULL AND nft_id IS NOT NULL)
 );
CREATE INDEX IF NOT EXISTS dao_reward_unassigned_legacy_payout_pending_idx
 ON public.dao_reward_claim_candidates(user_id,wallet_id,claim_block)
 WHERE status='unassigned_legacy' AND payout_status IN ('pending','needs_review');
COMMIT;
