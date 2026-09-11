-- WalletTracking
-- 050-apertum-nft-history-cache.sql
-- Globale öffentliche Apertum-NFT-Transferhistorie + Coverage.
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Mehrere Statements in EINER Transaktion.
--   Am Ende GENAU EIN Resultset.
--   Reihenfolge: nach 049-dao1-transaction-asset-flows.sql.

begin;

create table if not exists public.apertum_nft_transfer_cache (
  chain_key text not null default 'apertum',
  nft_contract text not null,
  nft_id bigint not null,
  tx_hash text not null,
  log_index integer not null default 0,
  block_number bigint not null,
  block_timestamp timestamptz,
  from_address text,
  to_address text,
  source text not null default 'blockscout-instance',
  created_at timestamptz not null default now(),
  primary key (chain_key,nft_contract,nft_id,tx_hash,log_index)
);

create index if not exists apertum_nft_transfer_cache_lookup_idx
  on public.apertum_nft_transfer_cache(chain_key,nft_contract,nft_id,block_number,log_index);

create table if not exists public.apertum_nft_history_coverage (
  chain_key text not null default 'apertum',
  nft_contract text not null,
  nft_id bigint not null,
  is_complete boolean not null default false,
  transfer_count integer not null default 0,
  checked_at timestamptz not null default now(),
  source text not null default 'blockscout-instance',
  primary key (chain_key,nft_contract,nft_id)
);

alter table public.apertum_nft_transfer_cache enable row level security;
alter table public.apertum_nft_history_coverage enable row level security;

drop policy if exists apertum_nft_transfer_cache_read on public.apertum_nft_transfer_cache;
create policy apertum_nft_transfer_cache_read
  on public.apertum_nft_transfer_cache
  for select to authenticated
  using (true);

drop policy if exists apertum_nft_history_coverage_read on public.apertum_nft_history_coverage;
create policy apertum_nft_history_coverage_read
  on public.apertum_nft_history_coverage
  for select to authenticated
  using (true);

-- Writes intentionally have no authenticated-user policy.
-- Only the Edge Function with service_role may populate this global public-chain cache.

commit;

select
  to_regclass('public.apertum_nft_transfer_cache') is not null as transfer_cache_ready,
  to_regclass('public.apertum_nft_history_coverage') is not null as coverage_ready,
  (select count(*) from pg_policies where schemaname='public' and tablename in
    ('apertum_nft_transfer_cache','apertum_nft_history_coverage')) as rls_policy_count;
