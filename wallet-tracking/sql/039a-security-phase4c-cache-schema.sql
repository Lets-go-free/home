-- WalletTracking
-- 039a-security-phase4c-cache-schema.sql
-- Phase 4c – private Wallet-Caches von globalen technischen On-Chain-Caches trennen
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--
-- Voraussetzung: 037 = PASS (alle vorhandenen tln_vow_staking_scan_cache-Zeilen haben wallet_id).
-- Keine Zeilen werden gelöscht.

begin;

do $$ begin
  if exists(select 1 from public.tln_vow_staking_scan_cache where wallet_id is null) then
    raise exception 'BLOCK: tln_vow_staking_scan_cache enthält Zeilen ohne wallet_id';
  end if;
end $$;

-- Private userbezogene Cache-Tabelle: Schlüssel künftig ausschließlich wallet_id.
alter table public.tln_vow_staking_scan_cache drop constraint if exists tln_vow_staking_scan_cache_pkey;
alter table public.tln_vow_staking_scan_cache alter column wallet_address drop not null;
alter table public.tln_vow_staking_scan_cache alter column wallet_id set not null;

alter table public.tln_vow_staking_scan_cache
  add constraint tln_vow_staking_scan_cache_pkey
  primary key (user_id,chain_key,wallet_id,cache_key);

create index if not exists idx_tln_vow_staking_scan_cache_wallet_id
  on public.tln_vow_staking_scan_cache(user_id,chain_key,wallet_id);

-- Bestehende 23 privaten Cache-Zeilen verlieren die redundante Klartextadresse.
update public.tln_vow_staking_scan_cache set wallet_address=null where wallet_address is not null;

-- Globaler, user-unabhängiger Technikcache für öffentliche On-Chain-Fakten
-- (Team-Lifecycle, Team-Contract-History, globale Preis-/Evidence-Caches etc.).
create table if not exists public.tln_vow_technical_global_cache(
  chain_key text not null,
  scope_address text not null,
  cache_key text not null,
  scanner_version text not null,
  complete_from_block bigint not null default 0,
  last_scanned_block bigint not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tln_vow_technical_global_cache_pkey primary key(chain_key,scope_address,cache_key),
  constraint tln_vow_technical_global_cache_scope_format check(scope_address ~ '^0x[0-9a-f]{40}$')
);
create index if not exists tln_vow_technical_global_cache_key_idx on public.tln_vow_technical_global_cache(chain_key,cache_key,scope_address);
alter table public.tln_vow_technical_global_cache enable row level security;
drop policy if exists "tln_technical_global_authenticated_select" on public.tln_vow_technical_global_cache;
create policy "tln_technical_global_authenticated_select" on public.tln_vow_technical_global_cache for select to authenticated using(true);
drop policy if exists "tln_technical_global_authenticated_insert" on public.tln_vow_technical_global_cache;
create policy "tln_technical_global_authenticated_insert" on public.tln_vow_technical_global_cache for insert to authenticated with check(created_by=auth.uid() and updated_by=auth.uid());
drop policy if exists "tln_technical_global_authenticated_update" on public.tln_vow_technical_global_cache;
create policy "tln_technical_global_authenticated_update" on public.tln_vow_technical_global_cache for update to authenticated using(true) with check(updated_by=auth.uid());
drop policy if exists "tln_technical_global_admin_delete" on public.tln_vow_technical_global_cache;
create policy "tln_technical_global_admin_delete" on public.tln_vow_technical_global_cache for delete to authenticated using(coalesce(public.is_admin(auth.uid()),false));

commit;

-- Genau EIN Resultset
select
  (select count(*) from public.tln_vow_staking_scan_cache) as private_cache_rows,
  (select count(*) from public.tln_vow_staking_scan_cache where wallet_id is null) as private_wallet_id_null_rows,
  (select count(*) from public.tln_vow_staking_scan_cache where wallet_address is not null) as private_plaintext_address_rows,
  (select count(*) from public.tln_vow_technical_global_cache) as global_technical_cache_rows,
  (select relrowsecurity from pg_class where oid='public.tln_vow_technical_global_cache'::regclass) as global_rls_enabled;
