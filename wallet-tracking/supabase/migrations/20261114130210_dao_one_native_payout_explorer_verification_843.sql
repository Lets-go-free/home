-- WalletTracking 8.43 – 1 nativer DAO1-Claim, extern erneut gepruefte Internal-TX-Auszahlung.
-- Erst nach Live-Explorer-Abgleich der exakten TX/WALLET. Keine Massenklassifikation.
-- Ohne Preis-, NFT-, kanonische Claim-, Queue- oder Cron-Aenderung.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_verify_single_native_payout_843(
 p_user uuid,p_wallet uuid,p_tx text,p_explorer_amount_raw text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 c public.dao_reward_claim_candidates%ROWTYPE;
 t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 n integer; applied boolean; coverage jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_tx IS NULL OR p_tx !~ '^0x[0-9a-f]{64}$' OR p_explorer_amount_raw IS NULL
  OR p_explorer_amount_raw !~ '^[0-9]+$' OR length(p_explorer_amount_raw)>100
  OR p_explorer_amount_raw::numeric<=0 THEN RAISE EXCEPTION 'Invalid transaction evidence'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
  RAISE EXCEPTION 'Wallet mismatch'; END IF;
 SELECT * INTO c FROM public.dao_reward_claim_candidates d
  WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1'
   AND d.chain_key='apertum' AND d.tx_hash=p_tx FOR UPDATE;
 IF NOT FOUND OR c.payout_status IS DISTINCT FROM 'pending'
  OR c.canonical_existing_verified IS TRUE OR c.audit_classification IS NOT NULL
  OR c.claim_pipeline_status='completed' THEN
  RETURN jsonb_build_object('status','skipped','reason','candidate-not-eligible','claimsCreated',0);
 END IF;
 IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.project_key='dao1'
  AND n.chain_key='apertum' AND n.tx_hash=p_tx) THEN
  RETURN jsonb_build_object('status','skipped','reason','canonical-claim-already-present','claimsCreated',0);
 END IF;
 SELECT count(*) INTO n FROM public.project_transactions x
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
   AND x.chain_key='apertum' AND x.tx_hash=p_tx;
 IF n<>1 THEN RETURN jsonb_build_object('status','blocked','reason','transaction-not-unique','claimsCreated',0); END IF;
 SELECT * INTO t FROM public.project_transactions x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
  AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx FOR SHARE;
 IF t.block_number IS DISTINCT FROM c.claim_block OR lower(coalesce(t.status,'')) NOT IN ('ok','success')
  OR lower(coalesce(t.selector,'')) NOT IN ('0x86bb8f37','0x19da4078')
  OR lower(coalesce(t.to_address,'')) <> '0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
  OR coalesce(t.claim_reward_aptm,0)<>0 OR coalesce(t.claim_reward_usd,0)<>0 THEN
  RETURN jsonb_build_object('status','blocked','reason','invalid-transaction-context','claimsCreated',0);
 END IF;
 SELECT count(*) INTO n FROM public.project_transaction_asset_flows x
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum'
   AND x.tx_hash=p_tx AND (x.direction IS NULL OR x.direction NOT IN ('eingang','ausgang','intern','sonst')
     OR (x.direction IN ('eingang','intern') AND CASE
       WHEN x.amount_raw ~ '^[0-9]+$' AND length(x.amount_raw)<=100 THEN x.amount_raw::numeric>0
       ELSE true END));
 IF n<>1 THEN RETURN jsonb_build_object('status','blocked','reason','incoming-flow-not-unique','claimsCreated',0); END IF;
 SELECT * INTO f FROM public.project_transaction_asset_flows x
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum'
   AND x.tx_hash=p_tx AND x.flow_key='claim-native:'||p_tx FOR SHARE;
 IF NOT FOUND OR f.direction IS DISTINCT FROM 'eingang' OR f.token_address IS DISTINCT FROM 'native'
  OR f.token_decimals IS DISTINCT FROM 18 OR f.block_number IS DISTINCT FROM c.claim_block
  OR lower(coalesce(f.counterparty_address,'')) IS DISTINCT FROM lower(t.to_address)
  OR f.log_index IS DISTINCT FROM -1
  OR f.amount_raw IS DISTINCT FROM p_explorer_amount_raw THEN
  RETURN jsonb_build_object('status','blocked','reason','explorer-persisted-flow-mismatch','claimsCreated',0);
 END IF;
 coverage:=jsonb_build_object('source','blockscout-internal-transactions-v1',
  'complete',true,'tx_hash',p_tx,'block_number',c.claim_block,
  'native_internal_transfer_verified',true,'wallet_scoped',true,
  'direct_contract_sender',lower(t.to_address),'amount_raw',p_explorer_amount_raw,
  'token_address','native','token_decimals',18,'flow_count',1,
  'canonical_amount_required',false,'usd_required',false);
 applied:=public.wallettracking_dao_record_payout_check(p_user,p_wallet,p_tx,c.payout_checked_at,
  'verified','explorer-native-matches-persisted-flow',coverage,'native',p_explorer_amount_raw,18,1);
 IF NOT applied THEN RAISE EXCEPTION 'Concurrent payout evidence change'; END IF;
 RETURN jsonb_build_object('status','verified','txHash',p_tx,'amountRaw',p_explorer_amount_raw,
  'claimsCreated',0,'usdPriceChanged',false,'canonicalRewardChanged',false);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_verify_single_native_payout_843(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_verify_single_native_payout_843(uuid,uuid,text,text) TO service_role;
COMMIT;
