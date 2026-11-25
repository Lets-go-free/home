-- WalletTracking 10.02: guarded DAO assigned-miner finalizer and terminal review state.
-- DDL/function definitions only; no historic reward/queue mutations or cron changes.
BEGIN;
ALTER TABLE public.wallet_reward_refresh_attempts DROP CONSTRAINT IF EXISTS wallet_reward_refresh_attempts_state_check;
ALTER TABLE public.wallet_reward_refresh_attempts ADD CONSTRAINT wallet_reward_refresh_attempts_state_check
 CHECK (state IN ('pending','running','partial','staged','reward_running','failed','completed','blocked'));
CREATE OR REPLACE FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(
 p_user uuid,p_wallet uuid,p_tx text,p_verified_token text,p_verified_decimals integer,p_fixed_price numeric,p_include_erc20 boolean,p_metadata_source text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE c public.dao_reward_claim_candidates%ROWTYPE;t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 metadata_available boolean:=true;
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
  IF NOT FOUND THEN metadata_available:=false;END IF;
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
 ELSIF NOT metadata_available THEN reason:='central-technical-decimals-unavailable';
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
     -- 8.49: historical miner assignment ONLY with complete independently
     -- persisted NFT chain proof. Payout and exact price are checked below.
     OR (t.selector='0x19da4078'
       AND lower(t.to_address)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
       AND c.status='ownership_verified' AND c.proof_reason='prior-transfer-recipient'
       AND c.payout_status='verified'
       AND c.payout_token_address='native' AND c.payout_token_decimals=18
       AND c.payout_flow_count=1
       AND c.nft_contract ~* '^0x[0-9a-f]{40}$'
       AND lower(c.nft_contract)='0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d'
       AND c.nft_id BETWEEN 0 AND 9223372036854775807
       AND t.from_address ~* '^0x[0-9a-f]{40}$'
       AND (SELECT count(*) FROM public.project_nft_ownership o
         WHERE o.user_id=p_user AND o.wallet_id=p_wallet AND o.project_key='dao1'
           AND o.chain_key='apertum' AND lower(o.nft_contract)=lower(c.nft_contract)
           -- 8.51: ownership table links an encrypted wallet by UUID. Its optional
           -- wallet_address must NOT be required or reconstructed in plaintext;
           -- the exact historical last NFT transfer below independently checks
           -- the on-chain owner against the transaction sender.
           AND o.nft_id=c.nft_id AND o.owned_from_block<=c.claim_block
           AND (o.owned_to_block IS NULL OR o.owned_to_block>=c.claim_block)
           )=1
       AND EXISTS (
         SELECT 1 FROM public.apertum_nft_history_coverage h
         WHERE h.chain_key='apertum' AND lower(h.nft_contract)=lower(c.nft_contract)
           AND h.nft_id=c.nft_id AND h.is_complete=true
           AND h.transfer_count=(SELECT count(*) FROM public.apertum_nft_transfer_cache tr
             WHERE tr.chain_key='apertum' AND lower(tr.nft_contract)=lower(c.nft_contract)
               AND tr.nft_id=c.nft_id)
           AND NOT EXISTS (SELECT 1 FROM public.apertum_nft_transfer_cache tr
             WHERE tr.chain_key='apertum' AND lower(tr.nft_contract)=lower(c.nft_contract)
               AND tr.nft_id=c.nft_id AND tr.block_number=c.claim_block)
           AND (SELECT count(*) FROM public.apertum_nft_transfer_cache tr
             WHERE tr.chain_key='apertum' AND lower(tr.nft_contract)=lower(c.nft_contract)
               AND tr.nft_id=c.nft_id AND tr.block_number=(SELECT max(p.block_number)
                 FROM public.apertum_nft_transfer_cache p WHERE p.chain_key='apertum'
                   AND lower(p.nft_contract)=lower(c.nft_contract) AND p.nft_id=c.nft_id
                   AND p.block_number<c.claim_block))=1
           AND lower((SELECT tr.to_address FROM public.apertum_nft_transfer_cache tr
             WHERE tr.chain_key='apertum' AND lower(tr.nft_contract)=lower(c.nft_contract)
               AND tr.nft_id=c.nft_id AND tr.block_number<c.claim_block
             ORDER BY tr.block_number DESC,tr.log_index DESC LIMIT 1))=lower(t.from_address)
       )
     )
    ),false) THEN reason:=CASE WHEN t.selector='0x19da4078' AND c.status='ownership_verified'
       AND c.nft_id IS NOT NULL THEN 'assigned-miner-history-proof-open' ELSE 'ownership-or-bot-assignment-open' END;
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
        CASE WHEN t.selector='0x86bb8f37' OR (t.selector='0x19da4078' AND c.status='ownership_verified') THEN c.nft_contract END,
        CASE WHEN t.selector='0x86bb8f37' OR (t.selector='0x19da4078' AND c.status='ownership_verified') THEN c.nft_id END,
        CASE WHEN t.selector='0x86bb8f37' OR (t.selector='0x19da4078' AND c.status='ownership_verified') THEN 'NFT #'||c.nft_id::text ELSE 'Nicht zugeordnet' END,
        CASE WHEN t.selector='0x19da4078' THEN 'Mining-Bot' END,
        p_tx,t.block_number,t.tx_timestamp,CASE WHEN is_native THEN amount_exact END,COALESCE(t.gas_aptm,0),
        CASE WHEN is_native THEN amount_exact-COALESCE(t.gas_aptm,0) ELSE 0 END,
        asset,asset_symbol,c.payout_token_decimals,amount_exact,total_usd,price_source,now())
       ON CONFLICT(user_id,project_key,chain_key,tx_hash) DO NOTHING RETURNING id INTO new_id;
       IF new_id IS NOT NULL THEN
        -- 8.52: update only the newly inserted canonical claim's companion row.
        UPDATE public.project_transactions q SET
          claim_nft_id=CASE WHEN c.nft_id IS NOT NULL THEN c.nft_id ELSE q.claim_nft_id END,
          claim_nft_name=CASE WHEN c.nft_id IS NOT NULL THEN 'NFT #'||c.nft_id::text ELSE q.claim_nft_name END,
          claim_nft_subtype=CASE WHEN t.selector='0x19da4078' THEN 'Mining-Bot' ELSE q.claim_nft_subtype END,
          claim_reward_aptm=CASE WHEN is_native THEN amount_exact ELSE q.claim_reward_aptm END,
          claim_reward_usd=total_usd,updated_at=now()
        WHERE q.user_id=p_user AND q.wallet_id=p_wallet AND q.project_key='dao1'
          AND q.chain_key='apertum' AND q.tx_hash=p_tx
          AND q.claim_nft_id IS NULL AND COALESCE(q.claim_reward_aptm,0)=0
          AND COALESCE(q.claim_reward_usd,0)=0;
        IF NOT FOUND THEN RAISE EXCEPTION '10.02 companion transaction update failed; rollback claim'; END IF;
        UPDATE public.project_nft_claims n SET reward_usd=total_usd,updated_at=now()
        WHERE n.id=new_id AND n.user_id=p_user AND n.wallet_id=p_wallet
          AND n.reward_usd IS NULL AND n.reward_asset_usd=total_usd;
        IF NOT FOUND THEN RAISE EXCEPTION '10.02 canonical reward_usd update failed; rollback claim'; END IF;
        created_count:=1;reason:=CASE WHEN is_native THEN 'native-claim-created' ELSE 'erc20-claim-created' END;
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
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1' AND d.chain_key='apertum' AND d.tx_hash=p_tx;
 RETURN jsonb_build_object('status',pipeline_state,'reason',reason,'txHash',p_tx,
  'claimsCreated',created_count,'exactAnchorPricedFlows',priced_count,'stableQuotedFlows',stable_quoted,'reusedPricedFlows',priced_reused);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(uuid,uuid,text,text,integer,numeric,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_finalize_single_claim_with_metadata(uuid,uuid,text,text,integer,numeric,boolean,text) TO service_role;

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

CREATE OR REPLACE FUNCTION public.wallettracking_dao_reward_finish_staged_v3(
 p_day date,p_user uuid,p_wallet uuid,p_lease uuid,p_state text,p_error text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role only'; END IF;
 IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Zurich')::date THEN RAISE EXCEPTION 'Invalid day'; END IF;
 IF p_state NOT IN ('staged','completed','failed','blocked') THEN RAISE EXCEPTION 'Invalid reward transition'; END IF;
 UPDATE public.wallet_reward_refresh_attempts
 SET state=p_state,lease_until=NULL,lease_token=NULL,
     last_error=CASE WHEN p_state IN ('failed','blocked') THEN left(coalesce(p_error,'Unknown reward error'),2000) ELSE NULL END,
     failure_count=failure_count+CASE WHEN p_state='failed' THEN 1 ELSE 0 END,updated_at=now()
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='dao1' AND scan_day=p_day
  AND state='reward_running' AND lease_token=p_lease AND lease_until>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'DAO reward lease expired or owned by another worker'; END IF;
END $fn$;


REVOKE ALL ON FUNCTION public.wallettracking_dao_reward_finish_staged_v3(date,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reward_finish_staged_v3(date,uuid,uuid,uuid,text,text) TO service_role;
COMMIT;
