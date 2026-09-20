-- Phase 5.62: userbezogener, datensparsamer Scan-State für DAO-Partner-Bots.
-- Keine Partner-Walletadresse wird in dieser technischen State-Tabelle gespeichert;
-- die Zuordnung erfolgt ausschließlich über SHA-256(normalisierte Walletadresse).
create table if not exists public.dao_partner_bot_scan_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null default 'dao1',
  wallet_hash text not null,
  last_scanned_at timestamptz,
  status text not null default 'pending',
  last_error text,
  updated_at timestamptz not null default now(),
  primary key (user_id, project_key, wallet_hash),
  constraint dao_partner_bot_scan_state_hash_chk check (wallet_hash ~ '^[0-9a-f]{64}$'),
  constraint dao_partner_bot_scan_state_status_chk check (status in ('pending','ok','error'))
);
alter table public.dao_partner_bot_scan_state enable row level security;
drop policy if exists dao_partner_bot_scan_state_select on public.dao_partner_bot_scan_state;
create policy dao_partner_bot_scan_state_select on public.dao_partner_bot_scan_state for select using (auth.uid() = user_id);
drop policy if exists dao_partner_bot_scan_state_insert on public.dao_partner_bot_scan_state;
create policy dao_partner_bot_scan_state_insert on public.dao_partner_bot_scan_state for insert with check (auth.uid() = user_id);
drop policy if exists dao_partner_bot_scan_state_update on public.dao_partner_bot_scan_state;
create policy dao_partner_bot_scan_state_update on public.dao_partner_bot_scan_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists dao_partner_bot_scan_state_delete on public.dao_partner_bot_scan_state;
create policy dao_partner_bot_scan_state_delete on public.dao_partner_bot_scan_state for delete using (auth.uid() = user_id);
create index if not exists dao_partner_bot_scan_state_due_idx on public.dao_partner_bot_scan_state(user_id, project_key, last_scanned_at);
