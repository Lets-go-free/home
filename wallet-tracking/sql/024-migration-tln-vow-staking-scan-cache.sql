-- WalletTracking · TLN/VOW Staking technical chain cache
-- Created 2026-09-02
-- Purpose: persistent, incremental cache for expensive wallet-level chain discovery data.
-- This is intentionally separate from public.discovery_cache, whose 30-day cooldown
-- belongs to the user-facing token discovery feature.

begin;

create table if not exists public.tln_vow_staking_scan_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null default 'tln_vow',
  chain_key text not null,
  wallet_address text not null,
  cache_key text not null,
  scanner_version text not null,
  complete_from_block bigint not null default 0,
  last_scanned_block bigint not null default 0,
  payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tln_vow_staking_scan_cache_pkey
    primary key (user_id, chain_key, wallet_address, cache_key),
  constraint tln_vow_staking_scan_cache_wallet_lowercase
    check (wallet_address = lower(wallet_address))
);

create index if not exists idx_tln_vow_staking_scan_cache_wallet
  on public.tln_vow_staking_scan_cache (user_id, chain_key, wallet_address);

alter table public.tln_vow_staking_scan_cache enable row level security;

drop policy if exists "staking_scan_cache_select_own" on public.tln_vow_staking_scan_cache;
create policy "staking_scan_cache_select_own"
  on public.tln_vow_staking_scan_cache
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "staking_scan_cache_insert_own" on public.tln_vow_staking_scan_cache;
create policy "staking_scan_cache_insert_own"
  on public.tln_vow_staking_scan_cache
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "staking_scan_cache_update_own" on public.tln_vow_staking_scan_cache;
create policy "staking_scan_cache_update_own"
  on public.tln_vow_staking_scan_cache
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "staking_scan_cache_delete_own" on public.tln_vow_staking_scan_cache;
create policy "staking_scan_cache_delete_own"
  on public.tln_vow_staking_scan_cache
  for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.tln_vow_staking_scan_cache is
  'Technical TLN/VOW staking chain cache. No cooldown: historical coverage is reused and only the chain tip is refreshed with overlap.';

commit;
