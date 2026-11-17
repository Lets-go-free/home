-- WalletTracking 8.91: preview/commit guarded reconciliation of 1,690 already-canonical
-- native DAO1 claims. INSTALLATION CREATES ONLY A FUNCTION; NO CLAIMS ARE MODIFIED.
-- Service role or Supabase SQL Editor postgres session; never authenticated browsers.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reconcile_existing_native_891(
 p_commit boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 v_candidate public.dao_reward_claim_candidates%ROWTYPE;
 v_claim public.project_nft_claims%ROWTYPE;
 v_flow public.project_transaction_asset_flows%ROWTYPE;
 v_tx public.project_transactions%ROWTYPE;
 v_claim_count integer;
 v_flow_count integer;
 v_tx_count integer;
 v_row_count integer;
 v_candidates integer:=0;
 v_eligible integer:=0;
 v_missing_flow integer:=0;
 v_preanchor integer:=0;
 v_updated integer:=0;
 v_amount_from_raw numeric;
BEGIN
 IF coalesce(auth.role(),'') IS DISTINCT FROM 'service_role'
    AND session_user IS DISTINCT FROM 'postgres' THEN
  RAISE EXCEPTION 'Service role or PostgreSQL SQL Editor only';
 END IF;
 IF p_commit IS NULL THEN RAISE EXCEPTION 'Commit choice must be boolean'; END IF;
 -- Fixed global target cohort, independent of wallet order; DAO-Cron remains OFF.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('dao-native-existing-reconcile-891',0));
 FOR v_candidate IN
  SELECT c.* FROM public.dao_reward_claim_candidates c
  WHERE c.project_key='dao1' AND c.chain_key='apertum'
    AND c.status='pending' AND c.payout_status='pending'
    AND c.claim_pipeline_status='pending' AND c.audit_classification IS NULL
    AND c.canonical_existing_verified=false
  ORDER BY c.wallet_id,c.claim_block,c.tx_hash FOR UPDATE
 LOOP
  v_candidates:=v_candidates+1;
  SELECT count(*) INTO v_claim_count FROM public.project_nft_claims n
   WHERE n.user_id=v_candidate.user_id AND n.wallet_id=v_candidate.wallet_id
     AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=v_candidate.tx_hash;
  SELECT count(*) INTO v_flow_count FROM public.project_transaction_asset_flows f
   WHERE f.user_id=v_candidate.user_id AND f.wallet_id=v_candidate.wallet_id
     AND f.project_key='dao1' AND f.chain_key='apertum' AND f.tx_hash=v_candidate.tx_hash
     AND f.direction='eingang';
  SELECT count(*) INTO v_tx_count FROM public.project_transactions t
   WHERE t.user_id=v_candidate.user_id AND t.wallet_id=v_candidate.wallet_id
     AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=v_candidate.tx_hash;
  IF v_claim_count<>1 OR v_tx_count<>1 OR v_flow_count>1 THEN
   RAISE EXCEPTION 'Canonical/transaction/flow uniqueness changed at tx %',v_candidate.tx_hash;
  END IF;
  IF v_flow_count=0 THEN
   v_missing_flow:=v_missing_flow+1;
   CONTINUE;
  END IF;
  SELECT * INTO STRICT v_claim FROM public.project_nft_claims n
   WHERE n.user_id=v_candidate.user_id AND n.wallet_id=v_candidate.wallet_id
     AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=v_candidate.tx_hash FOR SHARE;
  SELECT * INTO STRICT v_flow FROM public.project_transaction_asset_flows f
   WHERE f.user_id=v_candidate.user_id AND f.wallet_id=v_candidate.wallet_id
     AND f.project_key='dao1' AND f.chain_key='apertum' AND f.tx_hash=v_candidate.tx_hash
     AND f.direction='eingang' FOR SHARE;
  SELECT * INTO STRICT v_tx FROM public.project_transactions t
   WHERE t.user_id=v_candidate.user_id AND t.wallet_id=v_candidate.wallet_id
     AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=v_candidate.tx_hash FOR SHARE;
  IF lower(v_tx.status) NOT IN ('ok','success') OR v_tx.selector IS DISTINCT FROM '0x86bb8f37'
     OR lower(v_tx.to_address) IS DISTINCT FROM '0x2096bd2e860b450498a7c908708757a1eb306416'
     OR v_tx.block_number IS DISTINCT FROM v_candidate.claim_block
     OR v_claim.nft_id IS DISTINCT FROM v_candidate.nft_id
     OR lower(v_claim.nft_contract) IS DISTINCT FROM lower(v_candidate.nft_contract)
     OR v_claim.reward_aptm IS NULL OR v_claim.reward_aptm<=0
     OR v_flow.token_address IS DISTINCT FROM 'native' OR v_flow.token_decimals IS DISTINCT FROM 18
     OR v_flow.flow_key IS DISTINCT FROM ('claim-native:'||v_candidate.tx_hash)
     OR v_flow.amount_raw IS NULL OR v_flow.amount_raw !~ '^[0-9]{1,78}$'
     OR v_flow.amount IS NULL OR v_flow.amount<=0
     OR abs(v_flow.amount-v_claim.reward_aptm)>0.000000000001
     OR v_flow.value_usd IS DISTINCT FROM v_claim.reward_usd THEN
   RAISE EXCEPTION 'Historical native claim/flow mismatch at tx %',v_candidate.tx_hash;
  END IF;
  v_amount_from_raw:=public.wallettracking_dao_raw_decimal(v_flow.amount_raw,18);
  IF abs(v_amount_from_raw-v_claim.reward_aptm)>0.000000000001 THEN
   RAISE EXCEPTION 'Historical native raw wei mismatch at tx %',v_candidate.tx_hash;
  END IF;
  IF v_claim.reward_usd IS NULL THEN
   IF v_candidate.claim_block>=88356 OR v_flow.value_usd IS NOT NULL THEN
    RAISE EXCEPTION 'Unpriced reward is not a verified preanchor claim at tx %',v_candidate.tx_hash;
   END IF;
   v_preanchor:=v_preanchor+1;
  ELSIF v_claim.reward_usd<=0 THEN
   RAISE EXCEPTION 'Non-positive canonical USD at tx %',v_candidate.tx_hash;
  END IF;
  v_eligible:=v_eligible+1;
 END LOOP;
 IF v_candidates<>1706 OR v_eligible<>1690 OR v_missing_flow<>16 OR v_preanchor<>1 THEN
  RAISE EXCEPTION 'Global fixed reconciliation cohort changed (candidates %, eligible %, missing %, preanchor %)',
   v_candidates,v_eligible,v_missing_flow,v_preanchor;
 END IF;
 IF p_commit THEN
  UPDATE public.dao_reward_claim_candidates c SET
    canonical_existing_verified=true,canonical_existing_checked_at=clock_timestamp()
  WHERE c.project_key='dao1' AND c.chain_key='apertum'
    AND c.status='pending' AND c.payout_status='pending'
    AND c.claim_pipeline_status='pending' AND c.audit_classification IS NULL
    AND c.canonical_existing_verified=false
    AND EXISTS(SELECT 1 FROM public.project_transaction_asset_flows f
      WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id AND f.project_key=c.project_key
        AND f.chain_key=c.chain_key AND f.tx_hash=c.tx_hash AND f.direction='eingang');
  GET DIAGNOSTICS v_updated=ROW_COUNT;
  IF v_updated<>1690 THEN RAISE EXCEPTION 'Atomic mark count mismatch: %',v_updated; END IF;
  SELECT count(*) INTO v_row_count FROM public.dao_reward_claim_candidates c
   WHERE c.project_key='dao1' AND c.chain_key='apertum'
     AND c.status='pending' AND c.payout_status='pending'
     AND c.claim_pipeline_status='pending' AND c.audit_classification IS NULL
     AND c.canonical_existing_verified=false;
  IF v_row_count<>16 THEN RAISE EXCEPTION 'Historical postcondition: expected 16 remaining without flow'; END IF;
 END IF;
 RETURN jsonb_build_object('ok',true,'mode',CASE WHEN p_commit THEN 'commit' ELSE 'preview' END,
  'candidatesChecked',v_candidates,'verifiedExisting',v_eligible,
  'withoutIncomingFlow',v_missing_flow,'unpricedPreanchor',v_preanchor,
  'marked',v_updated,'claimsCreated',0,'flowsCreated',0,
  'note','Only canonical_existing_verified is changed on commit; no rewards, prices, payouts, flow or pipeline state changed.');
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_reconcile_existing_native_891(boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reconcile_existing_native_891(boolean)
 TO service_role;
COMMIT;
