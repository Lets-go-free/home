-- WalletTracking 7.42: Kontolöschung mit Admin-Sperre; Datenreset erhält Adminrechte.
begin;

create or replace function public.wallettracking_delete_all_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
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

  if to_regprocedure('public.wallettracking_delete_wallet_complete(uuid,text)') is null then
    raise exception 'Migration 069-wallet-complete-delete.sql fehlt.';
  end if;

  if to_regclass('public.wallets') is not null then
    for v_wallet in select id from public.wallets where user_id = v_user_id
    loop
      select public.wallettracking_delete_wallet_complete(v_wallet.id, null) into v_wallet_result;
      v_total := v_total + coalesce((v_wallet_result->>'deleted_rows')::bigint, 0);
    end loop;
  end if;

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
        and t.table_name <> 'admins'
      order by case
        when t.table_name in ('snapshot_items','project_transaction_asset_flows','project_nft_ownership') then 0
        when t.table_name in ('snapshots','wallets') then 9
        else 5
      end,
      t.table_name
    loop
      begin
        execute format('delete from public.%I where user_id = $1', v_table.table_name) using v_user_id;
        get diagnostics v_rows = row_count;
        v_total := v_total + v_rows;
        if v_rows > 0 then
          v_details := v_details || jsonb_build_object(v_table.table_name, coalesce((v_details->>v_table.table_name)::bigint,0) + v_rows);
        end if;
      exception when foreign_key_violation then
        null;
      end;
    end loop;
  end loop;

  for v_column in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
        and t.table_name <> 'admins'
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
      v_details := v_details || jsonb_build_object(v_column.table_name || '.' || v_column.column_name, v_rows);
    end if;
  end loop;

  for v_table in
    select t.table_name
    from information_schema.tables t
    join information_schema.columns c
      on c.table_schema = t.table_schema
     and c.table_name = t.table_name
     and c.column_name = 'user_id'
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
        and t.table_name <> 'admins'
    order by t.table_name
  loop
    execute format('select exists(select 1 from public.%I where user_id = $1)', v_table.table_name)
      into v_exists using v_user_id;
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


create or replace function public.wallettracking_delete_own_account(p_confirmation text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_result jsonb;
  v_rows bigint;
  v_column record;
  v_has_files boolean;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet.';
  end if;
  if p_confirmation is distinct from 'KONTO LÖSCHEN' then
    raise exception 'Kontolöschung muss mit KONTO LÖSCHEN bestätigt werden.';
  end if;
  select email into v_email from auth.users where id = v_user_id for update;
  if not found then
    raise exception 'Login-Konto nicht vorhanden.';
  end if;

  -- Fehlende Admin-Struktur ist ein Fehler, keine Erlaubnis zum Löschen.
  -- SHARE verhindert eine gleichzeitige Admin-Zuweisung während dieser Transaktion.
  lock table public.admins in share mode;
  if exists (select 1 from public.admins a
             where a.user_id = v_user_id
                or (v_email is not null and lower(a.email) = lower(v_email))) then
    raise exception 'Admin-Konten können nicht gelöscht werden.';
  end if;

  -- Storage-Metadaten nicht direkt entfernen: Dateien müssen über die Storage-API
  -- gelöscht werden. WalletTracking lädt derzeit keine persönlichen Dateien hoch.
  if to_regclass('storage.objects') is not null then
    for v_column in
      select column_name from information_schema.columns
      where table_schema = 'storage' and table_name = 'objects'
        and column_name in ('owner', 'owner_id')
    loop
      execute format('select exists(select 1 from storage.objects where %I::text = $1)', v_column.column_name)
        into v_has_files using v_user_id::text;
      if v_has_files then
        raise exception 'Kontolöschung blockiert: persönliche Storage-Dateien zuerst entfernen.';
      end if;
    end loop;
  end if;

  v_result := public.wallettracking_delete_all_user_data();
  delete from auth.users where id = v_user_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 or exists(select 1 from auth.users where id = v_user_id) then
    raise exception 'Login-Konto konnte nicht vollständig gelöscht werden.';
  end if;
  return v_result || jsonb_build_object('auth_account_deleted', true);
end;
$$;

revoke all on function public.wallettracking_delete_all_user_data() from public, anon;
grant execute on function public.wallettracking_delete_all_user_data() to authenticated, service_role;
revoke all on function public.wallettracking_delete_own_account(text) from public, anon;
grant execute on function public.wallettracking_delete_own_account(text) to authenticated;

commit;
