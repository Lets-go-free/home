-- WalletTracking
-- 036-security-phase4c-tln-vow-audit.sql
-- Phase 4c – TLN/VOW Privacy Audit (READ ONLY)
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset.
--   Nichts einzeln markieren.
--
-- Dieses Script ändert KEINE Daten, KEINE Constraints und KEINE RLS-Policies.
-- Es gibt KEINE konkreten Wallet-Adressen oder Partnernamen aus.

with table_stats as (
  select
    'tln_wallet_identity_cache'::text as object_name,
    'TABLE'::text as object_type,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address)<>'')::bigint as address_value_rows,
    count(*) filter (where parent_wallet is not null and btrim(parent_wallet)<>'')::bigint as second_address_value_rows,
    'PRIVATE_USER_RELATION'::text as privacy_class,
    'User↔TLN/Partner-Zuordnung ist privat. Nicht blind löschen: Team-/Referral-Logik nutzt wallet_address/parent_wallet.'::text as recommendation
  from public.tln_wallet_identity_cache

  union all
  select
    'tln_vow_staking_scan_cache','TABLE',
    count(*)::bigint,
    count(*) filter (where wallet_id is null)::bigint,
    count(*) filter (where wallet_address is not null and btrim(wallet_address)<>'')::bigint,
    0::bigint,
    'PRIVATE_OWN_WALLET_CACHE',
    'Wenn wallet_id vollständig ist, ist wallet_address Cleanup-Kandidat; Code vorher ausschließlich auf wallet_id umstellen.'
  from public.tln_vow_staking_scan_cache

  union all
  select
    'tln_vow_smartnode_graph_cache','TABLE',
    count(*)::bigint,
    null::bigint,
    count(*) filter (where child_wallet is not null and btrim(child_wallet)<>'')::bigint,
    count(*) filter (where parent_wallet is not null and btrim(parent_wallet)<>'')::bigint,
    'PUBLIC_ONCHAIN_GLOBAL',
    'child_wallet/parent_wallet bleiben Klartext: globaler, user-unabhängiger SmartNode-On-Chain-Fakt. Schreibrechte später auf Backend/Admin härten.'
  from public.tln_vow_smartnode_graph_cache

  union all
  select
    'tln_vow_smartnode_graph_state','TABLE',
    count(*)::bigint,
    null::bigint,
    0::bigint,
    0::bigint,
    'PUBLIC_ONCHAIN_GLOBAL',
    'Globaler Scan-/Block-State; keine private Wallet-Zuordnung.'
  from public.tln_vow_smartnode_graph_state
),
rls_stats as (
  select
    c.relname::text as object_name,
    'RLS'::text as object_type,
    null::bigint as total_rows,
    null::bigint as wallet_id_null_rows,
    null::bigint as address_value_rows,
    null::bigint as second_address_value_rows,
    case when c.relrowsecurity then 'RLS_ENABLED' else 'RLS_DISABLED' end::text as privacy_class,
    coalesce((
      select string_agg(p.cmd || ':' || p.policyname, ' | ' order by p.cmd,p.policyname)
      from pg_policies p
      where p.schemaname='public' and p.tablename=c.relname
    ),'Keine Policies gefunden')::text as recommendation
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='r'
    and c.relname in (
      'tln_wallet_identity_cache',
      'tln_vow_staking_scan_cache',
      'tln_vow_smartnode_graph_cache',
      'tln_vow_smartnode_graph_state'
    )
),
alias_schema_candidates as (
  select
    (c.table_name || '.' || c.column_name)::text as object_name,
    'ALIAS_SCHEMA_CANDIDATE'::text as object_type,
    null::bigint as total_rows,
    null::bigint as wallet_id_null_rows,
    null::bigint as address_value_rows,
    null::bigint as second_address_value_rows,
    'PRIVATE_ALIAS_REVIEW'::text as privacy_class,
    ('Datentyp=' || c.data_type || ' · nullable=' || c.is_nullable ||
     ' · prüfen, ob hier TLN/VOW Partnernamen/Aliase gespeichert werden.')::text as recommendation
  from information_schema.columns c
  where c.table_schema='public'
    and (
      c.column_name ilike '%alias%'
      or c.column_name ilike '%partner%name%'
      or c.column_name ilike '%team%name%'
      or c.column_name ilike '%team%alias%'
      or c.column_name ilike '%alias%payload%'
    )
)
select *
from (
  select * from table_stats
  union all
  select * from rls_stats
  union all
  select * from alias_schema_candidates
) x
order by
  case object_type when 'TABLE' then 1 when 'RLS' then 2 else 3 end,
  object_name;
