-- WalletTracking
-- 038-security-phase4c-global-tln-identity-cache.sql
-- Phase 4c-2 – Vorbereitung einer globalen TLN-Identity-Struktur
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--
-- ZWECK:
--   Öffentliche, verifizierbare On-Chain-Fakten Wallet <-> TLN-ID werden künftig
--   global und user-unabhängig gespeichert. Damit muss dieselbe öffentliche
--   Identität nicht pro User in tln_wallet_identity_cache dupliziert werden.
--
-- WICHTIG:
--   - Dieses Script migriert noch KEINE bestehenden Daten.
--   - Es löscht/ändert tln_wallet_identity_cache NICHT.
--   - Es ändert den Discovery-Code noch NICHT.
--   - Partnernamen/Aliase gehören NICHT in diese Tabelle.
--   - child/parent-Teambeziehungen bleiben weiterhin im bestehenden
--     tln_vow_smartnode_graph_cache.
--
-- Datenschutz:
--   Diese Tabelle enthält ausschließlich öffentliche On-Chain-Fakten.
--   created_by/updated_by sind technische Provenienzfelder, keine Besitz-Zuordnung.

begin;

create table if not exists public.tln_vow_identity_global_cache (
  chain_key text not null,
  registry_contract text not null,
  wallet_address text not null,
  node_id numeric(78,0) not null,

  source_method text not null,
  source_tx_hash text,
  source_block bigint,
  verified_at timestamptz not null default now(),

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tln_vow_identity_global_cache_pk
    primary key (chain_key, registry_contract, wallet_address),

  constraint tln_vow_identity_global_cache_wallet_format
    check (wallet_address ~ '^0x[0-9a-f]{40}$'),

  constraint tln_vow_identity_global_cache_contract_format
    check (registry_contract ~ '^0x[0-9a-f]{40}$'),

  constraint tln_vow_identity_global_cache_node_positive
    check (node_id > 0)
);

create unique index if not exists tln_vow_identity_global_cache_node_idx
  on public.tln_vow_identity_global_cache(chain_key, registry_contract, node_id);

create index if not exists tln_vow_identity_global_cache_verified_idx
  on public.tln_vow_identity_global_cache(chain_key, registry_contract, verified_at desc);

alter table public.tln_vow_identity_global_cache enable row level security;

drop policy if exists "tln_identity_global_authenticated_select"
  on public.tln_vow_identity_global_cache;

create policy "tln_identity_global_authenticated_select"
on public.tln_vow_identity_global_cache
for select
to authenticated
using (true);

-- Phase 4c Vorbereitung:
-- Schreiben bleibt vorerst für authentifizierte Nutzer erlaubt, aber jede neue/aktualisierte
-- Zeile muss ihre Provenienz dem eingeloggten User zuordnen.
-- In einer späteren Security-Härtung werden globale Cache-Writes auf Backend/Edge Function
-- verschoben, analog zur geplanten Härtung des SmartNode-Globalgraphs.
drop policy if exists "tln_identity_global_authenticated_insert"
  on public.tln_vow_identity_global_cache;

create policy "tln_identity_global_authenticated_insert"
on public.tln_vow_identity_global_cache
for insert
to authenticated
with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists "tln_identity_global_authenticated_update"
  on public.tln_vow_identity_global_cache;

create policy "tln_identity_global_authenticated_update"
on public.tln_vow_identity_global_cache
for update
to authenticated
using (true)
with check (updated_by = auth.uid());

comment on table public.tln_vow_identity_global_cache is
'Globaler user-unabhängiger Cache für verifizierte TLN/VOW Wallet↔TLN-ID On-Chain-Fakten. Keine Partner-Aliase und keine User-Besitzrelation.';

commit;

-- Genau EIN Resultset:
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  coalesce((
    select string_agg(p.cmd || ':' || p.policyname, ' | ' order by p.cmd,p.policyname)
    from pg_policies p
    where p.schemaname='public'
      and p.tablename='tln_vow_identity_global_cache'
  ),'') as policies,
  (
    select count(*)
    from information_schema.columns ic
    where ic.table_schema='public'
      and ic.table_name='tln_vow_identity_global_cache'
  ) as column_count
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname='tln_vow_identity_global_cache';
