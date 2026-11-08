-- Apertum technical metadata, separate from display precision. No cron changes.
BEGIN;
ALTER TABLE public.predefined_tokens
 ADD COLUMN IF NOT EXISTS decimals_source text,
 ADD COLUMN IF NOT EXISTS decimals_checked_at timestamptz,
 ADD COLUMN IF NOT EXISTS decimals_observed integer,
 ADD COLUMN IF NOT EXISTS decimals_status text NOT NULL DEFAULT 'unverified';
CREATE OR REPLACE FUNCTION public.wallettracking_record_apertum_token_decimals(p_token text,p_decimals integer,p_source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE t public.predefined_tokens%ROWTYPE;matches integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF p_token IS NULL OR p_token !~ '^0x[0-9a-f]{40}$' OR p_decimals IS NULL OR p_decimals<0 OR p_decimals>36
  OR p_source IS NULL OR p_source NOT IN ('apertum-explorer-token-metadata','eth_call-decimals-at-claim-block') THEN
  RAISE EXCEPTION 'Invalid technical metadata';END IF;
 SELECT count(*) INTO matches FROM public.predefined_tokens WHERE chain='apertum' AND lower(address)=p_token;
 IF matches<>1 THEN RETURN jsonb_build_object('decimals',NULL,'reason','token-not-uniquely-registered');END IF;
 SELECT * INTO t FROM public.predefined_tokens WHERE chain='apertum' AND lower(address)=p_token FOR UPDATE;
 UPDATE public.predefined_tokens SET
  decimals=CASE WHEN decimals IS NULL AND decimals_status<>'conflict' THEN p_decimals ELSE decimals END,
  decimals_status=CASE WHEN decimals_status='conflict' OR (decimals IS NOT NULL AND decimals<>p_decimals) THEN 'conflict' ELSE 'verified' END,
  decimals_observed=p_decimals,decimals_source=p_source,decimals_checked_at=clock_timestamp()
 WHERE chain=t.chain AND address=t.address RETURNING * INTO t;
 RETURN jsonb_build_object('token',p_token,'decimals',CASE WHEN t.decimals_status='conflict' THEN NULL ELSE t.decimals END,
  'storedDecimals',t.decimals,'observedDecimals',t.decimals_observed,'status',t.decimals_status,
  'source',t.decimals_source,'reason',CASE WHEN t.decimals_status='conflict' THEN 'technical-decimals-conflict' ELSE 'verified' END);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_record_apertum_token_decimals(text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_record_apertum_token_decimals(text,integer,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(
 p_user uuid,p_wallet uuid,p_tx text,p_verified_token text,p_verified_decimals integer,p_fixed_price numeric,p_include_erc20 boolean,p_metadata_source text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE c public.dao_reward_claim_candidates%ROWTYPE;t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 reason text; pipeline_state text:='blocked';created_count integer:=0;priced_count integer:=0;
 flow_count integer;incoming_count integer;tx_count integer;amount_exact numeric;new_id bigint;
 asset text;asset_symbol text;is_native boolean;total_raw numeric;total_usd numeric;price_source text;
 seen_keys text[];asset_evidence jsonb;stable_quoted integer:=0;priced_reused integer:=0;validated_count integer;unit_price numeric;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF p_verified_token IS NOT NULL AND p_verified_token<>'native' THEN
  IF p_metadata_source IS NULL OR p_metadata_source NOT IN ('central-predefined-token-decimals','apertum-explorer-token-metadata','eth_call-decimals-at-claim-block') THEN
   RAISE EXCEPTION 'Missing technical metadata source';END IF;
  PERFORM 1 FROM public.predefined_tokens WHERE chain='apertum' AND lower(address)=p_verified_token
   AND decimals=p_verified_decimals AND decimals_status<>'conflict' FOR SHARE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','blocked','reason','central-technical-decimals-unavailable','claimsCreated',0);END IF;
 END IF;
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
   ELSIF COALESCE(t.claim_reward_aptm,0)<>0 OR COALESCE(t.claim_reward_usd,0)<>0 THEN reason:='existing-transaction-reward-protected';
   ELSIF NOT COALESCE((
     (t.selector='0x86bb8f37' AND c.status='ownership_verified'
       AND lower(c.nft_contract)='0xa1b761890c36e356f49f9df8d495fcffa76857ad' AND c.nft_id BETWEEN 0 AND 9223372036854775807)
     OR (t.selector='0x19da4078' AND lower(t.to_address)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
       AND c.status='unassigned_miner' AND c.nft_contract IS NULL AND c.nft_id IS NULL)
    ),false) THEN reason:='ownership-or-bot-assignment-open';
   ELSIF c.payout_status<>'verified' THEN reason:=CASE WHEN c.payout_status='no_payout_evidence' THEN 'no-payout-evidence' ELSE 'payout-evidence-open' END;
   ELSE
    asset:=lower(COALESCE(c.payout_token_address,''));is_native:=asset='native';
    -- Contract identity guards mirror asset-policy.js. SQL consumes the fixed
    -- quote supplied by that one shared browser/worker policy, not a symbol.
    asset_symbol:=CASE asset WHEN 'native' THEN 'APTM'
     WHEN '0x110ac02ba3384bc055c13a87766049a74517beda' THEN 'wAPTM'
     WHEN '0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f' THEN 'wUSDT'
     WHEN '0xd979f41e12a69aa82f04866444ea91e8e8faefd9' THEN 'wUSDC' END;
    asset_evidence:=jsonb_build_object('token',asset,'block_number',c.claim_block,'technical_decimals_verified',false);
    IF NOT is_native AND NOT COALESCE(p_include_erc20,false) THEN reason:='native-only-pipeline';
    ELSIF asset_symbol IS NULL THEN reason:='unsupported-claim-asset';
    ELSIF c.payout_token_decimals IS NULL OR c.payout_token_decimals NOT BETWEEN 0 AND 36
     OR (is_native AND c.payout_token_decimals<>18) OR c.payout_flow_count IS NULL
     OR c.payout_flow_count NOT BETWEEN 1 AND 100 OR (is_native AND c.payout_flow_count<>1)
     OR c.payout_amount_raw IS NULL OR c.payout_amount_raw !~ '^[0-9]+$' OR length(c.payout_amount_raw)>100 THEN reason:='invalid-payout-metadata';
    ELSIF NOT is_native AND (lower(COALESCE(p_verified_token,''))<>asset
     OR p_verified_decimals IS DISTINCT FROM c.payout_token_decimals) THEN reason:='technical-decimals-unverified';
    ELSIF asset_symbol IN ('wUSDT','wUSDC') AND p_fixed_price IS DISTINCT FROM 1::numeric THEN reason:='stable-quote-unverified';
    ELSE
     asset_evidence:=asset_evidence||jsonb_build_object('technical_decimals_verified',true,
      'decimals',c.payout_token_decimals,'source',CASE WHEN is_native THEN 'native-chain-units' ELSE p_metadata_source END);
     flow_count:=0;total_raw:=0;seen_keys:=ARRAY[]::text[];
     -- Lock and validate ALL incoming / internal positive-or-malformed flows;
     -- no mixed assets, proxy senders, duplicate events or unknown units hidden.
     FOR f IN SELECT x.* FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
      AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx
      AND (x.direction IS NULL OR x.direction NOT IN ('eingang','ausgang','intern','sonst')
       OR (x.direction IN ('eingang','intern') AND CASE WHEN x.amount_raw ~ '^[0-9]+$' AND length(x.amount_raw)<=100
        THEN x.amount_raw::numeric>0 ELSE true END)) ORDER BY x.id FOR UPDATE
     LOOP
      IF f.direction IS DISTINCT FROM 'eingang' OR lower(f.token_address) IS DISTINCT FROM asset
       OR f.token_decimals IS DISTINCT FROM c.payout_token_decimals OR f.block_number IS DISTINCT FROM c.claim_block
       OR f.amount_raw IS NULL OR f.amount_raw !~ '^[0-9]+$' OR length(f.amount_raw)>100 THEN reason:='payout-flow-mismatch';EXIT;
      END IF;
      IF f.amount_raw::numeric<=0 OR f.flow_key IS NULL OR f.flow_key=ANY(seen_keys) THEN reason:='invalid-payout-flow';EXIT;END IF;
      IF is_native THEN
       IF f.flow_key<>'claim-native:'||p_tx THEN reason:='invalid-native-flow-key';EXIT;END IF;
      ELSE
       IF lower(COALESCE(f.counterparty_address,''))<>lower(t.to_address) OR f.log_index IS NULL OR f.log_index<0
        OR f.flow_key<>concat(p_tx,'|',asset,'|',f.log_index,'|eingang|',f.amount_raw) THEN reason:='erc20-contract-or-event-mismatch';EXIT;END IF;
      END IF;
      flow_count:=flow_count+1;total_raw:=total_raw+f.amount_raw::numeric;seen_keys:=array_append(seen_keys,f.flow_key);
      IF flow_count>100 THEN reason:='payout-flow-budget';EXIT;END IF;
     END LOOP;
     IF reason IS NULL AND (flow_count<>c.payout_flow_count OR total_raw<>c.payout_amount_raw::numeric OR total_raw<=0) THEN reason:='payout-total-mismatch';END IF;
     IF reason IS NULL THEN
      -- Only this TX can receive missing price fields. Existing valuations stay.
      IF asset_symbol IN ('APTM','wAPTM') THEN
       priced_count:=public.wallettracking_dao_apply_exact_target_anchors_scoped(p_user,p_wallet,100,p_tx);
      ELSIF asset_symbol IN ('wUSDT','wUSDC') THEN
       WITH priced AS (UPDATE public.project_transaction_asset_flows x
        SET price_usd=p_fixed_price,value_usd=public.wallettracking_dao_raw_decimal(x.amount_raw,x.token_decimals)*p_fixed_price,
         price_source='Stablecoin-Parität · 1 USD',updated_at=now()
        WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1' AND x.chain_key='apertum'
         AND x.tx_hash=p_tx AND lower(x.token_address)=asset AND x.direction='eingang'
         AND x.id IN (SELECT y.id FROM public.project_transaction_asset_flows y WHERE y.user_id=p_user AND y.wallet_id=p_wallet
          AND y.tx_hash=p_tx AND y.flow_key=ANY(seen_keys)) AND x.price_usd IS NULL AND x.value_usd IS NULL RETURNING x.id)
       SELECT count(*) INTO stable_quoted FROM priced;
      END IF;
      priced_reused:=public.wallettracking_dao_reuse_exact_block_prices_scoped(p_user,p_wallet,100,p_tx);
      total_usd:=0;price_source:=NULL;unit_price:=NULL;validated_count:=0;
      FOR f IN SELECT x.* FROM public.project_transaction_asset_flows x WHERE x.user_id=p_user AND x.wallet_id=p_wallet
       AND x.project_key='dao1' AND x.chain_key='apertum' AND x.tx_hash=p_tx AND x.flow_key=ANY(seen_keys) ORDER BY x.id
      LOOP
       IF f.price_usd IS NULL OR f.value_usd IS NULL THEN
        reason:=CASE WHEN c.claim_block<88356 AND asset_symbol IN ('APTM','wAPTM') THEN 'before-exact-anchor-window' ELSE 'canonical-price-missing' END;EXIT;
       END IF;
       IF f.price_usd<=0 OR f.value_usd<=0 OR f.price_usd::text IN ('NaN','Infinity','-Infinity')
        OR f.value_usd::text IN ('NaN','Infinity','-Infinity') OR COALESCE(f.price_source,'')='' THEN reason:='canonical-price-incomplete';EXIT;END IF;
       IF (price_source IS NOT NULL AND price_source<>f.price_source) OR (unit_price IS NOT NULL AND unit_price<>f.price_usd)
        THEN reason:='conflicting-canonical-price-sources';EXIT;END IF;
       price_source:=f.price_source;unit_price:=f.price_usd;total_usd:=total_usd+f.value_usd;validated_count:=validated_count+1;
      END LOOP;
      IF reason IS NULL AND validated_count<>flow_count THEN reason:='payout-flow-changed';END IF;
      IF reason IS NULL THEN
       amount_exact:=public.wallettracking_dao_raw_decimal(total_raw::text,c.payout_token_decimals);
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
        p_tx,t.block_number,t.tx_timestamp,CASE WHEN is_native THEN amount_exact END,COALESCE(t.gas_aptm,0),
        CASE WHEN is_native THEN amount_exact-COALESCE(t.gas_aptm,0) ELSE 0 END,
        asset,asset_symbol,c.payout_token_decimals,amount_exact,total_usd,price_source,now())
       ON CONFLICT(user_id,project_key,chain_key,tx_hash) DO NOTHING RETURNING id INTO new_id;
       IF new_id IS NOT NULL THEN created_count:=1;reason:=CASE WHEN is_native THEN 'native-claim-created' ELSE 'erc20-claim-created' END;
       ELSE reason:='canonical-claim-already-present';END IF;
       pipeline_state:='completed';
      END IF;
     END IF;
    END IF;
   END IF;
  END IF;
 END IF;
 UPDATE public.dao_reward_claim_candidates d SET claim_pipeline_status=pipeline_state,
  claim_pipeline_reason=reason,claim_pipeline_checked_at=clock_timestamp(),claim_pipeline_asset_evidence=asset_evidence
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.chain_key='apertum' AND d.tx_hash=p_tx;
 RETURN jsonb_build_object('status',pipeline_state,'reason',reason,'txHash',p_tx,
  'claimsCreated',created_count,'exactAnchorPricedFlows',priced_count,'stableQuotedFlows',stable_quoted,'reusedPricedFlows',priced_reused);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(uuid,uuid,text,text,integer,numeric,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(uuid,uuid,text,text,integer,numeric,boolean,text) TO service_role;
-- Backwards-compatible seven-argument entry point shares the same implementation.
CREATE OR REPLACE FUNCTION public.wallettracking_dao_finalize_single_claim(
 p_user uuid,p_wallet uuid,p_tx text,p_verified_token text,p_verified_decimals integer,p_fixed_price numeric,p_include_erc20 boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN RETURN public.wallettracking_dao_finalize_single_claim_with_metadata(p_user,p_wallet,p_tx,p_verified_token,
 p_verified_decimals,p_fixed_price,p_include_erc20,'eth_call-decimals-at-claim-block');END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_finalize_single_claim(uuid,uuid,text,text,integer,numeric,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_finalize_single_claim(uuid,uuid,text,text,integer,numeric,boolean) TO service_role;
COMMIT;
