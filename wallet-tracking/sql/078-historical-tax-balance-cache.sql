-- WalletTracking 6.82 · Build 20260930-003245
-- Persistenter technischer Cache fuer historische 31.12.-Balance-/Token-Kandidaten-Abfragen.
-- Die Tabellen liegen bewusst in public, weil der authentifizierte Browser sie fuer den
-- Steuerbericht cache-first lesen/schreiben muss. RLS trennt die Daten strikt je User.

begin;

create table if not exists public.historical_token_balance_cache (
  user_id uuid not null,
  wallet_id text,
  chain_key text not null,
  wallet_address text not null,
  asset_key text not null,
  block_number bigint not null,
  amount numeric(78,30) not null default 0,
  decimals integer,
  balance_source text,
  checked_at timestamptz not null default now(),
  primary key (user_id, chain_key, wallet_address, asset_key, block_number)
);

create table if not exists public.historical_token_candidate_cache (
  user_id uuid not null,
  wallet_id text,
  chain_key text not null,
  wallet_address text not null,
  block_number bigint not null,
  token_addresses jsonb not null default '[]'::jsonb,
  discovery_source text,
  checked_at timestamptz not null default now(),
  primary key (user_id, chain_key, wallet_address, block_number),
  constraint historical_token_candidate_cache_array check (jsonb_typeof(token_addresses) = 'array')
);

create index if not exists historical_token_balance_cache_wallet_idx
  on public.historical_token_balance_cache(user_id, wallet_id, chain_key, block_number);
create index if not exists historical_token_balance_cache_checked_idx
  on public.historical_token_balance_cache(user_id, checked_at desc);
create index if not exists historical_token_candidate_cache_wallet_idx
  on public.historical_token_candidate_cache(user_id, wallet_id, chain_key, block_number);

alter table public.historical_token_balance_cache enable row level security;
alter table public.historical_token_candidate_cache enable row level security;

revoke all on table public.historical_token_balance_cache from anon;
revoke all on table public.historical_token_candidate_cache from anon;
grant select, insert, update, delete on table public.historical_token_balance_cache to authenticated;
grant select, insert, update, delete on table public.historical_token_candidate_cache to authenticated;

drop policy if exists historical_token_balance_cache_own on public.historical_token_balance_cache;
create policy historical_token_balance_cache_own on public.historical_token_balance_cache
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists historical_token_candidate_cache_own on public.historical_token_candidate_cache;
create policy historical_token_candidate_cache_own on public.historical_token_candidate_cache
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
