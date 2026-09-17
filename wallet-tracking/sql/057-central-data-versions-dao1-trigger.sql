-- WalletTracking · zentrale DATA_VERSIONS · DAO1-Tree Writer-Anbindung
-- Migration 057 · nach 056 ausführen.
-- Ziel: Browser prüfen nur die kleine Registry. Die Registry wird automatisch aktualisiert,
-- sobald der zentrale DAO1-Tree-State nach einem erfolgreichen Scan geschrieben wird.
begin;

create or replace function public.wt_sync_dao1_old_tree_data_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cache_data_versions(
    namespace, cache_key, data_version, payload_schema_version,
    row_count, sync_cursor, updated_at, updated_by
  ) values (
    'dao1', 'legacy-tree', new.last_verified_block, 1,
    new.edge_count, new.updated_at, now(), new.updated_by
  )
  on conflict(namespace,cache_key) do update set
    data_version = excluded.data_version,
    row_count = excluded.row_count,
    sync_cursor = excluded.sync_cursor,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
  return new;
end;
$$;

drop trigger if exists wt_dao1_old_tree_data_version on public.dao1_old_tree_graph_state;
create trigger wt_dao1_old_tree_data_version
after insert or update of last_verified_block, edge_count, updated_at
on public.dao1_old_tree_graph_state
for each row execute function public.wt_sync_dao1_old_tree_data_version();

-- Bestehenden Stand einmalig in die Registry übernehmen.
-- updated_by ist UUID; deshalb keine Aggregation mit max(uuid).
-- Eine konsistente State-Zeile wird als Ganzes übernommen.
insert into public.cache_data_versions(
  namespace, cache_key, data_version, payload_schema_version,
  row_count, sync_cursor, updated_at, updated_by
)
select
  'dao1',
  'legacy-tree',
  coalesce(s.last_verified_block, 0),
  1,
  coalesce(s.edge_count, 0),
  s.updated_at,
  now(),
  s.updated_by
from public.dao1_old_tree_graph_state s
order by s.last_verified_block desc nulls last, s.updated_at desc nulls last
limit 1
on conflict(namespace,cache_key) do update set
  data_version = excluded.data_version,
  row_count = excluded.row_count,
  sync_cursor = excluded.sync_cursor,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by;

commit;
