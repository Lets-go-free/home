-- WalletTracking
-- 043-security-phase4d-legacy-identity-final-cleanup.sql
-- Phase 4d – Legacy Identity Final Cleanup
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--
-- SICHERHEIT:
--   Das Script löscht Legacy-Zeilen NUR, wenn:
--   1) jede Legacy Wallet↔TLN-ID im neuen globalen Identity-Cache vorhanden ist,
--   2) node_id exakt übereinstimmt,
--   3) jede vorhandene Legacy Parent-Beziehung im globalen SmartNode-Graph vorhanden ist.
--
-- Es DROPPT die alte Tabelle NICHT.
-- Es leert nur ihre verbliebenen Legacy-Zeilen.
-- Bei einer Abweichung wird mit BLOCK abgebrochen und NICHTS gelöscht.

begin;

create temp table if not exists _phase4d_043_audit (
  legacy_rows_before bigint,
  legacy_identity_rows_before bigint,
  legacy_parent_rows_before bigint,
  matching_global_identity_rows bigint,
  matching_global_parent_rows bigint,
  deleted_rows bigint,
  legacy_rows_after bigint
) on commit preserve rows;

truncate table _phase4d_043_audit;

insert into _phase4d_043_audit (
  legacy_rows_before,
  legacy_identity_rows_before,
  legacy_parent_rows_before,
  matching_global_identity_rows,
  matching_global_parent_rows,
  deleted_rows,
  legacy_rows_after
)
select
  (select count(*) from public.tln_wallet_identity_cache),
  (select count(*) from public.tln_wallet_identity_cache where node_id is not null),
  (select count(*) from public.tln_wallet_identity_cache where parent_wallet is not null),
  (
    select count(*)
    from public.tln_wallet_identity_cache l
    where l.node_id is not null
      and exists (
        select 1
        from public.tln_vow_identity_global_cache g
        where g.chain_key = l.chain_key
          and g.registry_contract = lower(
            coalesce(
              nullif(l.source_contract,''),
              '0x028c911c10c9e346158206991e02d09bd0a8a35b'
            )
          )
          and g.wallet_address = lower(l.wallet_address)
          and g.node_id = l.node_id::numeric
      )
  ),
  (
    select count(*)
    from public.tln_wallet_identity_cache l
    where l.parent_wallet is not null
      and exists (
        select 1
        from public.tln_vow_smartnode_graph_cache g
        where g.chain_key = l.chain_key
          and g.child_wallet = lower(l.wallet_address)
          and g.parent_wallet = lower(l.parent_wallet)
      )
  ),
  0,
  0;

do $$
declare
  v_legacy_rows bigint;
  v_identity_rows bigint;
  v_parent_rows bigint;
  v_identity_matches bigint;
  v_parent_matches bigint;
begin
  select
    legacy_rows_before,
    legacy_identity_rows_before,
    legacy_parent_rows_before,
    matching_global_identity_rows,
    matching_global_parent_rows
  into
    v_legacy_rows,
    v_identity_rows,
    v_parent_rows,
    v_identity_matches,
    v_parent_matches
  from _phase4d_043_audit
  limit 1;

  if v_legacy_rows = 0 then
    raise notice 'Legacy Identity Cache ist bereits leer.';
    return;
  end if;

  if v_identity_rows <> v_identity_matches then
    raise exception
      'BLOCK: Nur % von % Legacy Wallet↔TLN-ID-Einträgen sind exakt im globalen Identity-Cache verifiziert.',
      v_identity_matches, v_identity_rows;
  end if;

  if v_parent_rows <> v_parent_matches then
    raise exception
      'BLOCK: Nur % von % Legacy Parent-Beziehungen sind exakt im globalen SmartNode-Graph verifiziert.',
      v_parent_matches, v_parent_rows;
  end if;
end $$;

with deleted as (
  delete from public.tln_wallet_identity_cache
  returning 1
)
update _phase4d_043_audit
set deleted_rows = (select count(*) from deleted);

update _phase4d_043_audit
set legacy_rows_after = (select count(*) from public.tln_wallet_identity_cache);

commit;

-- Genau EIN Resultset:
select
  legacy_rows_before,
  legacy_identity_rows_before,
  matching_global_identity_rows,
  legacy_parent_rows_before,
  matching_global_parent_rows,
  deleted_rows,
  legacy_rows_after,
  (select count(*) from public.tln_vow_identity_global_cache) as global_identity_rows_after,
  case
    when legacy_rows_after = 0
     and legacy_identity_rows_before = matching_global_identity_rows
     and legacy_parent_rows_before = matching_global_parent_rows
     and deleted_rows = legacy_rows_before
    then 'PASS'
    else 'REVIEW'
  end as cleanup_status
from _phase4d_043_audit;
