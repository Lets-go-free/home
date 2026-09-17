-- WalletTracking · zentrale DATA_VERSIONS Registry
-- Kleine Freshness-Abfrage für grosse öffentliche Browser-Caches.
begin;
create table if not exists public.cache_data_versions (
  namespace text not null,
  cache_key text not null,
  data_version bigint not null default 0,
  payload_schema_version integer not null default 1,
  row_count bigint not null default 0,
  sync_cursor timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key(namespace,cache_key),
  constraint cache_data_versions_nonnegative check(data_version>=0 and payload_schema_version>0 and row_count>=0)
);
alter table public.cache_data_versions enable row level security;
drop policy if exists cache_data_versions_select on public.cache_data_versions;
create policy cache_data_versions_select on public.cache_data_versions for select to authenticated using(true);
drop policy if exists cache_data_versions_insert on public.cache_data_versions;
create policy cache_data_versions_insert on public.cache_data_versions for insert to authenticated with check(updated_by=auth.uid());
drop policy if exists cache_data_versions_update on public.cache_data_versions;
create policy cache_data_versions_update on public.cache_data_versions for update to authenticated using(true) with check(updated_by=auth.uid());
comment on table public.cache_data_versions is 'Zentrale kleine Freshness-/Schema-Registry für persistente Browser-Caches. payload_schema_version erzwingt bei strukturellen Payload-Änderungen einen gezielten Vollrefresh.';
commit;
