-- WalletTracking 7.98: atomic, exact-evidence-only existing DAO claim marking.
-- Test wallet caller is fixed and admin-authorized in the Edge Function.
-- No canonical transaction, reward, price, NFT or payout state is written.
BEGIN;
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
         AND f.amount_raw::numeric=t.claim_reward_aptm*1000000000000000000::numeric
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
