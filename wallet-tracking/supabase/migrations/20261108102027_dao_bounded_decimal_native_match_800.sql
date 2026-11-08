-- WalletTracking phase 8.00, run once after 7.99.
-- Existing 384 marks are not touched; only functions are replaced.
-- This migration has no SELECT result sets.
BEGIN;
-- WalletTracking 8.00: exact decimal-native payout check with a bounded
-- rounding tolerance of 1e-15 APTM, for historical JS Number values.
-- No binary floating point is used in the raw-amount comparison.
-- The guarded caller must request the expected remaining count (4).
-- Version 7.97: strict native payout evidence only. Other assets
-- require separate canonical token mapping and historical ownership proof.
-- No original reward amounts, token prices, NFT ownership or transactions changed.
CREATE OR REPLACE FUNCTION public.wallettracking_dao_mark_existing_paid_claims(
 p_user uuid, p_wallet uuid, p_limit integer DEFAULT 500)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE v_updated integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Service role required';
 END IF;
 IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
  RAISE EXCEPTION 'Invalid batch size';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
  RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 WITH eligible AS (
 SELECT c.user_id,c.wallet_id,c.chain_key,c.tx_hash
 FROM public.dao_reward_claim_candidates c
 JOIN public.project_transactions t
   ON t.user_id=c.user_id AND t.wallet_id=c.wallet_id
  AND t.project_key=c.project_key AND t.chain_key=c.chain_key
  AND lower(t.tx_hash)=lower(c.tx_hash)
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet
   AND c.project_key='dao1' AND c.chain_key='apertum'
   AND c.canonical_existing_verified IS DISTINCT FROM true
   AND lower(t.selector) IN ('0x19da4078','0x86bb8f37')
   AND (lower(t.selector)<>'0x19da4078'
        OR lower(t.to_address)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d')
   AND lower(t.status) IN ('ok','success')
   AND t.claim_reward_aptm > 0
   AND t.claim_reward_usd IS NOT NULL AND t.claim_reward_usd > 0
   AND EXISTS (
      SELECT 1 FROM public.project_transaction_asset_flows f
      WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
        AND f.project_key=c.project_key AND f.chain_key=c.chain_key
        AND lower(f.tx_hash)=lower(c.tx_hash)
        AND f.flow_key=concat('claim-native:',lower(c.tx_hash))
        AND f.direction='eingang' AND f.token_address='native'
        AND f.amount>0 AND f.amount=t.claim_reward_aptm
        AND f.amount_raw ~ '^[0-9]+$' AND f.token_decimals=18
        AND abs((f.amount_raw::numeric / 1000000000000000000::numeric) - t.claim_reward_aptm::numeric) <= 0.000000000000001::numeric
   )
 ORDER BY c.claim_block,c.tx_hash
 LIMIT p_limit
 ), marked AS (
 UPDATE public.dao_reward_claim_candidates c
 SET canonical_existing_verified=true,canonical_existing_checked_at=now()
 FROM eligible e
 WHERE c.user_id=e.user_id AND c.wallet_id=e.wallet_id
   AND c.chain_key=e.chain_key AND c.tx_hash=e.tx_hash
   AND c.canonical_existing_verified IS DISTINCT FROM true
 RETURNING c.tx_hash
 ) SELECT count(*) INTO v_updated FROM marked;
 RETURN v_updated;
END $function$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_mark_existing_paid_claims(uuid,uuid,integer)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_mark_existing_paid_claims(uuid,uuid,integer)
 TO service_role;

-- WalletTracking 8.00: both guarded and marking functions share the identical
-- decimal-native payout comparison, with expected-count guard and rollback.
-- Version 7.98: atomic, exact-evidence-only existing DAO claim marking.
-- Test wallet caller is fixed and admin-authorized in the Edge Function.
-- No canonical transaction, reward, price, NFT or payout state is written.
CREATE OR REPLACE FUNCTION public.wallettracking_dao_mark_existing_paid_claims_guarded(
 p_user uuid, p_wallet uuid, p_expected_marked integer, p_expected_eligible integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
 v_marked_before integer; v_eligible integer; v_marked_after integer; v_updated integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_expected_marked IS NULL OR p_expected_marked < 0 OR
    p_expected_eligible IS NULL OR p_expected_eligible < 0 OR p_expected_eligible > 500 THEN
   RAISE EXCEPTION 'Invalid expected counts';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
  RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 -- Lock this wallet's candidate set for concurrent guarded operations.
 PERFORM pg_advisory_xact_lock(hashtextextended('dao-existing-mark:'||p_user::text||':'||p_wallet::text,0));
 SELECT count(*) INTO v_marked_before
 FROM public.dao_reward_claim_candidates c
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet AND c.project_key='dao1'
   AND c.chain_key='apertum' AND c.canonical_existing_verified IS TRUE;
 IF v_marked_before <> p_expected_marked THEN
  RAISE EXCEPTION 'Existing mark count changed (expected %, actual %)',p_expected_marked,v_marked_before;
 END IF;
 SELECT count(*) INTO v_eligible
 FROM public.dao_reward_claim_candidates c
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet AND c.project_key='dao1'
   AND c.chain_key='apertum' AND c.canonical_existing_verified IS DISTINCT FROM TRUE
   AND EXISTS (
     SELECT 1 FROM public.project_transactions t
     WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
       AND t.project_key=c.project_key AND t.chain_key=c.chain_key
       AND lower(t.tx_hash)=lower(c.tx_hash)
       AND lower(t.selector) IN ('0x19da4078','0x86bb8f37')
       AND (lower(t.selector)<>'0x19da4078'
         OR lower(t.to_address)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d')
       AND lower(t.status) IN ('ok','success')
       AND t.claim_reward_aptm > 0 AND t.claim_reward_usd > 0
       AND EXISTS (
        SELECT 1 FROM public.project_transaction_asset_flows f
        WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
         AND f.project_key=c.project_key AND f.chain_key=c.chain_key
         AND lower(f.tx_hash)=lower(c.tx_hash)
         AND f.flow_key=concat('claim-native:',lower(c.tx_hash))
         AND f.direction='eingang' AND f.token_address='native'
         AND f.amount > 0 AND f.amount=t.claim_reward_aptm
         AND f.amount_raw ~ '^[0-9]+$' AND f.token_decimals=18
         AND abs((f.amount_raw::numeric / 1000000000000000000::numeric) - t.claim_reward_aptm::numeric) <= 0.000000000000001::numeric
       )
   );
 IF v_eligible <> p_expected_eligible THEN
  RAISE EXCEPTION 'Eligible count changed (expected %, actual %)',p_expected_eligible,v_eligible;
 END IF;
 -- Reuse the proven 7.97 strict matching predicate. Both RPCs execute in
 -- one database transaction; any mismatch below rolls the writes back.
 SELECT public.wallettracking_dao_mark_existing_paid_claims(p_user,p_wallet,500) INTO v_updated;
 IF v_updated <> v_eligible THEN
  RAISE EXCEPTION 'Strict mark count mismatch (expected %, actual %)',v_eligible,v_updated;
 END IF;
 SELECT count(*) INTO v_marked_after
 FROM public.dao_reward_claim_candidates c
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet AND c.project_key='dao1'
   AND c.chain_key='apertum' AND c.canonical_existing_verified IS TRUE;
 IF v_marked_after <> v_marked_before+v_updated THEN
  RAISE EXCEPTION 'Post-check count mismatch';
 END IF;
 RETURN jsonb_build_object('markedBefore',v_marked_before,
  'eligibleBefore',v_eligible,'newlyMarked',v_updated,'markedAfter',v_marked_after);
END $function$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_mark_existing_paid_claims_guarded(uuid,uuid,integer,integer)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_mark_existing_paid_claims_guarded(uuid,uuid,integer,integer)
 TO service_role;
COMMIT;
