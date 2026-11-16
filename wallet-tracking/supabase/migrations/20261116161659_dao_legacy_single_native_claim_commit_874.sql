-- WalletTracking 8.74: install a service-role-only, fixed-TX atomic commit.
-- Installing this function does NOT create a claim, flow or price anchor.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_commit_legacy_minebot_874(
 p_user uuid, p_wallet uuid, p_tx text, p_amount_raw text,
 p_price numeric, p_proof_block bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 v_wallet constant uuid := '8a3c5dc6-0610-482d-a327-3f3ba03db158';
 v_tx constant text := '0xc27e0aa5e092efefe9f57e8c7d6890bfdd54a974fde2988e6319a653b3eb2363';
 v_contract constant text := '0xa1b761890c36e356f49f9df8d495fcffa76857ad';
 v_wallet_address constant text := '0x39180b13f5bd24432f01535ceb2c069fd2adf937';
 v_pool constant text := '0x38acbfa5108d3c76d6cea4d380182e832a289b57';
 v_amount constant text := '15167495057030400213';
 v_price constant numeric := 1.3088042775902748;
 v_candidate public.dao_reward_claim_candidates%ROWTYPE;
 v_transaction public.project_transactions%ROWTYPE;
 v_final jsonb;
 v_count bigint;
 v_anchor public.aptm_price_anchors%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_wallet IS DISTINCT FROM v_wallet OR p_tx IS DISTINCT FROM v_tx
    OR p_amount_raw IS DISTINCT FROM v_amount OR p_price IS DISTINCT FROM v_price
    OR p_proof_block IS DISTINCT FROM 957942 THEN
   RAISE EXCEPTION 'Fixed legacy single-claim parameters mismatch';
 END IF;
 IF p_user IS NULL OR (SELECT count(*) FROM public.wallets w WHERE w.id=v_wallet AND w.user_id=p_user)<>1 THEN
   RAISE EXCEPTION 'Fixed wallet owner mismatch';
 END IF;
 -- Same advisory lock ordering as the existing native finalizer.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||v_wallet::text,78384));
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||v_wallet::text,78787));

 SELECT c.* INTO STRICT v_candidate FROM public.dao_reward_claim_candidates c
 WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum'
   AND c.tx_hash=v_tx FOR UPDATE;
 IF v_candidate.status IS DISTINCT FROM 'unassigned_legacy'
    OR v_candidate.payout_status IS DISTINCT FROM 'pending'
    OR v_candidate.claim_pipeline_status IS DISTINCT FROM 'pending'
    OR v_candidate.audit_classification IS NOT NULL
    OR v_candidate.canonical_existing_verified IS DISTINCT FROM false
    OR v_candidate.claim_block IS DISTINCT FROM 957942
    OR v_candidate.nft_id IS NOT NULL OR v_candidate.nft_contract IS NOT NULL
    OR v_candidate.payout_amount_raw IS NOT NULL OR v_candidate.payout_token_address IS NOT NULL
    OR v_candidate.payout_flow_count IS NOT NULL THEN
   RAISE EXCEPTION 'Legacy candidate changed or already assigned';
 END IF;
 SELECT t.* INTO STRICT v_transaction FROM public.project_transactions t
 WHERE t.user_id=p_user AND t.wallet_id=v_wallet AND t.project_key='dao1' AND t.chain_key='apertum'
   AND t.tx_hash=v_tx FOR SHARE;
 IF v_transaction.block_number IS DISTINCT FROM 957942 OR v_transaction.tx_timestamp IS NULL
    OR lower(v_transaction.from_address) IS DISTINCT FROM v_wallet_address
    OR lower(v_transaction.to_address) IS DISTINCT FROM '0x2096bd2e860b450498a7c908708757a1eb306416'
    OR lower(v_transaction.selector) IS DISTINCT FROM '0x86bb8f37'
    OR lower(v_transaction.status) NOT IN ('ok','success')
    OR lower(v_transaction.raw_input) IS DISTINCT FROM
       ('0x86bb8f37'||lpad(to_hex(818),64,'0')||lpad(to_hex(50),64,'0'))
    OR COALESCE(v_transaction.value_aptm,0)<>0
    OR COALESCE(v_transaction.claim_reward_aptm,0)<>0
    OR COALESCE(v_transaction.claim_reward_usd,0)<>0
    OR v_transaction.claim_nft_id IS NOT NULL THEN
   RAISE EXCEPTION 'Historical claim transaction changed';
 END IF;
 IF (SELECT count(*) FROM public.project_nft_ownership o
     WHERE o.user_id=p_user AND o.wallet_id=v_wallet AND o.project_key='dao1' AND o.chain_key='apertum'
       AND lower(o.nft_contract)=v_contract AND o.nft_id=818
       AND o.acquisition_verified=true AND o.acquisition_kind='mint_to_own_wallet'
       AND o.is_current=false AND o.owned_from_block=10904 AND o.owned_to_block=11448349)<>1
    OR NOT EXISTS(SELECT 1 FROM public.project_nfts n WHERE n.project_key='dao1' AND n.chain_key='apertum'
      AND lower(n.nft_contract)=v_contract AND n.nft_id=818 AND n.subtype='Mining-Bot')
    OR NOT EXISTS(SELECT 1 FROM public.apertum_nft_history_coverage h WHERE h.chain_key='apertum'
      AND lower(h.nft_contract)=v_contract AND h.nft_id=818 AND h.is_complete=true AND h.transfer_count=2)
    OR (SELECT count(*) FROM public.apertum_nft_transfer_cache tr WHERE tr.chain_key='apertum'
      AND lower(tr.nft_contract)=v_contract AND tr.nft_id=818)<>2
    OR lower((SELECT tr.to_address FROM public.apertum_nft_transfer_cache tr WHERE tr.chain_key='apertum'
      AND lower(tr.nft_contract)=v_contract AND tr.nft_id=818 AND tr.block_number<957942
      ORDER BY tr.block_number DESC,tr.log_index DESC LIMIT 1)) IS DISTINCT FROM v_wallet_address THEN
   RAISE EXCEPTION 'Historical NFT ownership or transfer completeness changed';
 END IF;
 IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.project_key='dao1'
      AND n.chain_key='apertum' AND n.tx_hash=v_tx)
    OR EXISTS(SELECT 1 FROM public.project_transaction_asset_flows f WHERE f.user_id=p_user
      AND f.wallet_id=v_wallet AND f.project_key='dao1' AND f.chain_key='apertum' AND f.tx_hash=v_tx) THEN
   RAISE EXCEPTION 'Existing canonical claim or asset flow';
 END IF;
 -- Live Edge verification MUST have matched Trace/MintEvent and exact-v13
 -- pool-state price independently immediately before this service-only call.
 INSERT INTO public.aptm_price_anchors
  (project_key,chain_key,pool_address,parser_version,target_block,sync_block,log_index,tx_hash,
   aptm_usd,scanned_from_block,scanned_at)
 VALUES ('dao1','apertum',v_pool,1,957942,957942,NULL,NULL,v_price,957942,clock_timestamp())
 ON CONFLICT(pool_address,parser_version,target_block) DO NOTHING;
 SELECT a.* INTO STRICT v_anchor FROM public.aptm_price_anchors a WHERE a.project_key='dao1'
  AND a.chain_key='apertum' AND lower(a.pool_address)=v_pool AND a.parser_version=1 AND a.target_block=957942;
 IF v_anchor.aptm_usd IS DISTINCT FROM v_price OR v_anchor.sync_block IS DISTINCT FROM 957942
    OR v_anchor.scanned_from_block IS DISTINCT FROM 957942 OR v_anchor.tx_hash IS NOT NULL THEN
   RAISE EXCEPTION 'Existing historical price anchor conflicts with exact pool-state proof';
 END IF;
 INSERT INTO public.project_transaction_asset_flows
  (user_id,project_key,chain_key,wallet_id,flow_key,tx_hash,block_number,tx_timestamp,
   log_index,token_address,token_symbol,token_name,token_decimals,amount_raw,amount,
   counterparty_address,direction)
 VALUES (p_user,'dao1','apertum',v_wallet,'claim-native:'||v_tx,v_tx,957942,v_transaction.tx_timestamp,
   NULL,'native','APTM','Apertum',18,v_amount,v_amount::numeric/1000000000000000000::numeric,
   '0x0200000000000000000000000000000000000001','eingang');
 UPDATE public.dao_reward_claim_candidates c SET
  status='ownership_verified',nft_id=818,nft_contract=v_contract,
  payout_status='verified',payout_reason='verified-native-minter-trace-event-874',
  payout_checked_at=clock_timestamp(),payout_token_address='native',
  payout_token_decimals=18,payout_flow_count=1,payout_amount_raw=v_amount
 WHERE c.user_id=p_user AND c.wallet_id=v_wallet AND c.project_key='dao1' AND c.chain_key='apertum' AND c.tx_hash=v_tx;
 GET DIAGNOSTICS v_count = ROW_COUNT;
 IF v_count<>1 THEN RAISE EXCEPTION 'Unexpected candidate staging row count'; END IF;
 v_final:=public.wallettracking_dao_finalize_single_native_claim(p_user,v_wallet,v_tx);
 IF v_final->>'status' IS DISTINCT FROM 'completed' OR (v_final->>'claimsCreated')::int IS DISTINCT FROM 1 THEN
   RAISE EXCEPTION 'Canonical finalizer rejected single claim: %',v_final;
 END IF;
 IF (SELECT count(*) FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.wallet_id=v_wallet
     AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=v_tx
     AND n.nft_id=818 AND lower(n.nft_contract)=v_contract
     AND n.reward_aptm=v_amount::numeric/1000000000000000000::numeric
     AND n.reward_asset_usd IS NOT NULL AND n.reward_asset_usd>0)<>1 THEN
   RAISE EXCEPTION 'Canonical post-condition missing; rollback';
 END IF;
 RETURN jsonb_build_object('status','completed','claimsCreated',1,'txHash',v_tx,
  'nftId',818,'amountRaw',v_amount,'anchorPriceUsd',v_price,
  'canonicalFinalizer',v_final);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_commit_legacy_minebot_874(uuid,uuid,text,text,numeric,bigint)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_commit_legacy_minebot_874(uuid,uuid,text,text,numeric,bigint)
 TO service_role;
COMMIT;
