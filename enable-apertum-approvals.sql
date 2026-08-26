-- Wallet Tracking – Apertum Freigaben aktivieren
-- Apertum ist EVM-kompatibel (Chain-ID 2786).
-- Approval-Historie: Blockscout Explorer; aktuelle allowance(): offizieller Apertum RPC.

update public.chains
set
  approvals_enabled = true,
  approvals_provider = 'blockscout',
  approvals_api_base = 'https://explorer.apertum.io/api/v2',
  rpc_url = 'https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc',
  evm_chain_id = 2786
where chain_key = 'apertum';

select chain_key,label,approvals_enabled,approvals_provider,approvals_api_base,rpc_url,evm_chain_id
from public.chains
where chain_key='apertum';
