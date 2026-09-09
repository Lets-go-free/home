-- WalletTracking
-- Migration 026b: Cleanup orphaned private wallet data
-- Stand: 2026-09-09
--
-- Voraussetzung:
--   Migration 026 wurde bereits erfolgreich ausgefuehrt.
--
-- Zweck:
--   Entfernt ausschliesslich userbezogene Cache-/Analysezeilen, die nach
--   Phase 1 keiner aktuell vorhandenen public.wallets.id zugeordnet werden
--   konnten (wallet_id IS NULL).
--
-- Wichtig:
--   - public.wallets wird NICHT veraendert.
--   - Bereits erfolgreich gemappte Zeilen werden NICHT geloescht.
--   - Globale technische Tabellen/Registries/SmartNode-Graphdaten werden
--     NICHT angefasst.
--   - Die geloeschten Daten sind rekonstruierbare Cache-/Discovery-Daten.
--   - Bis Phase 2/3 abgeschlossen ist, koennen neue Scans solche Zeilen
--     wieder erzeugen. Daher bis dahin moeglichst keine unnoetigen Vollscans.

begin;

create temporary table wt_026b_cleanup_counts (
  table_name text primary key,
  rows_before bigint not null,
  rows_deleted bigint not null default 0,
  rows_after bigint
) on commit preserve rows;

insert into wt_026b_cleanup_counts (table_name, rows_before)
values
  ('lp_history_events',
    (select count(*) from public.lp_history_events where wallet_id is null)),
  ('lp_position_cache',
    (select count(*) from public.lp_position_cache where wallet_id is null)),
  ('project_miners',
    (select count(*) from public.project_miners where wallet_id is null)),
  ('project_miner_ownership',
    (select count(*) from public.project_miner_ownership where wallet_id is null)),
  ('project_nft_claims',
    (select count(*) from public.project_nft_claims where wallet_id is null)),
  ('project_nft_ownership',
    (select count(*) from public.project_nft_ownership where wallet_id is null)),
  ('project_scan_state',
    (select count(*) from public.project_scan_state where wallet_id is null)),
  ('project_transactions',
    (select count(*) from public.project_transactions where wallet_id is null)),
  ('tln_vow_staking_scan_cache',
    (select count(*) from public.tln_vow_staking_scan_cache where wallet_id is null)),
  ('tln_wallet_identity_cache',
    (select count(*) from public.tln_wallet_identity_cache where wallet_id is null));

with d as (
  delete from public.lp_history_events
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'lp_history_events';

with d as (
  delete from public.lp_position_cache
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'lp_position_cache';

with d as (
  delete from public.project_miners
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_miners';

with d as (
  delete from public.project_miner_ownership
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_miner_ownership';

with d as (
  delete from public.project_nft_claims
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_nft_claims';

with d as (
  delete from public.project_nft_ownership
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_nft_ownership';

with d as (
  delete from public.project_scan_state
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_scan_state';

with d as (
  delete from public.project_transactions
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'project_transactions';

with d as (
  delete from public.tln_vow_staking_scan_cache
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'tln_vow_staking_scan_cache';

with d as (
  delete from public.tln_wallet_identity_cache
  where wallet_id is null
  returning 1
)
update wt_026b_cleanup_counts
set rows_deleted = (select count(*) from d)
where table_name = 'tln_wallet_identity_cache';

update wt_026b_cleanup_counts
set rows_after = case table_name
  when 'lp_history_events'
    then (select count(*) from public.lp_history_events where wallet_id is null)
  when 'lp_position_cache'
    then (select count(*) from public.lp_position_cache where wallet_id is null)
  when 'project_miners'
    then (select count(*) from public.project_miners where wallet_id is null)
  when 'project_miner_ownership'
    then (select count(*) from public.project_miner_ownership where wallet_id is null)
  when 'project_nft_claims'
    then (select count(*) from public.project_nft_claims where wallet_id is null)
  when 'project_nft_ownership'
    then (select count(*) from public.project_nft_ownership where wallet_id is null)
  when 'project_scan_state'
    then (select count(*) from public.project_scan_state where wallet_id is null)
  when 'project_transactions'
    then (select count(*) from public.project_transactions where wallet_id is null)
  when 'tln_vow_staking_scan_cache'
    then (select count(*) from public.tln_vow_staking_scan_cache where wallet_id is null)
  when 'tln_wallet_identity_cache'
    then (select count(*) from public.tln_wallet_identity_cache where wallet_id is null)
end;

do $$
declare
  remaining bigint;
begin
  select coalesce(sum(rows_after), 0)
  into remaining
  from wt_026b_cleanup_counts;

  if remaining <> 0 then
    raise exception
      '026b cleanup aborted: % unmatched row(s) remain. Transaction will roll back.',
      remaining;
  end if;
end
$$;

commit;

select
  table_name,
  rows_before,
  rows_deleted,
  rows_after,
  case
    when rows_after = 0 and rows_deleted = rows_before then 'PASS'
    else 'PRUEFEN'
  end as status
from wt_026b_cleanup_counts
order by table_name;

select
  sum(rows_before) as total_orphans_before,
  sum(rows_deleted) as total_deleted,
  sum(rows_after) as total_orphans_after,
  case
    when sum(rows_after) = 0 then 'PASS'
    else 'PRUEFEN'
  end as status
from wt_026b_cleanup_counts;
