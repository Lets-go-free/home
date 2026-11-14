-- WalletTracking 8.48: service-role-only selection across all users.
-- READ ONLY. Only payout-verified pending claim candidates with unpriced
-- native APTM asset flows; neither rewards nor wallet ownership are changed.
BEGIN;
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
   AND c.status='pending' AND c.payout_status='verified'
   AND c.audit_classification IS NULL AND c.canonical_existing_verified=false
   AND c.claim_block>=88356
   AND EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=c.wallet_id AND w.user_id=c.user_id)
 ORDER BY c.claim_block,c.user_id,c.wallet_id,c.tx_hash
 LIMIT p_limit;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_next_price_targets_848(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_next_price_targets_848(integer) TO service_role;
COMMIT;
