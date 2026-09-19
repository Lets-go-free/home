-- WalletTracking Phase 5.41 · DAO1/APTMDAO Partner-Bot-Lifecycle
-- Userbezogener, evidenzbasierter Cache. Ein Bot wird nur gespeichert, wenn seine
-- Erwerbs-Transaktion den DAO1- oder APTMDAO-Kontext eindeutig belegt.
begin;

create table if not exists public.dao_partner_bot_lifecycle_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null default 'dao1',
  tree_system text not null check (tree_system in ('legacy','aptmdao')),
  partner_did bigint,
  wallet_address text not null,
  bot_contract text not null,
  bot_id text not null,
  bot_type text,
  bot_name text,
  acquired_at timestamptz,
  acquisition_tx_hash text not null,
  evidence_type text not null default 'same_acquisition_tx',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,tree_system,bot_contract,bot_id)
);

create index if not exists dao_partner_bot_lifecycle_user_date_idx
  on public.dao_partner_bot_lifecycle_cache(user_id, acquired_at desc);
create index if not exists dao_partner_bot_lifecycle_wallet_idx
  on public.dao_partner_bot_lifecycle_cache(user_id, tree_system, wallet_address);

alter table public.dao_partner_bot_lifecycle_cache enable row level security;
drop policy if exists dao_partner_bot_lifecycle_select on public.dao_partner_bot_lifecycle_cache;
create policy dao_partner_bot_lifecycle_select on public.dao_partner_bot_lifecycle_cache
  for select to authenticated using (user_id=auth.uid());
drop policy if exists dao_partner_bot_lifecycle_insert on public.dao_partner_bot_lifecycle_cache;
create policy dao_partner_bot_lifecycle_insert on public.dao_partner_bot_lifecycle_cache
  for insert to authenticated with check (user_id=auth.uid());
drop policy if exists dao_partner_bot_lifecycle_update on public.dao_partner_bot_lifecycle_cache;
create policy dao_partner_bot_lifecycle_update on public.dao_partner_bot_lifecycle_cache
  for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists dao_partner_bot_lifecycle_delete on public.dao_partner_bot_lifecycle_cache;
create policy dao_partner_bot_lifecycle_delete on public.dao_partner_bot_lifecycle_cache
  for delete to authenticated using (user_id=auth.uid());

commit;
