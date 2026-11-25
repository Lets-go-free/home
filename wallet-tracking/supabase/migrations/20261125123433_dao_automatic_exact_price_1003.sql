-- 10.03: bounded scoped historical price proof, no queue/cron/backfill changes.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates ADD COLUMN IF NOT EXISTS price_auto_attempted_at timestamptz;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reserve_exact_price_target_1003(p_user uuid,p_wallet uuid,p_tx text)
RETURNS TABLE(user_id uuid,wallet_id uuid,tx_hash text,claim_block bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_tx IS NULL OR p_tx !~ '^0x[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid claim hash'; END IF;
 RETURN QUERY
 UPDATE public.dao_reward_claim_candidates c SET price_auto_attempted_at=clock_timestamp()
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet AND c.tx_hash=p_tx
   AND c.project_key='dao1' AND c.chain_key='apertum'
   AND c.claim_pipeline_status='blocked' AND c.claim_pipeline_reason='canonical-price-missing'
   AND c.payout_status='verified' AND c.audit_classification IS NULL
   AND c.canonical_existing_verified IS DISTINCT FROM true AND c.claim_block>=88356
   AND (c.price_auto_attempted_at IS NULL OR c.price_auto_attempted_at<now()-interval '24 hours')
   AND EXISTS (SELECT 1 FROM public.wallets w WHERE w.id=c.wallet_id AND w.user_id=c.user_id)
   AND NOT EXISTS (SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=c.user_id AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=c.tx_hash)
   AND EXISTS (SELECT 1 FROM public.project_transaction_asset_flows f
    WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id AND f.project_key='dao1' AND f.chain_key='apertum'
      AND f.tx_hash=c.tx_hash AND f.block_number=c.claim_block AND f.direction='eingang'
      AND lower(f.token_address)=lower(c.payout_token_address)
      AND lower(f.token_address) IN ('native','0x110ac02ba3384bc055c13a87766049a74517beda')
      AND f.price_usd IS NULL AND f.value_usd IS NULL AND f.amount_raw ~ '^[0-9]+$' AND f.amount_raw<>'0')
 RETURNING c.user_id,c.wallet_id,c.tx_hash::text,c.claim_block;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_reserve_exact_price_target_1003(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reserve_exact_price_target_1003(uuid,uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_next_price_targets_848(p_limit integer DEFAULT 4)
RETURNS TABLE(user_id uuid,wallet_id uuid,tx_hash text,claim_block bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role required';
 END IF;
 IF p_limit IS NULL OR p_limit<1 OR p_limit>4 THEN
   RAISE EXCEPTION 'Invalid global DAO price-target batch size';
 END IF;
 RETURN QUERY
 SELECT c.user_id,c.wallet_id,c.tx_hash::text,c.claim_block
 FROM public.dao_reward_claim_candidates c
 JOIN public.project_transaction_asset_flows f
   ON f.user_id=c.user_id AND f.wallet_id=c.wallet_id
  AND f.project_key='dao1' AND f.chain_key='apertum'
  AND f.tx_hash=c.tx_hash
  AND f.flow_key='claim-native:' || c.tx_hash
  AND f.token_address='native' AND f.direction='eingang'
  AND upper(f.token_symbol)='APTM' AND f.token_decimals=18
  AND f.block_number=c.claim_block
  AND f.amount_raw ~ '^[0-9]+$' AND f.amount_raw <> '0'
  AND f.price_usd IS NULL AND f.value_usd IS NULL
 WHERE c.project_key='dao1' AND c.chain_key='apertum'
   AND c.status IN ('pending','ownership_verified','unassigned_miner') AND c.claim_pipeline_status<>'completed' AND c.payout_status='verified'
   AND c.audit_classification IS NULL AND c.canonical_existing_verified=false
   AND c.claim_block>=88356
   AND EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=c.wallet_id AND w.user_id=c.user_id)
 ORDER BY c.claim_block,c.user_id,c.wallet_id,c.tx_hash
 LIMIT p_limit;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_next_price_targets_848(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_next_price_targets_848(integer) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_next_native_claim_candidate(
 p_user uuid,p_wallet uuid,p_retry_blocked boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_candidate public.dao_reward_claim_candidates%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch'; END IF;

 UPDATE public.dao_reward_claim_candidates c
 SET audit_classification='failed_transaction', audit_classified_at=clock_timestamp()
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet
   AND c.project_key='dao1' AND c.chain_key='apertum'
   AND c.audit_classification IS NULL
   AND c.canonical_existing_verified IS DISTINCT FROM true
   AND c.payout_status = 'pending'
   AND c.claim_pipeline_status IS DISTINCT FROM 'completed'
   AND NOT EXISTS (
    SELECT 1 FROM public.project_nft_claims n
    WHERE n.user_id=c.user_id AND n.project_key=c.project_key
      AND n.chain_key=c.chain_key AND lower(n.tx_hash)=lower(c.tx_hash)
   )
   AND NOT EXISTS (
    SELECT 1 FROM public.project_transaction_asset_flows f
    WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
      AND f.project_key=c.project_key AND f.chain_key=c.chain_key
      AND lower(f.tx_hash)=lower(c.tx_hash) AND f.direction='eingang'
   )
   AND (SELECT count(*) FROM public.project_transactions tt
        WHERE tt.user_id=c.user_id AND tt.wallet_id=c.wallet_id
          AND tt.project_key=c.project_key AND tt.chain_key=c.chain_key
          AND lower(tt.tx_hash)=lower(c.tx_hash))=1
   AND EXISTS (
    SELECT 1 FROM public.project_transactions t
    WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
      AND t.project_key=c.project_key AND t.chain_key=c.chain_key
      AND lower(t.tx_hash)=lower(c.tx_hash)
      AND t.block_number=c.claim_block
      AND lower(coalesce(t.status,''))='error'
      AND coalesce(t.claim_reward_aptm,0)=0
      AND coalesce(t.claim_reward_usd,0)=0
   );

 SELECT d.* INTO v_candidate FROM public.dao_reward_claim_candidates d
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1' AND d.chain_key='apertum'
   AND d.canonical_existing_verified IS DISTINCT FROM true AND d.audit_classification IS NULL
   AND d.payout_status<>'no_payout_evidence' AND d.claim_pipeline_status<>'completed'
   AND (d.claim_pipeline_status='pending' OR COALESCE(p_retry_blocked,false)
     OR (d.claim_pipeline_status='blocked' AND d.claim_pipeline_reason='canonical-price-missing'
       AND d.price_auto_attempted_at IS NULL)
     OR d.claim_pipeline_checked_at IS NULL OR d.claim_pipeline_checked_at<now()-interval '24 hours'
     OR (d.claim_pipeline_status='blocked' AND d.claim_pipeline_reason='ownership-or-bot-assignment-open'
       AND d.status='ownership_verified' AND d.proof_reason='prior-transfer-recipient'
       AND lower(d.nft_contract)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
       AND d.nft_id IS NOT NULL AND d.payout_status='verified' AND d.payout_token_address='native'))
   AND EXISTS(SELECT 1 FROM public.project_transactions t WHERE t.user_id=p_user AND t.wallet_id=p_wallet
     AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=d.tx_hash
     AND lower(coalesce(t.status,'')) IN ('ok','success')
     AND t.block_number=d.claim_block
     AND lower(t.selector) IN ('0x86bb8f37','0x19da4078') AND COALESCE(t.claim_reward_aptm,0)=0 AND COALESCE(t.claim_reward_usd,0)=0)
   AND NOT EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.wallet_id=p_wallet
     AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=d.tx_hash)
 ORDER BY CASE WHEN d.claim_pipeline_status='pending' THEN 0 ELSE 1 END,
   d.claim_pipeline_checked_at NULLS FIRST,d.claim_block,d.tx_hash LIMIT 1;

 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('tx_hash',v_candidate.tx_hash,'claim_block',v_candidate.claim_block,
  'status',v_candidate.status,'nft_contract',v_candidate.nft_contract,
  'nft_id',v_candidate.nft_id::text,'payout_status',v_candidate.payout_status,
  'payout_checked_at',v_candidate.payout_checked_at,'proof_reason',v_candidate.proof_reason);
END $fn$;

REVOKE ALL ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean)
 TO service_role;

COMMIT;
