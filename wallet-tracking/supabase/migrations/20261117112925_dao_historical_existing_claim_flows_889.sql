-- WalletTracking 8.89: guarded, atomic reconciliation of up to three already-canonical
-- historical native APTM claims. Installing this function performs NO data writes.
-- A separately authenticated Edge action MUST freshly verify live trace, logs,
-- historical NFT ownership and exact raw amount before submitting each proof.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_commit_historical_existing_flows_889(
 p_user uuid,p_wallet uuid,p_proofs jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 v_wallet constant uuid := 'e8b5c835-0db2-4449-bbee-258e28b42bbb';
 v_contract constant text := '0xa1b761890c36e356f49f9df8d495fcffa76857ad';
 v_minter constant text := '0x0200000000000000000000000000000000000001';
 v_address text;
 v_expected text[];
 v_submitted text[];
 v_record record;
 v_proof jsonb;
 v_candidate public.dao_reward_claim_candidates%ROWTYPE;
 v_tx public.project_transactions%ROWTYPE;
 v_claim public.project_nft_claims%ROWTYPE;
 v_raw numeric;
 v_amount numeric;
 v_count integer;
 v_index integer:=0;
 v_results jsonb:='[]'::jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_user IS NULL OR p_wallet IS DISTINCT FROM v_wallet OR
    (SELECT count(*) FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user)<>1 THEN
  RAISE EXCEPTION 'Historical fixed wallet mismatch';
 END IF;
 IF p_proofs IS NULL OR jsonb_typeof(p_proofs)<>'array' OR jsonb_array_length(p_proofs) NOT BETWEEN 1 AND 3 THEN
  RAISE EXCEPTION 'One to three freshly verified proofs required';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||v_wallet::text,78889));
 SELECT array_agg(q.tx_hash ORDER BY q.claim_block,q.tx_hash) INTO v_expected
 FROM (SELECT c.tx_hash,c.claim_block FROM public.dao_reward_claim_candidates c
       WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum'
         AND c.status='pending' AND c.payout_status='pending' AND c.claim_pipeline_status='pending'
         AND c.canonical_existing_verified=false AND c.audit_classification IS NULL
       ORDER BY c.claim_block,c.tx_hash LIMIT 3) q;
 SELECT array_agg(z.proof->>'txHash' ORDER BY z.ordinality) INTO v_submitted
 FROM jsonb_array_elements(p_proofs) WITH ORDINALITY AS z(proof,ordinality);
 IF v_expected IS NULL OR v_expected IS DISTINCT FROM v_submitted THEN
  RAISE EXCEPTION 'Historical candidate order/count changed; preview and retry';
 END IF;
 -- Wallet address is sourced from the already verified transaction, not a client-supplied address.
 FOR v_record IN SELECT x.proof,x.ordinality FROM jsonb_array_elements(p_proofs)
   WITH ORDINALITY AS x(proof,ordinality) ORDER BY x.ordinality LOOP
  v_proof:=v_record.proof;
  IF jsonb_typeof(v_proof)<>'object' OR
     v_proof->>'txHash' IS NULL OR v_proof->>'amountRaw' IS NULL OR
     v_proof->>'mintCalls' IS NULL OR v_proof->>'mintEvents' IS NULL OR
     v_proof->>'claimBlock' IS NULL OR v_proof->>'nftId' IS NULL OR
     v_proof->>'txHash' !~ '^0x[0-9a-f]{64}$' OR
     v_proof->>'amountRaw' !~ '^[0-9]{1,78}$' OR
     (v_proof->>'amountRaw')::numeric<=0 OR
     v_proof->>'ownershipProof' IS DISTINCT FROM 'prior-transfer-recipient' OR
     v_proof->>'mintCalls' !~ '^[1-9][0-9]*$' OR
     v_proof->>'mintEvents' IS DISTINCT FROM v_proof->>'mintCalls' OR
     v_proof->>'claimBlock' !~ '^[1-9][0-9]*$' OR
     v_proof->>'nftId' !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Invalid refreshed live proof at index %',v_index;
  END IF;
  SELECT * INTO STRICT v_candidate FROM public.dao_reward_claim_candidates c
   WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum'
     AND c.tx_hash=v_proof->>'txHash' FOR UPDATE;
  IF v_candidate.status IS DISTINCT FROM 'pending' OR
     v_candidate.payout_status IS DISTINCT FROM 'pending' OR
     v_candidate.claim_pipeline_status IS DISTINCT FROM 'pending' OR
     v_candidate.canonical_existing_verified IS DISTINCT FROM false OR
     v_candidate.audit_classification IS NOT NULL OR
     v_candidate.nft_contract IS DISTINCT FROM v_contract OR
     v_candidate.nft_id IS DISTINCT FROM (v_proof->>'nftId')::numeric OR
     v_candidate.claim_block IS DISTINCT FROM (v_proof->>'claimBlock')::bigint OR
     v_candidate.payout_amount_raw IS NOT NULL OR v_candidate.payout_flow_count IS NOT NULL THEN
   RAISE EXCEPTION 'Historical candidate already changed at index %',v_index;
  END IF;
  SELECT * INTO STRICT v_tx FROM public.project_transactions t
   WHERE t.user_id=p_user AND t.wallet_id=v_wallet AND t.project_key='dao1' AND t.chain_key='apertum'
     AND t.tx_hash=v_candidate.tx_hash FOR SHARE;
  IF v_tx.block_number IS DISTINCT FROM v_candidate.claim_block OR
     v_tx.tx_timestamp IS NULL OR v_tx.selector IS DISTINCT FROM '0x86bb8f37' OR
     lower(v_tx.status) NOT IN ('ok','success') OR
     lower(v_tx.to_address) IS DISTINCT FROM '0x2096bd2e860b450498a7c908708757a1eb306416' OR
     v_tx.from_address IS NULL OR v_tx.claim_reward_aptm IS NULL THEN
   RAISE EXCEPTION 'Historical canonical transaction mismatch at index %',v_index;
  END IF;
  SELECT * INTO STRICT v_claim FROM public.project_nft_claims n
   WHERE n.user_id=p_user AND n.wallet_id=v_wallet AND n.project_key='dao1' AND n.chain_key='apertum'
     AND n.tx_hash=v_candidate.tx_hash FOR SHARE;
  IF v_claim.nft_id IS DISTINCT FROM v_candidate.nft_id OR
     lower(v_claim.nft_contract) IS DISTINCT FROM v_contract OR
     v_claim.reward_asset_decimals IS DISTINCT FROM 18 OR
     v_claim.reward_asset_symbol IS DISTINCT FROM 'APTM' OR
     v_claim.reward_aptm IS NULL OR v_claim.reward_aptm<=0 OR
     v_claim.reward_asset_amount IS NULL OR v_claim.reward_asset_amount<=0 OR
     v_claim.reward_usd IS NULL OR v_claim.reward_usd<=0 OR
     v_claim.reward_asset_usd IS NULL OR v_claim.reward_asset_usd<=0 OR
     v_claim.reward_usd IS DISTINCT FROM v_claim.reward_asset_usd OR
     v_claim.reward_asset_price_source IS NULL THEN
   RAISE EXCEPTION 'Existing canonical claim incomplete at index %',v_index;
  END IF;
  IF (SELECT count(*) FROM public.project_nft_ownership o
      WHERE o.user_id=p_user AND o.wallet_id=v_wallet AND o.project_key='dao1' AND o.chain_key='apertum'
        AND o.nft_contract=v_contract AND o.nft_id=v_candidate.nft_id
        AND o.owned_from_block<=v_candidate.claim_block
        AND (o.owned_to_block IS NULL OR o.owned_to_block>=v_candidate.claim_block))<>1 OR
     EXISTS(SELECT 1 FROM public.project_transaction_asset_flows f
      WHERE f.user_id=p_user AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum'
        AND f.tx_hash=v_candidate.tx_hash) THEN
   RAISE EXCEPTION 'Historical owner interval or duplicate flow at index %',v_index;
  END IF;
  v_raw:=(v_proof->>'amountRaw')::numeric;
  v_amount:=public.wallettracking_dao_raw_decimal(v_proof->>'amountRaw',18);
  IF abs(v_amount-v_claim.reward_aptm)>0.000000000001 OR
     abs(v_amount-v_claim.reward_asset_amount)>0.000000000001 OR
     abs(v_amount-v_tx.claim_reward_aptm)>0.000000000001 THEN
   RAISE EXCEPTION 'Original native payout amount differs at index %',v_index;
  END IF;
  INSERT INTO public.project_transaction_asset_flows
   (user_id,project_key,chain_key,wallet_id,flow_key,tx_hash,block_number,tx_timestamp,
    log_index,token_address,token_symbol,token_name,token_decimals,amount_raw,amount,
    counterparty_address,direction,price_usd,value_usd,price_source)
  VALUES(p_user,'dao1','apertum',v_wallet,'claim-native:'||v_candidate.tx_hash,v_candidate.tx_hash,
    v_candidate.claim_block,v_tx.tx_timestamp,-1,'native','APTM','Apertum',18,
    v_proof->>'amountRaw',v_amount,v_minter,'eingang',
    v_claim.reward_usd/v_amount,v_claim.reward_usd,v_claim.reward_asset_price_source);
  UPDATE public.dao_reward_claim_candidates c SET
    status='ownership_verified',payout_status='verified',
    payout_reason='verified-native-minter-trace-event-existing-889',
    payout_checked_at=clock_timestamp(),payout_token_address='native',
    payout_token_decimals=18,payout_flow_count=1,payout_amount_raw=v_proof->>'amountRaw',
    canonical_existing_verified=true,claim_pipeline_status='completed',
    claim_pipeline_reason='canonical-existing-historical-native-flow-889',
    claim_pipeline_checked_at=clock_timestamp()
  WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1'
    AND c.chain_key='apertum' AND c.tx_hash=v_candidate.tx_hash;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 OR
     (SELECT count(*) FROM public.project_transaction_asset_flows f
      WHERE f.user_id=p_user AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum'
        AND f.tx_hash=v_candidate.tx_hash AND f.amount_raw=v_proof->>'amountRaw'
        AND f.value_usd=v_claim.reward_usd AND f.log_index=-1)<>1 THEN
   RAISE EXCEPTION 'Historical flow postcondition failed at index %',v_index;
  END IF;
  v_results:=v_results||jsonb_build_array(jsonb_build_object('txHash',v_candidate.tx_hash,
     'claimBlock',v_candidate.claim_block,'nftId',v_candidate.nft_id,
     'amountRaw',v_proof->>'amountRaw','status','flow_committed'));
  v_index:=v_index+1;
 END LOOP;
 RETURN jsonb_build_object('status','completed','flowsCreated',v_index,'claimsCreated',0,'results',v_results);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_commit_historical_existing_flows_889(uuid,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_commit_historical_existing_flows_889(uuid,uuid,jsonb)
 TO service_role;
COMMIT;
