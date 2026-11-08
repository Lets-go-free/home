-- WalletTracking 8.04: positive native payout evidence independently of USD pricing.
-- Function definitions only. No data backfill, no jobs and no canonical writes.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_check_pending_native_payouts(
 p_user uuid,p_wallet uuid,p_limit integer DEFAULT 4
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE
 c public.dao_reward_claim_candidates%ROWTYPE;
 t public.project_transactions%ROWTYPE;
 f public.project_transaction_asset_flows%ROWTYPE;
 tx_count integer; flow_count integer; incoming_count integer;
 checked integer:=0; verified integer:=0; review integer:=0; remaining integer;
 reason text; outcome text; coverage jsonb; applied boolean; results jsonb:='[]'::jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_user IS NULL OR p_wallet IS NULL OR p_limit IS NULL OR p_limit<1 OR p_limit>4 THEN
  RAISE EXCEPTION 'Invalid bounded payout check';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
  RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 -- Retry-safe bounded native evidence pass. Never revisit verified, negative,
 -- canonical-existing or review states here. Review needs an explicit later path.
 FOR c IN SELECT * FROM public.dao_reward_claim_candidates d
  WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1'
   AND d.chain_key='apertum' AND d.payout_status='pending'
   AND d.canonical_existing_verified IS DISTINCT FROM true
  ORDER BY d.claim_block,d.tx_hash LIMIT p_limit FOR UPDATE OF d
 LOOP
  outcome:='needs_review';reason:='transaction-not-unique';
  coverage:=jsonb_build_object('source','persisted-native-claim-v1','complete',false,
   'tx_hash',c.tx_hash,'block_number',c.claim_block,
   'canonical_amount_matched',false,'usd_required',false);
  SELECT count(*) INTO tx_count FROM public.project_transactions x
   WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
    AND x.chain_key='apertum' AND x.tx_hash=c.tx_hash;
  IF tx_count=1 THEN
   SELECT * INTO t FROM public.project_transactions x
    WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
     AND x.chain_key='apertum' AND x.tx_hash=c.tx_hash FOR SHARE;
   IF t.block_number IS DISTINCT FROM c.claim_block
      OR lower(COALESCE(t.selector,'')) NOT IN ('0x86bb8f37','0x19da4078')
      OR lower(COALESCE(t.status,'')) NOT IN ('ok','success')
      OR lower(COALESCE(t.to_address,'')) !~ '^0x[0-9a-f]{40}$'
      OR (lower(t.selector)='0x19da4078' AND lower(t.to_address)<>'0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d') THEN
    reason:='claim-context-mismatch';
   ELSIF t.claim_reward_aptm IS NULL OR t.claim_reward_aptm<=0
      OR t.claim_reward_aptm::text IN ('NaN','Infinity','-Infinity') THEN
    reason:='positive-native-amount-required';
   ELSE
    SELECT count(*) INTO flow_count FROM public.project_transaction_asset_flows x
     WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
      AND x.chain_key='apertum' AND x.tx_hash=c.tx_hash
      AND x.flow_key=concat('claim-native:',c.tx_hash);
    -- Do not hide a second incoming asset, malformed flow or unknown direction.
    SELECT count(*) INTO incoming_count FROM public.project_transaction_asset_flows x
     WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
      AND x.chain_key='apertum' AND x.tx_hash=c.tx_hash
      AND (x.direction IS NULL OR x.direction NOT IN ('eingang','ausgang','intern','sonst')
       OR (x.direction IN ('eingang','intern') AND CASE
         WHEN x.amount_raw ~ '^[0-9]+$' AND length(x.amount_raw)<=100
          THEN x.amount_raw::numeric>0 ELSE true END));
    IF flow_count<>1 THEN reason:='native-payout-not-unique';
    ELSIF incoming_count<>1 THEN reason:='ambiguous-incoming-assets';
    ELSE
     SELECT * INTO f FROM public.project_transaction_asset_flows x
      WHERE x.user_id=p_user AND x.wallet_id=p_wallet AND x.project_key='dao1'
       AND x.chain_key='apertum' AND x.tx_hash=c.tx_hash
       AND x.flow_key=concat('claim-native:',c.tx_hash) FOR SHARE;
     IF f.direction IS DISTINCT FROM 'eingang' OR f.token_address IS DISTINCT FROM 'native'
        OR f.token_decimals IS DISTINCT FROM 18 OR f.block_number IS DISTINCT FROM c.claim_block
        OR f.amount_raw IS NULL OR f.amount_raw !~ '^[0-9]+$' OR length(f.amount_raw)>100 THEN
      reason:='invalid-native-payout-evidence';
     ELSIF f.amount_raw::numeric<=0 THEN reason:='nonpositive-native-payout';
     -- Same 1e-15 APTM tolerance as 8.00, expressed as exactly 1000 wei.
     -- Multiply the canonical decimal instead of dividing raw units: PostgreSQL
     -- numeric division can otherwise round a 1001-wei mismatch to the boundary.
     ELSIF abs(f.amount_raw::numeric - t.claim_reward_aptm::numeric * 1000000000000000000::numeric) > 1000::numeric THEN
      reason:='native-amount-mismatch';
     ELSE
      outcome:='verified';reason:='persisted-native-matches-canonical-amount';
      coverage:=coverage||jsonb_build_object('canonical_amount_matched',true,
       'positive_flow_verified',true,'flow_count',1,'token_address','native','token_decimals',18);
     END IF;
    END IF;
   END IF;
  END IF;
  -- Reuse 8.02 history, CAS and verified-row protection. Only candidate payout
  -- fields are written. Prices, audit_classification, ownership and canonical
  -- existing flags remain exactly as they were, even before the first anchor.
  applied:=public.wallettracking_dao_record_payout_check(
   p_user,p_wallet,c.tx_hash,c.payout_checked_at,outcome,reason,coverage,
   CASE WHEN outcome='verified' THEN 'native' END,
   CASE WHEN outcome='verified' THEN f.amount_raw END,
   CASE WHEN outcome='verified' THEN 18 END,
   CASE WHEN outcome='verified' THEN 1 END);
  IF NOT applied THEN RAISE EXCEPTION 'Concurrent candidate payout change'; END IF;
  checked:=checked+1;
  IF outcome='verified' THEN verified:=verified+1;ELSE review:=review+1;END IF;
  results:=results||jsonb_build_array(jsonb_build_object(
   'txHash',c.tx_hash,'claimBlock',c.claim_block,'payout_status',outcome,'reason',reason,
   'token',CASE WHEN outcome='verified' THEN 'native' END,
   'amountRaw',CASE WHEN outcome='verified' THEN f.amount_raw END,
   'tokenDecimals',CASE WHEN outcome='verified' THEN 18 END,
   'auditClassification',c.audit_classification));
 END LOOP;
 SELECT count(*) INTO remaining FROM public.dao_reward_claim_candidates d
  WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1'
   AND d.chain_key='apertum' AND d.payout_status='pending'
   AND d.canonical_existing_verified IS DISTINCT FROM true;
 RETURN jsonb_build_object('checked',checked,'verifiedPayoutClaims',verified,
  'payoutsNeedingReview',review,'pendingPayoutChecks',remaining,'results',results);
END $function$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_check_pending_native_payouts(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_check_pending_native_payouts(uuid,uuid,integer) TO service_role;
COMMIT;
