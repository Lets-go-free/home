-- WalletTracking 7.04 · Build 20261002-121802
-- Auth-Basis: Adminrechte an stabile auth.users.id koppeln.
-- Bestehende Admin-E-Mail bleibt als Information/Backfill-Hilfe erhalten.

begin;

alter table public.admins add column if not exists user_id uuid;

-- Bestehende Admins eindeutig anhand ihrer bisherigen E-Mail dem bestehenden Supabase-User zuordnen.
update public.admins a
set user_id = u.id
from auth.users u
where a.user_id is null
  and a.email is not null
  and u.email is not null
  and lower(a.email) = lower(u.email);

create unique index if not exists admins_user_id_uidx
on public.admins(user_id)
where user_id is not null;

-- FK bewusst ON DELETE SET NULL: die Admin-Zeile darf als Verwaltungs-/Auditzeile bestehen bleiben,
-- verliert beim Löschen des Auth-Users aber automatisch ihre Berechtigung.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'admins_user_id_fkey'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

-- Zentraler Admin-Check. Der Browser muss public.admins dafür nicht direkt lesen.
create or replace function public.wallettracking_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
     and exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.wallettracking_is_admin() from public, anon;
grant execute on function public.wallettracking_is_admin() to authenticated;

-- Bereits bekannte Admin-RLS-Stellen auf UUID-basierten Check umstellen.
drop policy if exists tax_fx_rates_admin_write on public.tax_fx_rates;
create policy tax_fx_rates_admin_write on public.tax_fx_rates
for all to authenticated
using (public.wallettracking_is_admin())
with check (public.wallettracking_is_admin());

drop policy if exists tax_asset_prices_admin_write on public.tax_asset_prices;
create policy tax_asset_prices_admin_write on public.tax_asset_prices
for all to authenticated
using (public.wallettracking_is_admin())
with check (public.wallettracking_is_admin());

drop policy if exists lp_pair_registry_read_authenticated on public.lp_pair_registry;
create policy lp_pair_registry_read_authenticated on public.lp_pair_registry
for select to authenticated using (status = 'verified' or public.wallettracking_is_admin());

drop policy if exists lp_staking_candidates_read_authenticated on public.lp_staking_candidates;
create policy lp_staking_candidates_read_authenticated on public.lp_staking_candidates
for select to authenticated using (status = 'verified' or public.wallettracking_is_admin());

drop policy if exists lp_pair_registry_admin_write on public.lp_pair_registry;
create policy lp_pair_registry_admin_write on public.lp_pair_registry
for all to authenticated
using (public.wallettracking_is_admin())
with check (public.wallettracking_is_admin());

drop policy if exists lp_staking_candidates_admin_write on public.lp_staking_candidates;
create policy lp_staking_candidates_admin_write on public.lp_staking_candidates
for all to authenticated
using (public.wallettracking_is_admin())
with check (public.wallettracking_is_admin());

commit;

-- Nach Ausführung prüfen:
-- select email, user_id from public.admins order by email;
-- Kein bestehender Admin darf user_id = null haben, bevor der E-Mail-Fallback später entfernt wird.
