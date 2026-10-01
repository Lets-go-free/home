-- ============================================================
-- TagMarkets: Admins aus der Tabelle public.admins (wie beim Wallet-Tracking)
-- Ersetzt die fest eingetragene Admin-E-Mail in den Zugriffsrechten.
-- Im Supabase SQL Editor einfügen und ausführen.
-- ============================================================

-- 1) Ist der angemeldete Benutzer Admin?
--    "security definer": liest admins auch dann, wenn die Tabelle für andere gesperrt ist
create or replace function public.tm_ist_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.admins a
        where lower(trim(a.email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

-- 2) Darf diese E-Mail einen Login-Link bekommen? (für die Seite vor dem Login)
create or replace function public.tm_ist_admin_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.admins a
        where lower(trim(a.email)) = lower(trim(coalesce(p_email, '')))
    );
$$;

revoke all on function public.tm_ist_admin() from public;
revoke all on function public.tm_ist_admin_email(text) from public;
grant execute on function public.tm_ist_admin() to anon, authenticated;
grant execute on function public.tm_ist_admin_email(text) to anon, authenticated;

-- 3) Zugriffsrechte neu: Ändern nur für Admins aus der Tabelle admins
-- tm_accounts
drop policy if exists "tm_accounts einfuegen" on public.tm_accounts;
drop policy if exists "tm_accounts aendern"   on public.tm_accounts;
drop policy if exists "tm_accounts loeschen"  on public.tm_accounts;
create policy "tm_accounts einfuegen" on public.tm_accounts for insert to authenticated
    with check (public.tm_ist_admin());
create policy "tm_accounts aendern" on public.tm_accounts for update to authenticated
    using (public.tm_ist_admin()) with check (public.tm_ist_admin());
create policy "tm_accounts loeschen" on public.tm_accounts for delete to authenticated
    using (public.tm_ist_admin());

-- tm_trades
drop policy if exists "tm_trades einfuegen" on public.tm_trades;
drop policy if exists "tm_trades aendern"   on public.tm_trades;
drop policy if exists "tm_trades loeschen"  on public.tm_trades;
create policy "tm_trades einfuegen" on public.tm_trades for insert to authenticated
    with check (public.tm_ist_admin());
create policy "tm_trades aendern" on public.tm_trades for update to authenticated
    using (public.tm_ist_admin()) with check (public.tm_ist_admin());
create policy "tm_trades loeschen" on public.tm_trades for delete to authenticated
    using (public.tm_ist_admin());

-- tm_wallet_transactions
drop policy if exists "tm_wallet_transactions einfuegen" on public.tm_wallet_transactions;
drop policy if exists "tm_wallet_transactions aendern"   on public.tm_wallet_transactions;
drop policy if exists "tm_wallet_transactions loeschen"  on public.tm_wallet_transactions;
create policy "tm_wallet_transactions einfuegen" on public.tm_wallet_transactions for insert to authenticated
    with check (public.tm_ist_admin());
create policy "tm_wallet_transactions aendern" on public.tm_wallet_transactions for update to authenticated
    using (public.tm_ist_admin()) with check (public.tm_ist_admin());
create policy "tm_wallet_transactions loeschen" on public.tm_wallet_transactions for delete to authenticated
    using (public.tm_ist_admin());

-- Kontrolle: welche Adressen sind Admin?
select email from public.admins order by email;
