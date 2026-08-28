-- Wallet Tracking · Phase 2v
-- Historische native Steuerpreise: CoinGecko-ID dort ergänzen, wo sie in public.chains noch leer ist.
-- EINMAL ausführen. Vorhandene Werte werden NICHT überschrieben.

update public.chains set coingecko_id = 'ethereum'
where coingecko_id is null and evm_chain_id in (1, 42161, 8453);

update public.chains set coingecko_id = 'binancecoin'
where coingecko_id is null and evm_chain_id = 56;

update public.chains set coingecko_id = 'polygon-ecosystem-token'
where coingecko_id is null and evm_chain_id = 137;

update public.chains set coingecko_id = 'avalanche-2'
where coingecko_id is null and evm_chain_id = 43114;

update public.chains set coingecko_id = 'bitcoin'
where coingecko_id is null and wallet_type = 'btc';

update public.chains set coingecko_id = 'ripple'
where coingecko_id is null and wallet_type = 'xrp';

update public.chains set coingecko_id = 'solana'
where coingecko_id is null and wallet_type = 'sol';

-- Apertum/APTM wird bewusst NICHT hier gesetzt:
-- dessen historischer Preis stammt aus aptm_price_history / APTM-USDT-Pool.
