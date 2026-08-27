-- Wallet Tracking · DAO1/Apertum · Phase 1
-- Run once in Supabase SQL Editor.

insert into public.defi_projects (project_key, name, description, sort_order, enabled)
values ('dao1', 'DAO1', 'DAO1 / Apertum – projektspezifische Assets und Mining', 20, true)
on conflict (project_key) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    enabled = excluded.enabled;

-- Native APTM as a project reference. Blank contract means native asset.
insert into public.defi_project_tokens (project_key, chain_key, role, symbol, contract_address, enabled)
select 'dao1', 'apertum', 'native', 'APTM', '', true
where not exists (
  select 1 from public.defi_project_tokens
  where project_key='dao1' and chain_key='apertum' and role='native'
);

-- Historical on-chain APTM/wUSDT pool states. One Sync event can price claims from many wallets.
create table if not exists public.aptm_price_history (
  project_key text not null default 'dao1',
  chain_key text not null default 'apertum',
  pool_address text not null,
  block_number bigint not null,
  log_index integer not null,
  tx_hash text,
  block_timestamp timestamptz,
  reserve_aptm numeric not null,
  reserve_usdt numeric not null,
  aptm_usd numeric not null,
  created_at timestamptz not null default now(),
  primary key (pool_address, block_number, log_index)
);
create index if not exists aptm_price_history_block_idx
  on public.aptm_price_history (pool_address, block_number desc, log_index desc);

-- User-specific DAO1 miner/NFT assignments.
create table if not exists public.project_miners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null default 'dao1',
  chain_key text not null default 'apertum',
  wallet_address text not null,
  nft_contract text,
  nft_id bigint not null,
  label text,
  active_from timestamptz,
  active_to timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, project_key, wallet_address, nft_id)
);
create index if not exists project_miners_user_project_idx
  on public.project_miners (user_id, project_key, enabled);

alter table public.project_miners enable row level security;
alter table public.aptm_price_history enable row level security;

drop policy if exists project_miners_select_own on public.project_miners;
create policy project_miners_select_own on public.project_miners
for select using (auth.uid() = user_id);

drop policy if exists project_miners_insert_own on public.project_miners;
create policy project_miners_insert_own on public.project_miners
for insert with check (auth.uid() = user_id);

drop policy if exists project_miners_update_own on public.project_miners;
create policy project_miners_update_own on public.project_miners
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists project_miners_delete_own on public.project_miners;
create policy project_miners_delete_own on public.project_miners
for delete using (auth.uid() = user_id);

-- Price history is shared and readable by authenticated users.
drop policy if exists aptm_price_history_read on public.aptm_price_history;
create policy aptm_price_history_read on public.aptm_price_history
for select to authenticated using (true);

-- Shared historical prices may only be written by admins, preventing cache poisoning.
drop policy if exists aptm_price_history_admin_insert on public.aptm_price_history;
create policy aptm_price_history_admin_insert on public.aptm_price_history
for insert to authenticated
with check (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));

drop policy if exists aptm_price_history_admin_update on public.aptm_price_history;
create policy aptm_price_history_admin_update on public.aptm_price_history
for update to authenticated
using (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'))
with check (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));
