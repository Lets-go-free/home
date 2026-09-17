-- WalletTracking Phase 4.85
-- DAO1 Legacy Tree: globalen Graph-Cache kompakt halten, ohne RLS-Schutz zu schwächen.
-- KORRIGIERTE FASSUNG von 055: created_by/updated_by bleiben erhalten, weil die
-- bestehenden INSERT-/UPDATE-Policies von diesen Audit-Spalten abhängen.
-- Datenzeilen werden NICHT gelöscht. Kein CASCADE.

begin;

-- Sicherheitsprüfung: child_id muss global eindeutig sein.
do $$
begin
  if exists (
    select 1
    from public.dao1_old_tree_graph_cache
    group by child_id
    having count(*) > 1
  ) then
    raise exception 'Abbruch: dao1_old_tree_graph_cache enthält doppelte child_id-Werte.';
  end if;
end $$;

-- Kompakter Primary Key: die Tabelle ist ausschließlich der Legacy-DAO1-DID-Graph.
alter table public.dao1_old_tree_graph_cache
  drop constraint if exists dao1_old_tree_graph_cache_pkey;

alter table public.dao1_old_tree_graph_cache
  add constraint dao1_old_tree_graph_cache_pkey primary key (child_id);

-- chain_key und contract_address waren in jeder Zeile identisch und müssen daher
-- nicht zusätzlich in jedem Indexeintrag stehen.
drop index if exists public.dao1_old_tree_parent_idx;
drop index if exists public.dao1_old_tree_block_idx;

create index dao1_old_tree_parent_idx
  on public.dao1_old_tree_graph_cache (parent_id);

create index dao1_old_tree_block_idx
  on public.dao1_old_tree_graph_cache (mint_block);

-- Nur echte redundante Konstanten entfernen.
-- created_by/updated_by bleiben wegen RLS bestehen.
-- verified_at/created_at/updated_at bleiben für Audit/Freshness bestehen.
alter table public.dao1_old_tree_graph_cache
  drop column if exists chain_key,
  drop column if exists contract_address,
  drop column if exists source;

analyze public.dao1_old_tree_graph_cache;

commit;

-- Kontrolle nach erfolgreicher Migration.
select
  count(*) as rows,
  pg_size_pretty(pg_relation_size('public.dao1_old_tree_graph_cache')) as table_size,
  pg_size_pretty(pg_indexes_size('public.dao1_old_tree_graph_cache')) as indexes_size,
  pg_size_pretty(pg_total_relation_size('public.dao1_old_tree_graph_cache')) as total_size
from public.dao1_old_tree_graph_cache;
