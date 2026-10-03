-- WalletTracking · read-only DB inventory helper
-- Phase 7.17 · 04.10.2026
-- Keine DDL/DML-Anweisungen. Kann im Supabase SQL Editor ausgeführt werden.

select jsonb_pretty(jsonb_build_object(
  'tables', coalesce((
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname,
      'name', c.relname,
      'rls', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity
    ) order by n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r','p')
      and n.nspname not in ('pg_catalog','information_schema','pg_toast')
      and n.nspname not like 'pg_%'
  ), '[]'::jsonb),
  'policies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'schema', schemaname,
      'table', tablename,
      'name', policyname,
      'permissive', permissive,
      'roles', roles,
      'cmd', cmd,
      'qual', qual,
      'with_check', with_check
    ) order by schemaname, tablename, policyname)
    from pg_policies
    where schemaname not in ('pg_catalog','information_schema')
  ), '[]'::jsonb),
  'functions', coalesce((
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname,
      'name', p.proname,
      'args', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'acl', p.proacl
    ) order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('pg_catalog','information_schema','pg_toast')
      and n.nspname not like 'pg_%'
  ), '[]'::jsonb),
  'triggers', coalesce((
    select jsonb_agg(jsonb_build_object(
      'schema', n.nspname,
      'table', c.relname,
      'name', t.tgname,
      'definition', pg_get_triggerdef(t.oid, true)
    ) order by n.nspname, c.relname, t.tgname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and n.nspname not in ('pg_catalog','information_schema','pg_toast')
      and n.nspname not like 'pg_%'
  ), '[]'::jsonb),
  'table_grants', coalesce((
    select jsonb_agg(jsonb_build_object(
      'schema', table_schema,
      'table', table_name,
      'grantee', grantee,
      'privilege', privilege_type
    ) order by table_schema, table_name, grantee, privilege_type)
    from information_schema.table_privileges
    where table_schema not in ('pg_catalog','information_schema')
  ), '[]'::jsonb)
)) as wallettracking_db_inventory;
