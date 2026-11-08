-- WalletTracking 7.97: strict native payout evidence only. Other assets
-- require separate canonical token mapping and historical ownership proof.
-- No original reward amounts, token prices, NFT ownership or transactions changed.
BEGIN;
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
        AND f.amount_raw::numeric = t.claim_reward_aptm * 1000000000000000000::numeric
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
COMMIT;
