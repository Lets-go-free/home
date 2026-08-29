-- WalletTracking
-- Migration 021: predefined_tokens um historische Staking-Assets erweitern
--
-- AUSFÜHREN: genau einmal auf der aktuellen Datenbank (nach Migration 020).
-- NICHT erneut ausführen, wenn Migration 021 bereits ausgeführt wurde.
--
-- Ziel:
-- Historische Staking-Assets können in public.predefined_tokens gepflegt werden,
-- ohne sie als heute aktive DEX-LPs oder normale Bestands-Token behandeln zu müssen.
--
-- Bestehende Spalten wie enabled, defi_project_key und defi_category bleiben unverändert.

begin;

alter table public.predefined_tokens
  add column if not exists staking_asset_kind text,
  add column if not exists historical_only boolean not null default false,
  add column if not exists staking_contract_addresses text[] not null default '{}'::text[],
  add column if not exists valid_from_block bigint,
  add column if not exists valid_to_block bigint,
  add column if not exists origin_chain text,
  add column if not exists historical_note text;

comment on column public.predefined_tokens.staking_asset_kind is
  'Optionaler Staking-Asset-Typ. Empfohlene Werte: dex_lp, staking_token, legacy_staking_token. NULL = kein spezielles Staking-Asset.';

comment on column public.predefined_tokens.historical_only is
  'TRUE = Token nur für historische Rekonstruktion/Anzeige; nicht automatisch als heute aktiver Portfolio-Token behandeln.';

comment on column public.predefined_tokens.staking_contract_addresses is
  'Liste bestätigter Staking-Contracts, mit denen dieses Asset historisch oder aktuell verwendet werden darf.';

comment on column public.predefined_tokens.valid_from_block is
  'Optionaler erster BSC/Chain-Block, ab dem die historische Zuordnung als gültig betrachtet wird.';

comment on column public.predefined_tokens.valid_to_block is
  'Optionaler letzter BSC/Chain-Block, bis zu dem die historische Zuordnung als gültig betrachtet wird. NULL = kein bekanntes Ende.';

comment on column public.predefined_tokens.origin_chain is
  'Optionale Ursprungs-Chain eines historischen/gebridgten Assets, z.B. eth.';

comment on column public.predefined_tokens.historical_note is
  'Freitext zur historischen Einordnung; keine Programmlogik daraus ableiten.';

-- Flexible CHECK-Constraint: NULL bleibt für alle normalen Tokens erlaubt.
-- Die drei Werte decken aktuelle DEX-LPs, normale Staking-Tokens und Legacy-Staking-Tokens ab.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'predefined_tokens_staking_asset_kind_chk'
      and conrelid = 'public.predefined_tokens'::regclass
  ) then
    alter table public.predefined_tokens
      add constraint predefined_tokens_staking_asset_kind_chk
      check (
        staking_asset_kind is null
        or staking_asset_kind in ('dex_lp', 'staking_token', 'legacy_staking_token')
      );
  end if;
end $$;

-- Plausibilitätsprüfung für optionale Blockgrenzen.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'predefined_tokens_staking_block_range_chk'
      and conrelid = 'public.predefined_tokens'::regclass
  ) then
    alter table public.predefined_tokens
      add constraint predefined_tokens_staking_block_range_chk
      check (
        valid_from_block is null
        or valid_to_block is null
        or valid_to_block >= valid_from_block
      );
  end if;
end $$;

create index if not exists idx_predefined_tokens_historical_staking
  on public.predefined_tokens (chain, defi_project_key, historical_only, staking_asset_kind);

commit;

-- Kontrolle:
-- select chain, address, symbol, label, enabled, defi_project_key, defi_category,
--        staking_asset_kind, historical_only, staking_contract_addresses,
--        valid_from_block, valid_to_block, origin_chain, historical_note
-- from public.predefined_tokens
-- where historical_only = true
-- order by chain, symbol, address;
