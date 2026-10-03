-- Phase 7.14 · 03.10.2026
-- Polygon PoS: offizielle Stablecoin-Stammdaten vervollständigen.
-- Ziel: technische Decimals, echtes Symbol und Name stehen in predefined_tokens vollständig zur Verfügung.
-- Native Circle USDC: 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359 (6 Decimals)
-- Polygon USDT:       0xc2132d05d31c914a87c6611c10748aeb04b58e8f (6 Decimals)
-- Interner Chain-Key wird NICHT umbenannt; Polygon wird über EVM Chain-ID 137 ermittelt.

DO $$
DECLARE
  c_polygon text;
BEGIN
  SELECT chain_key INTO c_polygon
  FROM public.chains
  WHERE enabled = true AND evm_chain_id = 137
  ORDER BY sort_order NULLS LAST, chain_key
  LIMIT 1;

  IF c_polygon IS NULL THEN
    RAISE NOTICE 'Migration 083: Polygon PoS (EVM Chain-ID 137) nicht aktiv konfiguriert; keine Änderung.';
    RETURN;
  END IF;

  UPDATE public.predefined_tokens
     SET label='USDC', symbol='USDC', name='USD Coin', decimals=6,
         coingecko_id='usd-coin', enabled=true
   WHERE chain=c_polygon
     AND lower(address)=lower('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359');
  IF NOT FOUND THEN
    INSERT INTO public.predefined_tokens
      (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
    VALUES
      (c_polygon,'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359','USDC','USDC','USD Coin',6,'usd-coin',true);
  END IF;

  UPDATE public.predefined_tokens
     SET label='USDT', symbol='USDT', name='Tether USD', decimals=6,
         coingecko_id='tether', enabled=true
   WHERE chain=c_polygon
     AND lower(address)=lower('0xc2132d05d31c914a87c6611c10748aeb04b58e8f');
  IF NOT FOUND THEN
    INSERT INTO public.predefined_tokens
      (chain,address,label,symbol,name,decimals,coingecko_id,enabled)
    VALUES
      (c_polygon,'0xc2132d05d31c914a87c6611c10748aeb04b58e8f','USDT','USDT','Tether USD',6,'tether',true);
  END IF;
END $$;
