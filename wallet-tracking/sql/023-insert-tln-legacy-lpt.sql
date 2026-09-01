-- WalletTracking
-- Seed/Insert: historischer TLN Legacy-LPT auf BSC
--
-- VORAUSSETZUNG:
-- Migration 021-predefined-token-historical-staking.sql wurde bereits erfolgreich ausgeführt.
--
-- Dieses Script ist absichtlich als UPSERT-ähnlicher, idempotenter Block geschrieben:
-- Existiert der Token bereits für BSC, werden nur die relevanten Projekt-/Historienfelder aktualisiert.
-- Existiert er noch nicht, wird er angelegt.
--
-- Historischer Kontext:
-- BSC Token: 0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995
-- Symbol: LPT
-- Bekannter Original-LPT-Staking-Contract:
-- 0x9a9e97a015ca65f48973835b45d4e28a99f89191
--
-- Wichtig:
-- historical_only = true
-- staking_asset_kind = legacy_staking_token
-- enabled = false
-- Dadurch soll der Token nicht als heute aktiver Portfolio-/Bestands-Token behandelt werden.

begin;

-- 1) Falls bereits vorhanden: vorhandenen Datensatz erweitern.
update public.predefined_tokens
set
  symbol = coalesce(nullif(symbol, ''), 'LPT'),
  label = coalesce(nullif(label, ''), 'TLN Legacy LPT'),
  defi_project_key = 'tln_vow',
  staking_asset_kind = 'legacy_staking_token',
  historical_only = true,
  staking_contract_addresses = array[
    '0x9a9e97a015ca65f48973835b45d4e28a99f89191'
  ]::text[],
  origin_chain = 'eth',
  historical_note = 'Historischer TLN-LPT. Ursprüngliche TLN-Liquidität lief auf Ethereum/Uniswap; LPT konnten später auf BSC gebridgt und dort im Original-LPT-Programm gestakt werden. Heute nicht mehr stakebar.',
  enabled = false
where lower(chain) = 'bsc'
  and lower(address) = '0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995';

-- 2) Nur anlegen, wenn noch kein BSC-Datensatz für diese Adresse existiert.
insert into public.predefined_tokens (
  chain,
  address,
  symbol,
  label,
  enabled,
  defi_project_key,
  defi_category,
  staking_asset_kind,
  historical_only,
  staking_contract_addresses,
  valid_from_block,
  valid_to_block,
  origin_chain,
  historical_note
)
select
  'bsc',
  '0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995',
  'LPT',
  'TLN Legacy LPT',
  false,
  'tln_vow',
  'defi_token',
  'legacy_staking_token',
  true,
  array['0x9a9e97a015ca65f48973835b45d4e28a99f89191']::text[],
  null,
  null,
  'eth',
  'Historischer TLN-LPT. Ursprüngliche TLN-Liquidität lief auf Ethereum/Uniswap; LPT konnten später auf BSC gebridgt und dort im Original-LPT-Programm gestakt werden. Heute nicht mehr stakebar.'
where not exists (
  select 1
  from public.predefined_tokens
  where lower(chain) = 'bsc'
    and lower(address) = '0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995'
);

commit;

-- Kontrolle:
select
  chain,
  address,
  symbol,
  label,
  enabled,
  defi_project_key,
  defi_category,
  staking_asset_kind,
  historical_only,
  staking_contract_addresses,
  valid_from_block,
  valid_to_block,
  origin_chain,
  historical_note
from public.predefined_tokens
where lower(chain) = 'bsc'
  and lower(address) = '0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995';
