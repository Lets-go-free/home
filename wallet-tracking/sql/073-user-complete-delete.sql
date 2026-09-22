-- Phase 5.94 Rebuild · 22.09.2026 14:03:48 CEST · unveränderte Löschlogik, Paketstruktur korrigiert
-- Build 20260922-140348
-- WalletTracking
-- 073-user-complete-delete.sql
-- Phase 5.94 · 22.09.2026 14:03:48 CEST · vollständige Userdaten-Löschung
-- Build 20260922-140348
--
-- Löscht ALLE userbezogenen WalletTracking-Daten des aktuell angemeldeten Users
-- aus public.*. Das Supabase-Auth-Konto selbst bleibt bestehen.
-- Globale öffentliche Blockchain-/Registry-/Token-/Contract-/Preisfakten bleiben
-- erhalten; reine created_by/updated_by-Verweise des Users werden dort anonymisiert.
--
-- Die Funktion ist transaktional: bleibt nach mehreren Lösch-Pässen noch eine
-- user_id-Zeile übrig, wird eine Exception ausgelöst und der gesamte Aufruf
-- zurückgerollt. Damit darf die UI nie einen nur halb gelöschten Zustand als
-- erfolgreich melden.

begin;

create or replace function public.wallettracking_delete_all_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet record;
  v_table record;
  v_column record;
  v_rows bigint := 0;
  v_total bigint := 0;
  v_pass integer := 0;
  v_exists boolean := false;
  v_remaining text[] := array[]::text[];
  v_wallet_result jsonb;
  v_details jsonb := '{}'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet.';
  end if;

  -- Zuerst jede vorhandene Wallet über den bereits geprüften vollständigen
  -- Einzel-Wallet-Purge entfernen. Dadurch werden auch Tabellen bereinigt, die
  -- nicht ausschließlich über user_id, sondern zusätzlich über wallet_id bzw.
  -- abgeleitete Wallet-Caches verbunden sind.
  if to_regprocedure('public.wallettracking_delete_wallet_complete(uuid,text)') is null then
    raise exception 'Migration 069-wallet-complete-delete.sql fehlt.';
  end if;

  if to_regclass('public.wallets') is not null then
    for v_wallet in
      select id from public.wallets where user_id = v_user_id
    loop
      select public.wallettracking_delete_wallet_complete(v_wallet.id, null)
        into v_wallet_result;
      v_total := v_total + coalesce((v_wallet_result->>'deleted_rows')::bigint, 0);
    end loop;
  end if;

  -- Danach generischer Sicherheitsnetz-Purge für ALLE aktuellen und zukünftigen
  -- public-Basistabellen mit user_id. Mehrere Durchläufe erlauben das Auflösen
  -- von FK-Abhängigkeiten, auch wenn neue Tabellen später hinzukommen.
  for v_pass in 1..8 loop
    for v_table in
      select t.table_name
      from information_schema.tables t
      join information_schema.columns c
        on c.table_schema = t.table_schema
       and c.table_name = t.table_name
       and c.column_name = 'user_id'
      where t.table_schema = 'public'
        and t.table_type = 'BASE TABLE'
      order by case
        when t.table_name in ('snapshot_items','project_transaction_asset_flows','project_nft_ownership','project_miner_ownership') then 0
        when t.table_name in ('snapshots','wallets') then 9
        else 5
      end,
      t.table_name
    loop
      begin
        execute format('delete from public.%I where user_id = $1', v_table.table_name)
          using v_user_id;
        get diagnostics v_rows = row_count;
        v_total := v_total + v_rows;
        if v_rows > 0 then
          v_details := v_details || jsonb_build_object(v_table.table_name, coalesce((v_details->>v_table.table_name)::bigint,0) + v_rows);
        end if;
      exception
        when foreign_key_violation then
          -- Ein späterer Pass versucht die Tabelle erneut, nachdem abhängige
          -- Child-Tabellen entfernt wurden.
          null;
      end;
    end loop;
  end loop;

  -- Keine personenbezogene Provenienz in globalen Caches zurücklassen. Die
  -- globalen Fakten selbst werden nicht gelöscht; nur nullable created_by /
  -- updated_by-Verweise auf diesen User werden anonymisiert.
  for v_column in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.column_name in ('created_by','updated_by')
      and c.is_nullable = 'YES'
      and c.data_type = 'uuid'
  loop
    execute format('update public.%I set %I = null where %I = $1',
                   v_column.table_name, v_column.column_name, v_column.column_name)
      using v_user_id;
    get diagnostics v_rows = row_count;
    if v_rows > 0 then
      v_total := v_total + v_rows;
      v_details := v_details || jsonb_build_object(
        v_column.table_name || '.' || v_column.column_name,
        v_rows
      );
    end if;
  end loop;

  -- Harte Abschlussprüfung: Es darf in keiner public-Basistabelle mit user_id
  -- noch eine Zeile dieses Users existieren. Andernfalls Rollback des gesamten
  -- Funktionsaufrufs statt eines unvollständigen Erfolgs.
  for v_table in
    select t.table_name
    from information_schema.tables t
    join information_schema.columns c
      on c.table_schema = t.table_schema
     and c.table_name = t.table_name
     and c.column_name = 'user_id'
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
    order by t.table_name
  loop
    execute format('select exists(select 1 from public.%I where user_id = $1)', v_table.table_name)
      into v_exists
      using v_user_id;
    if v_exists then
      v_remaining := array_append(v_remaining, v_table.table_name);
    end if;
  end loop;

  if coalesce(array_length(v_remaining,1),0) > 0 then
    raise exception 'Vollständige Userdaten-Löschung nicht abgeschlossen. Verbleibende Tabellen: %', array_to_string(v_remaining, ', ');
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'deleted_rows', v_total,
    'auth_account_deleted', false,
    'details', v_details
  );
end;
$$;

revoke all on function public.wallettracking_delete_all_user_data() from public;
grant execute on function public.wallettracking_delete_all_user_data() to authenticated;

comment on function public.wallettracking_delete_all_user_data() is
  'Löscht transaktional alle userbezogenen WalletTracking-Daten des angemeldeten Users aus public.* und anonymisiert User-Provenienz in globalen Caches. Das Auth-Konto bleibt bestehen.';

commit;
