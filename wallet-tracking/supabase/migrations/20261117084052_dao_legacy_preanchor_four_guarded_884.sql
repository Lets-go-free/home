-- WalletTracking 8.84: installation ONLY creates a service-only atomic function.
-- No historical claim, candidate, flow or price is written by this migration.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_commit_legacy_preanchor_four_884(
 p_user uuid, p_wallet uuid, p_proofs jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 v_wallet constant uuid := '8a3c5dc6-0610-482d-a327-3f3ba03db158';
 v_address constant text := '0x39180b13f5bd24432f01535ceb2c069fd2adf937';
 v_contract constant text := '0xa1b761890c36e356f49f9df8d495fcffa76857ad';
 v_result jsonb := '[]'::jsonb;
 v_row record;
 v_c public.dao_reward_claim_candidates%ROWTYPE;
 v_t public.project_transactions%ROWTYPE;
 v_proof jsonb;
 v_amount numeric;
 v_count integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_user IS NULL OR p_wallet IS DISTINCT FROM v_wallet OR
    (SELECT count(*) FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user)<>1 THEN
  RAISE EXCEPTION 'Fixed wallet scope mismatch';
 END IF;
 IF p_proofs IS NULL OR jsonb_typeof(p_proofs)<>'array' OR jsonb_array_length(p_proofs)<>4 THEN
  RAISE EXCEPTION 'Four fresh native-mint proofs required';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78384));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78787));
 IF (SELECT count(*) FROM public.dao_reward_claim_candidates c WHERE c.user_id=p_user
     AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum'
     AND c.status='unassigned_legacy' AND c.payout_status='pending')<>4 THEN
  RAISE EXCEPTION 'Legacy candidate set changed; no preanchor commit';
 END IF;
 FOR v_row IN
  SELECT * FROM (VALUES
   (0,'0xc66aa64b38d65910e64c3bd63b26b58961f155e5a35663900494bd0721641c6c',40707::bigint,819::bigint,'2432568024883926698','0xa1b761890c36e356f49f9df8d495fcffa76857ad'),
   (1,'0xa7bf9a4827adcb397f92c0f67412320d0d77a74022878e5700b950fb28c47333',40709::bigint,818::bigint,'2432568024883926698','0xa1b761890c36e356f49f9df8d495fcffa76857ad'),
   (2,'0x88459cda136bdc5abebc2f3d79c2dcdd05320d498fac6d8c0c23c83f54f79b8f',62642::bigint,818::bigint,'676221939941904344','0xdb330f9a9c4cd2ab4f8e6965bbff8af225b3da60'),
   (3,'0x37b087ddc4dc1a70cdfbb659561eeb1e81a7ad104e498f80ac9a453d4931ca53',62644::bigint,819::bigint,'676221939941904344','0xdb330f9a9c4cd2ab4f8e6965bbff8af225b3da60')
  ) AS x(idx,tx_hash,claim_block,nft_id,amount_raw,vault_address)
  ORDER BY idx
 LOOP
  v_proof:=p_proofs->v_row.idx;
  IF jsonb_typeof(v_proof) IS DISTINCT FROM 'object' OR
     v_proof->>'txHash' IS DISTINCT FROM v_row.tx_hash OR
     (v_proof->>'claimBlock')::bigint IS DISTINCT FROM v_row.claim_block OR
     (v_proof->>'nftId')::bigint IS DISTINCT FROM v_row.nft_id OR
     v_proof->>'amountRaw' IS DISTINCT FROM v_row.amount_raw OR
     (v_proof->>'mintCalls')::integer IS DISTINCT FROM 1 OR
     (v_proof->>'mintEvents')::integer IS DISTINCT FROM 1 OR
     v_proof->>'priceStatus' IS DISTINCT FROM 'unpriced_before_exact_anchor' THEN
   RAISE EXCEPTION 'Fresh preanchor proof mismatch at index %',v_row.idx;
  END IF;
  SELECT c.* INTO STRICT v_c FROM public.dao_reward_claim_candidates c
   WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1'
     AND c.chain_key='apertum' AND c.tx_hash=v_row.tx_hash FOR UPDATE;
  IF v_c.status IS DISTINCT FROM 'unassigned_legacy' OR v_c.payout_status IS DISTINCT FROM 'pending'
    OR v_c.claim_pipeline_status IS DISTINCT FROM 'pending' OR v_c.audit_classification IS NOT NULL
    OR v_c.canonical_existing_verified IS DISTINCT FROM false
    OR v_c.claim_block IS DISTINCT FROM v_row.claim_block OR v_c.nft_id IS NOT NULL
    OR v_c.nft_contract IS NOT NULL OR v_c.payout_amount_raw IS NOT NULL
    OR v_c.payout_token_address IS NOT NULL OR v_c.payout_flow_count IS NOT NULL THEN
   RAISE EXCEPTION 'Preanchor candidate changed at index %',v_row.idx;
  END IF;
  SELECT t.* INTO STRICT v_t FROM public.project_transactions t
   WHERE t.user_id=p_user AND t.wallet_id=v_wallet AND t.project_key='dao1'
     AND t.chain_key='apertum' AND t.tx_hash=v_row.tx_hash FOR SHARE;
  IF v_t.block_number IS DISTINCT FROM v_row.claim_block OR v_t.tx_timestamp IS NULL
    OR lower(v_t.from_address) IS DISTINCT FROM v_address
    OR lower(v_t.to_address) IS DISTINCT FROM v_row.vault_address
    OR lower(v_t.selector) IS DISTINCT FROM '0x86bb8f37'
    OR lower(v_t.status) NOT IN ('ok','success')
    OR lower(v_t.raw_input) IS DISTINCT FROM
      ('0x86bb8f37'||lpad(to_hex(v_row.nft_id),64,'0')||lpad(to_hex(50),64,'0'))
    OR coalesce(v_t.value_aptm,0)<>0 OR coalesce(v_t.claim_reward_aptm,0)<>0
    OR v_t.claim_reward_usd IS NOT NULL OR v_t.claim_nft_id IS NOT NULL THEN
   RAISE EXCEPTION 'Preanchor transaction context changed at index %',v_row.idx;
  END IF;
  IF (SELECT count(*) FROM public.project_nft_ownership o WHERE o.user_id=p_user
     AND o.wallet_id=v_wallet AND o.project_key='dao1' AND o.chain_key='apertum'
     AND lower(o.nft_contract)=v_contract AND o.nft_id=v_row.nft_id
     AND o.acquisition_verified=true AND o.acquisition_kind='mint_to_own_wallet'
     AND o.is_current=false AND o.owned_from_block=10904
     AND o.owned_to_block=CASE v_row.nft_id WHEN 818 THEN 11448349 ELSE 11448526 END
     AND o.owned_from_block<v_row.claim_block AND o.owned_to_block>v_row.claim_block)<>1
    OR NOT EXISTS(SELECT 1 FROM public.project_nfts n WHERE n.project_key='dao1' AND n.chain_key='apertum'
      AND lower(n.nft_contract)=v_contract AND n.nft_id=v_row.nft_id AND n.subtype='Mining-Bot')
    OR NOT EXISTS(SELECT 1 FROM public.apertum_nft_history_coverage h WHERE h.chain_key='apertum'
      AND lower(h.nft_contract)=v_contract AND h.nft_id=v_row.nft_id AND h.is_complete=true AND h.transfer_count=2)
    OR (SELECT count(*) FROM public.apertum_nft_transfer_cache tr WHERE tr.chain_key='apertum'
      AND lower(tr.nft_contract)=v_contract AND tr.nft_id=v_row.nft_id)<>2
    OR lower((SELECT tr.to_address FROM public.apertum_nft_transfer_cache tr
      WHERE tr.chain_key='apertum' AND lower(tr.nft_contract)=v_contract
        AND tr.nft_id=v_row.nft_id AND tr.block_number<v_row.claim_block
      ORDER BY tr.block_number DESC,tr.log_index DESC LIMIT 1)) IS DISTINCT FROM v_address THEN
   RAISE EXCEPTION 'Historical NFT ownership proof incomplete at index %',v_row.idx;
  END IF;
  IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.project_key='dao1'
      AND n.chain_key='apertum' AND n.tx_hash=v_row.tx_hash)
    OR EXISTS(SELECT 1 FROM public.project_transaction_asset_flows f WHERE f.user_id=p_user
      AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum'
      AND f.tx_hash=v_row.tx_hash) THEN
   RAISE EXCEPTION 'Duplicate claim or asset flow at index %',v_row.idx;
  END IF;
  v_amount:=public.wallettracking_dao_raw_decimal(v_row.amount_raw,18);
  INSERT INTO public.project_transaction_asset_flows
   (user_id,project_key,chain_key,wallet_id,flow_key,tx_hash,block_number,tx_timestamp,
    log_index,token_address,token_symbol,token_name,token_decimals,amount_raw,amount,
    counterparty_address,direction,price_usd,value_usd,price_source)
  VALUES(p_user,'dao1','apertum',v_wallet,'claim-native:'||v_row.tx_hash,v_row.tx_hash,
    v_row.claim_block,v_t.tx_timestamp,-1,'native','APTM','Apertum',18,v_row.amount_raw,
    v_amount,'0x0200000000000000000000000000000000000001','eingang',NULL,NULL,NULL);
  INSERT INTO public.project_nft_claims
   (user_id,project_key,chain_key,wallet_id,nft_contract,nft_id,nft_name,nft_subtype,
    tx_hash,block_number,tx_timestamp,reward_aptm,gas_aptm,net_aptm,
    reward_asset_address,reward_asset_symbol,reward_asset_decimals,reward_asset_amount,
    reward_asset_usd,reward_asset_price_source,reward_usd,updated_at)
  VALUES(p_user,'dao1','apertum',v_wallet,v_contract,v_row.nft_id,'NFT #'||v_row.nft_id,'Mining-Bot',
    v_row.tx_hash,v_row.claim_block,v_t.tx_timestamp,v_amount,coalesce(v_t.gas_aptm,0),
    v_amount-coalesce(v_t.gas_aptm,0),'native','APTM',18,v_amount,NULL,NULL,NULL,now());
  UPDATE public.project_transactions t SET claim_nft_id=v_row.nft_id,
    claim_nft_name='NFT #'||v_row.nft_id,claim_nft_subtype='Mining-Bot',
    claim_reward_aptm=v_amount,claim_reward_usd=NULL,updated_at=now()
  WHERE t.user_id=p_user AND t.wallet_id=v_wallet AND t.project_key='dao1'
    AND t.chain_key='apertum' AND t.tx_hash=v_row.tx_hash;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Transaction update count mismatch'; END IF;
  UPDATE public.dao_reward_claim_candidates c SET status='ownership_verified',
    nft_id=v_row.nft_id,nft_contract=v_contract,payout_status='verified',
    payout_reason='verified-native-minter-trace-event-884',payout_checked_at=clock_timestamp(),
    payout_token_address='native',payout_token_decimals=18,payout_flow_count=1,
    payout_amount_raw=v_row.amount_raw,claim_pipeline_status='completed',
    claim_pipeline_reason='preanchor-native-verified-unpriced-884',
    claim_pipeline_checked_at=clock_timestamp(),
    audit_classification='unpriced_before_exact_anchor',audit_classified_at=clock_timestamp()
  WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1'
    AND c.chain_key='apertum' AND c.tx_hash=v_row.tx_hash;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Candidate update count mismatch'; END IF;
  IF (SELECT count(*) FROM public.project_nft_claims n WHERE n.user_id=p_user
      AND n.wallet_id=v_wallet AND n.project_key='dao1' AND n.chain_key='apertum'
      AND n.tx_hash=v_row.tx_hash AND n.nft_id=v_row.nft_id AND lower(n.nft_contract)=v_contract
      AND n.reward_aptm=v_amount AND n.reward_asset_amount=v_amount
      AND n.reward_usd IS NULL AND n.reward_asset_usd IS NULL
      AND n.reward_asset_price_source IS NULL)<>1
    OR (SELECT count(*) FROM public.project_transaction_asset_flows f WHERE f.user_id=p_user
      AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum'
      AND f.tx_hash=v_row.tx_hash AND f.amount_raw=v_row.amount_raw AND f.log_index=-1
      AND f.price_usd IS NULL AND f.value_usd IS NULL AND f.price_source IS NULL)<>1 THEN
   RAISE EXCEPTION 'Unpriced canonical postcondition failed at index %',v_row.idx;
  END IF;
  v_result:=v_result||jsonb_build_array(jsonb_build_object('txHash',v_row.tx_hash,
    'claimBlock',v_row.claim_block,'nftId',v_row.nft_id,'amountRaw',v_row.amount_raw,
    'status','completed','rewardUsd',NULL,'priceStatus','unpriced_before_exact_anchor'));
 END LOOP;
 RETURN jsonb_build_object('status','completed','claimsCreated',4,'results',v_result);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_commit_legacy_preanchor_four_884(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_commit_legacy_preanchor_four_884(uuid,uuid,jsonb)
 TO service_role;
COMMIT;
