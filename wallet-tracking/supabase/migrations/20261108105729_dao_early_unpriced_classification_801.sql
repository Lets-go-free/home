-- WalletTracking 8.01: durable audit classification for four pre-anchor APTM claims.
-- This migration runs exactly ONE guarded write against staging claim candidates.
-- No canonical reward/price/payout/NFT/wallet/scan records are modified.
-- Run AFTER 8.00. A repeated run is idempotent.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
  ADD COLUMN IF NOT EXISTS audit_classification text,
  ADD COLUMN IF NOT EXISTS audit_classified_at timestamptz;

DO $body$
DECLARE
  v_total integer;
  v_eligible integer;
  v_changed integer;
BEGIN
  -- Fail closed if any of these four historical claims is missing or modified.
  SELECT count(*), count(*) FILTER (
    WHERE c.canonical_existing_verified IS DISTINCT FROM TRUE
      AND t.claim_reward_aptm > 0
      AND t.claim_reward_usd IS NULL
      AND t.block_number < 88356
      AND lower(t.selector) = '0x86bb8f37'
      AND (c.audit_classification IS NULL OR c.audit_classification = 'unpriced_before_exact_anchor')
  ) INTO v_total,v_eligible
  FROM public.dao_reward_claim_candidates c
  JOIN public.project_transactions t
    ON t.user_id=c.user_id AND t.wallet_id=c.wallet_id
    AND t.project_key=c.project_key AND t.chain_key=c.chain_key
    AND lower(t.tx_hash)=lower(c.tx_hash)
  WHERE c.project_key='dao1' AND c.chain_key='apertum'
    AND lower(c.tx_hash) IN (
      '0xad23676b7ea6e6db9ff47d0c3d60933ddb606b5194ba3660ea0fe1b8aafce4d8',
      '0x4fc74666a206f5e96bb0e34df8dec0dd022c16662ead1b6b93e8771f85ce1b91',
      '0x4e6a4ae039914965691a4caa09d5c98c6d3b9fd7f5aae258e0d7aad7fefb07bc',
      '0x7adf44b5eec40f3d347c6e87362160092017ed1cee178cc50c83c69537bcf12e'
    );
  IF v_total <> 4 OR v_eligible <> 4 THEN
    RAISE EXCEPTION 'DAO early-claim guard failed (found %, eligible %; expected 4/4)',v_total,v_eligible;
  END IF;

  UPDATE public.dao_reward_claim_candidates c
  SET audit_classification='unpriced_before_exact_anchor',
      audit_classified_at=now()
  FROM public.project_transactions t
  WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
    AND t.project_key=c.project_key AND t.chain_key=c.chain_key
    AND lower(t.tx_hash)=lower(c.tx_hash)
    AND c.project_key='dao1' AND c.chain_key='apertum'
    AND c.canonical_existing_verified IS DISTINCT FROM TRUE
    AND t.claim_reward_aptm>0 AND t.claim_reward_usd IS NULL
    AND t.block_number<88356
    AND lower(t.selector)='0x86bb8f37'
    AND c.audit_classification IS DISTINCT FROM 'unpriced_before_exact_anchor'
    AND lower(c.tx_hash) IN (
      '0xad23676b7ea6e6db9ff47d0c3d60933ddb606b5194ba3660ea0fe1b8aafce4d8',
      '0x4fc74666a206f5e96bb0e34df8dec0dd022c16662ead1b6b93e8771f85ce1b91',
      '0x4e6a4ae039914965691a4caa09d5c98c6d3b9fd7f5aae258e0d7aad7fefb07bc',
      '0x7adf44b5eec40f3d347c6e87362160092017ed1cee178cc50c83c69537bcf12e'
    );
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RAISE NOTICE 'Pre-anchor DAO claims labelled: % (existing labels preserved)', v_changed;
END $body$;
COMMIT;
