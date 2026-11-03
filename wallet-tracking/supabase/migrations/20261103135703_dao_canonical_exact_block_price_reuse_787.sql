-- WalletTracking 7.87: only reuse previously valued canonical flow prices
-- within the SAME wallet, chain, token contract, token decimals and block.
-- Never derive a new pool price, fall back to an earlier block, use symbols as
-- identities, or alter existing/manual valuations. Idempotent and service-only.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reuse_exact_block_prices(
 p_user uuid, p_wallet uuid, p_limit integer DEFAULT 100
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_updated integer := 0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
   RAISE EXCEPTION 'Service role required';
 END IF;
 IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
   RAISE EXCEPTION 'Invalid limit';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets
               WHERE id=p_wallet AND user_id=p_user) THEN
   RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_user::text || ':' || p_wallet::text, 78787));
 WITH valued AS (
   SELECT f.block_number, lower(f.token_address) AS token, f.token_decimals,
          min(f.price_usd) AS unit_price, min(f.price_source) AS source,
          count(*) AS supports
   FROM public.project_transaction_asset_flows f
   WHERE f.user_id=p_user AND f.wallet_id=p_wallet
     AND f.project_key='dao1' AND f.chain_key='apertum'
     AND f.price_usd>0 AND f.value_usd IS NOT NULL
     AND f.price_source IS NOT NULL
     AND (f.price_source='Stablecoin-Parität · 1 USD'
       OR f.price_source LIKE 'APTM/wUSDT Pool · Sync Block %'
       OR f.price_source LIKE 'wAPTM/APTM 1:1 · APTM/wUSDT Pool · Sync Block %'
       OR f.price_source='Zentrale historische Apertum-Preisengine')
   GROUP BY f.block_number,lower(f.token_address),f.token_decimals
   HAVING min(f.price_usd)=max(f.price_usd)
      AND min(f.price_source)=max(f.price_source)
 ), eligible AS (
   SELECT target.id, valued.unit_price, valued.source,
          (target.amount_raw::numeric / power(10::numeric,target.token_decimals)) * valued.unit_price AS usd
   FROM public.project_transaction_asset_flows target
   JOIN valued ON valued.block_number=target.block_number
       AND valued.token=lower(target.token_address)
       AND valued.token_decimals=target.token_decimals
   WHERE target.user_id=p_user AND target.wallet_id=p_wallet
     AND target.project_key='dao1' AND target.chain_key='apertum'
     AND target.price_usd IS NULL AND target.value_usd IS NULL
     AND target.amount_raw ~ '^[0-9]+$'
     AND target.token_decimals BETWEEN 0 AND 36
   ORDER BY target.block_number,target.id LIMIT p_limit
 ), updated AS (
   UPDATE public.project_transaction_asset_flows f
   SET price_usd=e.unit_price, value_usd=e.usd,
       price_source=e.source, updated_at=now()
   FROM eligible e WHERE f.id=e.id
     AND f.user_id=p_user AND f.wallet_id=p_wallet
     AND f.price_usd IS NULL AND f.value_usd IS NULL
   RETURNING f.id
 ) SELECT count(*) INTO v_updated FROM updated;
 RETURN v_updated;
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_reuse_exact_block_prices(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reuse_exact_block_prices(uuid,uuid,integer) TO service_role;
COMMIT;
