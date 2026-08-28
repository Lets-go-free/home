-- 018-wallet-refresh-state.sql
-- Phase 2au: geräteübergreifender Aktualisierungs-/Activity-Status pro User, Wallet, Chain und Datentyp.
-- Einmal nach 017 ausführen. Nicht erneut ausführen, wenn die Tabelle bereits vorhanden ist.

create table if not exists public.wallet_refresh_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id text not null,
  chain_key text not null default '',
  data_type text not null,
  last_checked_at timestamptz,
  last_refreshed_at timestamptz,
  last_checked_block bigint,
  last_nonce bigint,
  last_result text,
  updated_at timestamptz not null default now(),
  primary key (user_id, wallet_id, chain_key, data_type)
);

alter table public.wallet_refresh_state enable row level security;

drop policy if exists "wallet_refresh_state_select_own" on public.wallet_refresh_state;
create policy "wallet_refresh_state_select_own" on public.wallet_refresh_state
  for select using (auth.uid() = user_id);

drop policy if exists "wallet_refresh_state_insert_own" on public.wallet_refresh_state;
create policy "wallet_refresh_state_insert_own" on public.wallet_refresh_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "wallet_refresh_state_update_own" on public.wallet_refresh_state;
create policy "wallet_refresh_state_update_own" on public.wallet_refresh_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.wallet_refresh_state to authenticated;
