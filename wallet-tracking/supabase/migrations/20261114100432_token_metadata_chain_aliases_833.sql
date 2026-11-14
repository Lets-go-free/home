-- WalletTracking Phase 8.33: registry-key aliases for technical token metadata.
-- Existing user/predefined token identifiers and metadata history remain unchanged.
-- Verified registry keys: arbitrum->arb, avalanche->avax, polygon->matic, solana->sol.
CREATE OR REPLACE FUNCTION public.wallettracking_metadata_address(p_chain text,p_address text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT CASE
   WHEN p_address='native' OR c.wallet_type='evm' THEN lower(btrim(p_address))
   ELSE btrim(p_address)
 END
 FROM public.chains c
 WHERE c.chain_key = CASE p_chain
   WHEN 'arbitrum' THEN 'arb'
   WHEN 'avalanche' THEN 'avax'
   WHEN 'polygon' THEN 'matic'
   WHEN 'solana' THEN 'sol'
   ELSE p_chain
 END;
$fn$;
REVOKE ALL ON FUNCTION public.wallettracking_metadata_address(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_metadata_address(text,text) TO service_role;
