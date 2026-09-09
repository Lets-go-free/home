-- WalletTracking
-- 027b-security-crypto-tests-insert-policy.sql
-- Zweck:
--   Erlaubt dem authentifizierten Benutzer ausschließlich das Einfügen
--   eigener Zeilen in public.security_crypto_tests.
--   Wird für den RLS-basierten db_self_test der Edge Function wallet-private benötigt.
--
-- Sicherheit:
--   Kein Zugriff auf fremde User-Daten.
--   Kein UPDATE-Recht.
--   Bestehende SELECT-/DELETE-Policies bleiben unverändert.

begin;

drop policy if exists "security_crypto_tests_insert_own"
on public.security_crypto_tests;

create policy "security_crypto_tests_insert_own"
on public.security_crypto_tests
for insert
to authenticated
with check (auth.uid() = user_id);

commit;

-- Audit
select
  polname as policy_name,
  polcmd as command,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
from pg_policy
where polrelid = 'public.security_crypto_tests'::regclass
order by polname;
