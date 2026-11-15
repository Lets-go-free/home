-- WalletTracking 8.58 | guarded multi-event miner assignment, single transaction only.
-- Event proof is revalidated in the Edge route; SQL validates independently persisted facts.
-- Never creates a canonical claim or modifies rewards or historical prices.
BEGIN;

CREATE OR REPLACE FUNCTION public.wallettracking_dao_assign_multi_miner_nft_858(
 p_user uuid, p_wallet uuid, p_tx text, p_collection_id bigint,
 p_nft_id bigint, p_event_staker text, p_event_amount_raw text, p_event_count integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 c public.dao_reward_claim_candidates%ROWTYPE;
 t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 v_contract constant text := '0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d';
 v_owner_count integer; v_coverage_count integer; v_count integer;
 v_prior_block bigint; v_prior_owner text; v_prior_count integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_wallet IS DISTINCT FROM '8a3c5dc6-0610-482d-a327-3f3ba03db158'::uuid
  OR p_user IS DISTINCT FROM 'f1c89973-f40b-402a-9670-33cee7300b1e'::uuid
  OR p_tx IS DISTINCT FROM
  '0xb4090cfae1d9a3d86e68755d2130a87e38e172626a948ebac2b7b17bdb806954'
  OR p_collection_id IS DISTINCT FROM 32888 OR p_nft_id IS DISTINCT FROM 37084
  OR p_event_count IS DISTINCT FROM 499
  OR p_event_amount_raw IS DISTINCT FROM '54477996600093324995'
  OR p_event_staker IS NULL OR p_event_staker !~* '^0x[0-9a-f]{40}$'
  OR p_event_amount_raw IS NULL OR p_event_amount_raw !~ '^[0-9]+$'
  OR length(p_event_amount_raw)>100 OR p_event_amount_raw::numeric<=0
 THEN RAISE EXCEPTION '8.58 multi-event pilot evidence mismatch'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user)
 THEN RAISE EXCEPTION 'Wallet/user scope mismatch'; END IF;

 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78384));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78787));
 SELECT * INTO c FROM public.dao_reward_claim_candidates x
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
   AND x.chain_key='apertum' AND x.tx_hash=p_tx FOR UPDATE;
 IF NOT FOUND OR c.status IS DISTINCT FROM 'unassigned_miner'
  OR c.payout_status IS DISTINCT FROM 'verified'
  OR c.payout_reason IS DISTINCT FROM 'explorer-native-matches-persisted-flow'
  OR c.canonical_existing_verified IS TRUE OR c.audit_classification IS NOT NULL
  OR c.claim_pipeline_status IS DISTINCT FROM 'pending'
  OR c.nft_contract IS NOT NULL OR c.nft_id IS NOT NULL
  OR c.payout_token_address IS DISTINCT FROM 'native'
  OR c.payout_token_decimals IS DISTINCT FROM 18
  OR c.payout_flow_count IS DISTINCT FROM 1
  OR c.payout_amount_raw IS DISTINCT FROM p_event_amount_raw
 THEN RAISE EXCEPTION 'Candidate changed or is not eligible'; END IF;
 IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user
  AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=p_tx)
 THEN RAISE EXCEPTION 'Canonical claim already present'; END IF;
 IF (SELECT count(*) FROM public.project_transactions x WHERE x.user_id=p_user
  AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx)<>1
 THEN RAISE EXCEPTION 'Transaction not unique'; END IF;
 SELECT * INTO t FROM public.project_transactions x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
  AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx FOR SHARE;
 IF t.selector IS DISTINCT FROM '0x19da4078' OR t.status IS NULL
  OR lower(t.status) NOT IN ('ok','success')
  OR lower(t.to_address) IS DISTINCT FROM v_contract
  OR lower(t.from_address) IS DISTINCT FROM lower(p_event_staker)
  OR t.block_number IS DISTINCT FROM c.claim_block
  OR coalesce(t.claim_reward_aptm,0)<>0 OR coalesce(t.claim_reward_usd,0)<>0
  OR t.claim_nft_id IS NOT NULL
 THEN RAISE EXCEPTION 'Original claim context mismatch'; END IF;

 IF (SELECT count(*) FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user
  AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx
  AND (x.direction IS NULL OR x.direction NOT IN ('eingang','ausgang','intern','sonst')
   OR x.direction IN ('eingang','intern')))<>1
 THEN RAISE EXCEPTION 'Ambiguous incoming flow'; END IF;
 SELECT * INTO f FROM public.project_transaction_asset_flows x
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum'
   AND x.tx_hash=p_tx AND x.direction='eingang' FOR SHARE;
 IF NOT FOUND OR f.flow_key IS DISTINCT FROM 'claim-native:'||p_tx
  OR f.token_address IS DISTINCT FROM 'native' OR f.token_decimals IS DISTINCT FROM 18
  OR f.amount_raw IS DISTINCT FROM p_event_amount_raw
  OR lower(f.counterparty_address) IS DISTINCT FROM v_contract
  OR f.block_number IS DISTINCT FROM c.claim_block
  OR f.value_usd IS NULL OR f.value_usd<=0 OR f.price_usd IS NULL
  OR f.price_source NOT LIKE '%exact-v13%'
 THEN RAISE EXCEPTION 'Payout flow or exact historical price mismatch'; END IF;

 SELECT count(*) INTO v_owner_count FROM public.project_nft_ownership o
  WHERE o.user_id=p_user AND o.wallet_id=p_wallet AND o.project_key='dao1'
   AND o.chain_key='apertum' AND lower(o.nft_contract)=v_contract AND o.nft_id=p_nft_id
   AND o.owned_from_block<=c.claim_block
   AND (o.owned_to_block IS NULL OR o.owned_to_block>=c.claim_block);
 IF v_owner_count<>1 THEN RAISE EXCEPTION 'Unique historical ownership interval required'; END IF;
 SELECT count(*) INTO v_coverage_count FROM public.apertum_nft_history_coverage h
  WHERE h.chain_key='apertum' AND lower(h.nft_contract)=v_contract AND h.nft_id=p_nft_id
   AND h.is_complete=true AND h.transfer_count=(
    SELECT count(*) FROM public.apertum_nft_transfer_cache x
    WHERE x.chain_key='apertum' AND lower(x.nft_contract)=v_contract AND x.nft_id=p_nft_id);
 IF v_coverage_count<>1 THEN RAISE EXCEPTION 'Complete NFT transfer coverage required'; END IF;
 SELECT count(*) INTO v_count FROM public.apertum_nft_transfer_cache x
  WHERE x.chain_key='apertum' AND lower(x.nft_contract)=v_contract AND x.nft_id=p_nft_id
   AND x.block_number=c.claim_block;
 IF v_count<>0 THEN RAISE EXCEPTION 'Same-block NFT transfer ambiguity'; END IF;
 SELECT x.block_number,x.to_address INTO v_prior_block,v_prior_owner
  FROM public.apertum_nft_transfer_cache x
  WHERE x.chain_key='apertum' AND lower(x.nft_contract)=v_contract AND x.nft_id=p_nft_id
   AND x.block_number<c.claim_block
  ORDER BY x.block_number DESC,x.log_index DESC LIMIT 1;
 IF NOT FOUND OR lower(v_prior_owner) IS DISTINCT FROM lower(t.from_address)
 THEN RAISE EXCEPTION 'Historical last NFT owner mismatch'; END IF;
 SELECT count(*) INTO v_prior_count FROM public.apertum_nft_transfer_cache x
  WHERE x.chain_key='apertum' AND lower(x.nft_contract)=v_contract AND x.nft_id=p_nft_id
   AND x.block_number=v_prior_block;
 IF v_prior_count<>1 THEN RAISE EXCEPTION 'Ambiguous last owner block'; END IF;

 UPDATE public.dao_reward_claim_candidates x
  SET nft_contract=v_contract,nft_id=p_nft_id,status='pending'
  WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
   AND x.chain_key='apertum' AND x.tx_hash=p_tx
   AND x.status='unassigned_miner' AND x.nft_id IS NULL AND x.nft_contract IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Candidate changed during assignment'; END IF;
 RETURN jsonb_build_object('status','assigned','txHash',p_tx,'nftId',p_nft_id,
  'collectionId',p_collection_id,'eventCount',p_event_count,'claimsCreated',0,'rewardChanged',false,'priceChanged',false);
END $fn$;

REVOKE ALL ON FUNCTION public.wallettracking_dao_assign_multi_miner_nft_858(uuid,uuid,text,bigint,bigint,text,text,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_assign_multi_miner_nft_858(uuid,uuid,text,bigint,bigint,text,text,integer) TO service_role;
COMMIT;
