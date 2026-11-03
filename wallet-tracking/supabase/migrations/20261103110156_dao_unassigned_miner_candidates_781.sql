-- WalletTracking 7.81: New Miner claims without verifiable NFT IDs.
-- Store transaction-level payout evidence without inventing NFT ownership.
-- This is a service-role-only staging extension; it does not change reward totals.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
  ALTER COLUMN nft_contract DROP NOT NULL,
  ALTER COLUMN nft_id DROP NOT NULL;
ALTER TABLE public.dao_reward_claim_candidates
  DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_status_check;
ALTER TABLE public.dao_reward_claim_candidates
  ADD CONSTRAINT dao_reward_claim_candidates_status_check
  CHECK (status IN ('pending','ownership_verified','unverified','needs_review','unassigned_miner'));
ALTER TABLE public.dao_reward_claim_candidates
  ADD CONSTRAINT dao_reward_claim_candidates_nft_evidence_check CHECK (
    (status='unassigned_miner' AND nft_contract IS NULL AND nft_id IS NULL)
    OR
    (status<>'unassigned_miner' AND nft_contract IS NOT NULL AND nft_id IS NOT NULL)
  );
CREATE INDEX IF NOT EXISTS dao_reward_unassigned_miner_payout_pending_idx
 ON public.dao_reward_claim_candidates(user_id,wallet_id,claim_block)
 WHERE status='unassigned_miner' AND payout_status IN ('pending','needs_review');
COMMIT;
