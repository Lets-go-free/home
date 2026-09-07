-- WalletTracking · TLN/VOW aktueller Preis-/Pool-Tagescache
-- Version: 07.09.2026 18:51:59 CEST · Build 20260907-185159
-- Ein globaler, nicht personenbezogener Snapshot je Projekt + Bewertungslogik.

create table if not exists public.defi_current_price_snapshots (
  project_key text not null,
  valuation_version text not null,
  captured_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint defi_current_price_snapshots_pkey primary key (project_key, valuation_version),
  constraint defi_current_price_snapshots_payload_object check (jsonb_typeof(payload) = 'object')
);

alter table public.defi_current_price_snapshots enable row level security;

drop policy if exists "defi_current_price_snapshots_select" on public.defi_current_price_snapshots;
drop policy if exists "defi_current_price_snapshots_insert" on public.defi_current_price_snapshots;
drop policy if exists "defi_current_price_snapshots_update" on public.defi_current_price_snapshots;

-- Die Daten enthalten ausschließlich öffentliche DEX-/Preisfakten, keine Wallet-/User-Daten.
create policy "defi_current_price_snapshots_select"
on public.defi_current_price_snapshots for select
using (true);

create policy "defi_current_price_snapshots_insert"
on public.defi_current_price_snapshots for insert to authenticated
with check (true);

create policy "defi_current_price_snapshots_update"
on public.defi_current_price_snapshots for update to authenticated
using (true)
with check (true);

create index if not exists idx_defi_current_price_snapshots_captured_at
on public.defi_current_price_snapshots (captured_at desc);

comment on table public.defi_current_price_snapshots is
'Globaler aktueller DeFi-Preis-/Pool-Snapshot. Nicht personenbezogen; automatische Aktualisierung höchstens 1x pro Kalendertag, manuell jederzeit möglich.';
