-- Phase 7.23 / Migration 085
-- Least-Privilege fuer globale Stammdaten im exponierten Schema public.
--
-- Ziel:
--   * anon: keinerlei direkte Tabellen-/Sequenzrechte auf globale Stammdaten
--   * authenticated: nur fachlich benoetigte Rechte
--   * service_role: unveraendert
--
-- RLS bleibt die zweite Schutzschicht. Admin-Schreibrechte werden weiterhin durch
-- die vorhandenen Admin-RLS-Policies begrenzt. Diese Migration verschiebt keine
-- Tabellen und veraendert keine Daten.

begin;

-- 1) Bestehende pauschale Rechte entfernen.
revoke all privileges on table public.chains from anon, authenticated;
revoke all privileges on table public.defi_projects from anon, authenticated;
revoke all privileges on table public.defi_project_tokens from anon, authenticated;
revoke all privileges on table public.defi_staking_contracts from anon, authenticated;
revoke all privileges on table public.dex_configs from anon, authenticated;
revoke all privileges on table public.predefined_tokens from anon, authenticated;
revoke all privileges on table public.project_nfts from anon, authenticated;
revoke all privileges on table public.tax_asset_prices from anon, authenticated;
revoke all privileges on table public.tax_fx_rates from anon, authenticated;

-- Identity-Sequenzen dieser Stammdatentabellen ebenfalls nicht anonym exponieren.
revoke all privileges on sequence public.defi_staking_contracts_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_nfts_id_seq from anon, authenticated;

-- 2) Normale eingeloggte User duerfen globale Stammdaten lesen.
grant select on table public.chains to authenticated;
grant select on table public.defi_projects to authenticated;
grant select on table public.defi_project_tokens to authenticated;
grant select on table public.defi_staking_contracts to authenticated;
grant select on table public.dex_configs to authenticated;
grant select on table public.predefined_tokens to authenticated;
grant select on table public.project_nfts to authenticated;
grant select on table public.tax_asset_prices to authenticated;
grant select on table public.tax_fx_rates to authenticated;

-- 3) Browser-Adminmasken brauchen gezielte Schreibrechte.
-- RLS entscheidet weiterhin, ob der eingeloggte User Admin ist.
grant insert, update on table public.chains to authenticated;

grant insert, update, delete on table public.defi_projects to authenticated;
grant insert, update, delete on table public.defi_project_tokens to authenticated;

grant insert, update, delete on table public.dex_configs to authenticated;
grant insert, update, delete on table public.predefined_tokens to authenticated;

grant insert, update, delete on table public.project_nfts to authenticated;
grant usage on sequence public.project_nfts_id_seq to authenticated;

grant insert, update, delete on table public.tax_asset_prices to authenticated;
grant insert, update, delete on table public.tax_fx_rates to authenticated;

-- defi_staking_contracts wird im Browser nur gelesen. Pflege bleibt Backend/SQL/service_role.
-- Deshalb keine INSERT/UPDATE/DELETE- und keine Sequenzrechte fuer authenticated.

-- 4) Schutzpruefung: anon darf keine Operation auf diesen Tabellen mehr besitzen.
do $$
declare
  t text;
  p text;
  master_tables text[] := array[
    'public.chains',
    'public.defi_projects',
    'public.defi_project_tokens',
    'public.defi_staking_contracts',
    'public.dex_configs',
    'public.predefined_tokens',
    'public.project_nfts',
    'public.tax_asset_prices',
    'public.tax_fx_rates'
  ];
  table_privs text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
begin
  foreach t in array master_tables loop
    foreach p in array table_privs loop
      if has_table_privilege('anon', t, p) then
        raise exception 'Migration 085 fehlgeschlagen: anon besitzt weiterhin % auf %', p, t;
      end if;
    end loop;
  end loop;

  if has_sequence_privilege('anon','public.defi_staking_contracts_id_seq','USAGE')
     or has_sequence_privilege('anon','public.defi_staking_contracts_id_seq','SELECT')
     or has_sequence_privilege('anon','public.defi_staking_contracts_id_seq','UPDATE')
     or has_sequence_privilege('anon','public.project_nfts_id_seq','USAGE')
     or has_sequence_privilege('anon','public.project_nfts_id_seq','SELECT')
     or has_sequence_privilege('anon','public.project_nfts_id_seq','UPDATE') then
    raise exception 'Migration 085 fehlgeschlagen: anon besitzt weiterhin Sequenzrechte auf globalen Stammdaten';
  end if;
end $$;

-- 5) Positiv-/Negativpruefung fuer authenticated.
do $$
begin
  -- Leserechte muessen auf allen neun Tabellen vorhanden sein.
  if not (
    has_table_privilege('authenticated','public.chains','SELECT') and
    has_table_privilege('authenticated','public.defi_projects','SELECT') and
    has_table_privilege('authenticated','public.defi_project_tokens','SELECT') and
    has_table_privilege('authenticated','public.defi_staking_contracts','SELECT') and
    has_table_privilege('authenticated','public.dex_configs','SELECT') and
    has_table_privilege('authenticated','public.predefined_tokens','SELECT') and
    has_table_privilege('authenticated','public.project_nfts','SELECT') and
    has_table_privilege('authenticated','public.tax_asset_prices','SELECT') and
    has_table_privilege('authenticated','public.tax_fx_rates','SELECT')
  ) then
    raise exception 'Migration 085 fehlgeschlagen: authenticated SELECT unvollstaendig';
  end if;

  -- Browser-Pflege fuer Chains: kein DELETE.
  if not has_table_privilege('authenticated','public.chains','INSERT')
     or not has_table_privilege('authenticated','public.chains','UPDATE')
     or has_table_privilege('authenticated','public.chains','DELETE') then
    raise exception 'Migration 085 fehlgeschlagen: Chains-Rechte stimmen nicht';
  end if;

  -- Diese Admin-Stammdaten werden im Browser gezielt gepflegt.
  if not (
    has_table_privilege('authenticated','public.defi_projects','INSERT') and
    has_table_privilege('authenticated','public.defi_projects','UPDATE') and
    has_table_privilege('authenticated','public.defi_projects','DELETE') and
    has_table_privilege('authenticated','public.defi_project_tokens','INSERT') and
    has_table_privilege('authenticated','public.defi_project_tokens','UPDATE') and
    has_table_privilege('authenticated','public.defi_project_tokens','DELETE') and
    has_table_privilege('authenticated','public.dex_configs','INSERT') and
    has_table_privilege('authenticated','public.dex_configs','UPDATE') and
    has_table_privilege('authenticated','public.dex_configs','DELETE') and
    has_table_privilege('authenticated','public.predefined_tokens','INSERT') and
    has_table_privilege('authenticated','public.predefined_tokens','UPDATE') and
    has_table_privilege('authenticated','public.predefined_tokens','DELETE') and
    has_table_privilege('authenticated','public.project_nfts','INSERT') and
    has_table_privilege('authenticated','public.project_nfts','UPDATE') and
    has_table_privilege('authenticated','public.project_nfts','DELETE') and
    has_table_privilege('authenticated','public.tax_asset_prices','INSERT') and
    has_table_privilege('authenticated','public.tax_asset_prices','UPDATE') and
    has_table_privilege('authenticated','public.tax_asset_prices','DELETE') and
    has_table_privilege('authenticated','public.tax_fx_rates','INSERT') and
    has_table_privilege('authenticated','public.tax_fx_rates','UPDATE') and
    has_table_privilege('authenticated','public.tax_fx_rates','DELETE')
  ) then
    raise exception 'Migration 085 fehlgeschlagen: Admin-Stammdatenrechte unvollstaendig';
  end if;

  -- Staking-Contract-Stammdaten bleiben fuer Browser strikt read-only.
  if has_table_privilege('authenticated','public.defi_staking_contracts','INSERT')
     or has_table_privilege('authenticated','public.defi_staking_contracts','UPDATE')
     or has_table_privilege('authenticated','public.defi_staking_contracts','DELETE')
     or has_sequence_privilege('authenticated','public.defi_staking_contracts_id_seq','USAGE')
     or has_sequence_privilege('authenticated','public.defi_staking_contracts_id_seq','UPDATE') then
    raise exception 'Migration 085 fehlgeschlagen: defi_staking_contracts ist nicht read-only';
  end if;

  if not has_sequence_privilege('authenticated','public.project_nfts_id_seq','USAGE') then
    raise exception 'Migration 085 fehlgeschlagen: project_nfts_id_seq USAGE fehlt';
  end if;

  -- ALL-typische Zusatzrechte sollen nicht mehr vorhanden sein.
  if has_table_privilege('authenticated','public.chains','TRUNCATE')
     or has_table_privilege('authenticated','public.defi_projects','TRIGGER')
     or has_table_privilege('authenticated','public.predefined_tokens','REFERENCES')
     or has_table_privilege('authenticated','public.tax_asset_prices','TRUNCATE') then
    raise exception 'Migration 085 fehlgeschlagen: authenticated besitzt weiterhin zu breite Tabellenrechte';
  end if;
end $$;

commit;
