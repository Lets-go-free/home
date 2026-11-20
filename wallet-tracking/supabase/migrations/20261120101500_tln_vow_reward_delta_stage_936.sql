-- Phase 9.36: separate, immutable evidence staging. NOT a reward/claim table.
-- No job or cron is installed. Historical ranges prior to the anchor are unverified.
create table if not exists public.tln_vow_reward_delta_stage (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check (chain_key='bsc'),
  from_block bigint not null check (from_block>=0),
  to_block bigint not null check (to_block>=from_block),
  registry_contracts jsonb not null check (jsonb_typeof(registry_contracts)='array'),
  transfer_events jsonb not null check (jsonb_typeof(transfer_events)='array'),
  pagination_complete boolean not null check (pagination_complete=true),
  historical_completeness_verified boolean not null default false check (historical_completeness_verified=false),
  reward_classification_verified boolean not null default false check (reward_classification_verified=false),
  created_at timestamptz not null default now(),
  primary key(user_id,wallet_id,chain_key,from_block,to_block)
);
alter table public.tln_vow_reward_delta_stage enable row level security;
revoke all on public.tln_vow_reward_delta_stage from public,anon,authenticated;
grant select,insert on public.tln_vow_reward_delta_stage to service_role;
