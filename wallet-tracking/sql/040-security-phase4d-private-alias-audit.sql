-- WalletTracking
-- 040-security-phase4d-private-alias-audit.sql
-- Phase 4d – Audit Partnernamen/Aliase + Legacy Identity (READ ONLY)
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset.
--   Nichts einzeln markieren.
--
-- ZWECK:
--   Vor der Verschlüsselung exakt feststellen, wo private Partnernamen/Aliase
--   aktuell gespeichert sind und ob der alte user-spezifische Identity-Cache
--   noch Daten enthält.
--
-- WICHTIG:
--   Dieses Script verändert KEINE Daten, KEINE Tabellenstruktur und KEINE RLS-Policies.
--   Es gibt KEINE konkreten Wallet-Adressen oder Partnernamen aus.
--
-- HINWEIS:
--   PostgreSQL/Supabase stellt keine Funktion jsonb_object_length(jsonb) bereit.
--   Die Anzahl der Alias-Einträge wird deshalb portabel über jsonb_object_keys(...)
--   gezählt.

with stats as (

  -- Aktueller globaler technische Cache.
  -- Ein user_team_aliases-Payload wäre hier DATENSCHUTZTECHNISCH FALSCH,
  -- weil Partnernamen private user-spezifische Daten sind.
  select
    'tln_vow_technical_global_cache:user_team_aliases'::text as object_name,
    count(*) filter (
      where payload ->> 'kind' = 'user_team_aliases'
    )::bigint as rows_count,
    count(*) filter (
      where payload ->> 'kind' = 'user_team_aliases'
        and jsonb_typeof(payload -> 'aliases') = 'object'
        and payload -> 'aliases' <> '{}'::jsonb
    )::bigint as nonempty_rows,
    coalesce(sum(
      case
        when payload ->> 'kind' = 'user_team_aliases'
         and jsonb_typeof(payload -> 'aliases') = 'object'
        then (
          select count(*)::bigint
          from jsonb_object_keys(payload -> 'aliases')
        )
        else 0
      end
    ),0)::bigint as alias_entries,
    'PRIVATE_ALIAS_MUST_ENCRYPT'::text as privacy_class,
    case
      when count(*) filter (where payload ->> 'kind' = 'user_team_aliases') > 0
      then 'MIGRATE_REQUIRED'
      else 'PASS_NONE'
    end::text as status
  from public.tln_vow_technical_global_cache

  union all

  -- Alter user-spezifischer Staking-Cache: dort könnten aus früheren Builds
  -- ebenfalls Alias-Payloads liegen.
  select
    'tln_vow_staking_scan_cache:user_team_aliases',
    count(*) filter (
      where payload ->> 'kind' = 'user_team_aliases'
    )::bigint,
    count(*) filter (
      where payload ->> 'kind' = 'user_team_aliases'
        and jsonb_typeof(payload -> 'aliases') = 'object'
        and payload -> 'aliases' <> '{}'::jsonb
    )::bigint,
    coalesce(sum(
      case
        when payload ->> 'kind' = 'user_team_aliases'
         and jsonb_typeof(payload -> 'aliases') = 'object'
        then (
          select count(*)::bigint
          from jsonb_object_keys(payload -> 'aliases')
        )
        else 0
      end
    ),0)::bigint,
    'PRIVATE_ALIAS_MUST_ENCRYPT',
    case
      when count(*) filter (where payload ->> 'kind' = 'user_team_aliases') > 0
      then 'MIGRATE_REQUIRED'
      else 'PASS_NONE'
    end
  from public.tln_vow_staking_scan_cache

  union all

  -- Legacy user-spezifischer Identity-Cache.
  -- Die öffentlichen Wallet↔TLN-ID-Fakten wurden bereits in den globalen
  -- Identity-Cache migriert. Diese Tabelle enthält aber weiterhin eine
  -- private User↔Wallet-Beziehung und soll nach finalem Code-Test bereinigt werden.
  select
    'tln_wallet_identity_cache',
    count(*)::bigint,
    count(*) filter (
      where wallet_address is not null
        and btrim(wallet_address) <> ''
    )::bigint,
    count(*) filter (
      where parent_wallet is not null
        and btrim(parent_wallet) <> ''
    )::bigint,
    'LEGACY_PRIVATE_USER_RELATION',
    case
      when count(*) = 0 then 'PASS_EMPTY'
      else 'CLEANUP_PENDING'
    end
  from public.tln_wallet_identity_cache

  union all

  -- Kontrolle des neuen globalen Identity-Caches.
  select
    'tln_vow_identity_global_cache',
    count(*)::bigint,
    count(*)::bigint,
    0::bigint,
    'PUBLIC_ONCHAIN_GLOBAL',
    case when count(*) > 0 then 'PASS' else 'REVIEW_EMPTY' end
  from public.tln_vow_identity_global_cache
)

select *
from stats
order by object_name;
