-- 053-predefined-tokens-rls.sql
-- WalletTracking Security Hardening:
-- public.predefined_tokens ist global lesbar für authentifizierte Benutzer,
-- aber nur Admins dürfen INSERT / UPDATE / DELETE ausführen.
--
-- WICHTIG:
-- Bestehende Policies werden für diese Tabelle vollständig entfernt,
-- damit keine alte permissive Schreib-Policy die Admin-Regel aushebelt.

-- 1) RLS aktivieren
alter table public.predefined_tokens enable row level security;

-- 2) Alle bestehenden Policies dieser Tabelle entfernen
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'predefined_tokens'
  loop
    execute format(
      'drop policy if exists %I on public.predefined_tokens',
      p.policyname
    );
  end loop;
end
$$;

-- 3) Lesen: alle authentifizierten Benutzer
create policy predefined_tokens_authenticated_select
on public.predefined_tokens
for select
to authenticated
using (true);

-- 4) Einfügen: nur Admins
create policy predefined_tokens_admin_insert
on public.predefined_tokens
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(auth.jwt()->>'email')
  )
);

-- 5) Aktualisieren: nur Admins
create policy predefined_tokens_admin_update
on public.predefined_tokens
for update
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(auth.jwt()->>'email')
  )
)
with check (
  exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(auth.jwt()->>'email')
  )
);

-- 6) Löschen: nur Admins
create policy predefined_tokens_admin_delete
on public.predefined_tokens
for delete
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(auth.jwt()->>'email')
  )
);

-- 7) Kontrolle: RLS-Status + alle Policies anzeigen
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  p.policyname,
  p.cmd,
  p.roles,
  p.qual,
  p.with_check
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname = 'predefined_tokens'
order by p.cmd, p.policyname;
