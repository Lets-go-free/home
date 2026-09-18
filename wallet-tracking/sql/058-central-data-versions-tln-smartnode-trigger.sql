-- WalletTracking Phase 4.93 · 18.09.2026 11:09:17 CEST · Build 20260918-110917
-- TLN/VOW SmartNode Globalgraph: DB-State ist autoritativ für cache_data_versions.
create or replace function public.wt_sync_tln_smartnode_data_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cache_data_versions
    (namespace, cache_key, data_version, payload_schema_version, row_count, sync_cursor, updated_at, updated_by)
  values
    ('tln-vow', 'smartnode-global-graph', new.last_verified_block, 1, new.edge_count,
     coalesce(new.updated_at, new.verified_at, now()), now(), new.updated_by)
  on conflict (namespace, cache_key) do update set
    data_version = excluded.data_version,
    payload_schema_version = excluded.payload_schema_version,
    row_count = excluded.row_count,
    sync_cursor = excluded.sync_cursor,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
  return new;
end;
$$;

drop trigger if exists wt_sync_tln_smartnode_data_version on public.tln_vow_smartnode_graph_state;
create trigger wt_sync_tln_smartnode_data_version
after insert or update on public.tln_vow_smartnode_graph_state
for each row execute function public.wt_sync_tln_smartnode_data_version();

-- Bestehenden State sofort registrieren, damit der Browser-Gate ohne erneuten On-chain-Lauf starten kann.
insert into public.cache_data_versions
  (namespace, cache_key, data_version, payload_schema_version, row_count, sync_cursor, updated_at, updated_by)
select 'tln-vow', 'smartnode-global-graph', s.last_verified_block, 1, s.edge_count,
       coalesce(s.updated_at, s.verified_at, now()), now(), s.updated_by
from public.tln_vow_smartnode_graph_state s
where s.chain_key='bsc'
order by s.last_verified_block desc nulls last, s.updated_at desc nulls last
limit 1
on conflict (namespace, cache_key) do update set
  data_version=excluded.data_version,
  payload_schema_version=excluded.payload_schema_version,
  row_count=excluded.row_count,
  sync_cursor=excluded.sync_cursor,
  updated_at=excluded.updated_at,
  updated_by=excluded.updated_by;
