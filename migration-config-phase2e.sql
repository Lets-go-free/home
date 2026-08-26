-- Wallet Tracking – Konfigurations-Umbau Phase 2e
-- Balance-/REST-Endpunkte vollständig in public.chains zentralisieren.

alter table public.chains
  add column if not exists balance_api_base text;

-- EVM-Chains via RPC.
update public.chains set balance_provider='evm_rpc', balance_api_base=null
where chain_key in ('eth','bsc','matic','arb','base','avax');

-- Apertum via Blockscout-kompatiblen Explorer.
update public.chains set
  balance_provider='blockscout',
  balance_api_base='https://explorer.apertum.io/api/v2'
where chain_key='apertum';

-- Nicht-EVM native Balance-Provider.
update public.chains set
  balance_provider='blockstream',
  balance_api_base='https://blockstream.info/api'
where chain_key='btc';

update public.chains set
  balance_provider='xrpscan',
  balance_api_base='https://api.xrpscan.com/api/v1'
where chain_key='xrp';

update public.chains set
  balance_provider='solana_rpc',
  balance_api_base='https://solana-rpc.publicnode.com'
where chain_key='sol';

update public.chains set
  balance_provider='trongrid',
  balance_api_base='https://api.trongrid.io'
where chain_key='tron';

update public.chains set
  balance_provider='akash_rest',
  balance_api_base='https://api.akashnet.net'
where chain_key='akash';


-- Auch die bereits unterstützten Nicht-EVM-Gebührenquellen erhalten ihre API-Basis aus der DB.
update public.chains set fee_api_base='https://api.xrpscan.com/api/v1' where chain_key='xrp';
update public.chains set fee_api_base='https://solana-rpc.publicnode.com' where chain_key='sol';
update public.chains set fee_api_base='https://explorer.apertum.io/api/v2' where chain_key='apertum';

select chain_key,label,wallet_type,balance_provider,rpc_url,balance_api_base
from public.chains
order by sort_order;
