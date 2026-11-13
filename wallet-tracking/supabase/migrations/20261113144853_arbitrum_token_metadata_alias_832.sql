-- WalletTracking Phase 8.32
-- Browser/predefined token key 'arbitrum' maps to registry key 'arb' (EVM 42161).
-- Preserve original token/cache keys; do NOT rename existing chains or predefined tokens.
CREATE OR REPLACE FUNCTION public.wallettracking_metadata_address(p_chain text,p_address text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT CASE
   WHEN p_address='native' OR c.wallet_type='evm' THEN lower(btrim(p_address))
   ELSE btrim(p_address)
 END
 FROM public.chains c
 WHERE c.chain_key=CASE WHEN p_chain='arbitrum' THEN 'arb' ELSE p_chain END;
$fn$;
REVOKE ALL ON FUNCTION public.wallettracking_metadata_address(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_metadata_address(text,text) TO service_role;
