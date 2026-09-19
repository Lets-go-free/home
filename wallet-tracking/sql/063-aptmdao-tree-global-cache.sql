-- WalletTracking Phase 5.36 · APTMDAO neuer DID-Tree Global-Cache
-- Migration 063 · nach 056/057 ausführen.
-- Öffentliche, on-chain verifizierte APTMDAO child→parent Fakten.
begin;

create table if not exists public.aptmdao_tree_graph_cache (
  child_id bigint primary key,
  parent_id bigint not null,
  wallet_address text,
  mint_block bigint not null default 0,
  mint_tx_hash text,
  log_index integer not null default 0,
  verified_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint aptmdao_tree_ids_nonnegative check (child_id > 0 and parent_id >= 0),
  constraint aptmdao_tree_block_nonnegative check (mint_block >= 0)
);
create index if not exists aptmdao_tree_parent_idx on public.aptmdao_tree_graph_cache(parent_id);
create index if not exists aptmdao_tree_block_idx on public.aptmdao_tree_graph_cache(mint_block);

create table if not exists public.aptmdao_tree_graph_state (
  chain_key text not null default 'apertum',
  contract_address text not null,
  last_verified_block bigint not null default 0,
  edge_count bigint not null default 0,
  verified_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chain_key,contract_address),
  constraint aptmdao_tree_state_nonnegative check (last_verified_block >= 0 and edge_count >= 0)
);

alter table public.aptmdao_tree_graph_cache enable row level security;
alter table public.aptmdao_tree_graph_state enable row level security;

drop policy if exists aptmdao_tree_select on public.aptmdao_tree_graph_cache;
create policy aptmdao_tree_select on public.aptmdao_tree_graph_cache for select to authenticated using (true);
drop policy if exists aptmdao_tree_insert on public.aptmdao_tree_graph_cache;
create policy aptmdao_tree_insert on public.aptmdao_tree_graph_cache for insert to authenticated with check (created_by=auth.uid() and updated_by=auth.uid());
drop policy if exists aptmdao_tree_update on public.aptmdao_tree_graph_cache;
create policy aptmdao_tree_update on public.aptmdao_tree_graph_cache for update to authenticated using (true) with check (updated_by=auth.uid());

drop policy if exists aptmdao_tree_state_select on public.aptmdao_tree_graph_state;
create policy aptmdao_tree_state_select on public.aptmdao_tree_graph_state for select to authenticated using (true);
drop policy if exists aptmdao_tree_state_insert on public.aptmdao_tree_graph_state;
create policy aptmdao_tree_state_insert on public.aptmdao_tree_graph_state for insert to authenticated with check (updated_by=auth.uid());
drop policy if exists aptmdao_tree_state_update on public.aptmdao_tree_graph_state;
create policy aptmdao_tree_state_update on public.aptmdao_tree_graph_state for update to authenticated using (true) with check (updated_by=auth.uid());

create or replace function public.wt_sync_aptmdao_tree_data_version()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.cache_data_versions(namespace,cache_key,data_version,payload_schema_version,row_count,sync_cursor,updated_at,updated_by)
  values ('dao1','aptmdao-tree',new.last_verified_block,1,new.edge_count,new.updated_at,now(),new.updated_by)
  on conflict(namespace,cache_key) do update set
    data_version=excluded.data_version,row_count=excluded.row_count,sync_cursor=excluded.sync_cursor,
    updated_at=excluded.updated_at,updated_by=excluded.updated_by;
  return new;
end; $$;

drop trigger if exists wt_aptmdao_tree_data_version on public.aptmdao_tree_graph_state;
create trigger wt_aptmdao_tree_data_version after insert or update of last_verified_block,edge_count,updated_at
on public.aptmdao_tree_graph_state for each row execute function public.wt_sync_aptmdao_tree_data_version();

commit;
