-- Wallet Tracking · Phase 2aa
-- Historische Bestandesaufnahme: Alchemy nur als Archive-Fallback.
-- EINMAL in Supabase ausführen.

update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://eth-mainnet.g.alchemy.com/v2' where evm_chain_id=1;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://bnb-mainnet.g.alchemy.com/v2' where evm_chain_id=56;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://polygon-mainnet.g.alchemy.com/v2' where evm_chain_id=137;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://arb-mainnet.g.alchemy.com/v2' where evm_chain_id=42161;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://base-mainnet.g.alchemy.com/v2' where evm_chain_id=8453;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://avax-mainnet.g.alchemy.com/v2' where evm_chain_id=43114;
update public.chains set archive_rpc_provider='alchemy', archive_rpc_url='https://solana-mainnet.g.alchemy.com/v2' where wallet_type='sol';
