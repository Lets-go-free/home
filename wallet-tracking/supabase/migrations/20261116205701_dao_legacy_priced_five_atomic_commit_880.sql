-- WalletTracking 8.80: one fixed five-claim atomic historical batch.
-- Installation creates only a service-role function: NO claim/flow/price writes.
-- The Edge function MUST freshly recheck native Trace/MintEvent and exact-v13
-- archive pool state for every fixed transaction immediately before this call.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_commit_legacy_priced_five_880(
 p_user uuid,p_wallet uuid,p_proofs jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 v_wallet constant uuid := '8a3c5dc6-0610-482d-a327-3f3ba03db158';
 v_wallet_address constant text := '0x39180b13f5bd24432f01535ceb2c069fd2adf937';
 v_contract constant text := '0xa1b761890c36e356f49f9df8d495fcffa76857ad';
 v_pool constant text := '0x38acbfa5108d3c76d6cea4d380182e832a289b57';
 v_fixed record;
 v_proof jsonb;
 v_candidate public.dao_reward_claim_candidates%ROWTYPE;
 v_tx public.project_transactions%ROWTYPE;
 v_anchor public.aptm_price_anchors%ROWTYPE;
 v_final jsonb;
 v_count integer;
 v_idx integer:=0;
 v_results jsonb:='[]'::jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF p_wallet IS DISTINCT FROM v_wallet OR p_user IS NULL OR
    (SELECT count(*) FROM public.wallets w WHERE w.id=v_wallet AND w.user_id=p_user)<>1 THEN
  RAISE EXCEPTION 'Fixed wallet scope mismatch';
 END IF;
 IF p_proofs IS NULL OR jsonb_typeof(p_proofs)<>'array' OR jsonb_array_length(p_proofs)<>5 THEN
  RAISE EXCEPTION 'Exactly five live proofs required';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||v_wallet::text,78384));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||v_wallet::text,78787));
 FOR v_fixed IN
  SELECT * FROM (VALUES
   ('0xfb2184155412199053bb6df979dc8b4c57283725b935d30b8364c06676bd0d87'::text,1839700::bigint,818::bigint,'2525083041605479397'::text,1.29818624453132::numeric),
   ('0xb4abf20ae63e8488013729c1160d1578faecbf7b4b13183b2db3fb136e9e5596',1858236,819,'2687537425933638715',1.2969281481676773::numeric),
   ('0xc801519cac197cb76b38b2eca6432639f1a3588ef82af1cb1310dbda6f151bd0',2185604,818,'2924284507977177513',1.6625433945298382::numeric),
   ('0x4bf476ecd9fa1ffe956ddce09e40731ea856170c034b706bb3e4a8e98813af6b',2185862,819,'2761830123649018195',1.6638156156980808::numeric),
   ('0x5bfd2df402f5ac52708c88838cf443711932fa6f7dc1f91bf6635c21c210429f',2337875,818,'1137205057236417485',1.9320395188634845::numeric)
  ) AS fixed(tx_hash,claim_block,nft_id,amount_raw,price_usd)
 LOOP
  v_proof:=p_proofs->v_idx;
  IF jsonb_typeof(v_proof)<>'object' OR v_proof->>'txHash' IS DISTINCT FROM v_fixed.tx_hash
     OR (v_proof->>'claimBlock')::bigint IS DISTINCT FROM v_fixed.claim_block
     OR (v_proof->>'nftId')::bigint IS DISTINCT FROM v_fixed.nft_id
     OR v_proof->>'amountRaw' IS DISTINCT FROM v_fixed.amount_raw
     OR (v_proof->>'priceUsd')::numeric IS DISTINCT FROM v_fixed.price_usd
     OR (v_proof->>'proofBlock')::bigint IS DISTINCT FROM v_fixed.claim_block
     OR v_proof->>'source' IS DISTINCT FROM 'historical-pool-state' THEN
   RAISE EXCEPTION 'Fixed five-claim live proof mismatch at index %',v_idx;
  END IF;
  SELECT c.* INTO STRICT v_candidate FROM public.dao_reward_claim_candidates c
   WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum'
     AND c.tx_hash=v_fixed.tx_hash FOR UPDATE;
  IF v_candidate.claim_block IS DISTINCT FROM v_fixed.claim_block
     OR v_candidate.status IS DISTINCT FROM 'unassigned_legacy'
     OR v_candidate.payout_status IS DISTINCT FROM 'pending'
     OR v_candidate.claim_pipeline_status IS DISTINCT FROM 'pending'
     OR v_candidate.audit_classification IS NOT NULL
     OR v_candidate.canonical_existing_verified IS DISTINCT FROM false
     OR v_candidate.nft_id IS NOT NULL OR v_candidate.nft_contract IS NOT NULL
     OR v_candidate.payout_amount_raw IS NOT NULL OR v_candidate.payout_token_address IS NOT NULL
     OR v_candidate.payout_flow_count IS NOT NULL THEN
   RAISE EXCEPTION 'Legacy candidate already changed at index %',v_idx;
  END IF;
  SELECT t.* INTO STRICT v_tx FROM public.project_transactions t
   WHERE t.user_id=p_user AND t.wallet_id=v_wallet AND t.project_key='dao1' AND t.chain_key='apertum'
     AND t.tx_hash=v_fixed.tx_hash FOR SHARE;
  IF v_tx.block_number IS DISTINCT FROM v_fixed.claim_block OR v_tx.tx_timestamp IS NULL
     OR lower(v_tx.from_address) IS DISTINCT FROM v_wallet_address
     OR lower(v_tx.to_address) IS DISTINCT FROM '0x2096bd2e860b450498a7c908708757a1eb306416'
     OR lower(v_tx.selector) IS DISTINCT FROM '0x86bb8f37'
     OR lower(v_tx.status) NOT IN ('ok','success')
     OR lower(v_tx.raw_input) IS DISTINCT FROM
       ('0x86bb8f37'||lpad(to_hex(v_fixed.nft_id),64,'0')||lpad(to_hex(50),64,'0'))
     OR COALESCE(v_tx.value_aptm,0)<>0
     OR COALESCE(v_tx.claim_reward_aptm,0)<>0
     OR COALESCE(v_tx.claim_reward_usd,0)<>0
     OR v_tx.claim_nft_id IS NOT NULL THEN
   RAISE EXCEPTION 'Historical transaction changed at index %',v_idx;
  END IF;
  IF (SELECT count(*) FROM public.project_nft_ownership o
      WHERE o.user_id=p_user AND o.wallet_id=v_wallet AND o.project_key='dao1' AND o.chain_key='apertum'
        AND lower(o.nft_contract)=v_contract AND o.nft_id=v_fixed.nft_id
        AND o.acquisition_verified=true AND o.acquisition_kind='mint_to_own_wallet'
        AND o.is_current=false AND o.owned_from_block=10904
        AND o.owned_to_block=CASE v_fixed.nft_id WHEN 818 THEN 11448349 ELSE 11448526 END
        AND o.owned_from_block<v_fixed.claim_block AND o.owned_to_block>v_fixed.claim_block)<>1
    OR NOT EXISTS(SELECT 1 FROM public.project_nfts n WHERE n.project_key='dao1' AND n.chain_key='apertum'
       AND lower(n.nft_contract)=v_contract AND n.nft_id=v_fixed.nft_id AND n.subtype='Mining-Bot')
    OR NOT EXISTS(SELECT 1 FROM public.apertum_nft_history_coverage h WHERE h.chain_key='apertum'
       AND lower(h.nft_contract)=v_contract AND h.nft_id=v_fixed.nft_id AND h.is_complete=true AND h.transfer_count=2)
    OR (SELECT count(*) FROM public.apertum_nft_transfer_cache tr WHERE tr.chain_key='apertum'
       AND lower(tr.nft_contract)=v_contract AND tr.nft_id=v_fixed.nft_id)<>2
    OR lower((SELECT tr.to_address FROM public.apertum_nft_transfer_cache tr WHERE tr.chain_key='apertum'
       AND lower(tr.nft_contract)=v_contract AND tr.nft_id=v_fixed.nft_id
       AND tr.block_number<v_fixed.claim_block ORDER BY tr.block_number DESC,tr.log_index DESC LIMIT 1))
       IS DISTINCT FROM v_wallet_address THEN
   RAISE EXCEPTION 'Historical NFT ownership incomplete at index %',v_idx;
  END IF;
  IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.project_key='dao1'
       AND n.chain_key='apertum' AND n.tx_hash=v_fixed.tx_hash)
    OR EXISTS(SELECT 1 FROM public.project_transaction_asset_flows f WHERE f.user_id=p_user
       AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum'
       AND f.tx_hash=v_fixed.tx_hash) THEN
   RAISE EXCEPTION 'Existing claim or flow at index %',v_idx;
  END IF;
  INSERT INTO public.aptm_price_anchors
   (project_key,chain_key,pool_address,parser_version,target_block,sync_block,log_index,tx_hash,
    aptm_usd,scanned_from_block,scanned_at)
   VALUES ('dao1','apertum',v_pool,1,v_fixed.claim_block,v_fixed.claim_block,NULL,NULL,
    v_fixed.price_usd,v_fixed.claim_block,clock_timestamp())
   ON CONFLICT(pool_address,parser_version,target_block) DO NOTHING;
  SELECT a.* INTO STRICT v_anchor FROM public.aptm_price_anchors a
   WHERE a.project_key='dao1' AND a.chain_key='apertum' AND lower(a.pool_address)=v_pool
     AND a.parser_version=1 AND a.target_block=v_fixed.claim_block;
  IF v_anchor.aptm_usd IS DISTINCT FROM v_fixed.price_usd
     OR v_anchor.sync_block IS DISTINCT FROM v_fixed.claim_block
     OR v_anchor.scanned_from_block IS DISTINCT FROM v_fixed.claim_block
     OR v_anchor.tx_hash IS NOT NULL THEN
   RAISE EXCEPTION 'Historical exact-v13 anchor conflict at index %',v_idx;
  END IF;
  INSERT INTO public.project_transaction_asset_flows
   (user_id,project_key,chain_key,wallet_id,flow_key,tx_hash,block_number,tx_timestamp,
    log_index,token_address,token_symbol,token_name,token_decimals,amount_raw,amount,
    counterparty_address,direction)
   VALUES (p_user,'dao1','apertum',v_wallet,'claim-native:'||v_fixed.tx_hash,
    v_fixed.tx_hash,v_fixed.claim_block,v_tx.tx_timestamp,-1,'native','APTM','Apertum',18,
    v_fixed.amount_raw,public.wallettracking_dao_raw_decimal(v_fixed.amount_raw,18),
    '0x0200000000000000000000000000000000000001','eingang');
  UPDATE public.dao_reward_claim_candidates c SET
   status='ownership_verified',nft_id=v_fixed.nft_id,nft_contract=v_contract,
   payout_status='verified',payout_reason='verified-native-minter-trace-event-880',
   payout_checked_at=clock_timestamp(),payout_token_address='native',
   payout_token_decimals=18,payout_flow_count=1,payout_amount_raw=v_fixed.amount_raw
   WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1'
     AND c.chain_key='apertum' AND c.tx_hash=v_fixed.tx_hash;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Candidate staging row count mismatch at index %',v_idx;END IF;
  v_final:=public.wallettracking_dao_finalize_single_native_claim(p_user,v_wallet,v_fixed.tx_hash);
  IF v_final->>'status' IS DISTINCT FROM 'completed' OR (v_final->>'claimsCreated')::integer IS DISTINCT FROM 1 THEN
   RAISE EXCEPTION 'Canonical finalizer rejected index %: %',v_idx,v_final;
  END IF;
  IF (SELECT count(*) FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.wallet_id=v_wallet
      AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=v_fixed.tx_hash
      AND n.nft_id=v_fixed.nft_id AND lower(n.nft_contract)=v_contract
      AND n.reward_aptm=public.wallettracking_dao_raw_decimal(v_fixed.amount_raw,18)
      AND n.reward_asset_amount=n.reward_aptm AND n.reward_asset_usd>0
      AND n.reward_usd=n.reward_asset_usd)<>1 THEN
   RAISE EXCEPTION 'Canonical post-condition mismatch at index %',v_idx;
  END IF;
  v_results:=v_results||jsonb_build_array(jsonb_build_object('txHash',v_fixed.tx_hash,
    'claimBlock',v_fixed.claim_block,'nftId',v_fixed.nft_id,'amountRaw',v_fixed.amount_raw,
    'status','completed'));
  v_idx:=v_idx+1;
 END LOOP;
 IF v_idx<>5 THEN RAISE EXCEPTION 'Unexpected fixed batch size';END IF;
 RETURN jsonb_build_object('status','completed','claimsCreated',5,'results',v_results);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_commit_legacy_priced_five_880(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_commit_legacy_priced_five_880(uuid,uuid,jsonb)
 TO service_role;
COMMIT;
