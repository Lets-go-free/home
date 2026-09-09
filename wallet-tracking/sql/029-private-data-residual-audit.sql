-- WalletTracking
-- 029-private-data-residual-audit.sql
-- Phase 4 – Read-only Sicherheits-Audit
--
-- Zweck:
--   Nach erfolgreicher Verschlüsselung von public.wallets prüfen, in welchen
--   benutzerspezifischen Tabellen noch direkte Wallet-Adressen, Wallet-Labels
--   oder private Partner-Aliase im Klartext gespeichert sind.
--
-- WICHTIG:
--   Dieses Script verändert KEINE Daten und KEINE Struktur.
--   Es gibt nur Zählwerte aus, keine Wallet-Adressen und keine Alias-Namen.

-- =========================================================
-- A) User-spezifische Tabellen mit wallet_id / wallet_address
-- =========================================================
with audit as (
  select
    'lp_history_events'::text as table_name,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is not null)::bigint as wallet_id_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint as plaintext_wallet_address_rows
  from public.lp_history_events

  union all
  select 'lp_position_cache', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.lp_position_cache

  union all
  select 'project_miners', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_miners

  union all
  select 'project_miner_ownership', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_miner_ownership

  union all
  select 'project_nft_claims', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_claims

  union all
  select 'project_nft_ownership', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_ownership

  union all
  select 'project_scan_state', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_scan_state

  union all
  select 'project_transactions', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_transactions

  union all
  select 'tln_vow_staking_scan_cache', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.tln_vow_staking_scan_cache

  union all
  select 'tln_wallet_identity_cache', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.tln_wallet_identity_cache
)
select *
from audit
order by table_name;

-- =========================================================
-- B) Stichtags-/Snapshot-Tabellen mit redundanten Privatfeldern
-- =========================================================
select
  'year_end_positions'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where wallet_id is not null)::bigint as wallet_id_rows,
  count(*) filter (where wallet_label is not null and btrim(wallet_label) <> '')::bigint as plaintext_wallet_label_rows,
  count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint as plaintext_wallet_address_rows
from public.year_end_positions

union all

select
  'snapshot_items',
  count(*),
  count(*) filter (where wallet_id is not null),
  count(*) filter (where wallet_label is not null and btrim(wallet_label) <> ''),
  count(*) filter (where address is not null and btrim(address) <> '')
from public.snapshot_items;

-- =========================================================
-- C) TLN/VOW technischer Cache – private Alias-Payloads
-- =========================================================
select
  count(*)::bigint as total_tln_scan_cache_rows,
  count(*) filter (
    where payload ->> 'kind' = 'user_team_aliases'
  )::bigint as user_team_alias_payload_rows,
  count(*) filter (
    where payload ->> 'kind' = 'user_team_aliases'
      and jsonb_typeof(payload -> 'aliases') = 'object'
      and payload -> 'aliases' <> '{}'::jsonb
  )::bigint as nonempty_user_team_alias_payload_rows
from public.tln_vow_staking_scan_cache;

-- =========================================================
-- D) Wallet-Tabelle – Kontrollbeweis nach Phase 3b
-- =========================================================
select
  count(*)::bigint as total_wallets,
  count(*) filter (
    where encryption_version = 1
      and key_version = 1
      and label_ciphertext is not null
  )::bigint as encrypted_wallets,
  count(*) filter (
    where label is not null
       or evm_address is not null
       or btc_address is not null
       or xrp_address is not null
       or sol_address is not null
       or tron_address is not null
       or akash_address is not null
  )::bigint as wallets_with_remaining_plaintext
from public.wallets;
