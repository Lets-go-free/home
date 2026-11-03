-- WalletTracking 7.85: create verified NEW MINER payouts with intentionally NULL bot ID.
-- New Miner only; never infer ownership/NFT ID. Requires already valued exact payout flows.
-- Only use prices already stored by the canonical application flow evaluator.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_create_verified_unassigned_miner_claims(
 p_user uuid, p_wallet uuid, p_limit integer DEFAULT 20
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_created integer := 0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role required';
 END IF;
 IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
   RAISE EXCEPTION 'Invalid limit';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
   RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text || ':' || p_wallet::text, 78384));
 WITH verified AS (
   SELECT c.user_id,c.wallet_id,c.tx_hash,c.nft_contract,c.nft_id,
          t.block_number,t.tx_timestamp,t.gas_aptm,t.to_address,
          c.payout_token_address AS token_address,
          c.payout_token_decimals AS decimals,
          min(f.token_symbol) AS token_symbol,
          sum(f.amount_raw::numeric) AS total_raw,
          sum(f.value_usd) AS total_usd,
          min(f.price_usd) AS price_min, max(f.price_usd) AS price_max,
          min(f.price_source) AS source_min,max(f.price_source) AS source_max,
          count(*) AS flow_count
   FROM public.dao_reward_claim_candidates c
   JOIN public.project_transactions t ON t.user_id=c.user_id
     AND t.wallet_id=c.wallet_id AND t.project_key='dao1'
     AND t.chain_key='apertum' AND t.tx_hash=c.tx_hash
   JOIN public.project_transaction_asset_flows f ON f.user_id=c.user_id
     AND f.wallet_id=c.wallet_id AND f.project_key='dao1'
     AND f.chain_key='apertum' AND f.tx_hash=c.tx_hash
     AND lower(f.token_address)=lower(c.payout_token_address)
     AND f.token_decimals=c.payout_token_decimals
     AND f.direction='eingang'
     AND ( (lower(f.token_address)='native' AND f.flow_key='claim-native:'||c.tx_hash)
        OR (lower(f.token_address)<>'native' AND lower(f.counterparty_address)=lower(t.to_address)) )
   WHERE c.user_id=p_user AND c.wallet_id=p_wallet
     AND c.project_key='dao1' AND c.chain_key='apertum'
     AND c.status='unassigned_miner' AND c.payout_status='verified'
     AND c.nft_contract IS NULL AND c.nft_id IS NULL
     AND c.payout_amount_raw ~ '^[0-9]+$'
     AND c.payout_token_decimals BETWEEN 0 AND 36
     AND t.selector='0x19da4078' -- New Miner only; cannot substitute with legacy
     AND lower(t.status) IN ('ok','success')
     AND t.block_number=c.claim_block AND t.tx_timestamp IS NOT NULL
     AND t.to_address IS NOT NULL AND t.to_address ~* '^0x[0-9a-f]{40}$'
     AND f.amount_raw ~ '^[0-9]+$'
     AND f.value_usd IS NOT NULL AND f.value_usd>0
     AND f.price_usd>0 AND f.price_source IS NOT NULL AND length(f.price_source)>0
     AND f.token_symbol IS NOT NULL AND length(f.token_symbol)>0
     AND NOT EXISTS (
       SELECT 1 FROM public.project_nft_claims n
       WHERE n.user_id=c.user_id AND n.project_key='dao1'
         AND n.chain_key='apertum' AND n.tx_hash=c.tx_hash
     )
   GROUP BY c.user_id,c.wallet_id,c.tx_hash,c.nft_contract,c.nft_id,
     t.block_number,t.tx_timestamp,t.gas_aptm,t.to_address,
     c.payout_token_address,c.payout_token_decimals,c.payout_amount_raw,c.payout_flow_count
   HAVING sum(f.amount_raw::numeric)=c.payout_amount_raw::numeric
      AND count(*)=c.payout_flow_count
      AND count(DISTINCT f.flow_key)=count(*)
      AND min(f.price_usd)=max(f.price_usd)
      AND min(f.price_source)=max(f.price_source)
      AND min(f.token_symbol)=max(f.token_symbol)
      AND sum(f.value_usd)>0
   ORDER BY t.block_number,c.tx_hash LIMIT p_limit
 ), inserted AS (
   INSERT INTO public.project_nft_claims (
      user_id,project_key,chain_key,wallet_id,nft_contract,nft_id,nft_name,nft_subtype,
      tx_hash,block_number,tx_timestamp,reward_aptm,gas_aptm,net_aptm,
      reward_asset_address,reward_asset_symbol,reward_asset_decimals,
      reward_asset_amount,reward_asset_usd,reward_asset_price_source,updated_at
   )
   SELECT user_id,'dao1','apertum',wallet_id,NULL::text,NULL::bigint,
      'Nicht zugeordnet','Mining-Bot',tx_hash,block_number,tx_timestamp,
      CASE WHEN lower(token_address)='native' THEN total_raw/power(10::numeric,decimals) ELSE NULL END,
      coalesce(gas_aptm,0),
      CASE WHEN lower(token_address)='native' THEN total_raw/power(10::numeric,decimals)-coalesce(gas_aptm,0) ELSE 0 END,
      token_address,token_symbol,decimals,total_raw/power(10::numeric,decimals),
      total_usd,source_min,now()
   FROM verified
   ON CONFLICT (user_id,project_key,chain_key,tx_hash) DO NOTHING
   RETURNING id
 )
 SELECT count(*) INTO v_created FROM inserted;
 RETURN v_created;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_create_verified_unassigned_miner_claims(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_create_verified_unassigned_miner_claims(uuid,uuid,integer) TO service_role;
COMMIT;
