-- WalletTracking 7.83. Service-only canonical reconciliation of ALREADY EXISTING DAO claims.
-- The global historical price pipeline is the only source of valuation. This
-- function consumes its persisted flow values, NEVER estimates a token price.
-- No new claim rows, no NFT assignment, no legacy claim_reward_* modification.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reconcile_verified_claims(
    p_user uuid, p_wallet uuid, p_limit integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE v_row record; v_updated integer := 0; v_count integer;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Service role required';
    END IF;
    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
        RAISE EXCEPTION 'Invalid limit';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
        RAISE EXCEPTION 'Wallet ownership mismatch';
    END IF;
    -- A payout alone is not proof of ownership. Only candidates with a proven
    -- historical NFT and a matching existing canonical claim qualify.
    -- Exact raw amounts, token addresses, prices and all contributing flows
    -- must agree. Ambiguities are intentionally left for manual review.
    FOR v_row IN
        SELECT c.tx_hash, c.nft_contract, c.nft_id,
               c.payout_token_address AS token_address,
               c.payout_token_decimals AS decimals,
               sum(f.amount_raw::numeric) AS raw_sum,
               sum(f.value_usd) AS total_usd,
               min(f.price_usd) AS price_min,
               max(f.price_usd) AS price_max,
               min(f.price_source) AS price_source,
               count(*) AS flow_count
        FROM public.dao_reward_claim_candidates c
        JOIN public.project_transactions t
          ON t.user_id=c.user_id AND t.wallet_id=c.wallet_id
         AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=c.tx_hash
        JOIN public.project_nft_claims n
          ON n.user_id=c.user_id AND n.wallet_id=c.wallet_id
         AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=c.tx_hash
         AND n.nft_id=c.nft_id
         AND lower(n.nft_contract)=lower(c.nft_contract)
        JOIN public.project_transaction_asset_flows f
          ON f.user_id=c.user_id AND f.wallet_id=c.wallet_id
         AND f.project_key='dao1' AND f.chain_key='apertum'
         AND f.tx_hash=c.tx_hash
         AND lower(f.token_address)=lower(c.payout_token_address)
         AND f.token_decimals=c.payout_token_decimals
         AND f.direction='eingang'
         AND (
              (f.token_address='native' AND f.flow_key='claim-native:'||c.tx_hash)
              OR (f.token_address<>'native' AND lower(f.counterparty_address)=lower(t.to_address))
         )
        WHERE c.user_id=p_user AND c.wallet_id=p_wallet
          AND c.project_key='dao1' AND c.chain_key='apertum'
          AND c.status='ownership_verified' AND c.payout_status='verified'
          AND c.payout_amount_raw ~ '^[0-9]+$'
          AND c.payout_token_decimals BETWEEN 0 AND 36
          AND t.selector IN ('0x86bb8f37','0x19da4078')
          AND lower(t.status) IN ('ok','success')
          AND f.amount_raw ~ '^[0-9]+$'
          AND f.price_usd > 0 AND f.value_usd IS NOT NULL
          AND f.price_source IS NOT NULL AND length(f.price_source)>0
          AND n.price_is_manual=false
          AND n.reward_asset_address IS NULL AND n.reward_asset_amount IS NULL
          AND n.reward_asset_usd IS NULL AND n.reward_asset_price_source IS NULL
        GROUP BY c.tx_hash,c.nft_contract,c.nft_id,c.payout_token_address,
                 c.payout_token_decimals,c.payout_amount_raw,c.payout_flow_count
        HAVING sum(f.amount_raw::numeric)=c.payout_amount_raw::numeric
           AND count(*)=c.payout_flow_count
           AND count(DISTINCT f.flow_key)=count(*)
           AND min(f.price_usd)=max(f.price_usd)
           AND min(f.price_source)=max(f.price_source)
           AND sum(f.value_usd)>0
        ORDER BY c.tx_hash LIMIT p_limit
    LOOP
        UPDATE public.project_nft_claims n
        SET reward_asset_address=v_row.token_address,
            reward_asset_decimals=v_row.decimals,
            reward_asset_amount=v_row.raw_sum / power(10::numeric,v_row.decimals),
            reward_asset_usd=v_row.total_usd,
            reward_asset_price_source=v_row.price_source,
            updated_at=now()
        WHERE n.user_id=p_user AND n.wallet_id=p_wallet
          AND n.project_key='dao1' AND n.chain_key='apertum'
          AND n.tx_hash=v_row.tx_hash
          AND n.nft_id=v_row.nft_id
          AND lower(n.nft_contract)=lower(v_row.nft_contract)
          AND n.price_is_manual=false
          AND n.reward_asset_address IS NULL AND n.reward_asset_amount IS NULL
          AND n.reward_asset_usd IS NULL AND n.reward_asset_price_source IS NULL;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_updated := v_updated + v_count;
    END LOOP;
    RETURN v_updated;
END
$fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_reconcile_verified_claims(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reconcile_verified_claims(uuid,uuid,integer) TO service_role;
COMMIT;
