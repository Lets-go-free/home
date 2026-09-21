-- WalletTracking
-- 069-wallet-complete-delete.sql
-- Phase 5.81 · Vollständiges Löschen einer einzelnen Wallet
--
-- Ziel:
--   Eine gelöschte Wallet verschwindet vollständig aus allen userbezogenen
--   Beständen, Historien, Snapshots, 31.12.-Stichtagen, Projekt-/Discovery-Caches
--   und daraus abgeleiteten User-Caches. Globale/public On-Chain-Referenzdaten
--   (Token/Contracts, TLN Identity/SmartNode Globalgraph, DAO Tree Registry usw.)
--   werden NICHT gelöscht.
--
-- Die Funktion läuft transaktional innerhalb eines PostgreSQL-Funktionsaufrufs.
-- Sie prüft zwingend auth.uid() + Wallet-Besitz, bevor irgendetwas gelöscht wird.
-- Optionale/ältere Tabellen werden per to_regclass() übersprungen.

begin;

create or replace function public.wallettracking_delete_wallet_complete(
  p_wallet_id uuid,
  p_wallet_alias_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_table text;
  v_rows bigint := 0;
  v_total bigint := 0;
  v_result jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet.';
  end if;

  if p_wallet_id is null then
    raise exception 'Wallet-ID fehlt.';
  end if;

  if not exists (
    select 1
    from public.wallets w
    where w.id = p_wallet_id
      and w.user_id = v_user_id
  ) then
    raise exception 'Wallet existiert nicht oder gehört nicht zum angemeldeten User.';
  end if;

  -- Tabellen mit eindeutiger wallet_id-Zuordnung. wallet_id::text hält die
  -- Funktion kompatibel zu historisch text- bzw. uuid-basierten Cachetabellen.
  foreach v_table in array array[
    'snapshot_items',
    'year_end_positions',
    'wallet_refresh_state',
    'wallet_fee_transactions',
    'wallet_fee_cache',
    'nft_cache',
    'discovery_cache',
    'lp_history_events',
    'lp_position_cache',
    'project_miners',
    'project_miner_ownership',
    'project_nft_claims',
    'project_nft_ownership',
    'project_scan_state',
    'project_transaction_asset_flows',
    'project_transactions',
    'tln_wallet_identity_cache',
    'tln_vow_staking_scan_cache'
  ]
  loop
    if to_regclass('public.' || v_table) is not null then
      execute format(
        'delete from public.%I where user_id = $1 and wallet_id::text = $2',
        v_table
      ) using v_user_id, p_wallet_id::text;
      get diagnostics v_rows = row_count;
      v_total := v_total + v_rows;
      v_result := v_result || jsonb_build_object(v_table, v_rows);
    end if;
  end loop;

  -- Ein __all-Stichtags-Coverage-Datensatz ist nach Entfernen einer Wallet nicht
  -- mehr vollständig. Deshalb löschen wir neben wallet-spezifischen Coverage-
  -- Zeilen auch alle __all-Coverage-Zeilen dieses Users. Der nächste 31.12.-Lauf
  -- baut sie aus den verbleibenden Wallets neu auf.
  if to_regclass('public.year_end_coverage') is not null then
    execute
      'delete from public.year_end_coverage where user_id = $1 and (wallet_scope = $2 or wallet_scope = ''__all'')'
      using v_user_id, p_wallet_id::text;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('year_end_coverage', v_rows);
  end if;

  -- Manuelle/automatische Snapshots besitzen keine gespeicherten Summen; Summen
  -- werden aus snapshot_items berechnet. Nach dem Wallet-Purge entfernen wir nur
  -- Snapshot-Hüllen, die dadurch überhaupt keine Position mehr enthalten.
  if to_regclass('public.snapshots') is not null
     and to_regclass('public.snapshot_items') is not null then
    execute $q$
      delete from public.snapshots s
      where s.user_id = $1
        and not exists (
          select 1 from public.snapshot_items i where i.snapshot_id = s.id
        )
    $q$ using v_user_id;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('empty_snapshots', v_rows);
  end if;

  -- Diese beiden DAO-Caches sind userbezogen, aber aktuell nicht mit einer
  -- Root-wallet_id versehen. Um nach Löschen einer Root-Wallet keine Partner-
  -- Aktivitäten/Scan-States aus dem entfernten Team weiter anzuzeigen, werden
  -- sie für den User vollständig invalidiert und bei Bedarf aus den verbleibenden
  -- Wallets neu aufgebaut. Globale DAO-Tree-Caches bleiben unangetastet.
  foreach v_table in array array[
    'dao_partner_bot_lifecycle_cache',
    'dao_partner_bot_scan_state'
  ]
  loop
    if to_regclass('public.' || v_table) is not null then
      execute format('delete from public.%I where user_id = $1', v_table)
        using v_user_id;
      get diagnostics v_rows = row_count;
      v_total := v_total + v_rows;
      v_result := v_result || jsonb_build_object(v_table, v_rows);
    end if;
  end loop;

  -- Ein persönlicher Alias kann direkt als wallet:<adresse> gespeichert sein.
  -- Die Edge Function berechnet dafür denselben usergebundenen HMAC-Lookup-Key,
  -- ohne die Walletadresse im SQL-Aufruf offenzulegen.
  if p_wallet_alias_hash is not null
     and p_wallet_alias_hash <> ''
     and to_regclass('public.user_team_aliases_private') is not null then
    execute
      'delete from public.user_team_aliases_private where user_id = $1 and reference_hash = $2'
      using v_user_id, p_wallet_alias_hash;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('wallet_aliases', v_rows);
  end if;

  -- Erst ganz am Schluss den Wallet-Stammdatensatz löschen. Sämtliche abhängigen
  -- privaten Daten sind zu diesem Zeitpunkt bereits entfernt bzw. invalidiert.
  delete from public.wallets
  where id = p_wallet_id
    and user_id = v_user_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Wallet-Stammdatensatz konnte nicht eindeutig gelöscht werden.';
  end if;
  v_total := v_total + v_rows;
  v_result := v_result || jsonb_build_object('wallets', v_rows);

  return jsonb_build_object(
    'ok', true,
    'wallet_id', p_wallet_id,
    'deleted_rows', v_total,
    'details', v_result
  );
end;
$$;

revoke all on function public.wallettracking_delete_wallet_complete(uuid,text) from public;
grant execute on function public.wallettracking_delete_wallet_complete(uuid,text) to authenticated;

comment on function public.wallettracking_delete_wallet_complete(uuid,text) is
  'Löscht eine eigene Wallet vollständig aus allen userbezogenen WalletTracking-Daten. Globale On-Chain-/Registry-Fakten bleiben erhalten.';

commit;
