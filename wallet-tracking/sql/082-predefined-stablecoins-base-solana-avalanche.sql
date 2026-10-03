-- Phase 7.11 · 03.10.2026
-- Sichere Stablecoin-Stammdaten für bereits konfigurierte Chains.
-- Chain-Keys werden absichtlich NICHT hartcodiert: Base/Avalanche werden über EVM Chain-ID,
-- Solana über wallet_type + Label ermittelt. Dadurch bleibt z.B. ein interner Key "sol" zulässig.
-- Quellen/Identitäten:
--   Circle USDC Base:      0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
--   Circle USDC Avalanche: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
--   Circle USDC Solana:    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
--   Tether USDT Avalanche: 0x9702230A8Ea53601f5cD2dC00fDBc13d4dF4A8c7
--   Tether USDT Solana:    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
-- XRPL-USDC wird bewusst NICHT eingetragen, solange XRPL issued currencies/Trustlines
-- im Wallet-Loader noch nicht unterstützt werden.

DO $$
DECLARE
  c_base text;
  c_avax text;
  c_sol text;
BEGIN
  SELECT chain_key INTO c_base
  FROM public.chains
  WHERE enabled = true AND evm_chain_id = 8453
  ORDER BY sort_order NULLS LAST, chain_key
  LIMIT 1;

  SELECT chain_key INTO c_avax
  FROM public.chains
  WHERE enabled = true AND evm_chain_id = 43114
  ORDER BY sort_order NULLS LAST, chain_key
  LIMIT 1;

  SELECT chain_key INTO c_sol
  FROM public.chains
  WHERE enabled = true
    AND wallet_type = 'sol'
    AND (lower(label) LIKE '%solana%' OR lower(chain_key) IN ('sol','solana'))
  ORDER BY CASE WHEN lower(chain_key) IN ('sol','solana') THEN 0 ELSE 1 END,
           sort_order NULLS LAST, chain_key
  LIMIT 1;

  IF c_base IS NULL THEN
    RAISE NOTICE 'Migration 082: Base (EVM Chain-ID 8453) nicht aktiv konfiguriert; USDC nicht ergänzt.';
  ELSE
    UPDATE public.predefined_tokens
       SET label='USDC', symbol='USDC', name='USD Coin', decimals=6,
           coingecko_id='usd-coin', enabled=true
     WHERE chain=c_base
       AND lower(address)=lower('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    IF NOT FOUND THEN
      INSERT INTO public.predefined_tokens
        (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
      VALUES
        (c_base,'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913','USDC','USDC','USD Coin',6,'usd-coin',true);
    END IF;
  END IF;

  IF c_avax IS NULL THEN
    RAISE NOTICE 'Migration 082: Avalanche (EVM Chain-ID 43114) nicht aktiv konfiguriert; USDC/USDT nicht ergänzt.';
  ELSE
    UPDATE public.predefined_tokens
       SET label='USDC', symbol='USDC', name='USD Coin', decimals=6,
           coingecko_id='usd-coin', enabled=true
     WHERE chain=c_avax
       AND lower(address)=lower('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E');
    IF NOT FOUND THEN
      INSERT INTO public.predefined_tokens
        (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
      VALUES
        (c_avax,'0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e','USDC','USDC','USD Coin',6,'usd-coin',true);
    END IF;

    UPDATE public.predefined_tokens
       SET label='USDT', symbol='USDT', name='Tether USD', decimals=6,
           coingecko_id='tether', enabled=true
     WHERE chain=c_avax
       AND lower(address)=lower('0x9702230A8Ea53601f5cD2dC00fDBc13d4dF4A8c7');
    IF NOT FOUND THEN
      INSERT INTO public.predefined_tokens
        (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
      VALUES
        (c_avax,'0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7','USDT','USDT','Tether USD',6,'tether',true);
    END IF;
  END IF;

  IF c_sol IS NULL THEN
    RAISE NOTICE 'Migration 082: Solana-Chain nicht aktiv konfiguriert; USDC/USDT nicht ergänzt.';
  ELSE
    UPDATE public.predefined_tokens
       SET label='USDC', symbol='USDC', name='USD Coin', decimals=6,
           coingecko_id='usd-coin', enabled=true
     WHERE chain=c_sol
       AND address='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    IF NOT FOUND THEN
      INSERT INTO public.predefined_tokens
        (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
      VALUES
        (c_sol,'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v','USDC','USDC','USD Coin',6,'usd-coin',true);
    END IF;

    UPDATE public.predefined_tokens
       SET label='USDT', symbol='USDT', name='Tether USD', decimals=6,
           coingecko_id='tether', enabled=true
     WHERE chain=c_sol
       AND address='Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    IF NOT FOUND THEN
      INSERT INTO public.predefined_tokens
        (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
      VALUES
        (c_sol,'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB','USDT','USDT','Tether USD',6,'tether',true);
    END IF;
  END IF;
END $$;
