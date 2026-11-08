-- WalletTracking 8.05: bounded manual native Claim pipeline; cron stays off.
-- No backfill. Internal candidate progress fields and service-only functions.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
 ADD COLUMN IF NOT EXISTS claim_pipeline_status text NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS claim_pipeline_reason text,
 ADD COLUMN IF NOT EXISTS claim_pipeline_checked_at timestamptz;
ALTER TABLE public.dao_reward_claim_candidates DROP CONSTRAINT IF EXISTS dao_reward_claim_pipeline_status_check;
ALTER TABLE public.dao_reward_claim_candidates ADD CONSTRAINT dao_reward_claim_pipeline_status_check
 CHECK(claim_pipeline_status IN ('pending','blocked','completed'));
CREATE INDEX IF NOT EXISTS dao_reward_claim_pipeline_work_idx
 ON public.dao_reward_claim_candidates(user_id,wallet_id,claim_pipeline_status,claim_pipeline_checked_at,claim_block)
 WHERE canonical_existing_verified IS DISTINCT FROM true AND audit_classification IS NULL;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_apply_exact_target_anchors_scoped(
 p_user uuid, p_wallet uuid, p_limit integer, p_tx text
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_updated integer := 0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role required';
 END IF;
 IF p_tx IS NOT NULL AND p_tx !~ '^0x[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid claim hash'; END IF;
 IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
   RAISE EXCEPTION 'Invalid limit';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets
               WHERE id=p_wallet AND user_id=p_user) THEN
   RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_user::text || ':' || p_wallet::text, 78787));
 WITH eligible AS (
  SELECT f.id, a.aptm_usd AS unit_price,
         CASE WHEN lower(f.token_address)='native'
           THEN 'APTM/wUSDT Pool · Sync Block ' || a.sync_block::text || ' · exact-v13'
           ELSE 'wAPTM/APTM 1:1 · APTM/wUSDT Pool · Sync Block ' || a.sync_block::text || ' · exact-v13'
         END AS source,
         (f.amount_raw::numeric / power(10::numeric,f.token_decimals)) * a.aptm_usd AS usd
  FROM public.project_transaction_asset_flows f
  JOIN public.aptm_price_anchors a
    ON a.project_key='dao1' AND a.chain_key='apertum'
   AND lower(a.pool_address)='0x38acbfa5108d3c76d6cea4d380182e832a289b57'
   AND a.parser_version=1 AND a.target_block=f.block_number
  WHERE f.user_id=p_user AND f.wallet_id=p_wallet
    AND f.project_key='dao1' AND f.chain_key='apertum'
    AND (p_tx IS NULL OR f.tx_hash=p_tx)
    AND f.price_usd IS NULL AND f.value_usd IS NULL
    AND f.amount_raw ~ '^[0-9]+$' AND f.token_decimals BETWEEN 0 AND 36
    AND (
      (lower(f.token_address)='native' AND upper(f.token_symbol)='APTM' AND f.token_decimals=18)
      OR lower(f.token_address)='0x110ac02ba3384bc055c13a87766049a74517beda'
    )
    AND f.block_number >= 88356
    AND a.sync_block IS NOT NULL AND a.sync_block <= f.block_number
    AND a.aptm_usd IS NOT NULL AND a.aptm_usd > 0
    AND a.scanned_from_block >= 0 AND a.scanned_from_block <= a.target_block
  ORDER BY f.block_number,f.id LIMIT p_limit
 ), updated AS (
  UPDATE public.project_transaction_asset_flows f
  SET price_usd=e.unit_price,value_usd=e.usd,price_source=e.source,updated_at=now()
  FROM eligible e WHERE f.id=e.id
    AND f.user_id=p_user AND f.wallet_id=p_wallet
    AND f.price_usd IS NULL AND f.value_usd IS NULL
  RETURNING f.id
 ) SELECT count(*) INTO v_updated FROM updated;
 RETURN v_updated;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors_scoped(uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors_scoped(uuid,uuid,integer,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_apply_exact_target_anchors(
 p_user uuid,p_wallet uuid,p_limit integer DEFAULT 100
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 RETURN public.wallettracking_dao_apply_exact_target_anchors_scoped(p_user,p_wallet,p_limit,NULL);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors(uuid,uuid,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.wallettracking_dao_next_native_claim_candidate(
 p_user uuid,p_wallet uuid,p_retry_blocked boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE c public.dao_reward_claim_candidates%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch';END IF;
 SELECT d.* INTO c FROM public.dao_reward_claim_candidates d
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1' AND d.chain_key='apertum'
  AND d.canonical_existing_verified IS DISTINCT FROM true AND d.audit_classification IS NULL
  AND d.payout_status<>'no_payout_evidence' AND d.claim_pipeline_status<>'completed'
  AND (d.claim_pipeline_status='pending' OR COALESCE(p_retry_blocked,false)
    OR d.claim_pipeline_checked_at IS NULL OR d.claim_pipeline_checked_at<now()-interval '24 hours')
  AND EXISTS(SELECT 1 FROM public.project_transactions t WHERE t.user_id=p_user AND t.wallet_id=p_wallet
   AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=d.tx_hash
   AND lower(t.selector) IN ('0x86bb8f37','0x19da4078') AND COALESCE(t.claim_reward_aptm,0)=0)
  AND NOT EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.wallet_id=p_wallet
   AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=d.tx_hash)
 ORDER BY CASE WHEN d.claim_pipeline_status='pending' THEN 0 ELSE 1 END,
  d.claim_pipeline_checked_at NULLS FIRST,d.claim_block,d.tx_hash LIMIT 1;
 IF NOT FOUND THEN RETURN NULL;END IF;
 RETURN jsonb_build_object('tx_hash',c.tx_hash,'claim_block',c.claim_block,'status',c.status,
  'nft_contract',c.nft_contract,'nft_id',c.nft_id::text,
  'payout_status',c.payout_status,'payout_checked_at',c.payout_checked_at);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.wallettracking_dao_finalize_single_native_claim(
 p_user uuid,p_wallet uuid,p_tx text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE c public.dao_reward_claim_candidates%ROWTYPE;t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 reason text; pipeline_state text:='blocked';created_count integer:=0;priced_count integer:=0;
 flow_count integer;incoming_count integer;tx_count integer;amount_exact numeric;new_id bigint;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF p_tx IS NULL OR p_tx !~ '^0x[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid claim hash';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch';END IF;
 -- Same wallet lock as the existing canonical 7.83/7.84/7.85 Claim creators.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78384));
 -- Acquire the shared price-engine lock BEFORE locking a flow row to keep
 -- lock ordering compatible with the existing wallet-wide anchor operation.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,78787));
 SELECT * INTO c FROM public.dao_reward_claim_candidates d WHERE d.user_id=p_user AND d.wallet_id=p_wallet
  AND d.project_key='dao1' AND d.chain_key='apertum' AND d.tx_hash=p_tx FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('status','skipped','reason','candidate-not-found','claimsCreated',0);END IF;
 IF c.canonical_existing_verified OR c.audit_classification IS NOT NULL THEN
  RETURN jsonb_build_object('status','skipped','reason','historical-reference-protected','claimsCreated',0);
 END IF;
 IF c.claim_pipeline_status='completed' THEN
  RETURN jsonb_build_object('status','completed','reason','already-completed','claimsCreated',0);
 END IF;
 IF EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.project_key='dao1'
  AND n.chain_key='apertum' AND n.tx_hash=p_tx) THEN
  reason:='canonical-claim-already-present';pipeline_state:='completed';
 ELSE
  SELECT count(*) INTO tx_count FROM public.project_transactions x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
   AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx;
  IF tx_count<>1 THEN reason:='transaction-not-unique';
  ELSE
   SELECT * INTO t FROM public.project_transactions x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
    AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx FOR SHARE;
   IF t.block_number IS DISTINCT FROM c.claim_block OR lower(COALESCE(t.status,'')) NOT IN ('ok','success')
    OR t.tx_timestamp IS NULL OR lower(COALESCE(t.to_address,'')) !~ '^0x[0-9a-f]{40}$'
    OR lower(COALESCE(t.selector,'')) NOT IN ('0x86bb8f37','0x19da4078') THEN reason:='invalid-claim-context';
   ELSIF COALESCE(t.claim_reward_aptm,0)<>0 THEN reason:='existing-transaction-reward-protected';
   ELSIF NOT COALESCE((
     (t.selector='0x86bb8f37' AND c.status='ownership_verified'
       AND c.nft_contract ~ '^0x[0-9a-f]{40}$' AND c.nft_id BETWEEN 0 AND 9223372036854775807)
     OR (t.selector='0x19da4078' AND lower(t.to_address)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
       AND c.status='unassigned_miner' AND c.nft_contract IS NULL AND c.nft_id IS NULL)
    ),false) THEN reason:='ownership-or-bot-assignment-open';
   ELSIF c.payout_status<>'verified' THEN reason:=CASE WHEN c.payout_status='no_payout_evidence' THEN 'no-payout-evidence' ELSE 'payout-evidence-open' END;
   ELSIF c.payout_token_address IS DISTINCT FROM 'native' OR c.payout_token_decimals IS DISTINCT FROM 18
    OR c.payout_flow_count IS DISTINCT FROM 1 OR c.payout_amount_raw IS NULL
    OR c.payout_amount_raw !~ '^[0-9]+$' OR length(c.payout_amount_raw)>100 THEN reason:='native-only-pipeline';
   ELSE
    SELECT count(*) INTO flow_count FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
     AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx AND x.flow_key='claim-native:'||p_tx;
    SELECT count(*) INTO incoming_count FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
     AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx
     AND (x.direction IS NULL OR x.direction NOT IN ('eingang','ausgang','intern','sonst') OR (x.direction IN ('eingang','intern') AND CASE
      WHEN x.amount_raw ~ '^[0-9]+$' AND length(x.amount_raw)<=100 THEN x.amount_raw::numeric>0 ELSE true END));
    IF flow_count<>1 OR incoming_count<>1 THEN reason:='ambiguous-native-flows';
    ELSE
     SELECT * INTO f FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
      AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx AND x.flow_key='claim-native:'||p_tx FOR UPDATE;
     IF f.block_number IS DISTINCT FROM c.claim_block OR f.direction IS DISTINCT FROM 'eingang'
      OR f.token_address IS DISTINCT FROM 'native' OR f.token_decimals IS DISTINCT FROM 18
      OR f.amount_raw IS NULL OR f.amount_raw !~ '^[0-9]+$' OR length(f.amount_raw)>100
      OR f.amount_raw IS DISTINCT FROM c.payout_amount_raw THEN reason:='payout-flow-mismatch';
     ELSIF f.amount_raw::numeric<=0 THEN reason:='payout-flow-mismatch';
     ELSE
      -- Shared existing exact-v13 engine, constrained to THIS transaction.
      -- Missing anchors remain missing. No adjacent block or guessed quote.
      priced_count:=public.wallettracking_dao_apply_exact_target_anchors_scoped(p_user,p_wallet,1,p_tx);
      SELECT * INTO f FROM public.project_transaction_asset_flows x WHERE x.id=f.id;
      IF f.price_usd IS NULL OR f.value_usd IS NULL THEN
       reason:=CASE WHEN c.claim_block<88356 THEN 'before-exact-anchor-window' ELSE 'canonical-price-missing' END;
      ELSIF f.price_usd<=0 OR f.value_usd<=0 OR f.price_usd::text IN ('NaN','Infinity','-Infinity')
       OR f.value_usd::text IN ('NaN','Infinity','-Infinity') OR COALESCE(f.price_source,'')='' THEN reason:='canonical-price-incomplete';
      ELSE
       amount_exact:=f.amount_raw::numeric * 0.000000000000000001::numeric;
       INSERT INTO public.project_nft_claims(
        user_id,project_key,chain_key,wallet_id,nft_contract,nft_id,nft_name,nft_subtype,
        tx_hash,block_number,tx_timestamp,reward_aptm,gas_aptm,net_aptm,
        reward_asset_address,reward_asset_symbol,reward_asset_decimals,reward_asset_amount,
        reward_asset_usd,reward_asset_price_source,updated_at
       ) VALUES(p_user,'dao1','apertum',p_wallet,
        CASE WHEN t.selector='0x86bb8f37' THEN c.nft_contract END,
        CASE WHEN t.selector='0x86bb8f37' THEN c.nft_id END,
        CASE WHEN t.selector='0x86bb8f37' THEN 'NFT #'||c.nft_id::text ELSE 'Nicht zugeordnet' END,
        CASE WHEN t.selector='0x19da4078' THEN 'Mining-Bot' END,
        p_tx,t.block_number,t.tx_timestamp,amount_exact,COALESCE(t.gas_aptm,0),amount_exact-COALESCE(t.gas_aptm,0),
        'native','APTM',18,amount_exact,f.value_usd,f.price_source,now())
       ON CONFLICT(user_id,project_key,chain_key,tx_hash) DO NOTHING RETURNING id INTO new_id;
       IF new_id IS NOT NULL THEN created_count:=1;reason:='native-claim-created';ELSE reason:='canonical-claim-already-present';END IF;
       pipeline_state:='completed';
      END IF;
     END IF;
    END IF;
   END IF;
  END IF;
 END IF;
 UPDATE public.dao_reward_claim_candidates d SET claim_pipeline_status=pipeline_state,
  claim_pipeline_reason=reason,claim_pipeline_checked_at=clock_timestamp()
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.chain_key='apertum' AND d.tx_hash=p_tx;
 RETURN jsonb_build_object('status',pipeline_state,'reason',reason,'txHash',p_tx,
  'claimsCreated',created_count,'exactAnchorPricedFlows',priced_count);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_finalize_single_native_claim(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_finalize_single_native_claim(uuid,uuid,text) TO service_role;
COMMIT;
