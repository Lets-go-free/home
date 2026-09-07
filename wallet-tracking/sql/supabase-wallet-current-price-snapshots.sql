-- WalletTracking · zentraler Tagescache für aktuelle Preise
-- Version: 07.09.2026 19:37:00 CEST · Build 20260907-193700
-- Speichert ausschließlich aktuelle Preis-/Kursdaten je Benutzer.
-- Keine Wallet-Bestände, Discovery-, Staking-, Reward-, Team- oder historischen Daten.

create table if not exists public.wallet_current_price_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  valuation_version text not null,
  captured_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, valuation_version)
);

create index if not exists wallet_current_price_snapshots_captured_at_idx
  on public.wallet_current_price_snapshots (user_id, captured_at desc);

alter table public.wallet_current_price_snapshots enable row level security;

drop policy if exists "wallet_current_price_snapshots_select_own" on public.wallet_current_price_snapshots;
create policy "wallet_current_price_snapshots_select_own"
  on public.wallet_current_price_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "wallet_current_price_snapshots_insert_own" on public.wallet_current_price_snapshots;
create policy "wallet_current_price_snapshots_insert_own"
  on public.wallet_current_price_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "wallet_current_price_snapshots_update_own" on public.wallet_current_price_snapshots;
create policy "wallet_current_price_snapshots_update_own"
  on public.wallet_current_price_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.wallet_current_price_snapshots to authenticated;

comment on table public.wallet_current_price_snapshots is
  'WalletTracking: benutzerbezogener Tagescache für aktuelle native/token Preise. Automatisch höchstens einmal pro Europe/Zurich-Kalendertag; manuell jederzeit über den zentralen Button Preise aktualisieren.';
