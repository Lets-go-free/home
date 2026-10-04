-- Phase 7.27 / Migration 088
-- Retires two verified obsolete tables only after safety checks.
-- 1) project_miner_ownership: verified empty and replaced by current NFT ownership model.
-- 2) wallet_current_price_snapshots: old per-user current-price cache, replaced by
--    wallet_global_current_price_snapshot + 15-minute refresh-slot flow.

begin;

do $$
declare
  v_count bigint;
  v_latest timestamptz;
begin
  if to_regclass('public.project_miner_ownership') is not null then
    execute 'select count(*) from public.project_miner_ownership' into v_count;
    if v_count <> 0 then
      raise exception 'Migration 088 aborted: project_miner_ownership is no longer empty (% rows). Re-audit before retirement.', v_count;
    end if;
  end if;

  if to_regclass('public.wallet_current_price_snapshots') is not null then
    execute 'select count(*), max(updated_at) from public.wallet_current_price_snapshots'
      into v_count, v_latest;
    if v_count > 2 then
      raise exception 'Migration 088 aborted: wallet_current_price_snapshots now has % rows (expected <= 2). Re-audit before retirement.', v_count;
    end if;
    if v_latest is not null and v_latest > timestamptz '2026-09-19 09:53:44.736+00' then
      raise exception 'Migration 088 aborted: wallet_current_price_snapshots was updated again at %. Re-audit before retirement.', v_latest;
    end if;
  end if;
end
$$;

-- Keep the complete-user purge generic and remove the retired table from the
-- preferred child-table ordering. Function ACLs remain on the same function object.
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

create or replace function public.wallettracking_delete_wallet_complete(
  p_wallet_id uuid,
  p_wallet_alias_hash text default null::text
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
    select 1 from public.wallets w
    where w.id = p_wallet_id and w.user_id = v_user_id
  ) then
    raise exception 'Wallet existiert nicht oder gehört nicht zum angemeldeten User.';
  end if;

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
      execute format('delete from public.%I where user_id = $1 and wallet_id::text = $2', v_table)
        using v_user_id, p_wallet_id::text;
      get diagnostics v_rows = row_count;
      v_total := v_total + v_rows;
      v_result := v_result || jsonb_build_object(v_table, v_rows);
    end if;
  end loop;

  if to_regclass('public.year_end_coverage') is not null then
    execute 'delete from public.year_end_coverage where user_id = $1 and (wallet_scope = $2 or wallet_scope = ''__all'')'
      using v_user_id, p_wallet_id::text;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('year_end_coverage', v_rows);
  end if;

  if to_regclass('public.snapshots') is not null and to_regclass('public.snapshot_items') is not null then
    execute $q$
      delete from public.snapshots s
      where s.user_id = $1
        and not exists (select 1 from public.snapshot_items i where i.snapshot_id = s.id)
    $q$ using v_user_id;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('empty_snapshots', v_rows);
  end if;

  foreach v_table in array array['dao_partner_bot_lifecycle_cache','dao_partner_bot_scan_state']
  loop
    if to_regclass('public.' || v_table) is not null then
      execute format('delete from public.%I where user_id = $1', v_table) using v_user_id;
      get diagnostics v_rows = row_count;
      v_total := v_total + v_rows;
      v_result := v_result || jsonb_build_object(v_table, v_rows);
    end if;
  end loop;

  if p_wallet_alias_hash is not null
     and p_wallet_alias_hash <> ''
     and to_regclass('public.user_team_aliases_private') is not null then
    execute 'delete from public.user_team_aliases_private where user_id = $1 and reference_hash = $2'
      using v_user_id, p_wallet_alias_hash;
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    v_result := v_result || jsonb_build_object('wallet_aliases', v_rows);
  end if;

  delete from public.wallets
  where id = p_wallet_id and user_id = v_user_id;
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

-- Drop with RESTRICT on purpose: any unexpected external dependency aborts this migration.
drop table if exists public.project_miner_ownership restrict;
drop table if exists public.wallet_current_price_snapshots restrict;

commit;
