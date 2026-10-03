-- WalletTracking Phase 7.20
-- READ ONLY: zeigt exponierte Tabellen, RLS, Grants und Function-EXECUTE-Rechte.
-- Dieses Script verändert nichts.

-- Tabellen + RLS
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- Tabellenrechte der API-Rollen
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;

-- Sequenzrechte
select grantee, object_schema, object_name, privilege_type
from information_schema.role_usage_grants
where object_schema = 'public'
  and object_type = 'SEQUENCE'
  and grantee in ('anon','authenticated','service_role')
order by object_name, grantee, privilege_type;

-- Function EXECUTE (inkl. Signatur)
select
  r.routine_schema, r.routine_name, r.specific_name,
  p.grantee, p.privilege_type
from information_schema.routines r
join information_schema.routine_privileges p
  on p.specific_schema = r.specific_schema
 and p.specific_name = r.specific_name
where r.routine_schema = 'public'
  and p.grantee in ('anon','authenticated','service_role')
order by r.routine_name, p.grantee;
