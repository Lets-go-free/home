-- WalletTracking · DAO1/Apertum · globaler historischer Preis-Coverage-Cache
-- Einmalig NACH 046c ausführen.
-- Öffentliche On-Chain-Tatsache: welche Blockbereiche des APTM/wUSDT-Pools
-- mit welcher Parser-Version vollständig auf Sync-Events geprüft wurden.
-- Lesen: alle authentifizierten User. Schreiben: nur Admins (Cache-Poisoning-Schutz).

begin;

create table if not exists public.aptm_price_coverage (
  project_key text not null default 'dao1',
  chain_key text not null default 'apertum',
  pool_address text not null,
  parser_version integer not null,
  from_block bigint not null,
  to_block bigint not null,
  sync_count integer not null default 0,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint aptm_price_coverage_valid_range check (from_block >= 0 and to_block >= from_block),
  primary key (pool_address, parser_version, from_block, to_block)
);

create index if not exists aptm_price_coverage_lookup_idx
  on public.aptm_price_coverage (pool_address, parser_version, from_block, to_block);

alter table public.aptm_price_coverage enable row level security;

drop policy if exists aptm_price_coverage_read on public.aptm_price_coverage;
create policy aptm_price_coverage_read on public.aptm_price_coverage
for select to authenticated using (true);

drop policy if exists aptm_price_coverage_admin_insert on public.aptm_price_coverage;
create policy aptm_price_coverage_admin_insert on public.aptm_price_coverage
for insert to authenticated
with check (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));

drop policy if exists aptm_price_coverage_admin_update on public.aptm_price_coverage;
create policy aptm_price_coverage_admin_update on public.aptm_price_coverage
for update to authenticated
using (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'))
with check (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));

drop policy if exists aptm_price_coverage_admin_delete on public.aptm_price_coverage;
create policy aptm_price_coverage_admin_delete on public.aptm_price_coverage
for delete to authenticated
using (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));

commit;
