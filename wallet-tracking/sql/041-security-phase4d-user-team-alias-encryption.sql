-- WalletTracking
-- 041-security-phase4d-user-team-alias-encryption.sql
-- Phase 4d – user-spezifische, verschluesselte Partnernamen/Aliase
--
-- AUSFUEHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausfuehren.
--   Es enthaelt genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--
-- WICHTIG:
--   Die Tabelle speichert KEINEN Partnernamen und KEINE Partner-Wallet im Klartext.
--   reference_hash ist ein serverseitig erzeugter HMAC und nicht reversibel ohne Master-Key.
--   reference_ciphertext und alias_ciphertext werden durch wallet-private AES-256-GCM verschluesselt.

begin;

create table if not exists public.user_team_aliases_private (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_hash text not null,
  encryption_version integer not null,
  key_version integer not null,
  reference_ciphertext text not null,
  alias_ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_team_aliases_private_user_ref_uk unique(user_id,reference_hash),
  constraint user_team_aliases_private_refhash_ck check(reference_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists user_team_aliases_private_user_updated_idx
  on public.user_team_aliases_private(user_id,updated_at desc);

alter table public.user_team_aliases_private enable row level security;

-- Browser/Edge Function sieht nur Datensaetze des eingeloggten Users.
drop policy if exists "user_team_aliases_private_select_own" on public.user_team_aliases_private;
create policy "user_team_aliases_private_select_own"
on public.user_team_aliases_private for select to authenticated
using (user_id=auth.uid());

drop policy if exists "user_team_aliases_private_insert_own" on public.user_team_aliases_private;
create policy "user_team_aliases_private_insert_own"
on public.user_team_aliases_private for insert to authenticated
with check (user_id=auth.uid());

drop policy if exists "user_team_aliases_private_update_own" on public.user_team_aliases_private;
create policy "user_team_aliases_private_update_own"
on public.user_team_aliases_private for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "user_team_aliases_private_delete_own" on public.user_team_aliases_private;
create policy "user_team_aliases_private_delete_own"
on public.user_team_aliases_private for delete to authenticated
using (user_id=auth.uid());

comment on table public.user_team_aliases_private is
'Private user-spezifische TLN/VOW Partnernamen. Referenz und Alias liegen ausschliesslich verschluesselt vor; reference_hash ist serverseitiger HMAC fuer Lookup/Unique.';

commit;

-- Genau EIN Resultset:
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from information_schema.columns ic where ic.table_schema='public' and ic.table_name='user_team_aliases_private') as column_count,
  coalesce((select string_agg(p.cmd||':'||p.policyname,' | ' order by p.cmd,p.policyname) from pg_policies p where p.schemaname='public' and p.tablename='user_team_aliases_private'),'') as policies,
  (select count(*) from public.user_team_aliases_private) as current_rows
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='user_team_aliases_private';
