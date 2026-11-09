-- WalletTracking 8.11: strict historical NFT claim association (shared browser/worker).
-- Only attaches NFT identity to existing canonical rows; no reward or price writes.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_dao_reconcile_nft_claims(
 p_user uuid, p_wallet uuid, p_limit integer DEFAULT 200
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_tx integer := 0; v_claim integer := 0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role'
    AND (auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS DISTINCT FROM p_user) THEN
   RAISE EXCEPTION 'Access denied';
 END IF;
 IF p_limit IS NULL OR p_limit < 1 OR p_limit > 200 THEN RAISE EXCEPTION 'Invalid limit'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id=p_wallet AND w.user_id=p_user) THEN
   RAISE EXCEPTION 'Wallet ownership mismatch';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||':'||p_wallet::text,811));
 -- Materialize exact evidence for consistent claim/transaction updates within this transaction.
 CREATE TEMP TABLE pg_temp.wt811_nft_verified (
   tx_hash text PRIMARY KEY, nft_contract text NOT NULL, nft_id bigint NOT NULL,
   nft_name text, nft_subtype text
 ) ON COMMIT DROP;
 TRUNCATE pg_temp.wt811_nft_verified;
 INSERT INTO pg_temp.wt811_nft_verified (tx_hash,nft_contract,nft_id,nft_name,nft_subtype)
 SELECT matched.tx_hash, matched.nft_contract,matched.nft_id,matched.nft_name,
        CASE WHEN matched.selector='0x19da4078' THEN 'Mining-Bot' ELSE NULL END
 FROM (
  SELECT c.tx_hash, c.nft_contract, c.nft_id::bigint, t.selector,
         MIN(o.nft_name) AS nft_name, COUNT(*) AS owner_matches
  FROM public.dao_reward_claim_candidates c
  JOIN public.project_transactions t
    ON t.user_id=c.user_id AND t.wallet_id=c.wallet_id
   AND t.project_key=c.project_key AND t.chain_key=c.chain_key
   AND lower(t.tx_hash)=lower(c.tx_hash)
  JOIN public.project_nft_ownership o
    ON o.user_id=c.user_id AND o.wallet_id=c.wallet_id
   AND o.project_key=c.project_key AND o.chain_key=c.chain_key
   AND lower(o.nft_contract)=lower(c.nft_contract) AND o.nft_id=c.nft_id
   AND o.owned_from_block <= c.claim_block
   AND (o.owned_to_block IS NULL OR o.owned_to_block >= c.claim_block)
  JOIN public.apertum_nft_history_coverage h
    ON h.chain_key='apertum' AND lower(h.nft_contract)=lower(c.nft_contract)
   AND h.nft_id=c.nft_id AND h.is_complete=true
  WHERE c.user_id=p_user AND c.wallet_id=p_wallet
    AND c.project_key='dao1' AND c.chain_key='apertum'
    AND t.claim_nft_id IS NULL
    AND t.selector IN ('0x86bb8f37','0x19da4078')
    AND lower(t.status) IN ('ok','success')
    AND t.block_number=c.claim_block AND c.claim_block > 0
    AND c.nft_id IS NOT NULL AND c.nft_id BETWEEN 0 AND 9223372036854775807
    AND c.nft_contract ~* '^0x[0-9a-f]{40}$'
    AND t.from_address ~* '^0x[0-9a-f]{40}$'
    -- Claim must have a positive canonical reward, but never revalue it.
    AND (coalesce(t.claim_reward_aptm,0)>0 OR EXISTS (
        SELECT 1 FROM public.project_nft_claims x
        WHERE x.user_id=c.user_id AND x.wallet_id=c.wallet_id
          AND x.project_key=c.project_key AND x.chain_key=c.chain_key
          AND lower(x.tx_hash)=lower(c.tx_hash)
          AND coalesce(x.reward_asset_amount,0)>0))
    -- Require a complete persisted history, and verify the owner by the last
    -- transfer before the claim. A same-block NFT transfer is ambiguous.
    AND (SELECT COUNT(*) FROM public.apertum_nft_transfer_cache all_tr
         WHERE all_tr.chain_key='apertum' AND lower(all_tr.nft_contract)=lower(c.nft_contract)
           AND all_tr.nft_id=c.nft_id) = h.transfer_count
    AND NOT EXISTS (
      SELECT 1 FROM public.apertum_nft_transfer_cache same_block
      WHERE same_block.chain_key='apertum'
        AND lower(same_block.nft_contract)=lower(c.nft_contract)
        AND same_block.nft_id=c.nft_id AND same_block.block_number=c.claim_block)
    AND lower((SELECT prev.to_address FROM public.apertum_nft_transfer_cache prev
       WHERE prev.chain_key='apertum' AND lower(prev.nft_contract)=lower(c.nft_contract)
         AND prev.nft_id=c.nft_id AND prev.block_number<c.claim_block
       ORDER BY prev.block_number DESC,prev.log_index DESC LIMIT 1))=lower(t.from_address)
  GROUP BY c.tx_hash,c.nft_contract,c.nft_id,t.selector
  HAVING COUNT(*)=1
  ORDER BY MIN(c.claim_block),c.tx_hash
  LIMIT p_limit
 ) matched;
 -- Only fill blank identity fields. Existing identifiers are immutable here.
 UPDATE public.project_transactions t SET
    claim_nft_id=v.nft_id,
    claim_nft_name=COALESCE(NULLIF(v.nft_name,''),'NFT #'||v.nft_id::text),
    claim_nft_subtype=COALESCE(t.claim_nft_subtype,v.nft_subtype),
    updated_at=now()
 FROM pg_temp.wt811_nft_verified v
 WHERE t.user_id=p_user AND t.wallet_id=p_wallet
   AND t.project_key='dao1' AND t.chain_key='apertum'
   AND lower(t.tx_hash)=lower(v.tx_hash) AND t.claim_nft_id IS NULL;
 GET DIAGNOSTICS v_tx=ROW_COUNT;
 -- Existing canonical claim row only: never INSERT partial claim rows or
 -- touch payout, price, gas, reward, or historical valuation columns.
 UPDATE public.project_nft_claims n SET
    nft_contract=v.nft_contract,nft_id=v.nft_id,
    nft_name=COALESCE(NULLIF(v.nft_name,''),'NFT #'||v.nft_id::text),
    nft_subtype=COALESCE(n.nft_subtype,v.nft_subtype),updated_at=now()
 FROM pg_temp.wt811_nft_verified v
 WHERE n.user_id=p_user AND n.wallet_id=p_wallet
   AND n.project_key='dao1' AND n.chain_key='apertum'
   AND lower(n.tx_hash)=lower(v.tx_hash)
   AND n.nft_id IS NULL AND n.nft_contract IS NULL;
 GET DIAGNOSTICS v_claim=ROW_COUNT;
 RETURN jsonb_build_object('transactionsAssigned',v_tx,'existingClaimsAssigned',v_claim,
  'eligibleEvidence', (SELECT COUNT(*) FROM pg_temp.wt811_nft_verified),
  'notice','NFT identity fields only; amounts, prices, flows, cursors, ownership, and queue unchanged');
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_reconcile_nft_claims(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_reconcile_nft_claims(uuid,uuid,integer) TO authenticated,service_role;
COMMIT;
