-- WalletTracking TLN/VOW Handel · VOW / v$ · 30 Tage
-- Im Supabase SQL Editor einmalig ausführen, bevor Version 7.59 geöffnet wird.
-- Eigener, pro angemeldetem Benutzer isolierter Cache. Keine Service-Role im Browser.

create table if not exists public.tln_vow_trade_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  chain_key text not null check (chain_key in ('bsc','eth')),
  pool_address text not null,
  tx_hash text not null,
  log_index bigint not null,
  token_key text not null check (token_key in ('vow','vdollar')),
  side text not null check (side in ('buy','sell')),
  amount numeric not null check (amount >= 0),
  wallet_address text,
  block_number bigint not null,
  block_time timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id,chain_key,tx_hash,log_index,token_key,side)
);
create index if not exists tln_vow_trade_cache_user_time_idx
  on public.tln_vow_trade_cache(user_id,block_time desc);
create index if not exists tln_vow_trade_cache_expire_idx
  on public.tln_vow_trade_cache(block_time);
alter table public.tln_vow_trade_cache enable row level security;
drop policy if exists tln_vow_trade_cache_owner on public.tln_vow_trade_cache;
create policy tln_vow_trade_cache_owner on public.tln_vow_trade_cache
  for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.tln_vow_trade_cache to authenticated;

create table if not exists public.tln_vow_trade_scan_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  chain_key text not null check (chain_key in ('bsc','eth')),
  group_key text not null check (group_key in ('v2','v3')),
  schema_version integer not null,
  last_scanned_block bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id,chain_key,group_key)
);
alter table public.tln_vow_trade_scan_state enable row level security;
drop policy if exists tln_vow_trade_scan_state_owner on public.tln_vow_trade_scan_state;
create policy tln_vow_trade_scan_state_owner on public.tln_vow_trade_scan_state
  for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.tln_vow_trade_scan_state to authenticated;

-- Zusätzlich zur Bereinigung beim Aktualisieren: Alte Datensätze beim nächsten
-- Schreibvorgang entfernen, unabhängig davon, ob der Benutzer aufräumt.
create or replace function public.tln_vow_trade_purge_expired()
returns void language sql security definer set search_path = public as $$
  delete from public.tln_vow_trade_cache where block_time < now() - interval '30 days';
$$;
revoke all on function public.tln_vow_trade_purge_expired() from public, anon;
-- Nachts automatisch bereinigen, wenn pg_cron in der Datenbank aktiviert ist.
-- Supabase kann pg_cron über Database > Extensions aktivieren.
do $$
begin
  if exists(select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('tln-vow-trades-30d-purge','15 2 * * *',
      'select public.tln_vow_trade_purge_expired()');
  end if;
end $$;
-- Bei nicht aktiviertem pg_cron bereinigt die App bei jeder Handels-Aktualisierung.
