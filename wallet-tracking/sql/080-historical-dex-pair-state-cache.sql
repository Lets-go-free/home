-- WalletTracking 6.87 · Build 20260930-015858
-- Persistenter userbezogener Cache fuer exakt verifizierte historische DEX-Pair-Zustaende.
-- Aktuell fuer Apertum genutzt: Reserve-Sync und optional LP-TotalSupply am Zielblock.
-- Bei spaeteren Stichtagen werden nur Logs seit dem letzten gecachten Zielblock nachgezogen.
-- Browserzugriff ist erforderlich; deshalb public + RLS + explizite Grants.

begin;

create table if not exists public.historical_dex_pair_state_cache (
  user_id uuid not null,
  chain_key text not null,
  pair_address text not null,
  block_number bigint not null,
  sync_block bigint,
  reserve0_raw text not null,
  reserve1_raw text not null,
  total_supply_raw text,
  checked_at timestamptz not null default now(),
  primary key (user_id, chain_key, pair_address, block_number)
);

create index if not exists historical_dex_pair_state_lookup_idx
  on public.historical_dex_pair_state_cache(user_id, chain_key, pair_address, block_number desc);

alter table public.historical_dex_pair_state_cache enable row level security;

revoke all on table public.historical_dex_pair_state_cache from anon;
grant select, insert, update, delete on table public.historical_dex_pair_state_cache to authenticated;

drop policy if exists historical_dex_pair_state_own on public.historical_dex_pair_state_cache;
create policy historical_dex_pair_state_own on public.historical_dex_pair_state_cache
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
