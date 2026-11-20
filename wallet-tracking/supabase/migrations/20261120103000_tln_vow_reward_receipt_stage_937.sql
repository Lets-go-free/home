-- Phase 9.37: receipt-verified transaction evidence, separate from canonical rewards.
-- No background job, canonical reward mutations or historical completeness claims.
create table if not exists public.tln_vow_reward_receipt_stage (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check(chain_key='bsc'),
  tx_hash text not null check(tx_hash ~ '^0x[0-9a-f]{64}$'),
  block_number bigint not null check(block_number>0),
  evidence jsonb not null check(jsonb_typeof(evidence)='object'),
  reward_classification_verified boolean not null default false check(reward_classification_verified=false),
  created_at timestamptz not null default now(),
  primary key(user_id,wallet_id,chain_key,tx_hash)
);
alter table public.tln_vow_reward_receipt_stage enable row level security;
revoke all on public.tln_vow_reward_receipt_stage from public,anon,authenticated;
grant select,insert on public.tln_vow_reward_receipt_stage to service_role;
