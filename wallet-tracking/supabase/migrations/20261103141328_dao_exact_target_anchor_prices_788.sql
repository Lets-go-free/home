-- WalletTracking 7.88: reuse only the already-persisted canonical exact-v13
-- APTM target-block price anchor. This is NOT a separate price engine.
-- Never use an anchor from a neighbouring block or aptm_price_history predecessor.
-- Native APTM and the contract-verified wrapped APTM token only.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_apply_exact_target_anchors(
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
REVOKE ALL ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_apply_exact_target_anchors(uuid,uuid,integer) TO service_role;
COMMIT;
