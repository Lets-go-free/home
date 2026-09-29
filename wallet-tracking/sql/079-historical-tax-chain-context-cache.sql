-- WalletTracking 6.85 · Build 20260930-011109
-- Persistenter userbezogener Cache fuer exakte historische Stichtagsbloecke.
-- Spart nach Reload die teure Archive-RPC-Binaersuche je EVM-Chain.
-- Browserzugriff ist erforderlich; deshalb public + RLS + explizite Grants.

begin;

create table if not exists public.historical_tax_chain_context_cache (
  user_id uuid not null,
  chain_key text not null,
  target_epoch bigint not null,
  block_number bigint not null,
  block_source text,
  checked_at timestamptz not null default now(),
  primary key (user_id, chain_key, target_epoch)
);

create index if not exists historical_tax_chain_context_checked_idx
  on public.historical_tax_chain_context_cache(user_id, checked_at desc);

alter table public.historical_tax_chain_context_cache enable row level security;

revoke all on table public.historical_tax_chain_context_cache from anon;
grant select, insert, update, delete on table public.historical_tax_chain_context_cache to authenticated;

drop policy if exists historical_tax_chain_context_own on public.historical_tax_chain_context_cache;
create policy historical_tax_chain_context_own on public.historical_tax_chain_context_cache
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
