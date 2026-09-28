-- WalletTracking 6.66 · Build 20260928-180455
-- Globale Steuerkurs-Stammdaten für Bestandesaufnahme per 31.12.
-- Browser-lesbar für authentifizierte User; Änderungen nur durch Admins.

begin;

create table if not exists public.tax_fx_rates (
  tax_year integer not null check (tax_year between 2000 and 2100),
  from_currency text not null,
  to_currency text not null,
  rate numeric(30,12) not null check (rate > 0),
  effective_date date not null,
  source_name text,
  source_url text,
  imported_at timestamptz not null default now(),
  primary key (tax_year, from_currency, to_currency)
);

create table if not exists public.tax_asset_prices (
  tax_year integer not null check (tax_year between 2000 and 2100),
  asset_code text not null,
  price_chf numeric(36,12) not null check (price_chf >= 0),
  effective_date date not null,
  source_type text not null default 'estv_direct' check (source_type in ('estv_direct','manual')),
  source_name text,
  source_url text,
  imported_at timestamptz not null default now(),
  primary key (tax_year, asset_code)
);

alter table public.tax_fx_rates enable row level security;
alter table public.tax_asset_prices enable row level security;

revoke all on table public.tax_fx_rates from anon;
revoke all on table public.tax_asset_prices from anon;
grant select, insert, update, delete on table public.tax_fx_rates to authenticated;
grant select, insert, update, delete on table public.tax_asset_prices to authenticated;

drop policy if exists tax_fx_rates_read_authenticated on public.tax_fx_rates;
create policy tax_fx_rates_read_authenticated on public.tax_fx_rates
for select to authenticated using (true);

drop policy if exists tax_asset_prices_read_authenticated on public.tax_asset_prices;
create policy tax_asset_prices_read_authenticated on public.tax_asset_prices
for select to authenticated using (true);

drop policy if exists tax_fx_rates_admin_write on public.tax_fx_rates;
create policy tax_fx_rates_admin_write on public.tax_fx_rates
for all to authenticated
using (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')))
with check (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')));

drop policy if exists tax_asset_prices_admin_write on public.tax_asset_prices;
create policy tax_asset_prices_admin_write on public.tax_asset_prices
for all to authenticated
using (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')))
with check (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')));

commit;
