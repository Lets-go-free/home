-- WalletTracking · globaler aktueller 15-Minuten-Preisstand
-- Version: 19.09.2026 13:32:14 CEST · Build 20260919-133214
-- Nur aktueller Snapshot; keine Historisierung. Ein aktiver Client kann pro Slot genau einen Job claimen.

create table if not exists public.wallet_global_current_price_snapshot (
  snapshot_key text not null default 'current',
  valuation_version text not null,
  slot_key text not null,
  captured_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (snapshot_key, valuation_version),
  constraint wallet_global_current_price_snapshot_payload_object check (jsonb_typeof(payload)='object')
);

create table if not exists public.wallet_global_price_refresh_slots (
  valuation_version text not null,
  slot_key text not null,
  claimed_at timestamptz not null default now(),
  claimed_by uuid null,
  primary key (valuation_version, slot_key)
);

alter table public.wallet_global_current_price_snapshot enable row level security;
alter table public.wallet_global_price_refresh_slots enable row level security;

drop policy if exists "wallet_global_price_snapshot_select" on public.wallet_global_current_price_snapshot;
create policy "wallet_global_price_snapshot_select" on public.wallet_global_current_price_snapshot
  for select to authenticated using (true);

drop policy if exists "wallet_global_price_snapshot_insert" on public.wallet_global_current_price_snapshot;
create policy "wallet_global_price_snapshot_insert" on public.wallet_global_current_price_snapshot
  for insert to authenticated with check (true);

drop policy if exists "wallet_global_price_snapshot_update" on public.wallet_global_current_price_snapshot;
create policy "wallet_global_price_snapshot_update" on public.wallet_global_current_price_snapshot
  for update to authenticated using (true) with check (true);

-- Slots sind nur über die atomare RPC claimbar; Clients brauchen keine direkte Tabellenberechtigung.
revoke all on public.wallet_global_price_refresh_slots from anon, authenticated;
grant select, insert, update on public.wallet_global_current_price_snapshot to authenticated;

create or replace function public.wallettracking_claim_price_refresh_slot(
  p_slot_key text,
  p_valuation_version text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.wallet_global_price_refresh_slots(valuation_version,slot_key,claimed_by)
  values(p_valuation_version,p_slot_key,auth.uid())
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;
revoke all on function public.wallettracking_claim_price_refresh_slot(text,text) from public;
grant execute on function public.wallettracking_claim_price_refresh_slot(text,text) to authenticated;

-- Nur wenige Tage Slot-Metadaten behalten; Preiswerte selbst werden immer überschrieben.
create or replace function public.wallettracking_cleanup_price_refresh_slots() returns void
language sql security definer set search_path=public as $$
  delete from public.wallet_global_price_refresh_slots where claimed_at < now() - interval '7 days';
$$;
revoke all on function public.wallettracking_cleanup_price_refresh_slots() from public;
grant execute on function public.wallettracking_cleanup_price_refresh_slots() to authenticated;

comment on table public.wallet_global_current_price_snapshot is
'Globaler aktueller WalletTracking-Preisstand. Ein Datensatz wird überschrieben; keine Preis-Historisierung.';
comment on table public.wallet_global_price_refresh_slots is
'Atomare 15-Minuten-Slots für globale Preisaktualisierung; verhindert parallele Jobs mehrerer aktiver Clients.';
