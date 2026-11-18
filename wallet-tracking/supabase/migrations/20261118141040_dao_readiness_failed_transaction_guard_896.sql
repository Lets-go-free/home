-- WalletTracking 8.96: recognise independently classified failed DAO transactions
-- in service-only reward-stage readiness, without relaxing any unknown exception.
-- No queue/claim/flow/price writes and no cron activation.
BEGIN;

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_readiness_v3(
 p_user uuid,p_wallet uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 total_candidates integer;
 unresolved integer;
 invalid_reference integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Service role only';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user
 ) THEN
  RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;

 SELECT
  count(*),
  count(*) FILTER (
   WHERE c.canonical_existing_verified IS DISTINCT FROM true
    AND c.audit_classification IS NULL
    AND c.payout_status IS DISTINCT FROM 'no_payout_evidence'
    AND c.claim_pipeline_status IS DISTINCT FROM 'completed'
  ),
  count(*) FILTER (
   WHERE c.audit_classification IS NOT NULL
    AND c.audit_classification <> 'unpriced_before_exact_anchor'
    AND NOT (
     c.audit_classification = 'failed_transaction'
     AND c.status = 'pending'
     AND c.payout_status = 'pending'
     AND c.claim_pipeline_status = 'pending'
     AND c.canonical_existing_verified = false
     AND (
      SELECT count(*) FROM public.project_transactions t
      WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
       AND t.project_key='dao1' AND t.chain_key='apertum'
       AND t.tx_hash=c.tx_hash
       AND lower(t.status) IN ('failed','reverted','error')
     ) = 1
     AND NOT EXISTS (
      SELECT 1 FROM public.project_nft_claims n
      WHERE n.user_id=c.user_id AND n.wallet_id=c.wallet_id
       AND n.project_key='dao1' AND n.chain_key='apertum'
       AND n.tx_hash=c.tx_hash
     )
     AND NOT EXISTS (
      SELECT 1 FROM public.project_transaction_asset_flows f
      WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
       AND f.project_key='dao1' AND f.chain_key='apertum'
       AND f.tx_hash=c.tx_hash AND f.direction='eingang'
     )
    )
  )
 INTO total_candidates,unresolved,invalid_reference
 FROM public.dao_reward_claim_candidates c
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet
  AND c.project_key='dao1' AND c.chain_key='apertum';

 RETURN jsonb_build_object(
  'candidates',total_candidates,
  'unresolved',unresolved,
  'unrecognizedExceptions',invalid_reference
 );
END $fn$;

REVOKE ALL ON FUNCTION public.wallettracking_dao_reward_readiness_v3(uuid,uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reward_readiness_v3(uuid,uuid)
 TO service_role;
COMMIT;
