-- Durable staging backlog for historical NFT ownership evidence.
-- Does not create or modify reward totals; no cron activation.
CREATE TABLE IF NOT EXISTS public.dao_reward_claim_candidates (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
 project_key text NOT NULL DEFAULT 'dao1' CHECK(project_key='dao1'),
 chain_key text NOT NULL DEFAULT 'apertum' CHECK(chain_key='apertum'),
 tx_hash text NOT NULL CHECK(tx_hash ~ '^0x[0-9a-f]{64}$'),
 claim_block bigint NOT NULL CHECK(claim_block>0),
 nft_contract text NOT NULL CHECK(nft_contract ~ '^0x[0-9a-f]{40}$'),
 nft_id numeric(78,0) NOT NULL CHECK(nft_id>=0),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ownership_verified','unverified')),
 proof_reason text,
 checked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,wallet_id,chain_key,tx_hash)
);
CREATE INDEX IF NOT EXISTS dao_reward_claim_candidates_pending_idx
 ON public.dao_reward_claim_candidates (user_id,wallet_id,claim_block)
 WHERE status='pending';
ALTER TABLE public.dao_reward_claim_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dao_reward_claim_candidates FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.dao_reward_claim_candidates TO service_role;
