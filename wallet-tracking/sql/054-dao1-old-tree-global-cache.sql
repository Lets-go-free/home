-- WalletTracking · DAO1 alter DID-Tree Global-Cache
-- Migration 054 · öffentliche verifizierte Apertum Chain-Fakten
begin;

create table if not exists public.dao1_old_tree_graph_cache (
  chain_key text not null default 'apertum',
  contract_address text not null,
  child_id bigint not null,
  parent_id bigint not null,
  wallet_address text,
  mint_block bigint not null default 0,
  mint_tx_hash text,
  log_index integer not null default 0,
  source text not null default 'TokenMinted(to, tokenId, fid)',
  verified_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key,contract_address,child_id),
  constraint dao1_old_tree_ids_nonnegative check (child_id > 0 and parent_id >= 0),
  constraint dao1_old_tree_block_nonnegative check (mint_block >= 0)
);
create index if not exists dao1_old_tree_parent_idx on public.dao1_old_tree_graph_cache(chain_key,contract_address,parent_id);
create index if not exists dao1_old_tree_block_idx on public.dao1_old_tree_graph_cache(chain_key,contract_address,mint_block);

create table if not exists public.dao1_old_tree_graph_state (
  chain_key text not null default 'apertum',
  contract_address text not null,
  last_verified_block bigint not null default 0,
  edge_count bigint not null default 0,
  verified_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key,contract_address),
  constraint dao1_old_tree_state_nonnegative check (last_verified_block >= 0 and edge_count >= 0)
);

alter table public.dao1_old_tree_graph_cache enable row level security;
alter table public.dao1_old_tree_graph_state enable row level security;

-- Nur öffentliche Blockchain-Fakten; analog zum TLN SmartNode Global-Cache.
drop policy if exists dao1_old_tree_select on public.dao1_old_tree_graph_cache;
create policy dao1_old_tree_select on public.dao1_old_tree_graph_cache for select to authenticated using (true);
drop policy if exists dao1_old_tree_insert on public.dao1_old_tree_graph_cache;
create policy dao1_old_tree_insert on public.dao1_old_tree_graph_cache for insert to authenticated with check (created_by=auth.uid() and updated_by=auth.uid());
drop policy if exists dao1_old_tree_update on public.dao1_old_tree_graph_cache;
create policy dao1_old_tree_update on public.dao1_old_tree_graph_cache for update to authenticated using (true) with check (updated_by=auth.uid());

drop policy if exists dao1_old_tree_state_select on public.dao1_old_tree_graph_state;
create policy dao1_old_tree_state_select on public.dao1_old_tree_graph_state for select to authenticated using (true);
drop policy if exists dao1_old_tree_state_insert on public.dao1_old_tree_graph_state;
create policy dao1_old_tree_state_insert on public.dao1_old_tree_graph_state for insert to authenticated with check (updated_by=auth.uid());
drop policy if exists dao1_old_tree_state_update on public.dao1_old_tree_graph_state;
create policy dao1_old_tree_state_update on public.dao1_old_tree_graph_state for update to authenticated using (true) with check (updated_by=auth.uid());

comment on table public.dao1_old_tree_graph_cache is 'Globaler alter DAO1 DID child→fid/parent Graph aus verifizierten TokenMinted-Events.';
comment on table public.dao1_old_tree_graph_state is 'Globaler Scan-Fortschritt für inkrementelle DAO1-Tree-Aktualisierung mit 24 Block Overlap.';
commit;

select
  to_regclass('public.dao1_old_tree_graph_cache') is not null as graph_cache_ready,
  to_regclass('public.dao1_old_tree_graph_state') is not null as graph_state_ready;
