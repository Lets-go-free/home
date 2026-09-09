-- WalletTracking
-- Migration 027: Private Crypto Self-Test Infrastructure
-- Stand: 2026-09-09
--
-- Zweck:
--   Persistenter, aber rein technischer Testbereich fuer die serverseitige
--   Verschluesselung. Es werden KEINE bestehenden Wallet-Daten veraendert.
--
-- Sicherheitsmodell:
--   - nur Ciphertext wird gespeichert
--   - RLS ist aktiv
--   - User darf nur eigene Testzeilen lesen/loeschen
--   - Schreiben erfolgt spaeter kontrolliert ueber die Edge Function

begin;

create table if not exists public.security_crypto_tests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  encryption_version integer not null,
  key_version integer not null,
  test_ciphertext text not null,
  created_at timestamptz not null default now()
);

alter table public.security_crypto_tests enable row level security;

-- Bestehende Policies idempotent ersetzen.
drop policy if exists security_crypto_tests_select_own on public.security_crypto_tests;
drop policy if exists security_crypto_tests_delete_own on public.security_crypto_tests;

create policy security_crypto_tests_select_own
on public.security_crypto_tests
for select
to authenticated
using (auth.uid() = user_id);

create policy security_crypto_tests_delete_own
on public.security_crypto_tests
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists security_crypto_tests_user_created_idx
  on public.security_crypto_tests (user_id, created_at desc);

comment on table public.security_crypto_tests is
  'WalletTracking: rein technische Ciphertext-Testzeilen fuer Phase-2-Verschluesselung; keine produktiven Wallet-Daten.';

commit;

-- Audit
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname = 'security_crypto_tests'
group by c.relname, c.relrowsecurity;
