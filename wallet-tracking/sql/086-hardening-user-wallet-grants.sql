-- Phase 7.24 / Migration 086
-- Least-Privilege fuer user-/walletbezogene Tabellen im exponierten Schema public.
--
-- Ziel:
--   * anon: keinerlei direkte Tabellen-/Sequenzrechte auf private User-/Walletdaten
--   * authenticated: nur die DML-Operationen, fuer die bereits passende RLS-Policies existieren
--   * service_role: unveraendert
--
-- Diese Migration aendert KEINE RLS-Policies, KEINE Daten und verschiebt KEINE Tabellen.
-- Trading-Cockpit-Tabellen (tm_*) sowie globale Cache-/Jobtabellen sind bewusst NICHT Teil
-- dieses Blocks und werden separat geprueft.

begin;

-- 1) Pauschale Alt-Rechte entfernen.
revoke all privileges on table public.admins from anon, authenticated;
revoke all privileges on table public.chat_messages from anon, authenticated;
revoke all privileges on table public.chat_notification_state from anon, authenticated;
revoke all privileges on table public.dao_partner_bot_lifecycle_cache from anon, authenticated;
revoke all privileges on table public.dao_partner_bot_scan_state from anon, authenticated;
revoke all privileges on table public.discovery_cache from anon, authenticated;
revoke all privileges on table public.lp_history_events from anon, authenticated;
revoke all privileges on table public.lp_position_cache from anon, authenticated;
revoke all privileges on table public.nft_cache from anon, authenticated;
revoke all privileges on table public.project_miner_ownership from anon, authenticated;
revoke all privileges on table public.project_miners from anon, authenticated;
revoke all privileges on table public.project_nft_claims from anon, authenticated;
revoke all privileges on table public.project_nft_ownership from anon, authenticated;
revoke all privileges on table public.project_scan_state from anon, authenticated;
revoke all privileges on table public.project_transaction_asset_flows from anon, authenticated;
revoke all privileges on table public.project_transactions from anon, authenticated;
revoke all privileges on table public.safe_tokens from anon, authenticated;
revoke all privileges on table public.security_crypto_tests from anon, authenticated;
revoke all privileges on table public.snapshot_items from anon, authenticated;
revoke all privileges on table public.snapshots from anon, authenticated;
revoke all privileges on table public.tln_vow_staking_scan_cache from anon, authenticated;
revoke all privileges on table public.tln_wallet_identity_cache from anon, authenticated;
revoke all privileges on table public.user_data_migrations from anon, authenticated;
revoke all privileges on table public.user_release_acknowledgements from anon, authenticated;
revoke all privileges on table public.user_settings from anon, authenticated;
revoke all privileges on table public.user_team_aliases_private from anon, authenticated;
revoke all privileges on table public.user_ui_preferences from anon, authenticated;
revoke all privileges on table public.wallet_current_price_snapshots from anon, authenticated;
revoke all privileges on table public.wallet_fee_cache from anon, authenticated;
revoke all privileges on table public.wallet_fee_transactions from anon, authenticated;
revoke all privileges on table public.wallet_refresh_state from anon, authenticated;
revoke all privileges on table public.wallets from anon, authenticated;
revoke all privileges on table public.year_end_coverage from anon, authenticated;
revoke all privileges on table public.year_end_positions from anon, authenticated;

-- Identity-Sequenzen der userbezogenen Tabellen ebenfalls von Alt-ALL befreien.
revoke all privileges on sequence public.lp_history_events_id_seq from anon, authenticated;
revoke all privileges on sequence public.lp_position_cache_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_miner_ownership_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_nft_claims_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_nft_ownership_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_scan_state_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_transaction_asset_flows_id_seq from anon, authenticated;
revoke all privileges on sequence public.project_transactions_id_seq from anon, authenticated;
revoke all privileges on sequence public.tln_wallet_identity_cache_id_seq from anon, authenticated;
revoke all privileges on sequence public.year_end_coverage_id_seq from anon, authenticated;
revoke all privileges on sequence public.year_end_positions_id_seq from anon, authenticated;

-- 2) Authenticated: nur fachlich benoetigte Rechte entsprechend der bestehenden RLS-Pfade.
grant select on table public.admins to authenticated;
grant select, insert on table public.chat_messages to authenticated;
-- chat_notification_state hat keine Browser-RLS-Policy: bleibt service_role-only.

grant select, insert, update, delete on table public.dao_partner_bot_lifecycle_cache to authenticated;
grant select, insert, update, delete on table public.dao_partner_bot_scan_state to authenticated;
grant select, insert, update on table public.discovery_cache to authenticated;
grant select, insert, update, delete on table public.lp_history_events to authenticated;
grant select, insert, update, delete on table public.lp_position_cache to authenticated;
grant select, insert, update, delete on table public.nft_cache to authenticated;
grant select, insert, update, delete on table public.project_miner_ownership to authenticated;
grant select, insert, update, delete on table public.project_miners to authenticated;
grant select, insert, update, delete on table public.project_nft_claims to authenticated;
grant select, insert, update, delete on table public.project_nft_ownership to authenticated;
grant select, insert, update on table public.project_scan_state to authenticated;
grant select, insert, update, delete on table public.project_transaction_asset_flows to authenticated;
grant select, insert, update, delete on table public.project_transactions to authenticated;
grant select, insert, update, delete on table public.safe_tokens to authenticated;
grant select, insert, delete on table public.security_crypto_tests to authenticated;
grant select, insert, update, delete on table public.snapshot_items to authenticated;
grant select, insert, update, delete on table public.snapshots to authenticated;
grant select, insert, update, delete on table public.tln_vow_staking_scan_cache to authenticated;
grant select, insert, update, delete on table public.tln_wallet_identity_cache to authenticated;
grant select, insert, update on table public.user_data_migrations to authenticated;
grant select, insert, update on table public.user_release_acknowledgements to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.user_team_aliases_private to authenticated;
grant select, insert, update on table public.user_ui_preferences to authenticated;
grant select, insert, update on table public.wallet_current_price_snapshots to authenticated;
grant select, insert, update on table public.wallet_fee_cache to authenticated;
grant select, insert on table public.wallet_fee_transactions to authenticated;
grant select, insert, update on table public.wallet_refresh_state to authenticated;
grant select, insert, update, delete on table public.wallets to authenticated;
grant select, insert, update, delete on table public.year_end_coverage to authenticated;
grant select, insert, update, delete on table public.year_end_positions to authenticated;

-- 3) Sequenzen: nextval/currval fuer Tabellen, in die der Browser unter RLS einfuegen darf.
grant usage, select on sequence public.lp_history_events_id_seq to authenticated;
grant usage, select on sequence public.lp_position_cache_id_seq to authenticated;
grant usage, select on sequence public.project_miner_ownership_id_seq to authenticated;
grant usage, select on sequence public.project_nft_claims_id_seq to authenticated;
grant usage, select on sequence public.project_nft_ownership_id_seq to authenticated;
grant usage, select on sequence public.project_scan_state_id_seq to authenticated;
grant usage, select on sequence public.project_transaction_asset_flows_id_seq to authenticated;
grant usage, select on sequence public.project_transactions_id_seq to authenticated;
grant usage, select on sequence public.tln_wallet_identity_cache_id_seq to authenticated;
grant usage, select on sequence public.year_end_coverage_id_seq to authenticated;
grant usage, select on sequence public.year_end_positions_id_seq to authenticated;

-- 4) Fuer kuenftige Sequenzen keine pauschale anon-Freigabe mehr erben.
alter default privileges for role postgres in schema public revoke all on sequences from anon;

-- 5) Schutzpruefung: anon darf auf diesem Block keinerlei Tabellenrechte mehr besitzen.
do $$
declare
  t text;
  p text;
  private_tables text[] := array[
    'public.admins','public.chat_messages','public.chat_notification_state',
    'public.dao_partner_bot_lifecycle_cache','public.dao_partner_bot_scan_state','public.discovery_cache',
    'public.lp_history_events','public.lp_position_cache','public.nft_cache',
    'public.project_miner_ownership','public.project_miners','public.project_nft_claims',
    'public.project_nft_ownership','public.project_scan_state','public.project_transaction_asset_flows',
    'public.project_transactions','public.safe_tokens','public.security_crypto_tests',
    'public.snapshot_items','public.snapshots','public.tln_vow_staking_scan_cache','public.tln_wallet_identity_cache',
    'public.user_data_migrations','public.user_release_acknowledgements','public.user_settings',
    'public.user_team_aliases_private','public.user_ui_preferences','public.wallet_current_price_snapshots',
    'public.wallet_fee_cache','public.wallet_fee_transactions','public.wallet_refresh_state','public.wallets',
    'public.year_end_coverage','public.year_end_positions'
  ];
  table_privs text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
begin
  foreach t in array private_tables loop
    foreach p in array table_privs loop
      if has_table_privilege('anon', t, p) then
        raise exception 'Migration 086 fehlgeschlagen: anon besitzt weiterhin % auf %', p, t;
      end if;
    end loop;
  end loop;
end $$;

-- 6) Schutzpruefung: keine ALL-typischen Zusatzrechte fuer authenticated.
do $$
declare
  t text;
  p text;
  private_tables text[] := array[
    'public.admins','public.chat_messages','public.chat_notification_state',
    'public.dao_partner_bot_lifecycle_cache','public.dao_partner_bot_scan_state','public.discovery_cache',
    'public.lp_history_events','public.lp_position_cache','public.nft_cache',
    'public.project_miner_ownership','public.project_miners','public.project_nft_claims',
    'public.project_nft_ownership','public.project_scan_state','public.project_transaction_asset_flows',
    'public.project_transactions','public.safe_tokens','public.security_crypto_tests',
    'public.snapshot_items','public.snapshots','public.tln_vow_staking_scan_cache','public.tln_wallet_identity_cache',
    'public.user_data_migrations','public.user_release_acknowledgements','public.user_settings',
    'public.user_team_aliases_private','public.user_ui_preferences','public.wallet_current_price_snapshots',
    'public.wallet_fee_cache','public.wallet_fee_transactions','public.wallet_refresh_state','public.wallets',
    'public.year_end_coverage','public.year_end_positions'
  ];
  extra_privs text[] := array['TRUNCATE','REFERENCES','TRIGGER'];
begin
  foreach t in array private_tables loop
    foreach p in array extra_privs loop
      if has_table_privilege('authenticated', t, p) then
        raise exception 'Migration 086 fehlgeschlagen: authenticated besitzt unerwartet % auf %', p, t;
      end if;
    end loop;
  end loop;

  if has_table_privilege('authenticated','public.chat_notification_state','SELECT')
     or has_table_privilege('authenticated','public.chat_notification_state','INSERT')
     or has_table_privilege('authenticated','public.chat_notification_state','UPDATE')
     or has_table_privilege('authenticated','public.chat_notification_state','DELETE') then
    raise exception 'Migration 086 fehlgeschlagen: chat_notification_state ist nicht service_role-only';
  end if;

  if not has_table_privilege('authenticated','public.wallets','SELECT')
     or not has_table_privilege('authenticated','public.wallets','INSERT')
     or not has_table_privilege('authenticated','public.wallets','UPDATE')
     or not has_table_privilege('authenticated','public.wallets','DELETE') then
    raise exception 'Migration 086 fehlgeschlagen: Wallet-CRUD unvollstaendig';
  end if;

  if has_table_privilege('authenticated','public.discovery_cache','DELETE')
     or has_table_privilege('authenticated','public.wallet_fee_transactions','UPDATE')
     or has_table_privilege('authenticated','public.wallet_fee_transactions','DELETE')
     or has_table_privilege('authenticated','public.project_scan_state','DELETE') then
    raise exception 'Migration 086 fehlgeschlagen: authenticated besitzt nicht benoetigte DML-Rechte';
  end if;
end $$;

commit;
