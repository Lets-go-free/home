-- Wallet Tracking – Konfigurations-Umbau Phase 2d
-- Provider + API-Basis für Discovery, Freigaben und NFTs zentral in public.chains.

alter table public.chains
  add column if not exists discovery_provider text,
  add column if not exists discovery_api_base text,
  add column if not exists approvals_provider text,
  add column if not exists approvals_api_base text,
  add column if not exists nft_provider text,
  add column if not exists nft_api_base text;

-- EVM: Discovery und Approvals verwenden derzeit weiterhin Alchemy,
-- aber die Chain-spezifischen Endpunkte liegen nun ausschließlich in der DB.
update public.chains set discovery_provider='alchemy', discovery_api_base='https://eth-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://eth-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://eth-mainnet.g.alchemy.com/nft/v3'
where chain_key='eth';

update public.chains set discovery_provider='alchemy', discovery_api_base='https://bnb-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://bnb-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://bnb-mainnet.g.alchemy.com/nft/v3'
where chain_key='bsc';

update public.chains set discovery_provider='alchemy', discovery_api_base='https://polygon-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://polygon-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://polygon-mainnet.g.alchemy.com/nft/v3'
where chain_key='matic';

update public.chains set discovery_provider='alchemy', discovery_api_base='https://arb-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://arb-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://arb-mainnet.g.alchemy.com/nft/v3'
where chain_key='arb';

update public.chains set discovery_provider='alchemy', discovery_api_base='https://base-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://base-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://base-mainnet.g.alchemy.com/nft/v3'
where chain_key='base';

update public.chains set discovery_provider='alchemy', discovery_api_base='https://avax-mainnet.g.alchemy.com/v2',
  approvals_provider='alchemy', approvals_api_base='https://avax-mainnet.g.alchemy.com/v2',
  nft_provider='alchemy', nft_api_base='https://avax-mainnet.g.alchemy.com/nft/v3'
where chain_key='avax';

-- Apertum/Tron Discovery verwendet bereits die beim normalen Wallet-Load geladenen Token.
update public.chains set discovery_provider='wallet_data', discovery_api_base=null
where chain_key in ('apertum','tron');

-- Apertum NFTs über den eigenen Blockscout-kompatiblen Explorer.
update public.chains set
  nft_provider='blockscout',
  nft_api_base='https://explorer.apertum.io/api/v2'
where chain_key='apertum';

-- Nicht aktivierte Fähigkeiten bekommen bewusst keinen Provider.
update public.chains set approvals_provider=null, approvals_api_base=null
where approvals_enabled=false;

update public.chains set nft_provider=null, nft_api_base=null
where nft_enabled=false;

update public.chains set discovery_provider=null, discovery_api_base=null
where discovery_enabled=false;

select chain_key,label,
       discovery_enabled,discovery_provider,discovery_api_base,
       approvals_enabled,approvals_provider,approvals_api_base,
       nft_enabled,nft_provider,nft_api_base
from public.chains
order by sort_order;
