-- WalletTracking 8.70 – strict historical MineBot NFT metadata and ownership.
-- Only 818/819; no claim/reward/price/queue/cron updates.
BEGIN;

DO $migration$
DECLARE
  target_wallet constant uuid := '8a3c5dc6-0610-482d-a327-3f3ba03db158';
  target_contract constant text := '0xa1b761890c36e356f49f9df8d495fcffa76857ad';
  wallet_address constant text := '0x39180b13f5bd24432f01535ceb2c069fd2adf937';
  zero_address constant text := '0x0000000000000000000000000000000000000000';
  wallet_user uuid;
  candidates_count bigint;
  matching_count bigint;
  count_818 bigint;
  count_819 bigint;
  written bigint;
BEGIN
  SELECT w.user_id INTO STRICT wallet_user
  FROM public.wallets w WHERE w.id = target_wallet;
  IF wallet_user IS NULL THEN RAISE EXCEPTION 'Missing wallet owner'; END IF;

  SELECT count(*) INTO candidates_count
  FROM public.dao_reward_claim_candidates c
  WHERE c.wallet_id = target_wallet AND c.user_id = wallet_user
    AND c.project_key = 'dao1' AND c.chain_key = 'apertum'
    AND c.status = 'unassigned_legacy';
  IF candidates_count <> 76 THEN
    RAISE EXCEPTION 'Legacy candidate count changed: %', candidates_count;
  END IF;

  -- Exact function ABI, expected 50 parameter, 76 independent TX keys,
  -- and the two uniquely assigned vault IDs as confirmed read-only.
  SELECT count(*),
    count(*) FILTER (WHERE lower(t.raw_input) =
      '0x86bb8f37' || lpad(to_hex(818),64,'0') || lpad(to_hex(50),64,'0')),
    count(*) FILTER (WHERE lower(t.raw_input) =
      '0x86bb8f37' || lpad(to_hex(819),64,'0') || lpad(to_hex(50),64,'0'))
  INTO matching_count, count_818, count_819
  FROM public.dao_reward_claim_candidates c
  JOIN public.project_transactions t
    ON t.user_id = c.user_id AND t.wallet_id = c.wallet_id
   AND t.project_key = c.project_key AND t.chain_key = c.chain_key
   AND lower(t.tx_hash) = lower(c.tx_hash)
  WHERE c.wallet_id = target_wallet AND c.user_id = wallet_user
    AND c.project_key = 'dao1' AND c.chain_key = 'apertum'
    AND c.status = 'unassigned_legacy'
    AND t.status = 'ok' AND t.block_number = c.claim_block
    AND lower(t.from_address) = wallet_address
    AND lower(t.selector) = '0x86bb8f37';
  IF matching_count <> 76 OR count_818 <> 42 OR count_819 <> 34 THEN
    RAISE EXCEPTION 'Legacy claim guards changed: total %, #818 %, #819 %',
      matching_count, count_818, count_819;
  END IF;

  -- The complete cache must contain exactly two transfers per NFT:
  -- a confirmed mint to this wallet at block 10904, and one later exit.
  IF (SELECT count(*) FROM public.apertum_nft_history_coverage c
      WHERE c.chain_key='apertum' AND lower(c.nft_contract)=target_contract
        AND c.nft_id IN (818,819) AND c.is_complete AND c.transfer_count=2) <> 2
     OR (SELECT count(*) FROM public.apertum_nft_transfer_cache t
      WHERE t.chain_key='apertum' AND lower(t.nft_contract)=target_contract
        AND t.nft_id IN (818,819)) <> 4
     OR (SELECT count(*) FROM public.apertum_nft_transfer_cache t
      WHERE t.chain_key='apertum' AND lower(t.nft_contract)=target_contract
        AND t.nft_id IN (818,819) AND t.block_number=10904
        AND lower(t.from_address)=zero_address
        AND lower(t.to_address)=wallet_address
        AND lower(t.tx_hash)='0x3152e3b031b8df12367c2c9f3bdf1ed8e80dc582392d1d4180f840f694b77ab6') <> 2
     OR (SELECT count(*) FROM public.apertum_nft_transfer_cache t
      WHERE t.chain_key='apertum' AND lower(t.nft_contract)=target_contract
        AND ((t.nft_id=818 AND t.block_number=11448349
              AND lower(t.tx_hash)='0xf202c3e83548b381968cbbec9c24baa1461e29f195a830da4f59d3020d118dd6')
          OR (t.nft_id=819 AND t.block_number=11448526
              AND lower(t.tx_hash)='0xc79bbdc69305149321104e1f82c63d78d879c0256a9a703871283166a9c54bae'))
        AND lower(t.from_address)=wallet_address
        AND lower(t.to_address)='0x1ad197d8f5ac4731d9fb3fe7a8ff0c6a21f84d0c') <> 2
  THEN
    RAISE EXCEPTION 'Historical NFT transfer coverage or transfer chain changed';
  END IF;

  -- No cross-user NFT ownership or pre-existing master data may be overwritten.
  IF EXISTS (SELECT 1 FROM public.project_nft_ownership o
      WHERE o.project_key='dao1' AND o.chain_key='apertum'
        AND lower(o.nft_contract)=target_contract AND o.nft_id IN (818,819))
     OR EXISTS (SELECT 1 FROM public.project_nfts n
      WHERE n.project_key='dao1' AND n.chain_key='apertum'
        AND lower(n.nft_contract)=target_contract AND n.nft_id IN (818,819))
  THEN
    RAISE EXCEPTION 'Legacy MineBot already registered; refusing duplicate or overwrite';
  END IF;

  INSERT INTO public.project_nfts
    (project_key,chain_key,nft_contract,nft_id,nft_name,category,subtype,notes,enabled)
  VALUES
    ('dao1','apertum',target_contract,818,'MineBot','Bot','Mining-Bot',
     'Historical NFT, block 10904 mint; last ownership block 11448349. Verified complete ERC-721 transfer history.',true),
    ('dao1','apertum',target_contract,819,'MineBot','Bot','Mining-Bot',
     'Historical NFT, block 10904 mint; last ownership block 11448526. Verified complete ERC-721 transfer history.',true);
  GET DIAGNOSTICS written = ROW_COUNT;
  IF written <> 2 THEN RAISE EXCEPTION 'Unexpected master NFT insertion count: %',written; END IF;

  INSERT INTO public.project_nft_ownership
    (user_id,wallet_id,project_key,chain_key,nft_contract,nft_id,nft_name,
     wallet_address,owned_from_block,owned_to_block,owned_from_at,owned_to_at,
     is_current,entry_from_address,entry_tx_hash,acquisition_kind,
     acquisition_verified,acquisition_tx_hash)
  SELECT wallet_user,target_wallet,'dao1','apertum',target_contract,v.nft_id,'MineBot',
    NULL,10904,v.exit_block,m.block_timestamp,e.block_timestamp,
    false,zero_address,m.tx_hash,'mint_to_own_wallet',true,m.tx_hash
  FROM (VALUES (818::bigint,11448349::bigint),(819::bigint,11448526::bigint))
    v(nft_id,exit_block)
  JOIN public.apertum_nft_transfer_cache m
    ON m.chain_key='apertum' AND lower(m.nft_contract)=target_contract
   AND m.nft_id=v.nft_id AND m.block_number=10904
  JOIN public.apertum_nft_transfer_cache e
    ON e.chain_key='apertum' AND lower(e.nft_contract)=target_contract
   AND e.nft_id=v.nft_id AND e.block_number=v.exit_block;
  GET DIAGNOSTICS written = ROW_COUNT;
  IF written <> 2 THEN RAISE EXCEPTION 'Unexpected ownership insertion count: %',written; END IF;

  RAISE NOTICE 'Registered 2 historical MineBots, with no canonical claim or price writes';
END;
$migration$;

COMMIT;
