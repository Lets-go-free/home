


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."current_user_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from auth.users u
    join public.admins a
      on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."current_user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_discovery_cache_cooldown"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_is_admin boolean := false;
begin
  begin
    v_is_admin := coalesce(public.is_admin(auth.uid()), false);
  exception when others then
    v_is_admin := false;
  end;

  if tg_op = 'INSERT' then
    new.next_scan_at := new.scanned_at + interval '30 days';
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.scanned_at is not distinct from old.scanned_at then
      new.next_scan_at := old.next_scan_at;
      new.updated_at := now();
      return new;
    end if;

    if v_is_admin then
      new.next_scan_at := new.scanned_at + interval '30 days';
      new.updated_at := now();
      return new;
    end if;

    if now() < old.next_scan_at then
      raise exception
        'Discovery-Scan für diese Wallet erst wieder ab % möglich.',
        old.next_scan_at
        using errcode = 'P0001';
    end if;

    new.next_scan_at := new.scanned_at + interval '30 days';
    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_discovery_cache_cooldown"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = check_user_id
  );
$$;


ALTER FUNCTION "public"."is_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_chat_read"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_target uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if public.is_admin(auth.uid()) then
    v_target := p_user_id;
    if v_target is null then
      return 0;
    end if;

    update public.chat_messages
       set read_at = now()
     where user_id = v_target
       and sender_type = 'user'
       and read_at is null;
  else
    v_target := auth.uid();

    update public.chat_messages
       set read_at = now()
     where user_id = v_target
       and sender_type = 'admin'
       and read_at is null;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."mark_chat_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_lp_pair_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_factory_address" "text" DEFAULT NULL::"text", "p_token0_address" "text" DEFAULT NULL::"text", "p_token0_symbol" "text" DEFAULT NULL::"text", "p_token1_address" "text" DEFAULT NULL::"text", "p_token1_symbol" "text" DEFAULT NULL::"text", "p_decimals" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.lp_pair_registry(chain_key,pair_address,factory_address,token0_address,token0_symbol,token1_address,token1_symbol,decimals,status,last_seen_at)
  values(lower(trim(p_chain_key)),lower(trim(p_pair_address)),nullif(lower(trim(coalesce(p_factory_address,''))),''),nullif(lower(trim(coalesce(p_token0_address,''))),''),nullif(trim(coalesce(p_token0_symbol,'')),''),nullif(lower(trim(coalesce(p_token1_address,''))),''),nullif(trim(coalesce(p_token1_symbol,'')),''),p_decimals,'pending',now())
  on conflict (chain_key,pair_address) do update set
    factory_address=coalesce(excluded.factory_address,lp_pair_registry.factory_address),
    token0_address=coalesce(excluded.token0_address,lp_pair_registry.token0_address),
    token0_symbol=coalesce(excluded.token0_symbol,lp_pair_registry.token0_symbol),
    token1_address=coalesce(excluded.token1_address,lp_pair_registry.token1_address),
    token1_symbol=coalesce(excluded.token1_symbol,lp_pair_registry.token1_symbol),
    decimals=coalesce(excluded.decimals,lp_pair_registry.decimals),
    last_seen_at=now();
end;
$$;


ALTER FUNCTION "public"."register_lp_pair_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_factory_address" "text", "p_token0_address" "text", "p_token0_symbol" "text", "p_token1_address" "text", "p_token1_symbol" "text", "p_decimals" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_lp_staking_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_contract_address" "text", "p_evidence_tx_hash" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.lp_staking_candidates(chain_key,pair_address,contract_address,evidence_tx_hash,status,last_seen_at)
  values(lower(trim(p_chain_key)),lower(trim(p_pair_address)),lower(trim(p_contract_address)),nullif(lower(trim(coalesce(p_evidence_tx_hash,''))),''),'pending',now())
  on conflict (chain_key,pair_address,contract_address) do update set
    evidence_tx_hash=coalesce(excluded.evidence_tx_hash,lp_staking_candidates.evidence_tx_hash),
    last_seen_at=now();
end;
$$;


ALTER FUNCTION "public"."register_lp_staking_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_contract_address" "text", "p_evidence_tx_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tm_ist_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1 from public.admins a
        where lower(trim(a.email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;


ALTER FUNCTION "public"."tm_ist_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tm_ist_admin_email"("p_email" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1 from public.admins a
        where lower(trim(a.email)) = lower(trim(coalesce(p_email, '')))
    );
$$;


ALTER FUNCTION "public"."tm_ist_admin_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.wallet_global_price_refresh_slots(valuation_version,slot_key,claimed_by)
  values(p_valuation_version,p_slot_key,auth.uid())
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;


ALTER FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wallettracking_cleanup_price_refresh_slots"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from public.wallet_global_price_refresh_slots where claimed_at < now() - interval '7 days';
$$;


ALTER FUNCTION "public"."wallettracking_cleanup_price_refresh_slots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wallettracking_delete_all_user_data"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."wallettracking_delete_all_user_data"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."wallettracking_delete_all_user_data"() IS 'Löscht transaktional alle userbezogenen WalletTracking-Daten des angemeldeten Users aus public.* und anonymisiert User-Provenienz in globalen Caches. Das Auth-Konto bleibt bestehen.';



CREATE OR REPLACE FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") IS 'Löscht eine eigene Wallet vollständig aus allen userbezogenen WalletTracking-Daten. Globale On-Chain-/Registry-Fakten bleiben erhalten.';



CREATE OR REPLACE FUNCTION "public"."wallettracking_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select auth.uid() is not null
     and exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;


ALTER FUNCTION "public"."wallettracking_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wt_sync_aptmdao_tree_data_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.cache_data_versions(namespace,cache_key,data_version,payload_schema_version,row_count,sync_cursor,updated_at,updated_by)
  values ('dao1','aptmdao-tree',new.last_verified_block,1,new.edge_count,new.updated_at,now(),new.updated_by)
  on conflict(namespace,cache_key) do update set
    data_version=excluded.data_version,row_count=excluded.row_count,sync_cursor=excluded.sync_cursor,
    updated_at=excluded.updated_at,updated_by=excluded.updated_by;
  return new;
end; $$;


ALTER FUNCTION "public"."wt_sync_aptmdao_tree_data_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wt_sync_dao1_old_tree_data_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.cache_data_versions(
    namespace, cache_key, data_version, payload_schema_version,
    row_count, sync_cursor, updated_at, updated_by
  ) values (
    'dao1', 'legacy-tree', new.last_verified_block, 1,
    new.edge_count, new.updated_at, now(), new.updated_by
  )
  on conflict(namespace,cache_key) do update set
    data_version = excluded.data_version,
    row_count = excluded.row_count,
    sync_cursor = excluded.sync_cursor,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
  return new;
end;
$$;


ALTER FUNCTION "public"."wt_sync_dao1_old_tree_data_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."wt_sync_tln_smartnode_data_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.cache_data_versions
    (namespace, cache_key, data_version, payload_schema_version, row_count, sync_cursor, updated_at, updated_by)
  values
    ('tln-vow', 'smartnode-global-graph', new.last_verified_block, 1, new.edge_count,
     coalesce(new.updated_at, new.verified_at, now()), now(), new.updated_by)
  on conflict (namespace, cache_key) do update set
    data_version = excluded.data_version,
    payload_schema_version = excluded.payload_schema_version,
    row_count = excluded.row_count,
    sync_cursor = excluded.sync_cursor,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
  return new;
end;
$$;


ALTER FUNCTION "public"."wt_sync_tln_smartnode_data_version"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."tln_vow_smartnode_graph_cache" (
    "chain_key" "text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "child_wallet" "text" NOT NULL,
    "parent_wallet" "text" NOT NULL,
    "join_tx_hash" "text",
    "join_block" bigint,
    "source" "text" DEFAULT 'SmartNode.join(address _referrer)'::"text" NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tln_vow_smartnode_graph_cache_child_format" CHECK (("child_wallet" ~ '^0x[0-9a-f]{40}$'::"text")),
    CONSTRAINT "tln_vow_smartnode_graph_cache_contract_format" CHECK (("contract_address" ~ '^0x[0-9a-f]{40}$'::"text")),
    CONSTRAINT "tln_vow_smartnode_graph_cache_not_self" CHECK (("child_wallet" <> "parent_wallet")),
    CONSTRAINT "tln_vow_smartnode_graph_cache_parent_format" CHECK (("parent_wallet" ~ '^0x[0-9a-f]{40}$'::"text"))
);


ALTER TABLE "public"."tln_vow_smartnode_graph_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."tln_vow_smartnode_graph_cache" IS 'Globaler TLN/VOW SmartNode Child→Parent-Graph aus verifizierten join(address)-Transaktionen. Nicht wallet- oder user-spezifisch.';



CREATE OR REPLACE FUNCTION "public"."wt_tln_smartnode_graph_slice"("p_wallets" "text"[], "p_contract" "text", "p_max_depth" integer DEFAULT 20) RETURNS SETOF "public"."tln_vow_smartnode_graph_cache"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $_$
  with recursive
  roots(wallet) as (
    select distinct lower(x)
    from unnest(coalesce(p_wallets, array[]::text[])) x
    where x ~* '^0x[0-9a-f]{40}$'
  ),
  downline as (
    select g.child_wallet, 1 as depth, array[lower(g.parent_wallet), lower(g.child_wallet)]::text[] as path
    from public.tln_vow_smartnode_graph_cache g
    join roots r on lower(g.parent_wallet)=r.wallet
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
    union all
    select g.child_wallet, d.depth+1, d.path || lower(g.child_wallet)
    from downline d
    join public.tln_vow_smartnode_graph_cache g on lower(g.parent_wallet)=lower(d.child_wallet)
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
      and d.depth < greatest(1, least(coalesce(p_max_depth,20),100))
      and not lower(g.child_wallet)=any(d.path)
  ),
  upline as (
    select g.child_wallet, g.parent_wallet, 1 as depth, array[lower(g.child_wallet),lower(g.parent_wallet)]::text[] as path
    from public.tln_vow_smartnode_graph_cache g
    join roots r on lower(g.child_wallet)=r.wallet
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
    union all
    select g.child_wallet, g.parent_wallet, u.depth+1, u.path || lower(g.parent_wallet)
    from upline u
    join public.tln_vow_smartnode_graph_cache g on lower(g.child_wallet)=lower(u.parent_wallet)
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
      and u.depth < 1000
      and not lower(g.parent_wallet)=any(u.path)
  ),
  wanted(child_wallet) as (
    select child_wallet from downline
    union
    select child_wallet from upline
  )
  select g.*
  from public.tln_vow_smartnode_graph_cache g
  join wanted w on lower(g.child_wallet)=lower(w.child_wallet)
  where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract);
$_$;


ALTER FUNCTION "public"."wt_tln_smartnode_graph_slice"("p_wallets" "text"[], "p_contract" "text", "p_max_depth" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "email" "text" NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apertum_nft_history_coverage" (
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "nft_contract" "text" NOT NULL,
    "nft_id" bigint NOT NULL,
    "is_complete" boolean DEFAULT false NOT NULL,
    "transfer_count" integer DEFAULT 0 NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'blockscout-instance'::"text" NOT NULL
);


ALTER TABLE "public"."apertum_nft_history_coverage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apertum_nft_transfer_cache" (
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "nft_contract" "text" NOT NULL,
    "nft_id" bigint NOT NULL,
    "tx_hash" "text" NOT NULL,
    "log_index" integer DEFAULT 0 NOT NULL,
    "block_number" bigint NOT NULL,
    "block_timestamp" timestamp with time zone,
    "from_address" "text",
    "to_address" "text",
    "source" "text" DEFAULT 'blockscout-instance'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."apertum_nft_transfer_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aptm_price_anchors" (
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "pool_address" "text" NOT NULL,
    "parser_version" integer NOT NULL,
    "target_block" bigint NOT NULL,
    "sync_block" bigint,
    "log_index" integer,
    "tx_hash" "text",
    "aptm_usd" numeric,
    "scanned_from_block" bigint NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "aptm_price_anchors_price_valid" CHECK (((("sync_block" IS NULL) AND ("aptm_usd" IS NULL)) OR (("sync_block" IS NOT NULL) AND ("aptm_usd" IS NOT NULL) AND ("aptm_usd" > (0)::numeric)))),
    CONSTRAINT "aptm_price_anchors_scan_valid" CHECK ((("scanned_from_block" >= 0) AND ("scanned_from_block" <= "target_block"))),
    CONSTRAINT "aptm_price_anchors_sync_valid" CHECK ((("sync_block" IS NULL) OR (("sync_block" >= 0) AND ("sync_block" <= "target_block")))),
    CONSTRAINT "aptm_price_anchors_target_valid" CHECK (("target_block" >= 0))
);


ALTER TABLE "public"."aptm_price_anchors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aptm_price_coverage" (
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "pool_address" "text" NOT NULL,
    "parser_version" integer NOT NULL,
    "from_block" bigint NOT NULL,
    "to_block" bigint NOT NULL,
    "sync_count" integer DEFAULT 0 NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "aptm_price_coverage_valid_range" CHECK ((("from_block" >= 0) AND ("to_block" >= "from_block")))
);


ALTER TABLE "public"."aptm_price_coverage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aptm_price_history" (
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "pool_address" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "log_index" integer NOT NULL,
    "tx_hash" "text",
    "block_timestamp" timestamp with time zone,
    "reserve_aptm" numeric NOT NULL,
    "reserve_usdt" numeric NOT NULL,
    "aptm_usd" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."aptm_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aptmdao_tree_graph_cache" (
    "child_id" bigint NOT NULL,
    "parent_id" bigint NOT NULL,
    "wallet_address" "text",
    "mint_block" bigint DEFAULT 0 NOT NULL,
    "mint_tx_hash" "text",
    "log_index" integer DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "aptmdao_tree_block_nonnegative" CHECK (("mint_block" >= 0)),
    CONSTRAINT "aptmdao_tree_ids_nonnegative" CHECK ((("child_id" > 0) AND ("parent_id" >= 0)))
);


ALTER TABLE "public"."aptmdao_tree_graph_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aptmdao_tree_graph_state" (
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "last_verified_block" bigint DEFAULT 0 NOT NULL,
    "edge_count" bigint DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "aptmdao_tree_state_nonnegative" CHECK ((("last_verified_block" >= 0) AND ("edge_count" >= 0)))
);


ALTER TABLE "public"."aptmdao_tree_graph_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cache_data_versions" (
    "namespace" "text" NOT NULL,
    "cache_key" "text" NOT NULL,
    "data_version" bigint DEFAULT 0 NOT NULL,
    "payload_schema_version" integer DEFAULT 1 NOT NULL,
    "row_count" bigint DEFAULT 0 NOT NULL,
    "sync_cursor" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "cache_data_versions_nonnegative" CHECK ((("data_version" >= 0) AND ("payload_schema_version" > 0) AND ("row_count" >= 0)))
);


ALTER TABLE "public"."cache_data_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."cache_data_versions" IS 'Zentrale kleine Freshness-/Schema-Registry für persistente Browser-Caches. payload_schema_version erzwingt bei strukturellen Payload-Änderungen einen gezielten Vollrefresh.';



CREATE TABLE IF NOT EXISTS "public"."chains" (
    "chain_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "native_symbol" "text" NOT NULL,
    "coingecko_id" "text",
    "wallet_type" "text" NOT NULL,
    "explorer_url_template" "text",
    "geckoterminal_network" "text",
    "sort_order" integer DEFAULT 100 NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "evm_chain_id" bigint,
    "rpc_url" "text",
    "balance_provider" "text",
    "fee_provider" "text",
    "fee_api_base" "text",
    "fee_finality_blocks" integer,
    "fee_overlap_blocks" integer,
    "fees_enabled" boolean DEFAULT false NOT NULL,
    "discovery_enabled" boolean DEFAULT false NOT NULL,
    "approvals_enabled" boolean DEFAULT false NOT NULL,
    "nft_enabled" boolean DEFAULT false NOT NULL,
    "discovery_provider" "text",
    "discovery_api_base" "text",
    "approvals_provider" "text",
    "approvals_api_base" "text",
    "nft_provider" "text",
    "nft_api_base" "text",
    "balance_api_base" "text",
    "display_color" "text",
    "archive_rpc_url" "text",
    "archive_rpc_provider" "text",
    "icon_path" "text"
);


ALTER TABLE "public"."chains" OWNER TO "postgres";


COMMENT ON COLUMN "public"."chains"."archive_rpc_url" IS 'Optionaler Archive-RPC für historische State-Abfragen (Steuer-Stichtag). Wenn leer, wird rpc_url verwendet.';



COMMENT ON COLUMN "public"."chains"."archive_rpc_provider" IS 'Optionale Bezeichnung des Archive-RPC-Providers.';



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sender_type" "text" NOT NULL,
    "sender_email" "text",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    CONSTRAINT "chat_messages_sender_type_check" CHECK (("sender_type" = ANY (ARRAY['user'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_notification_state" (
    "user_id" "uuid" NOT NULL,
    "admin_notified_pending" boolean DEFAULT false NOT NULL,
    "user_notified_pending" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_notification_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dao1_old_tree_graph_cache" (
    "child_id" bigint NOT NULL,
    "parent_id" bigint NOT NULL,
    "wallet_address" "text",
    "mint_block" bigint DEFAULT 0 NOT NULL,
    "mint_tx_hash" "text",
    "log_index" integer DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dao1_old_tree_block_nonnegative" CHECK (("mint_block" >= 0)),
    CONSTRAINT "dao1_old_tree_ids_nonnegative" CHECK ((("child_id" > 0) AND ("parent_id" >= 0)))
);


ALTER TABLE "public"."dao1_old_tree_graph_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."dao1_old_tree_graph_cache" IS 'Globaler alter DAO1 DID child→fid/parent Graph aus verifizierten TokenMinted-Events.';



CREATE TABLE IF NOT EXISTS "public"."dao1_old_tree_graph_state" (
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "last_verified_block" bigint DEFAULT 0 NOT NULL,
    "edge_count" bigint DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dao1_old_tree_state_nonnegative" CHECK ((("last_verified_block" >= 0) AND ("edge_count" >= 0)))
);


ALTER TABLE "public"."dao1_old_tree_graph_state" OWNER TO "postgres";


COMMENT ON TABLE "public"."dao1_old_tree_graph_state" IS 'Globaler Scan-Fortschritt für inkrementelle DAO1-Tree-Aktualisierung mit 24 Block Overlap.';



CREATE TABLE IF NOT EXISTS "public"."dao_partner_bot_lifecycle_cache" (
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "tree_system" "text" NOT NULL,
    "partner_did" bigint,
    "wallet_address" "text" NOT NULL,
    "bot_contract" "text" NOT NULL,
    "bot_id" "text" NOT NULL,
    "bot_type" "text",
    "bot_name" "text",
    "acquired_at" timestamp with time zone,
    "acquisition_tx_hash" "text" NOT NULL,
    "evidence_type" "text" DEFAULT 'same_acquisition_tx'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dao_partner_bot_lifecycle_cache_tree_system_check" CHECK (("tree_system" = ANY (ARRAY['legacy'::"text", 'aptmdao'::"text"])))
);


ALTER TABLE "public"."dao_partner_bot_lifecycle_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dao_partner_bot_scan_state" (
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "wallet_hash" "text" NOT NULL,
    "last_scanned_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "last_error" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dao_partner_bot_scan_state_hash_chk" CHECK (("wallet_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "dao_partner_bot_scan_state_status_chk" CHECK (("status" = ANY (ARRAY['pending'::"text", 'ok'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."dao_partner_bot_scan_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."defi_current_price_snapshots" (
    "project_key" "text" NOT NULL,
    "valuation_version" "text" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "defi_current_price_snapshots_payload_object" CHECK (("jsonb_typeof"("payload") = 'object'::"text"))
);


ALTER TABLE "public"."defi_current_price_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."defi_current_price_snapshots" IS 'Globaler aktueller DeFi-Preis-/Pool-Snapshot. Nicht personenbezogen; automatische Aktualisierung höchstens 1x pro Kalendertag, manuell jederzeit möglich.';



CREATE TABLE IF NOT EXISTS "public"."defi_project_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "role" "text" NOT NULL,
    "symbol" "text",
    "contract_address" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."defi_project_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."defi_projects" (
    "project_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."defi_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."defi_staking_contracts" (
    "id" bigint NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "label" "text" NOT NULL,
    "pair_address" "text",
    "pair_label" "text",
    "role" "text" DEFAULT 'staking'::"text" NOT NULL,
    "classify_transfers" boolean DEFAULT false NOT NULL,
    "lock_days" integer,
    "notes" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."defi_staking_contracts" OWNER TO "postgres";


ALTER TABLE "public"."defi_staking_contracts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."defi_staking_contracts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dex_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chain_key" "text" NOT NULL,
    "dex_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "protocol" "text",
    "version" "text" NOT NULL,
    "factory_address" "text" NOT NULL,
    "router_address" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dex_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discovery_cache" (
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text" NOT NULL,
    "wallet_label" "text",
    "selected_chains" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "findings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "scan_notes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_scan_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "discovery_cache_findings_is_array" CHECK (("jsonb_typeof"("findings") = 'array'::"text")),
    CONSTRAINT "discovery_cache_next_after_scan" CHECK (("next_scan_at" >= ("scanned_at" + '30 days'::interval)))
);


ALTER TABLE "public"."discovery_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."discovery_cache" IS 'Entdecken-Cache: maximal ein erfolgreicher Scan je User und Wallet alle 30 Tage.';



CREATE TABLE IF NOT EXISTS "public"."historical_dex_pair_state_cache" (
    "user_id" "uuid" NOT NULL,
    "chain_key" "text" NOT NULL,
    "pair_address" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "sync_block" bigint,
    "reserve0_raw" "text" NOT NULL,
    "reserve1_raw" "text" NOT NULL,
    "total_supply_raw" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historical_dex_pair_state_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_tax_chain_context_cache" (
    "user_id" "uuid" NOT NULL,
    "chain_key" "text" NOT NULL,
    "target_epoch" bigint NOT NULL,
    "block_number" bigint NOT NULL,
    "block_source" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historical_tax_chain_context_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_token_balance_cache" (
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text",
    "chain_key" "text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "asset_key" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "amount" numeric(78,30) DEFAULT 0 NOT NULL,
    "decimals" integer,
    "balance_source" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historical_token_balance_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historical_token_candidate_cache" (
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text",
    "chain_key" "text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "token_addresses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "discovery_source" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "historical_token_candidate_cache_array" CHECK (("jsonb_typeof"("token_addresses") = 'array'::"text"))
);


ALTER TABLE "public"."historical_token_candidate_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lp_history_events" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "pair_address" "text" NOT NULL,
    "lp_label" "text",
    "token0_address" "text" NOT NULL,
    "token0_symbol" "text",
    "token0_decimals" integer,
    "token1_address" "text" NOT NULL,
    "token1_symbol" "text",
    "token1_decimals" integer,
    "tx_hash" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "tx_timestamp" timestamp with time zone,
    "event_type" "text" NOT NULL,
    "log_index" integer DEFAULT 0 NOT NULL,
    "lp_delta" numeric NOT NULL,
    "amount0" numeric DEFAULT 0 NOT NULL,
    "amount1" numeric DEFAULT 0 NOT NULL,
    "price0_usd" numeric,
    "price1_usd" numeric,
    "value_usd" numeric,
    "price_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "counterparty" "text",
    "staking_contract" "text",
    "staking_label" "text",
    "wallet_id" "uuid",
    CONSTRAINT "lp_history_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['add'::"text", 'remove'::"text", 'send'::"text", 'receive'::"text", 'stake'::"text", 'unstake'::"text"])))
);


ALTER TABLE "public"."lp_history_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."lp_history_events" IS 'Generischer Supabase-Cache für Add-/Remove-Liquidity-Historien (DAO1/Apertum, TLN/VOW BSC PCLP und Ethereum V2-LPs). Aktuelle LP-Bestände/Reserven bleiben live.';



ALTER TABLE "public"."lp_history_events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lp_history_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lp_pair_registry" (
    "chain_key" "text" NOT NULL,
    "pair_address" "text" NOT NULL,
    "factory_address" "text",
    "token0_address" "text",
    "token0_symbol" "text",
    "token1_address" "text",
    "token1_symbol" "text",
    "decimals" integer,
    "project_key" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "lp_pair_registry_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."lp_pair_registry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lp_position_cache" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "pair_address" "text" NOT NULL,
    "lp_label" "text",
    "token0_address" "text" NOT NULL,
    "token0_symbol" "text",
    "token0_decimals" integer,
    "token1_address" "text" NOT NULL,
    "token1_symbol" "text",
    "token1_decimals" integer,
    "current_lp" numeric DEFAULT 0 NOT NULL,
    "current_amount0" numeric DEFAULT 0 NOT NULL,
    "current_amount1" numeric DEFAULT 0 NOT NULL,
    "current_share" numeric DEFAULT 0 NOT NULL,
    "current_usd" numeric,
    "snapshot_date" "date",
    "snapshot_lp" numeric DEFAULT 0 NOT NULL,
    "snapshot_usd" numeric,
    "refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_wallet_lp" numeric DEFAULT 0 NOT NULL,
    "current_staked_lp" numeric DEFAULT 0 NOT NULL,
    "snapshot_wallet_lp" numeric DEFAULT 0 NOT NULL,
    "snapshot_staked_lp" numeric DEFAULT 0 NOT NULL,
    "wallet_id" "uuid"
);


ALTER TABLE "public"."lp_position_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."lp_position_cache" IS 'Persistenter Cache für aktuelle und 31.12.-LP/PCLP-Positionen. Wird nur durch explizites Daten aktualisieren erneuert; Projekt-Tabs lesen beim Öffnen ausschließlich Supabase.';



COMMENT ON COLUMN "public"."lp_position_cache"."current_lp" IS 'Wirtschaftlicher LP-Gesamtbestand: LP in Wallet + offene gestakte LP.';



COMMENT ON COLUMN "public"."lp_position_cache"."snapshot_lp" IS 'Wirtschaftlicher LP-Gesamtbestand am gespeicherten Stichtag: Wallet-LP + damals offene gestakte LP.';



ALTER TABLE "public"."lp_position_cache" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lp_position_cache_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lp_staking_candidates" (
    "chain_key" "text" NOT NULL,
    "pair_address" "text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "project_key" "text",
    "label" "text",
    "evidence_tx_hash" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "lp_staking_candidates_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."lp_staking_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nft_cache" (
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text" NOT NULL,
    "wallet_label" "text" NOT NULL,
    "selected_chains" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "nfts" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nft_cache_nfts_is_array" CHECK (("jsonb_typeof"("nfts") = 'array'::"text"))
);


ALTER TABLE "public"."nft_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."nft_cache" IS 'NFT-Bestand je User/Wallet. Enthält auch userMarkedSpam; Live-Refresh nur auf Benutzerwunsch.';



CREATE TABLE IF NOT EXISTS "public"."predefined_tokens" (
    "chain" "text" NOT NULL,
    "address" "text" NOT NULL,
    "label" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tln_vow_category" "text",
    "symbol" "text",
    "name" "text",
    "coingecko_id" "text",
    "decimals" integer,
    "price_source" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "defi_project_key" "text",
    "defi_category" "text",
    "staking_asset_kind" "text",
    "historical_only" boolean DEFAULT false NOT NULL,
    "staking_contract_addresses" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "valid_from_block" bigint,
    "valid_to_block" bigint,
    "origin_chain" "text",
    "historical_note" "text",
    "display_decimals" smallint DEFAULT 6 NOT NULL,
    "summary_decimals" smallint,
    "dashboard_visible" boolean DEFAULT false NOT NULL,
    "is_native" boolean DEFAULT false NOT NULL,
    CONSTRAINT "predefined_tokens_display_decimals_chk" CHECK ((("display_decimals" >= 0) AND ("display_decimals" <= 18))),
    CONSTRAINT "predefined_tokens_staking_asset_kind_chk" CHECK ((("staking_asset_kind" IS NULL) OR ("staking_asset_kind" = ANY (ARRAY['dex_lp'::"text", 'staking_token'::"text", 'legacy_staking_token'::"text"])))),
    CONSTRAINT "predefined_tokens_staking_block_range_chk" CHECK ((("valid_from_block" IS NULL) OR ("valid_to_block" IS NULL) OR ("valid_to_block" >= "valid_from_block"))),
    CONSTRAINT "predefined_tokens_summary_decimals_chk" CHECK ((("summary_decimals" IS NULL) OR (("summary_decimals" >= 0) AND ("summary_decimals" <= 18)))),
    CONSTRAINT "predefined_tokens_tln_vow_category_check" CHECK ((("tln_vow_category" IS NULL) OR ("tln_vow_category" = ANY (ARRAY['v_currency'::"text", 'lp_token'::"text", 'tln_vow_token'::"text"]))))
);


ALTER TABLE "public"."predefined_tokens" OWNER TO "postgres";


COMMENT ON COLUMN "public"."predefined_tokens"."staking_asset_kind" IS 'Optionaler Staking-Asset-Typ. Empfohlene Werte: dex_lp, staking_token, legacy_staking_token. NULL = kein spezielles Staking-Asset.';



COMMENT ON COLUMN "public"."predefined_tokens"."historical_only" IS 'TRUE = Token nur für historische Rekonstruktion/Anzeige; nicht automatisch als heute aktiver Portfolio-Token behandeln.';



COMMENT ON COLUMN "public"."predefined_tokens"."staking_contract_addresses" IS 'Liste bestätigter Staking-Contracts, mit denen dieses Asset historisch oder aktuell verwendet werden darf.';



COMMENT ON COLUMN "public"."predefined_tokens"."valid_from_block" IS 'Optionaler erster BSC/Chain-Block, ab dem die historische Zuordnung als gültig betrachtet wird.';



COMMENT ON COLUMN "public"."predefined_tokens"."valid_to_block" IS 'Optionaler letzter BSC/Chain-Block, bis zu dem die historische Zuordnung als gültig betrachtet wird. NULL = kein bekanntes Ende.';



COMMENT ON COLUMN "public"."predefined_tokens"."origin_chain" IS 'Optionale Ursprungs-Chain eines historischen/gebridgten Assets, z.B. eth.';



COMMENT ON COLUMN "public"."predefined_tokens"."historical_note" IS 'Freitext zur historischen Einordnung; keine Programmlogik daraus ableiten.';



COMMENT ON COLUMN "public"."predefined_tokens"."display_decimals" IS 'Reine UI-Anzeigepräzision für Tokenmengen; verändert keine Blockchain-decimals oder Berechnungen.';



COMMENT ON COLUMN "public"."predefined_tokens"."summary_decimals" IS 'Dashboard/Summary-Anzeige: NULL = display_decimals übernehmen; 0..18 = explizite Nachkommastellen (0 ist gültig).';



COMMENT ON COLUMN "public"."predefined_tokens"."dashboard_visible" IS 'Zentrale Admin-Auswahl: aktuellen Kurs dieses Tokens im Dashboard anzeigen.';



CREATE TABLE IF NOT EXISTS "public"."project_miner_ownership" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "nft_contract" "text" NOT NULL,
    "nft_id" bigint NOT NULL,
    "wallet_address" "text",
    "owned_from_block" bigint,
    "owned_to_block" bigint,
    "owned_from_at" timestamp with time zone,
    "owned_to_at" timestamp with time zone,
    "is_current" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nft_name" "text",
    "wallet_id" "uuid"
);


ALTER TABLE "public"."project_miner_ownership" OWNER TO "postgres";


ALTER TABLE "public"."project_miner_ownership" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_miner_ownership_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_miners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "wallet_address" "text",
    "nft_contract" "text",
    "nft_id" bigint NOT NULL,
    "label" "text",
    "active_from" timestamp with time zone,
    "active_to" timestamp with time zone,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nft_name" "text",
    "wallet_id" "uuid"
);


ALTER TABLE "public"."project_miners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_nft_claims" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "nft_contract" "text",
    "nft_id" bigint NOT NULL,
    "nft_name" "text",
    "nft_subtype" "text",
    "tx_hash" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "tx_timestamp" timestamp with time zone,
    "param1" "text",
    "param2" "text",
    "reward_aptm" numeric DEFAULT 0,
    "gas_aptm" numeric DEFAULT 0 NOT NULL,
    "net_aptm" numeric DEFAULT 0 NOT NULL,
    "aptm_usd" numeric,
    "reward_usd" numeric,
    "gas_usd" numeric,
    "price_block" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price_source" "text",
    "price_is_manual" boolean DEFAULT false NOT NULL,
    "wallet_id" "uuid",
    "reward_asset_address" "text",
    "reward_asset_symbol" "text",
    "reward_asset_decimals" integer,
    "reward_asset_amount" numeric,
    "reward_asset_usd" numeric,
    "reward_asset_price_source" "text"
);


ALTER TABLE "public"."project_nft_claims" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_nft_claims"."price_source" IS 'Historische APTM/USD-Quelle für den Claim.';



COMMENT ON COLUMN "public"."project_nft_claims"."price_is_manual" IS 'true = historischer Claim-Kurs wurde manuell vom Benutzer eingetragen.';



ALTER TABLE "public"."project_nft_claims" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_nft_claims_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_nft_ownership" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'dao1'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'apertum'::"text" NOT NULL,
    "nft_contract" "text" NOT NULL,
    "nft_id" bigint NOT NULL,
    "nft_name" "text",
    "wallet_address" "text",
    "owned_from_block" bigint,
    "owned_to_block" bigint,
    "owned_from_at" timestamp with time zone,
    "owned_to_at" timestamp with time zone,
    "is_current" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "wallet_id" "uuid",
    "entry_from_address" "text",
    "entry_tx_hash" "text",
    "acquisition_kind" "text",
    "acquisition_verified" boolean DEFAULT false NOT NULL,
    "acquisition_tx_hash" "text"
);


ALTER TABLE "public"."project_nft_ownership" OWNER TO "postgres";


ALTER TABLE "public"."project_nft_ownership" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_nft_ownership_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_nfts" (
    "id" bigint NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "nft_contract" "text" NOT NULL,
    "nft_id" bigint NOT NULL,
    "nft_name" "text",
    "category" "text",
    "subtype" "text",
    "notes" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_nfts" OWNER TO "postgres";


ALTER TABLE "public"."project_nfts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_nfts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_scan_state" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "scan_type" "text" NOT NULL,
    "last_scanned_block" bigint DEFAULT 0 NOT NULL,
    "last_scanned_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_transfers_seen" integer DEFAULT 0 NOT NULL,
    "last_candidate_contracts" integer DEFAULT 0 NOT NULL,
    "last_project_pairs" integer DEFAULT 0 NOT NULL,
    "last_events_saved" integer DEFAULT 0 NOT NULL,
    "last_staking_events" integer DEFAULT 0 NOT NULL,
    "last_scan_result" "text",
    "last_scan_message" "text",
    "wallet_id" "uuid"
);


ALTER TABLE "public"."project_scan_state" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_scan_state"."last_transfers_seen" IS 'ERC20-Transfers im letzten Discovery-Lauf';



COMMENT ON COLUMN "public"."project_scan_state"."last_candidate_contracts" IS 'Unterschiedliche ERC20-Contracts, die als LP-Kandidaten geprüft wurden';



COMMENT ON COLUMN "public"."project_scan_state"."last_project_pairs" IS 'Als Projekt-LPs erkannte Pair-Contracts im letzten Lauf';



COMMENT ON COLUMN "public"."project_scan_state"."last_events_saved" IS 'Neu gespeicherte LP-/Staking-Events im letzten Lauf';



COMMENT ON COLUMN "public"."project_scan_state"."last_staking_events" IS 'Davon neu erkannte Stake-/Unstake-Events';



ALTER TABLE "public"."project_scan_state" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_scan_state_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_transaction_asset_flows" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "flow_key" "text" NOT NULL,
    "tx_hash" "text" NOT NULL,
    "block_number" bigint NOT NULL,
    "tx_timestamp" timestamp with time zone,
    "log_index" integer DEFAULT '-1'::integer NOT NULL,
    "token_address" "text" NOT NULL,
    "token_symbol" "text",
    "token_name" "text",
    "token_decimals" integer DEFAULT 18 NOT NULL,
    "amount_raw" "text" DEFAULT '0'::"text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "counterparty_address" "text",
    "direction" "text" NOT NULL,
    "price_usd" numeric,
    "value_usd" numeric,
    "price_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_transaction_asset_flows" OWNER TO "postgres";


ALTER TABLE "public"."project_transaction_asset_flows" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_transaction_asset_flows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."project_transactions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "tx_hash" "text" NOT NULL,
    "block_number" bigint,
    "tx_timestamp" timestamp with time zone,
    "from_address" "text",
    "to_address" "text",
    "direction" "text",
    "method" "text",
    "selector" "text",
    "status" "text",
    "value_aptm" numeric DEFAULT 0 NOT NULL,
    "gas_aptm" numeric DEFAULT 0 NOT NULL,
    "raw_input" "text",
    "claim_nft_id" bigint,
    "claim_nft_name" "text",
    "claim_nft_subtype" "text",
    "claim_reward_aptm" numeric,
    "aptm_usd" numeric,
    "value_usd" numeric,
    "gas_usd" numeric,
    "claim_reward_usd" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price_source" "text",
    "price_is_manual" boolean DEFAULT false NOT NULL,
    "wallet_id" "uuid"
);


ALTER TABLE "public"."project_transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_transactions"."price_source" IS 'Historische APTM/USD-Quelle, z.B. APTM/wUSDT Pool Sync oder APTM/USDT Marktpreis-Fallback.';



COMMENT ON COLUMN "public"."project_transactions"."price_is_manual" IS 'true = historischer APTM/USD-Kurs wurde manuell vom Benutzer eingetragen.';



ALTER TABLE "public"."project_transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."project_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."safe_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "chain" "text" NOT NULL,
    "address" "text" NOT NULL,
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "admin_status" "text" DEFAULT 'pending'::"text"
);


ALTER TABLE "public"."safe_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_crypto_tests" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "encryption_version" integer NOT NULL,
    "key_version" integer NOT NULL,
    "test_ciphertext" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."security_crypto_tests" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_crypto_tests" IS 'WalletTracking: rein technische Ciphertext-Testzeilen fuer Phase-2-Verschluesselung; keine produktiven Wallet-Daten.';



CREATE TABLE IF NOT EXISTS "public"."snapshot_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "wallet_id" "uuid",
    "wallet_label" "text",
    "chain" "text" NOT NULL,
    "symbol" "text" NOT NULL,
    "address" "text",
    "is_native" boolean DEFAULT false NOT NULL,
    "amount" numeric NOT NULL,
    "price_usd" numeric
);


ALTER TABLE "public"."snapshot_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."snapshot_items"."price_usd" IS 'USD-Kurs des Tokens zum Zeitpunkt der Snapshot-Erstellung. NULL bei alten Snapshots oder wenn kein Kurs verfügbar war.';



CREATE TABLE IF NOT EXISTS "public"."snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_automated" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_asset_prices" (
    "tax_year" integer NOT NULL,
    "asset_code" "text" NOT NULL,
    "price_chf" numeric(36,12) NOT NULL,
    "effective_date" "date" NOT NULL,
    "source_type" "text" DEFAULT 'estv_direct'::"text" NOT NULL,
    "source_name" "text",
    "source_url" "text",
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tax_asset_prices_price_chf_check" CHECK (("price_chf" >= (0)::numeric)),
    CONSTRAINT "tax_asset_prices_source_type_check" CHECK (("source_type" = ANY (ARRAY['estv_direct'::"text", 'manual'::"text"]))),
    CONSTRAINT "tax_asset_prices_tax_year_check" CHECK ((("tax_year" >= 2000) AND ("tax_year" <= 2100)))
);


ALTER TABLE "public"."tax_asset_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_fx_rates" (
    "tax_year" integer NOT NULL,
    "from_currency" "text" NOT NULL,
    "to_currency" "text" NOT NULL,
    "rate" numeric(30,12) NOT NULL,
    "effective_date" "date" NOT NULL,
    "source_name" "text",
    "source_url" "text",
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tax_fx_rates_rate_check" CHECK (("rate" > (0)::numeric)),
    CONSTRAINT "tax_fx_rates_tax_year_check" CHECK ((("tax_year" >= 2000) AND ("tax_year" <= 2100)))
);


ALTER TABLE "public"."tax_fx_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tln_vow_identity_global_cache" (
    "chain_key" "text" NOT NULL,
    "registry_contract" "text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "node_id" numeric(78,0) NOT NULL,
    "source_method" "text" NOT NULL,
    "source_tx_hash" "text",
    "source_block" bigint,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tln_vow_identity_global_cache_contract_format" CHECK (("registry_contract" ~ '^0x[0-9a-f]{40}$'::"text")),
    CONSTRAINT "tln_vow_identity_global_cache_node_positive" CHECK (("node_id" > (0)::numeric)),
    CONSTRAINT "tln_vow_identity_global_cache_wallet_format" CHECK (("wallet_address" ~ '^0x[0-9a-f]{40}$'::"text"))
);


ALTER TABLE "public"."tln_vow_identity_global_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."tln_vow_identity_global_cache" IS 'Globaler user-unabhängiger Cache für verifizierte TLN/VOW Wallet↔TLN-ID On-Chain-Fakten. Keine Partner-Aliase und keine User-Besitzrelation.';



CREATE TABLE IF NOT EXISTS "public"."tln_vow_smartnode_graph_state" (
    "chain_key" "text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "last_verified_block" bigint DEFAULT 0 NOT NULL,
    "transfer_count" bigint DEFAULT 0 NOT NULL,
    "edge_count" bigint DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tln_vow_smartnode_graph_state_contract_format" CHECK (("contract_address" ~ '^0x[0-9a-f]{40}$'::"text")),
    CONSTRAINT "tln_vow_smartnode_graph_state_nonnegative" CHECK ((("last_verified_block" >= 0) AND ("transfer_count" >= 0) AND ("edge_count" >= 0)))
);


ALTER TABLE "public"."tln_vow_smartnode_graph_state" OWNER TO "postgres";


COMMENT ON TABLE "public"."tln_vow_smartnode_graph_state" IS 'Globaler Scan-Fortschritt für den TLN/VOW SmartNode-Graph. Ermöglicht inkrementelle Aktualisierung statt vollständiger Historien-Neuberechnung.';



CREATE TABLE IF NOT EXISTS "public"."tln_vow_staking_scan_cache" (
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'tln_vow'::"text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "wallet_address" "text",
    "cache_key" "text" NOT NULL,
    "scanner_version" "text" NOT NULL,
    "complete_from_block" bigint DEFAULT 0 NOT NULL,
    "last_scanned_block" bigint DEFAULT 0 NOT NULL,
    "payload" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    CONSTRAINT "tln_vow_staking_scan_cache_wallet_lowercase" CHECK (("wallet_address" = "lower"("wallet_address")))
);


ALTER TABLE "public"."tln_vow_staking_scan_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."tln_vow_staking_scan_cache" IS 'Technical TLN/VOW staking chain cache. No cooldown: historical coverage is reused and only the chain tip is refreshed with overlap.';



CREATE TABLE IF NOT EXISTS "public"."tln_vow_technical_global_cache" (
    "chain_key" "text" NOT NULL,
    "scope_address" "text" NOT NULL,
    "cache_key" "text" NOT NULL,
    "scanner_version" "text" NOT NULL,
    "complete_from_block" bigint DEFAULT 0 NOT NULL,
    "last_scanned_block" bigint DEFAULT 0 NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tln_vow_technical_global_cache_scope_format" CHECK (("scope_address" ~ '^0x[0-9a-f]{40}$'::"text"))
);


ALTER TABLE "public"."tln_vow_technical_global_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tln_wallet_identity_cache" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_key" "text" DEFAULT 'tln_vow'::"text" NOT NULL,
    "chain_key" "text" DEFAULT 'bsc'::"text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "node_id" bigint,
    "referred_by_id" bigint,
    "source" "text" NOT NULL,
    "source_contract" "text",
    "source_method" "text",
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_wallet" "text",
    "parent_source" "text",
    "parent_source_hash" "text",
    "parent_verified_at" timestamp with time zone,
    "wallet_id" "uuid",
    CONSTRAINT "tln_wallet_identity_cache_has_identity_chk" CHECK ((("node_id" IS NOT NULL) OR ("referred_by_id" IS NOT NULL))),
    CONSTRAINT "tln_wallet_identity_cache_node_id_chk" CHECK ((("node_id" IS NULL) OR ("node_id" > 0))),
    CONSTRAINT "tln_wallet_identity_cache_referred_by_id_chk" CHECK ((("referred_by_id" IS NULL) OR ("referred_by_id" > 0)))
);


ALTER TABLE "public"."tln_wallet_identity_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."tln_wallet_identity_cache" IS 'User-spezifischer persistenter Cache für bestätigte TLN-/Node-ID-Zuordnungen beliebiger Wallets. Referral-Staker müssen nicht in public.wallets vorhanden sein.';



COMMENT ON COLUMN "public"."tln_wallet_identity_cache"."parent_wallet" IS 'Direkte verifizierte Upline-Wallet dieser wallet_address. Wallet-Adressen sind die technische Referenz des Referral-Graphen.';



COMMENT ON COLUMN "public"."tln_wallet_identity_cache"."parent_source" IS 'Nachweisquelle der direkten Parent-Wallet, z.B. SmartNode Getter oder historische SmartNode.join(address)-Transaktion.';



COMMENT ON COLUMN "public"."tln_wallet_identity_cache"."parent_source_hash" IS 'Optionaler historischer Transaktionshash, falls die Parent-Beziehung über eine konkrete Join-Transaktion verifiziert wurde.';



COMMENT ON COLUMN "public"."tln_wallet_identity_cache"."parent_verified_at" IS 'Zeitpunkt der letzten erfolgreichen On-Chain-Verifizierung der Parent-Wallet-Beziehung.';



ALTER TABLE "public"."tln_wallet_identity_cache" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tln_wallet_identity_cache_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tm_accounts" (
    "account" "text" NOT NULL,
    "strategie" "text",
    "hebel" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inaktiv_seit" "date",
    CONSTRAINT "tm_accounts_hebel_check" CHECK (("hebel" = ANY (ARRAY['x12'::"text", 'x24'::"text"])))
);


ALTER TABLE "public"."tm_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."tm_accounts" IS 'TagMarkets Trading-Konten (Account, Strategie, Hebel)';



COMMENT ON COLUMN "public"."tm_accounts"."inaktiv_seit" IS 'Datum, ab dem der Account nicht mehr aktiv ist (leer = aktiv)';



CREATE TABLE IF NOT EXISTS "public"."tm_trades" (
    "id" bigint NOT NULL,
    "account" "text" NOT NULL,
    "ticket" "text" NOT NULL,
    "platform" "text",
    "open_time" timestamp without time zone,
    "type" "text" NOT NULL,
    "volume" numeric,
    "symbol" "text",
    "open_price" numeric,
    "sl" numeric,
    "tp" numeric,
    "closed_time" timestamp without time zone,
    "close_price" numeric,
    "commission" numeric,
    "taxes" numeric,
    "swap" numeric,
    "profit" numeric NOT NULL,
    "kategorie" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gehebelt" boolean,
    "kategorie_manuell" boolean DEFAULT false NOT NULL,
    CONSTRAINT "tm_trades_kategorie_check" CHECK (("kategorie" = ANY (ARRAY['Einzahlung'::"text", 'Gebühren'::"text", 'Auszahlung'::"text", 'Balance Adjust'::"text"])))
);


ALTER TABLE "public"."tm_trades" OWNER TO "postgres";


COMMENT ON TABLE "public"."tm_trades" IS 'TagMarkets Trades, eindeutig pro Account + Ticket';



COMMENT ON COLUMN "public"."tm_trades"."gehebelt" IS 'Betrag gehebelt? leer = automatisch, true/false = manuell gesetzt';



COMMENT ON COLUMN "public"."tm_trades"."kategorie_manuell" IS 'true = Kategorie von Hand gesetzt, bleibt bei automatischer Neu-Ermittlung unverändert';



ALTER TABLE "public"."tm_trades" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tm_trades_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tm_wallet_transactions" (
    "id" bigint NOT NULL,
    "transaction_id" "text" NOT NULL,
    "date" "date",
    "approved_date" "date",
    "type" "text",
    "details" "text",
    "sub_type" "text",
    "method" "text",
    "status" "text",
    "amount" numeric,
    "net_amount" numeric,
    "currency" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tm_wallet_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."tm_wallet_transactions" IS 'TagMarkets Wallet-Transaktionen, eindeutig pro Transaktions-ID';



ALTER TABLE "public"."tm_wallet_transactions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."tm_wallet_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_data_migrations" (
    "user_id" "uuid" NOT NULL,
    "migration_key" "text" NOT NULL,
    "data_version" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_error" "text",
    "details" "jsonb",
    CONSTRAINT "user_data_migrations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'complete'::"text", 'partial'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."user_data_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_release_acknowledgements" (
    "user_id" "uuid" NOT NULL,
    "release_key" "text" NOT NULL,
    "acknowledged_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_release_acknowledgements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "last_scam_check_date" "date",
    "seen_scam_addresses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "last_auto_load_date" "date"
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_team_aliases_private" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reference_hash" "text" NOT NULL,
    "encryption_version" integer NOT NULL,
    "key_version" integer NOT NULL,
    "reference_ciphertext" "text" NOT NULL,
    "alias_ciphertext" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_team_aliases_private_refhash_ck" CHECK (("reference_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "public"."user_team_aliases_private" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_team_aliases_private" IS 'Private user-spezifische TLN/VOW Partnernamen. Referenz und Alias liegen ausschliesslich verschluesselt vor; reference_hash ist serverseitiger HMAC fuer Lookup/Unique.';



CREATE TABLE IF NOT EXISTS "public"."user_ui_preferences" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'light'::"text" NOT NULL,
    "font_scale" integer DEFAULT 100 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_ui_preferences_font_scale_check" CHECK ((("font_scale" >= 85) AND ("font_scale" <= 125))),
    CONSTRAINT "user_ui_preferences_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text"])))
);


ALTER TABLE "public"."user_ui_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_current_price_snapshots" (
    "user_id" "uuid" NOT NULL,
    "valuation_version" "text" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wallet_current_price_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."wallet_current_price_snapshots" IS 'WalletTracking: benutzerbezogener Tagescache für aktuelle native/token Preise. Automatisch höchstens einmal pro Europe/Zurich-Kalendertag; manuell jederzeit über den zentralen Button Preise aktualisieren.';



CREATE TABLE IF NOT EXISTS "public"."wallet_fee_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text" NOT NULL,
    "chain" "text" NOT NULL,
    "total_fee_native" numeric DEFAULT 0 NOT NULL,
    "tx_count" integer DEFAULT 0 NOT NULL,
    "last_scanned_block" bigint,
    "last_scanned_at" timestamp with time zone,
    "data_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_fee_usd" numeric,
    "usd_complete" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."wallet_fee_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_fee_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text" NOT NULL,
    "chain" "text" NOT NULL,
    "tx_hash" "text" NOT NULL,
    "block_number" bigint,
    "fee_native" numeric DEFAULT 0 NOT NULL,
    "tx_timestamp" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "native_price_usd" numeric,
    "fee_usd" numeric
);


ALTER TABLE "public"."wallet_fee_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_global_current_price_snapshot" (
    "snapshot_key" "text" DEFAULT 'current'::"text" NOT NULL,
    "valuation_version" "text" NOT NULL,
    "slot_key" "text" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallet_global_current_price_snapshot_payload_object" CHECK (("jsonb_typeof"("payload") = 'object'::"text"))
);


ALTER TABLE "public"."wallet_global_current_price_snapshot" OWNER TO "postgres";


COMMENT ON TABLE "public"."wallet_global_current_price_snapshot" IS 'Globaler aktueller WalletTracking-Preisstand. Ein Datensatz wird überschrieben; keine Preis-Historisierung.';



CREATE TABLE IF NOT EXISTS "public"."wallet_global_price_refresh_slots" (
    "valuation_version" "text" NOT NULL,
    "slot_key" "text" NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "claimed_by" "uuid"
);


ALTER TABLE "public"."wallet_global_price_refresh_slots" OWNER TO "postgres";


COMMENT ON TABLE "public"."wallet_global_price_refresh_slots" IS 'Atomare 15-Minuten-Slots für globale Preisaktualisierung; verhindert parallele Jobs mehrerer aktiver Clients.';



CREATE TABLE IF NOT EXISTS "public"."wallet_refresh_state" (
    "user_id" "uuid" NOT NULL,
    "wallet_id" "text" NOT NULL,
    "chain_key" "text" DEFAULT ''::"text" NOT NULL,
    "data_type" "text" NOT NULL,
    "last_checked_at" timestamp with time zone,
    "last_refreshed_at" timestamp with time zone,
    "last_checked_block" bigint,
    "last_nonce" bigint,
    "last_result" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data_version" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."wallet_refresh_state" OWNER TO "postgres";


COMMENT ON COLUMN "public"."wallet_refresh_state"."data_version" IS 'Fachliche Cache-/Algorithmus-Version. Unter Soll-Version muss der Bereich vor Tageslimit/Activity-Check neu aufgebaut werden.';



CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "label" "text" DEFAULT 'Wallet'::"text",
    "evm_address" "text" DEFAULT ''::"text",
    "btc_address" "text" DEFAULT ''::"text",
    "xrp_address" "text" DEFAULT ''::"text",
    "sol_address" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tron_address" "text" DEFAULT ''::"text",
    "akash_address" "text",
    "encryption_version" integer,
    "key_version" integer,
    "label_ciphertext" "text",
    "evm_address_ciphertext" "text",
    "btc_address_ciphertext" "text",
    "xrp_address_ciphertext" "text",
    "sol_address_ciphertext" "text",
    "tron_address_ciphertext" "text",
    "akash_address_ciphertext" "text",
    "is_own_wallet" boolean DEFAULT true NOT NULL,
    "owner_name_ciphertext" "text"
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."wallets"."label" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in label_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."evm_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in evm_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."btc_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in btc_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."xrp_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in xrp_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."sol_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in sol_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."tron_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in tron_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."akash_address" IS 'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in akash_address_ciphertext.';



COMMENT ON COLUMN "public"."wallets"."encryption_version" IS 'Version des serverseitigen Verschluesselungsformats; Phase 1 noch NULL.';



COMMENT ON COLUMN "public"."wallets"."key_version" IS 'Version des serverseitigen Encryption Keys; Phase 1 noch NULL.';



COMMENT ON COLUMN "public"."wallets"."label_ciphertext" IS 'Serverseitig verschluesseltes Wallet-Label; Phase 1 noch NULL.';



COMMENT ON COLUMN "public"."wallets"."evm_address_ciphertext" IS 'Serverseitig verschluesselte EVM-Adresse; Phase 1 noch NULL.';



COMMENT ON COLUMN "public"."wallets"."is_own_wallet" IS 'True = eigenes Wallet des angemeldeten Users; false = Wallet einer benannten anderen Person.';



COMMENT ON COLUMN "public"."wallets"."owner_name_ciphertext" IS 'AES-256-GCM-verschlüsselter Besitzername; Entschlüsselung ausschliesslich über wallet-private.';



CREATE TABLE IF NOT EXISTS "public"."year_end_coverage" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "wallet_scope" "text" DEFAULT '__all'::"text" NOT NULL,
    "chain_key" "text" NOT NULL,
    "status" "text" NOT NULL,
    "scope" "text",
    "detail" "text",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."year_end_coverage" OWNER TO "postgres";


ALTER TABLE "public"."year_end_coverage" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."year_end_coverage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."year_end_positions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "timezone" "text" DEFAULT 'Europe/Zurich'::"text" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "wallet_label" "text",
    "wallet_address" "text",
    "chain_key" "text" NOT NULL,
    "asset_key" "text" NOT NULL,
    "symbol" "text",
    "decimals" integer,
    "amount" numeric,
    "block_ref" bigint,
    "price_usd" numeric,
    "value_usd" numeric,
    "balance_source" "text",
    "price_source" "text",
    "status" "text" DEFAULT 'verifiziert'::"text" NOT NULL,
    "error_message" "text",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."year_end_positions" OWNER TO "postgres";


ALTER TABLE "public"."year_end_positions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."year_end_positions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."apertum_nft_history_coverage"
    ADD CONSTRAINT "apertum_nft_history_coverage_pkey" PRIMARY KEY ("chain_key", "nft_contract", "nft_id");



ALTER TABLE ONLY "public"."apertum_nft_transfer_cache"
    ADD CONSTRAINT "apertum_nft_transfer_cache_pkey" PRIMARY KEY ("chain_key", "nft_contract", "nft_id", "tx_hash", "log_index");



ALTER TABLE ONLY "public"."aptm_price_anchors"
    ADD CONSTRAINT "aptm_price_anchors_pkey" PRIMARY KEY ("pool_address", "parser_version", "target_block");



ALTER TABLE ONLY "public"."aptm_price_coverage"
    ADD CONSTRAINT "aptm_price_coverage_pkey" PRIMARY KEY ("pool_address", "parser_version", "from_block", "to_block");



ALTER TABLE ONLY "public"."aptm_price_history"
    ADD CONSTRAINT "aptm_price_history_pkey" PRIMARY KEY ("pool_address", "block_number", "log_index");



ALTER TABLE ONLY "public"."aptmdao_tree_graph_cache"
    ADD CONSTRAINT "aptmdao_tree_graph_cache_pkey" PRIMARY KEY ("child_id");



ALTER TABLE ONLY "public"."aptmdao_tree_graph_state"
    ADD CONSTRAINT "aptmdao_tree_graph_state_pkey" PRIMARY KEY ("chain_key", "contract_address");



ALTER TABLE ONLY "public"."cache_data_versions"
    ADD CONSTRAINT "cache_data_versions_pkey" PRIMARY KEY ("namespace", "cache_key");



ALTER TABLE ONLY "public"."chains"
    ADD CONSTRAINT "chains_pkey" PRIMARY KEY ("chain_key");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_notification_state"
    ADD CONSTRAINT "chat_notification_state_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."dao1_old_tree_graph_cache"
    ADD CONSTRAINT "dao1_old_tree_graph_cache_pkey" PRIMARY KEY ("child_id");



ALTER TABLE ONLY "public"."dao1_old_tree_graph_state"
    ADD CONSTRAINT "dao1_old_tree_graph_state_pkey" PRIMARY KEY ("chain_key", "contract_address");



ALTER TABLE ONLY "public"."dao_partner_bot_lifecycle_cache"
    ADD CONSTRAINT "dao_partner_bot_lifecycle_cache_pkey" PRIMARY KEY ("user_id", "tree_system", "bot_contract", "bot_id");



ALTER TABLE ONLY "public"."dao_partner_bot_scan_state"
    ADD CONSTRAINT "dao_partner_bot_scan_state_pkey" PRIMARY KEY ("user_id", "project_key", "wallet_hash");



ALTER TABLE ONLY "public"."defi_current_price_snapshots"
    ADD CONSTRAINT "defi_current_price_snapshots_pkey" PRIMARY KEY ("project_key", "valuation_version");



ALTER TABLE ONLY "public"."defi_project_tokens"
    ADD CONSTRAINT "defi_project_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."defi_project_tokens"
    ADD CONSTRAINT "defi_project_tokens_project_key_chain_key_role_contract_add_key" UNIQUE ("project_key", "chain_key", "role", "contract_address");



ALTER TABLE ONLY "public"."defi_projects"
    ADD CONSTRAINT "defi_projects_pkey" PRIMARY KEY ("project_key");



ALTER TABLE ONLY "public"."defi_staking_contracts"
    ADD CONSTRAINT "defi_staking_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."defi_staking_contracts"
    ADD CONSTRAINT "defi_staking_contracts_project_key_chain_key_contract_addre_key" UNIQUE ("project_key", "chain_key", "contract_address");



ALTER TABLE ONLY "public"."dex_configs"
    ADD CONSTRAINT "dex_configs_chain_key_dex_key_key" UNIQUE ("chain_key", "dex_key");



ALTER TABLE ONLY "public"."dex_configs"
    ADD CONSTRAINT "dex_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discovery_cache"
    ADD CONSTRAINT "discovery_cache_pkey" PRIMARY KEY ("user_id", "wallet_id");



ALTER TABLE ONLY "public"."historical_dex_pair_state_cache"
    ADD CONSTRAINT "historical_dex_pair_state_cache_pkey" PRIMARY KEY ("user_id", "chain_key", "pair_address", "block_number");



ALTER TABLE ONLY "public"."historical_tax_chain_context_cache"
    ADD CONSTRAINT "historical_tax_chain_context_cache_pkey" PRIMARY KEY ("user_id", "chain_key", "target_epoch");



ALTER TABLE ONLY "public"."historical_token_balance_cache"
    ADD CONSTRAINT "historical_token_balance_cache_pkey" PRIMARY KEY ("user_id", "chain_key", "wallet_address", "asset_key", "block_number");



ALTER TABLE ONLY "public"."historical_token_candidate_cache"
    ADD CONSTRAINT "historical_token_candidate_cache_pkey" PRIMARY KEY ("user_id", "chain_key", "wallet_address", "block_number");



ALTER TABLE ONLY "public"."lp_history_events"
    ADD CONSTRAINT "lp_history_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lp_history_events"
    ADD CONSTRAINT "lp_history_events_user_id_project_key_chain_key_wallet_addr_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_address", "pair_address", "tx_hash", "event_type");



ALTER TABLE ONLY "public"."lp_history_events"
    ADD CONSTRAINT "lp_history_events_wallet_id_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_id", "pair_address", "tx_hash", "event_type");



ALTER TABLE ONLY "public"."lp_pair_registry"
    ADD CONSTRAINT "lp_pair_registry_pkey" PRIMARY KEY ("chain_key", "pair_address");



ALTER TABLE ONLY "public"."lp_position_cache"
    ADD CONSTRAINT "lp_position_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lp_position_cache"
    ADD CONSTRAINT "lp_position_cache_user_id_project_key_chain_key_wallet_addr_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_address", "pair_address");



ALTER TABLE ONLY "public"."lp_position_cache"
    ADD CONSTRAINT "lp_position_cache_wallet_id_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_id", "pair_address");



ALTER TABLE ONLY "public"."lp_staking_candidates"
    ADD CONSTRAINT "lp_staking_candidates_pkey" PRIMARY KEY ("chain_key", "pair_address", "contract_address");



ALTER TABLE ONLY "public"."nft_cache"
    ADD CONSTRAINT "nft_cache_pkey" PRIMARY KEY ("user_id", "wallet_id");



ALTER TABLE ONLY "public"."predefined_tokens"
    ADD CONSTRAINT "predefined_tokens_pkey" PRIMARY KEY ("chain", "address");



ALTER TABLE ONLY "public"."project_miner_ownership"
    ADD CONSTRAINT "project_miner_ownership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_miners"
    ADD CONSTRAINT "project_miners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_miners"
    ADD CONSTRAINT "project_miners_wallet_id_key" UNIQUE ("user_id", "project_key", "wallet_id", "nft_id");



ALTER TABLE ONLY "public"."project_nft_claims"
    ADD CONSTRAINT "project_nft_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_nft_claims"
    ADD CONSTRAINT "project_nft_claims_user_id_project_key_chain_key_tx_hash_key" UNIQUE ("user_id", "project_key", "chain_key", "tx_hash");



ALTER TABLE ONLY "public"."project_nft_ownership"
    ADD CONSTRAINT "project_nft_ownership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_nfts"
    ADD CONSTRAINT "project_nfts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_nfts"
    ADD CONSTRAINT "project_nfts_project_key_chain_key_nft_contract_nft_id_key" UNIQUE ("project_key", "chain_key", "nft_contract", "nft_id");



ALTER TABLE ONLY "public"."project_scan_state"
    ADD CONSTRAINT "project_scan_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_scan_state"
    ADD CONSTRAINT "project_scan_state_wallet_id_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_id", "scan_type");



ALTER TABLE ONLY "public"."project_transaction_asset_flows"
    ADD CONSTRAINT "project_transaction_asset_flo_user_id_project_key_chain_key_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_id", "flow_key");



ALTER TABLE ONLY "public"."project_transaction_asset_flows"
    ADD CONSTRAINT "project_transaction_asset_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_transactions"
    ADD CONSTRAINT "project_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_transactions"
    ADD CONSTRAINT "project_transactions_wallet_id_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_id", "tx_hash");



ALTER TABLE ONLY "public"."safe_tokens"
    ADD CONSTRAINT "safe_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_crypto_tests"
    ADD CONSTRAINT "security_crypto_tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_items"
    ADD CONSTRAINT "snapshot_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_asset_prices"
    ADD CONSTRAINT "tax_asset_prices_pkey" PRIMARY KEY ("tax_year", "asset_code");



ALTER TABLE ONLY "public"."tax_fx_rates"
    ADD CONSTRAINT "tax_fx_rates_pkey" PRIMARY KEY ("tax_year", "from_currency", "to_currency");



ALTER TABLE ONLY "public"."tln_vow_identity_global_cache"
    ADD CONSTRAINT "tln_vow_identity_global_cache_pk" PRIMARY KEY ("chain_key", "registry_contract", "wallet_address");



ALTER TABLE ONLY "public"."tln_vow_smartnode_graph_cache"
    ADD CONSTRAINT "tln_vow_smartnode_graph_cache_pk" PRIMARY KEY ("chain_key", "contract_address", "child_wallet");



ALTER TABLE ONLY "public"."tln_vow_smartnode_graph_state"
    ADD CONSTRAINT "tln_vow_smartnode_graph_state_pk" PRIMARY KEY ("chain_key", "contract_address");



ALTER TABLE ONLY "public"."tln_vow_staking_scan_cache"
    ADD CONSTRAINT "tln_vow_staking_scan_cache_pkey" PRIMARY KEY ("user_id", "chain_key", "wallet_id", "cache_key");



ALTER TABLE ONLY "public"."tln_vow_technical_global_cache"
    ADD CONSTRAINT "tln_vow_technical_global_cache_pkey" PRIMARY KEY ("chain_key", "scope_address", "cache_key");



ALTER TABLE ONLY "public"."tln_wallet_identity_cache"
    ADD CONSTRAINT "tln_wallet_identity_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tln_wallet_identity_cache"
    ADD CONSTRAINT "tln_wallet_identity_cache_user_id_project_key_chain_key_wal_key" UNIQUE ("user_id", "project_key", "chain_key", "wallet_address");



ALTER TABLE ONLY "public"."tm_accounts"
    ADD CONSTRAINT "tm_accounts_pkey" PRIMARY KEY ("account");



ALTER TABLE ONLY "public"."tm_trades"
    ADD CONSTRAINT "tm_trades_account_ticket_unique" UNIQUE ("account", "ticket");



ALTER TABLE ONLY "public"."tm_trades"
    ADD CONSTRAINT "tm_trades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tm_wallet_transactions"
    ADD CONSTRAINT "tm_wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tm_wallet_transactions"
    ADD CONSTRAINT "tm_wallet_transactions_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."user_data_migrations"
    ADD CONSTRAINT "user_data_migrations_pkey" PRIMARY KEY ("user_id", "migration_key");



ALTER TABLE ONLY "public"."user_release_acknowledgements"
    ADD CONSTRAINT "user_release_acknowledgements_pkey" PRIMARY KEY ("user_id", "release_key");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_team_aliases_private"
    ADD CONSTRAINT "user_team_aliases_private_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_team_aliases_private"
    ADD CONSTRAINT "user_team_aliases_private_user_ref_uk" UNIQUE ("user_id", "reference_hash");



ALTER TABLE ONLY "public"."user_ui_preferences"
    ADD CONSTRAINT "user_ui_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."wallet_current_price_snapshots"
    ADD CONSTRAINT "wallet_current_price_snapshots_pkey" PRIMARY KEY ("user_id", "valuation_version");



ALTER TABLE ONLY "public"."wallet_fee_cache"
    ADD CONSTRAINT "wallet_fee_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_fee_cache"
    ADD CONSTRAINT "wallet_fee_cache_user_id_wallet_id_chain_key" UNIQUE ("user_id", "wallet_id", "chain");



ALTER TABLE ONLY "public"."wallet_fee_transactions"
    ADD CONSTRAINT "wallet_fee_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_fee_transactions"
    ADD CONSTRAINT "wallet_fee_transactions_user_id_wallet_id_chain_tx_hash_key" UNIQUE ("user_id", "wallet_id", "chain", "tx_hash");



ALTER TABLE ONLY "public"."wallet_global_current_price_snapshot"
    ADD CONSTRAINT "wallet_global_current_price_snapshot_pkey" PRIMARY KEY ("snapshot_key", "valuation_version");



ALTER TABLE ONLY "public"."wallet_global_price_refresh_slots"
    ADD CONSTRAINT "wallet_global_price_refresh_slots_pkey" PRIMARY KEY ("valuation_version", "slot_key");



ALTER TABLE ONLY "public"."wallet_refresh_state"
    ADD CONSTRAINT "wallet_refresh_state_pkey" PRIMARY KEY ("user_id", "wallet_id", "chain_key", "data_type");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."year_end_coverage"
    ADD CONSTRAINT "year_end_coverage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."year_end_coverage"
    ADD CONSTRAINT "year_end_coverage_user_id_snapshot_date_wallet_scope_chain__key" UNIQUE ("user_id", "snapshot_date", "wallet_scope", "chain_key");



ALTER TABLE ONLY "public"."year_end_positions"
    ADD CONSTRAINT "year_end_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."year_end_positions"
    ADD CONSTRAINT "year_end_positions_user_id_snapshot_date_wallet_id_chain_ke_key" UNIQUE ("user_id", "snapshot_date", "wallet_id", "chain_key", "asset_key");



CREATE UNIQUE INDEX "admins_user_id_uidx" ON "public"."admins" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "apertum_nft_transfer_cache_lookup_idx" ON "public"."apertum_nft_transfer_cache" USING "btree" ("chain_key", "nft_contract", "nft_id", "block_number", "log_index");



CREATE INDEX "aptm_price_anchors_lookup_idx" ON "public"."aptm_price_anchors" USING "btree" ("pool_address", "parser_version", "target_block");



CREATE INDEX "aptm_price_coverage_lookup_idx" ON "public"."aptm_price_coverage" USING "btree" ("pool_address", "parser_version", "from_block", "to_block");



CREATE INDEX "aptmdao_tree_block_idx" ON "public"."aptmdao_tree_graph_cache" USING "btree" ("mint_block");



CREATE INDEX "aptmdao_tree_parent_idx" ON "public"."aptmdao_tree_graph_cache" USING "btree" ("parent_id");



CREATE INDEX "chat_messages_user_id_idx" ON "public"."chat_messages" USING "btree" ("user_id");



CREATE INDEX "dao1_old_tree_block_idx" ON "public"."dao1_old_tree_graph_cache" USING "btree" ("mint_block");



CREATE INDEX "dao1_old_tree_parent_idx" ON "public"."dao1_old_tree_graph_cache" USING "btree" ("parent_id");



CREATE INDEX "dao_partner_bot_lifecycle_user_date_idx" ON "public"."dao_partner_bot_lifecycle_cache" USING "btree" ("user_id", "acquired_at" DESC);



CREATE INDEX "dao_partner_bot_lifecycle_wallet_idx" ON "public"."dao_partner_bot_lifecycle_cache" USING "btree" ("user_id", "tree_system", "wallet_address");



CREATE INDEX "dao_partner_bot_scan_state_due_idx" ON "public"."dao_partner_bot_scan_state" USING "btree" ("user_id", "project_key", "last_scanned_at");



CREATE INDEX "defi_staking_contracts_lookup_idx" ON "public"."defi_staking_contracts" USING "btree" ("project_key", "chain_key", "enabled", "classify_transfers");



CREATE INDEX "historical_dex_pair_state_lookup_idx" ON "public"."historical_dex_pair_state_cache" USING "btree" ("user_id", "chain_key", "pair_address", "block_number" DESC);



CREATE INDEX "historical_tax_chain_context_checked_idx" ON "public"."historical_tax_chain_context_cache" USING "btree" ("user_id", "checked_at" DESC);



CREATE INDEX "historical_token_balance_cache_checked_idx" ON "public"."historical_token_balance_cache" USING "btree" ("user_id", "checked_at" DESC);



CREATE INDEX "historical_token_balance_cache_wallet_idx" ON "public"."historical_token_balance_cache" USING "btree" ("user_id", "wallet_id", "chain_key", "block_number");



CREATE INDEX "historical_token_candidate_cache_wallet_idx" ON "public"."historical_token_candidate_cache" USING "btree" ("user_id", "wallet_id", "chain_key", "block_number");



CREATE INDEX "idx_defi_current_price_snapshots_captured_at" ON "public"."defi_current_price_snapshots" USING "btree" ("captured_at" DESC);



CREATE INDEX "idx_discovery_cache_scanned_at" ON "public"."discovery_cache" USING "btree" ("scanned_at" DESC);



CREATE INDEX "idx_discovery_cache_user_wallet" ON "public"."discovery_cache" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "idx_nft_cache_refreshed_at" ON "public"."nft_cache" USING "btree" ("refreshed_at" DESC);



CREATE INDEX "idx_predefined_tokens_historical_staking" ON "public"."predefined_tokens" USING "btree" ("chain", "defi_project_key", "historical_only", "staking_asset_kind");



CREATE INDEX "idx_tln_vow_staking_scan_cache_wallet" ON "public"."tln_vow_staking_scan_cache" USING "btree" ("user_id", "chain_key", "wallet_address");



CREATE INDEX "idx_tln_vow_staking_scan_cache_wallet_id" ON "public"."tln_vow_staking_scan_cache" USING "btree" ("user_id", "chain_key", "wallet_id");



CREATE INDEX "lp_history_events_pair_idx" ON "public"."lp_history_events" USING "btree" ("user_id", "project_key", "chain_key", "pair_address", "block_number" DESC);



CREATE INDEX "lp_history_events_user_wallet_id_idx" ON "public"."lp_history_events" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "lp_history_events_wallet_block_idx" ON "public"."lp_history_events" USING "btree" ("user_id", "project_key", "chain_key", "wallet_address", "block_number" DESC);



CREATE INDEX "lp_history_events_wallet_id_block_idx" ON "public"."lp_history_events" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "block_number" DESC);



CREATE INDEX "lp_position_cache_scope_idx" ON "public"."lp_position_cache" USING "btree" ("user_id", "project_key", "chain_key", "wallet_address");



CREATE INDEX "lp_position_cache_user_wallet_id_idx" ON "public"."lp_position_cache" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "lp_position_cache_wallet_id_scope_idx" ON "public"."lp_position_cache" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id");



CREATE UNIQUE INDEX "nft_cache_user_wallet_uq" ON "public"."nft_cache" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_miner_ownership_nft_idx" ON "public"."project_miner_ownership" USING "btree" ("user_id", "project_key", "nft_contract", "nft_id", "owned_from_block");



CREATE INDEX "project_miner_ownership_user_wallet_id_idx" ON "public"."project_miner_ownership" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_miner_ownership_wallet_id_lookup_idx" ON "public"."project_miner_ownership" USING "btree" ("user_id", "project_key", "wallet_id", "nft_contract", "nft_id");



CREATE INDEX "project_miners_user_project_idx" ON "public"."project_miners" USING "btree" ("user_id", "project_key", "enabled");



CREATE INDEX "project_miners_user_wallet_id_idx" ON "public"."project_miners" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_miners_wallet_id_idx" ON "public"."project_miners" USING "btree" ("user_id", "project_key", "wallet_id", "enabled");



CREATE INDEX "project_nft_claims_user_wallet_id_idx" ON "public"."project_nft_claims" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_nft_claims_wallet_id_block_idx" ON "public"."project_nft_claims" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "block_number");



CREATE INDEX "project_nft_ownership_acquisition_idx" ON "public"."project_nft_ownership" USING "btree" ("user_id", "project_key", "chain_key", "nft_contract", "nft_id", "acquisition_verified");



CREATE INDEX "project_nft_ownership_nft_idx" ON "public"."project_nft_ownership" USING "btree" ("user_id", "project_key", "nft_contract", "nft_id", "owned_from_block");



CREATE INDEX "project_nft_ownership_user_wallet_id_idx" ON "public"."project_nft_ownership" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_nft_ownership_wallet_id_lookup_idx" ON "public"."project_nft_ownership" USING "btree" ("user_id", "project_key", "wallet_id", "nft_contract", "nft_id");



CREATE INDEX "project_nft_ownership_wallet_id_nft_idx" ON "public"."project_nft_ownership" USING "btree" ("user_id", "project_key", "wallet_id", "nft_contract", "nft_id");



CREATE INDEX "project_nfts_project_idx" ON "public"."project_nfts" USING "btree" ("project_key", "chain_key", "subtype", "enabled");



CREATE INDEX "project_scan_state_user_wallet_id_idx" ON "public"."project_scan_state" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_scan_state_wallet_id_lookup_idx" ON "public"."project_scan_state" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "scan_type");



CREATE INDEX "project_transaction_asset_flows_token_idx" ON "public"."project_transaction_asset_flows" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "token_address", "block_number" DESC);



CREATE INDEX "project_transaction_asset_flows_tx_idx" ON "public"."project_transaction_asset_flows" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "tx_hash");



CREATE INDEX "project_transaction_asset_flows_wallet_block_idx" ON "public"."project_transaction_asset_flows" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "block_number" DESC);



CREATE INDEX "project_transactions_user_wallet_id_idx" ON "public"."project_transactions" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "project_transactions_wallet_id_block_idx" ON "public"."project_transactions" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "block_number" DESC);



CREATE INDEX "project_transactions_wallet_id_time_idx" ON "public"."project_transactions" USING "btree" ("user_id", "project_key", "chain_key", "wallet_id", "tx_timestamp" DESC);



CREATE INDEX "security_crypto_tests_user_created_idx" ON "public"."security_crypto_tests" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "snapshot_items_snapshot_id_idx" ON "public"."snapshot_items" USING "btree" ("snapshot_id");



CREATE UNIQUE INDEX "tln_vow_identity_global_cache_node_idx" ON "public"."tln_vow_identity_global_cache" USING "btree" ("chain_key", "registry_contract", "node_id");



CREATE INDEX "tln_vow_identity_global_cache_verified_idx" ON "public"."tln_vow_identity_global_cache" USING "btree" ("chain_key", "registry_contract", "verified_at" DESC);



CREATE INDEX "tln_vow_smartnode_graph_cache_join_block_idx" ON "public"."tln_vow_smartnode_graph_cache" USING "btree" ("chain_key", "contract_address", "join_block");



CREATE INDEX "tln_vow_smartnode_graph_cache_parent_idx" ON "public"."tln_vow_smartnode_graph_cache" USING "btree" ("chain_key", "contract_address", "parent_wallet");



CREATE UNIQUE INDEX "tln_vow_smartnode_graph_cache_tx_idx" ON "public"."tln_vow_smartnode_graph_cache" USING "btree" ("chain_key", "contract_address", "join_tx_hash") WHERE ("join_tx_hash" IS NOT NULL);



CREATE INDEX "tln_vow_staking_scan_cache_user_wallet_id_idx" ON "public"."tln_vow_staking_scan_cache" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "tln_vow_technical_global_cache_key_idx" ON "public"."tln_vow_technical_global_cache" USING "btree" ("chain_key", "cache_key", "scope_address");



CREATE INDEX "tln_wallet_identity_cache_parent_wallet_idx" ON "public"."tln_wallet_identity_cache" USING "btree" ("user_id", "project_key", "chain_key", "parent_wallet") WHERE ("parent_wallet" IS NOT NULL);



CREATE INDEX "tln_wallet_identity_cache_user_wallet_id_idx" ON "public"."tln_wallet_identity_cache" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "tln_wallet_identity_cache_wallet_idx" ON "public"."tln_wallet_identity_cache" USING "btree" ("user_id", "project_key", "chain_key", "wallet_address");



CREATE INDEX "tm_trades_open_time_idx" ON "public"."tm_trades" USING "btree" ("open_time" DESC);



CREATE INDEX "tm_wallet_transactions_date_idx" ON "public"."tm_wallet_transactions" USING "btree" ("date" DESC);



CREATE INDEX "user_team_aliases_private_user_updated_idx" ON "public"."user_team_aliases_private" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "wallet_current_price_snapshots_captured_at_idx" ON "public"."wallet_current_price_snapshots" USING "btree" ("user_id", "captured_at" DESC);



CREATE INDEX "wallet_fee_cache_lookup_idx" ON "public"."wallet_fee_cache" USING "btree" ("user_id", "wallet_id", "chain");



CREATE INDEX "wallet_fee_transactions_lookup_idx" ON "public"."wallet_fee_transactions" USING "btree" ("user_id", "wallet_id", "chain", "block_number");



CREATE INDEX "year_end_coverage_user_date_idx" ON "public"."year_end_coverage" USING "btree" ("user_id", "snapshot_date");



CREATE INDEX "year_end_positions_user_date_idx" ON "public"."year_end_positions" USING "btree" ("user_id", "snapshot_date");



CREATE INDEX "year_end_positions_user_wallet_id_idx" ON "public"."year_end_positions" USING "btree" ("user_id", "wallet_id");



CREATE INDEX "year_end_positions_wallet_idx" ON "public"."year_end_positions" USING "btree" ("user_id", "wallet_id", "snapshot_date");



CREATE OR REPLACE TRIGGER "trg_discovery_cache_cooldown" BEFORE INSERT OR UPDATE ON "public"."discovery_cache" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_discovery_cache_cooldown"();



CREATE OR REPLACE TRIGGER "wt_aptmdao_tree_data_version" AFTER INSERT OR UPDATE OF "last_verified_block", "edge_count", "updated_at" ON "public"."aptmdao_tree_graph_state" FOR EACH ROW EXECUTE FUNCTION "public"."wt_sync_aptmdao_tree_data_version"();



CREATE OR REPLACE TRIGGER "wt_dao1_old_tree_data_version" AFTER INSERT OR UPDATE OF "last_verified_block", "edge_count", "updated_at" ON "public"."dao1_old_tree_graph_state" FOR EACH ROW EXECUTE FUNCTION "public"."wt_sync_dao1_old_tree_data_version"();



CREATE OR REPLACE TRIGGER "wt_sync_tln_smartnode_data_version" AFTER INSERT OR UPDATE ON "public"."tln_vow_smartnode_graph_state" FOR EACH ROW EXECUTE FUNCTION "public"."wt_sync_tln_smartnode_data_version"();



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."aptmdao_tree_graph_cache"
    ADD CONSTRAINT "aptmdao_tree_graph_cache_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."aptmdao_tree_graph_cache"
    ADD CONSTRAINT "aptmdao_tree_graph_cache_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."aptmdao_tree_graph_state"
    ADD CONSTRAINT "aptmdao_tree_graph_state_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cache_data_versions"
    ADD CONSTRAINT "cache_data_versions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dao1_old_tree_graph_cache"
    ADD CONSTRAINT "dao1_old_tree_graph_cache_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dao1_old_tree_graph_cache"
    ADD CONSTRAINT "dao1_old_tree_graph_cache_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dao1_old_tree_graph_state"
    ADD CONSTRAINT "dao1_old_tree_graph_state_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dao_partner_bot_lifecycle_cache"
    ADD CONSTRAINT "dao_partner_bot_lifecycle_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dao_partner_bot_scan_state"
    ADD CONSTRAINT "dao_partner_bot_scan_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."defi_project_tokens"
    ADD CONSTRAINT "defi_project_tokens_chain_key_fkey" FOREIGN KEY ("chain_key") REFERENCES "public"."chains"("chain_key");



ALTER TABLE ONLY "public"."defi_project_tokens"
    ADD CONSTRAINT "defi_project_tokens_project_key_fkey" FOREIGN KEY ("project_key") REFERENCES "public"."defi_projects"("project_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dex_configs"
    ADD CONSTRAINT "dex_configs_chain_key_fkey" FOREIGN KEY ("chain_key") REFERENCES "public"."chains"("chain_key");



ALTER TABLE ONLY "public"."discovery_cache"
    ADD CONSTRAINT "discovery_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lp_history_events"
    ADD CONSTRAINT "lp_history_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lp_history_events"
    ADD CONSTRAINT "lp_history_events_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."lp_position_cache"
    ADD CONSTRAINT "lp_position_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lp_position_cache"
    ADD CONSTRAINT "lp_position_cache_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."nft_cache"
    ADD CONSTRAINT "nft_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predefined_tokens"
    ADD CONSTRAINT "predefined_tokens_defi_project_key_fkey" FOREIGN KEY ("defi_project_key") REFERENCES "public"."defi_projects"("project_key");



ALTER TABLE ONLY "public"."project_miner_ownership"
    ADD CONSTRAINT "project_miner_ownership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_miner_ownership"
    ADD CONSTRAINT "project_miner_ownership_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."project_miners"
    ADD CONSTRAINT "project_miners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_miners"
    ADD CONSTRAINT "project_miners_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."project_nft_claims"
    ADD CONSTRAINT "project_nft_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_nft_claims"
    ADD CONSTRAINT "project_nft_claims_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."project_nft_ownership"
    ADD CONSTRAINT "project_nft_ownership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_nft_ownership"
    ADD CONSTRAINT "project_nft_ownership_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."project_nfts"
    ADD CONSTRAINT "project_nfts_project_key_fkey" FOREIGN KEY ("project_key") REFERENCES "public"."defi_projects"("project_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_scan_state"
    ADD CONSTRAINT "project_scan_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_scan_state"
    ADD CONSTRAINT "project_scan_state_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."project_transaction_asset_flows"
    ADD CONSTRAINT "project_transaction_asset_flows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_transactions"
    ADD CONSTRAINT "project_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_transactions"
    ADD CONSTRAINT "project_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."safe_tokens"
    ADD CONSTRAINT "safe_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_crypto_tests"
    ADD CONSTRAINT "security_crypto_tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_items"
    ADD CONSTRAINT "snapshot_items_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_items"
    ADD CONSTRAINT "snapshot_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshots"
    ADD CONSTRAINT "snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tln_vow_identity_global_cache"
    ADD CONSTRAINT "tln_vow_identity_global_cache_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_vow_identity_global_cache"
    ADD CONSTRAINT "tln_vow_identity_global_cache_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_vow_smartnode_graph_cache"
    ADD CONSTRAINT "tln_vow_smartnode_graph_cache_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_vow_smartnode_graph_state"
    ADD CONSTRAINT "tln_vow_smartnode_graph_state_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_vow_staking_scan_cache"
    ADD CONSTRAINT "tln_vow_staking_scan_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tln_vow_staking_scan_cache"
    ADD CONSTRAINT "tln_vow_staking_scan_cache_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."tln_vow_technical_global_cache"
    ADD CONSTRAINT "tln_vow_technical_global_cache_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_vow_technical_global_cache"
    ADD CONSTRAINT "tln_vow_technical_global_cache_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tln_wallet_identity_cache"
    ADD CONSTRAINT "tln_wallet_identity_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tln_wallet_identity_cache"
    ADD CONSTRAINT "tln_wallet_identity_cache_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."tm_trades"
    ADD CONSTRAINT "tm_trades_account_fkey" FOREIGN KEY ("account") REFERENCES "public"."tm_accounts"("account") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."user_data_migrations"
    ADD CONSTRAINT "user_data_migrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_release_acknowledgements"
    ADD CONSTRAINT "user_release_acknowledgements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_team_aliases_private"
    ADD CONSTRAINT "user_team_aliases_private_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ui_preferences"
    ADD CONSTRAINT "user_ui_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_current_price_snapshots"
    ADD CONSTRAINT "wallet_current_price_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_fee_cache"
    ADD CONSTRAINT "wallet_fee_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_fee_transactions"
    ADD CONSTRAINT "wallet_fee_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_refresh_state"
    ADD CONSTRAINT "wallet_refresh_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can read chains" ON "public"."chains" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "admin all chats" ON "public"."chat_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins update all safe_tokens" ON "public"."safe_tokens" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "admins view all safe_tokens" ON "public"."safe_tokens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."apertum_nft_history_coverage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apertum_nft_history_coverage_read" ON "public"."apertum_nft_history_coverage" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."apertum_nft_transfer_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apertum_nft_transfer_cache_read" ON "public"."apertum_nft_transfer_cache" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."aptm_price_anchors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aptm_price_anchors_admin_delete" ON "public"."aptm_price_anchors" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_anchors_admin_insert" ON "public"."aptm_price_anchors" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_anchors_admin_update" ON "public"."aptm_price_anchors" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_anchors_read" ON "public"."aptm_price_anchors" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."aptm_price_coverage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aptm_price_coverage_admin_delete" ON "public"."aptm_price_coverage" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_coverage_admin_insert" ON "public"."aptm_price_coverage" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_coverage_admin_update" ON "public"."aptm_price_coverage" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_coverage_read" ON "public"."aptm_price_coverage" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."aptm_price_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aptm_price_history_admin_insert" ON "public"."aptm_price_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_history_admin_update" ON "public"."aptm_price_history" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "aptm_price_history_read" ON "public"."aptm_price_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."aptmdao_tree_graph_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."aptmdao_tree_graph_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aptmdao_tree_insert" ON "public"."aptmdao_tree_graph_cache" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "aptmdao_tree_select" ON "public"."aptmdao_tree_graph_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "aptmdao_tree_state_insert" ON "public"."aptmdao_tree_graph_state" FOR INSERT TO "authenticated" WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "aptmdao_tree_state_select" ON "public"."aptmdao_tree_graph_state" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "aptmdao_tree_state_update" ON "public"."aptmdao_tree_graph_state" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "aptmdao_tree_update" ON "public"."aptmdao_tree_graph_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."cache_data_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cache_data_versions_insert" ON "public"."cache_data_versions" FOR INSERT TO "authenticated" WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "cache_data_versions_select" ON "public"."cache_data_versions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "cache_data_versions_update" ON "public"."cache_data_versions" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."chains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chains_admin_insert" ON "public"."chains" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "chains_admin_update" ON "public"."chains" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_messages_admin_insert" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_is_admin"() AND ("sender_type" = 'admin'::"text")));



CREATE POLICY "chat_messages_admin_select_all" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING ("public"."current_user_is_admin"());



ALTER TABLE "public"."chat_notification_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "check own admin status" ON "public"."admins" FOR SELECT USING (("email" = ("auth"."jwt"() ->> 'email'::"text")));



ALTER TABLE "public"."dao1_old_tree_graph_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dao1_old_tree_graph_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dao1_old_tree_insert" ON "public"."dao1_old_tree_graph_cache" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "dao1_old_tree_select" ON "public"."dao1_old_tree_graph_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dao1_old_tree_state_insert" ON "public"."dao1_old_tree_graph_state" FOR INSERT TO "authenticated" WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "dao1_old_tree_state_select" ON "public"."dao1_old_tree_graph_state" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dao1_old_tree_state_update" ON "public"."dao1_old_tree_graph_state" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "dao1_old_tree_update" ON "public"."dao1_old_tree_graph_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."dao_partner_bot_lifecycle_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dao_partner_bot_lifecycle_delete" ON "public"."dao_partner_bot_lifecycle_cache" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "dao_partner_bot_lifecycle_insert" ON "public"."dao_partner_bot_lifecycle_cache" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "dao_partner_bot_lifecycle_select" ON "public"."dao_partner_bot_lifecycle_cache" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "dao_partner_bot_lifecycle_update" ON "public"."dao_partner_bot_lifecycle_cache" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."dao_partner_bot_scan_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dao_partner_bot_scan_state_delete" ON "public"."dao_partner_bot_scan_state" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dao_partner_bot_scan_state_insert" ON "public"."dao_partner_bot_scan_state" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "dao_partner_bot_scan_state_select" ON "public"."dao_partner_bot_scan_state" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dao_partner_bot_scan_state_update" ON "public"."dao_partner_bot_scan_state" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."defi_current_price_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defi_current_price_snapshots_insert" ON "public"."defi_current_price_snapshots" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "defi_current_price_snapshots_select" ON "public"."defi_current_price_snapshots" FOR SELECT USING (true);



CREATE POLICY "defi_current_price_snapshots_update" ON "public"."defi_current_price_snapshots" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."defi_project_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defi_project_tokens_admin_all" ON "public"."defi_project_tokens" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "defi_project_tokens_read" ON "public"."defi_project_tokens" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."defi_projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defi_projects_admin_all" ON "public"."defi_projects" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "defi_projects_read" ON "public"."defi_projects" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."defi_staking_contracts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "defi_staking_contracts_select_authenticated" ON "public"."defi_staking_contracts" FOR SELECT TO "authenticated" USING (("enabled" = true));



CREATE POLICY "delete own tokens" ON "public"."safe_tokens" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "delete own wallets" ON "public"."wallets" FOR DELETE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."dex_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dex_configs_admin_all" ON "public"."dex_configs" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "dex_configs_read" ON "public"."dex_configs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."discovery_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discovery_cache_insert_own" ON "public"."discovery_cache" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "discovery_cache_select_own" ON "public"."discovery_cache" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "discovery_cache_update_own" ON "public"."discovery_cache" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."historical_dex_pair_state_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historical_dex_pair_state_own" ON "public"."historical_dex_pair_state_cache" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."historical_tax_chain_context_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historical_tax_chain_context_own" ON "public"."historical_tax_chain_context_cache" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."historical_token_balance_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historical_token_balance_cache_own" ON "public"."historical_token_balance_cache" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."historical_token_candidate_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "historical_token_candidate_cache_own" ON "public"."historical_token_candidate_cache" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert own tokens" ON "public"."safe_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert own wallets" ON "public"."wallets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."lp_history_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lp_history_events_delete_own" ON "public"."lp_history_events" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_history_events_insert_own" ON "public"."lp_history_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_history_events_no_plain_wallet_insert" ON "public"."lp_history_events" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "lp_history_events_no_plain_wallet_update" ON "public"."lp_history_events" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "lp_history_events_select_own" ON "public"."lp_history_events" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_history_events_update_own" ON "public"."lp_history_events" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."lp_pair_registry" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lp_pair_registry_admin_write" ON "public"."lp_pair_registry" TO "authenticated" USING ("public"."wallettracking_is_admin"()) WITH CHECK ("public"."wallettracking_is_admin"());



CREATE POLICY "lp_pair_registry_read_authenticated" ON "public"."lp_pair_registry" FOR SELECT TO "authenticated" USING ((("status" = 'verified'::"text") OR "public"."wallettracking_is_admin"()));



ALTER TABLE "public"."lp_position_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lp_position_cache_delete_own" ON "public"."lp_position_cache" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_position_cache_insert_own" ON "public"."lp_position_cache" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_position_cache_no_plain_wallet_insert" ON "public"."lp_position_cache" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "lp_position_cache_no_plain_wallet_update" ON "public"."lp_position_cache" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "lp_position_cache_select_own" ON "public"."lp_position_cache" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "lp_position_cache_update_own" ON "public"."lp_position_cache" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."lp_staking_candidates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lp_staking_candidates_admin_write" ON "public"."lp_staking_candidates" TO "authenticated" USING ("public"."wallettracking_is_admin"()) WITH CHECK ("public"."wallettracking_is_admin"());



CREATE POLICY "lp_staking_candidates_read_authenticated" ON "public"."lp_staking_candidates" FOR SELECT TO "authenticated" USING ((("status" = 'verified'::"text") OR "public"."wallettracking_is_admin"()));



ALTER TABLE "public"."nft_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "nft_cache_delete_own" ON "public"."nft_cache" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "nft_cache_insert_own" ON "public"."nft_cache" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "nft_cache_select_own" ON "public"."nft_cache" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "nft_cache_update_own" ON "public"."nft_cache" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own settings" ON "public"."user_settings" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own snapshot items" ON "public"."snapshot_items" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own snapshots" ON "public"."snapshots" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."predefined_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predefined_tokens_admin_delete" ON "public"."predefined_tokens" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("lower"("a"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "predefined_tokens_admin_insert" ON "public"."predefined_tokens" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("lower"("a"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "predefined_tokens_admin_update" ON "public"."predefined_tokens" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("lower"("a"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("lower"("a"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "predefined_tokens_authenticated_select" ON "public"."predefined_tokens" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."project_miner_ownership" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_miner_ownership_delete_own" ON "public"."project_miner_ownership" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miner_ownership_insert_own" ON "public"."project_miner_ownership" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miner_ownership_no_plain_wallet_insert" ON "public"."project_miner_ownership" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_miner_ownership_no_plain_wallet_update" ON "public"."project_miner_ownership" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_miner_ownership_select_own" ON "public"."project_miner_ownership" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miner_ownership_update_own" ON "public"."project_miner_ownership" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_miners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_miners_delete_own" ON "public"."project_miners" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miners_insert_own" ON "public"."project_miners" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miners_no_plain_wallet_insert" ON "public"."project_miners" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_miners_no_plain_wallet_update" ON "public"."project_miners" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_miners_select_own" ON "public"."project_miners" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_miners_update_own" ON "public"."project_miners" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_nft_claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_nft_claims_delete_own" ON "public"."project_nft_claims" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_claims_insert_own" ON "public"."project_nft_claims" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_claims_no_plain_wallet_insert" ON "public"."project_nft_claims" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_nft_claims_no_plain_wallet_update" ON "public"."project_nft_claims" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_nft_claims_select_own" ON "public"."project_nft_claims" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_claims_update_own" ON "public"."project_nft_claims" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_nft_ownership" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_nft_ownership_delete_own" ON "public"."project_nft_ownership" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_ownership_insert_own" ON "public"."project_nft_ownership" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_ownership_no_plain_wallet_insert" ON "public"."project_nft_ownership" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_nft_ownership_no_plain_wallet_update" ON "public"."project_nft_ownership" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_nft_ownership_select_own" ON "public"."project_nft_ownership" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_nft_ownership_update_own" ON "public"."project_nft_ownership" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_nfts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_nfts_admin_delete" ON "public"."project_nfts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "project_nfts_admin_insert" ON "public"."project_nfts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "project_nfts_admin_update" ON "public"."project_nfts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "project_nfts_read" ON "public"."project_nfts" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."project_scan_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_scan_state_insert_own" ON "public"."project_scan_state" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_scan_state_no_plain_wallet_insert" ON "public"."project_scan_state" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_scan_state_no_plain_wallet_update" ON "public"."project_scan_state" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_scan_state_select_own" ON "public"."project_scan_state" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_scan_state_update_own" ON "public"."project_scan_state" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_transaction_asset_flows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_transaction_asset_flows_delete_own" ON "public"."project_transaction_asset_flows" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transaction_asset_flows_insert_own" ON "public"."project_transaction_asset_flows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transaction_asset_flows_select_own" ON "public"."project_transaction_asset_flows" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transaction_asset_flows_update_own" ON "public"."project_transaction_asset_flows" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."project_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_transactions_delete_own" ON "public"."project_transactions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transactions_insert_own" ON "public"."project_transactions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transactions_no_plain_wallet_insert" ON "public"."project_transactions" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_transactions_no_plain_wallet_update" ON "public"."project_transactions" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "project_transactions_select_own" ON "public"."project_transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "project_transactions_update_own" ON "public"."project_transactions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."safe_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_crypto_tests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_crypto_tests_delete_own" ON "public"."security_crypto_tests" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "security_crypto_tests_insert_own" ON "public"."security_crypto_tests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "security_crypto_tests_select_own" ON "public"."security_crypto_tests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select own tokens" ON "public"."safe_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select own wallets" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "smartnode_graph_authenticated_insert" ON "public"."tln_vow_smartnode_graph_cache" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "smartnode_graph_authenticated_select" ON "public"."tln_vow_smartnode_graph_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "smartnode_graph_authenticated_update" ON "public"."tln_vow_smartnode_graph_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "smartnode_state_authenticated_insert" ON "public"."tln_vow_smartnode_graph_state" FOR INSERT TO "authenticated" WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "smartnode_state_authenticated_select" ON "public"."tln_vow_smartnode_graph_state" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "smartnode_state_authenticated_update" ON "public"."tln_vow_smartnode_graph_state" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."snapshot_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staking_scan_cache_delete_own" ON "public"."tln_vow_staking_scan_cache" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "staking_scan_cache_insert_own" ON "public"."tln_vow_staking_scan_cache" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "staking_scan_cache_select_own" ON "public"."tln_vow_staking_scan_cache" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "staking_scan_cache_update_own" ON "public"."tln_vow_staking_scan_cache" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tax_asset_prices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tax_asset_prices_admin_write" ON "public"."tax_asset_prices" TO "authenticated" USING ("public"."wallettracking_is_admin"()) WITH CHECK ("public"."wallettracking_is_admin"());



CREATE POLICY "tax_asset_prices_read_authenticated" ON "public"."tax_asset_prices" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."tax_fx_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tax_fx_rates_admin_write" ON "public"."tax_fx_rates" TO "authenticated" USING ("public"."wallettracking_is_admin"()) WITH CHECK ("public"."wallettracking_is_admin"());



CREATE POLICY "tax_fx_rates_read_authenticated" ON "public"."tax_fx_rates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "tln_identity_global_authenticated_insert" ON "public"."tln_vow_identity_global_cache" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "tln_identity_global_authenticated_select" ON "public"."tln_vow_identity_global_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "tln_identity_global_authenticated_update" ON "public"."tln_vow_identity_global_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



CREATE POLICY "tln_technical_global_admin_delete" ON "public"."tln_vow_technical_global_cache" FOR DELETE TO "authenticated" USING (COALESCE("public"."is_admin"("auth"."uid"()), false));



CREATE POLICY "tln_technical_global_authenticated_insert" ON "public"."tln_vow_technical_global_cache" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "tln_technical_global_authenticated_select" ON "public"."tln_vow_technical_global_cache" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "tln_technical_global_authenticated_update" ON "public"."tln_vow_technical_global_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("updated_by" = "auth"."uid"()));



ALTER TABLE "public"."tln_vow_identity_global_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tln_vow_smartnode_graph_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tln_vow_smartnode_graph_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tln_vow_staking_scan_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tln_vow_staking_scan_cache_no_plain_wallet_insert" ON "public"."tln_vow_staking_scan_cache" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (("wallet_address" IS NULL));



CREATE POLICY "tln_vow_staking_scan_cache_no_plain_wallet_update" ON "public"."tln_vow_staking_scan_cache" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (true) WITH CHECK (("wallet_address" IS NULL));



ALTER TABLE "public"."tln_vow_technical_global_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tln_wallet_identity_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tln_wallet_identity_cache_delete_own" ON "public"."tln_wallet_identity_cache" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tln_wallet_identity_cache_insert_own" ON "public"."tln_wallet_identity_cache" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "tln_wallet_identity_cache_select_own" ON "public"."tln_wallet_identity_cache" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tln_wallet_identity_cache_update_own" ON "public"."tln_wallet_identity_cache" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tm_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tm_accounts aendern" ON "public"."tm_accounts" FOR UPDATE TO "authenticated" USING ("public"."tm_ist_admin"()) WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_accounts einfuegen" ON "public"."tm_accounts" FOR INSERT TO "authenticated" WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_accounts lesen" ON "public"."tm_accounts" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "tm_accounts loeschen" ON "public"."tm_accounts" FOR DELETE TO "authenticated" USING ("public"."tm_ist_admin"());



ALTER TABLE "public"."tm_trades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tm_trades aendern" ON "public"."tm_trades" FOR UPDATE TO "authenticated" USING ("public"."tm_ist_admin"()) WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_trades einfuegen" ON "public"."tm_trades" FOR INSERT TO "authenticated" WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_trades lesen" ON "public"."tm_trades" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "tm_trades loeschen" ON "public"."tm_trades" FOR DELETE TO "authenticated" USING ("public"."tm_ist_admin"());



ALTER TABLE "public"."tm_wallet_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tm_wallet_transactions aendern" ON "public"."tm_wallet_transactions" FOR UPDATE TO "authenticated" USING ("public"."tm_ist_admin"()) WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_wallet_transactions einfuegen" ON "public"."tm_wallet_transactions" FOR INSERT TO "authenticated" WITH CHECK ("public"."tm_ist_admin"());



CREATE POLICY "tm_wallet_transactions lesen" ON "public"."tm_wallet_transactions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "tm_wallet_transactions loeschen" ON "public"."tm_wallet_transactions" FOR DELETE TO "authenticated" USING ("public"."tm_ist_admin"());



CREATE POLICY "update own tokens" ON "public"."safe_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "update own wallets" ON "public"."wallets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user own chat" ON "public"."chat_messages" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_data_migrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_data_migrations_self_insert" ON "public"."user_data_migrations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_data_migrations_self_select" ON "public"."user_data_migrations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_data_migrations_self_update" ON "public"."user_data_migrations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_release_ack_self_insert" ON "public"."user_release_acknowledgements" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_release_ack_self_select" ON "public"."user_release_acknowledgements" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_release_ack_self_update" ON "public"."user_release_acknowledgements" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_release_acknowledgements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_team_aliases_private" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_team_aliases_private_delete_own" ON "public"."user_team_aliases_private" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_team_aliases_private_insert_own" ON "public"."user_team_aliases_private" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_team_aliases_private_select_own" ON "public"."user_team_aliases_private" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_team_aliases_private_update_own" ON "public"."user_team_aliases_private" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_ui_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_ui_preferences_insert_own" ON "public"."user_ui_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_ui_preferences_select_own" ON "public"."user_ui_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_ui_preferences_update_own" ON "public"."user_ui_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users insert own fee cache" ON "public"."wallet_fee_cache" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users insert own fee transactions" ON "public"."wallet_fee_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users read own fee cache" ON "public"."wallet_fee_cache" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users read own fee transactions" ON "public"."wallet_fee_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users update own fee cache" ON "public"."wallet_fee_cache" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."wallet_current_price_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallet_current_price_snapshots_insert_own" ON "public"."wallet_current_price_snapshots" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "wallet_current_price_snapshots_select_own" ON "public"."wallet_current_price_snapshots" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "wallet_current_price_snapshots_update_own" ON "public"."wallet_current_price_snapshots" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."wallet_fee_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_fee_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_global_current_price_snapshot" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_global_price_refresh_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallet_global_price_snapshot_insert" ON "public"."wallet_global_current_price_snapshot" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "wallet_global_price_snapshot_select" ON "public"."wallet_global_current_price_snapshot" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "wallet_global_price_snapshot_update" ON "public"."wallet_global_current_price_snapshot" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."wallet_refresh_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallet_refresh_state_insert_own" ON "public"."wallet_refresh_state" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "wallet_refresh_state_select_own" ON "public"."wallet_refresh_state" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "wallet_refresh_state_update_own" ON "public"."wallet_refresh_state" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."year_end_coverage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "year_end_coverage_delete_own" ON "public"."year_end_coverage" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_coverage_insert_own" ON "public"."year_end_coverage" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_coverage_select_own" ON "public"."year_end_coverage" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_coverage_update_own" ON "public"."year_end_coverage" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."year_end_positions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "year_end_positions_delete_own" ON "public"."year_end_positions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_positions_insert_own" ON "public"."year_end_positions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_positions_select_own" ON "public"."year_end_positions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "year_end_positions_update_own" ON "public"."year_end_positions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."current_user_is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_discovery_cache_cooldown"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_chat_read"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_chat_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_chat_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_chat_read"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_lp_pair_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_factory_address" "text", "p_token0_address" "text", "p_token0_symbol" "text", "p_token1_address" "text", "p_token1_symbol" "text", "p_decimals" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_lp_pair_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_factory_address" "text", "p_token0_address" "text", "p_token0_symbol" "text", "p_token1_address" "text", "p_token1_symbol" "text", "p_decimals" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_lp_pair_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_factory_address" "text", "p_token0_address" "text", "p_token0_symbol" "text", "p_token1_address" "text", "p_token1_symbol" "text", "p_decimals" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_lp_staking_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_contract_address" "text", "p_evidence_tx_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_lp_staking_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_contract_address" "text", "p_evidence_tx_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_lp_staking_candidate"("p_chain_key" "text", "p_pair_address" "text", "p_contract_address" "text", "p_evidence_tx_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."tm_ist_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tm_ist_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."tm_ist_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tm_ist_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tm_ist_admin_email"("p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tm_ist_admin_email"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."tm_ist_admin_email"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tm_ist_admin_email"("p_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallettracking_claim_price_refresh_slot"("p_slot_key" "text", "p_valuation_version" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."wallettracking_cleanup_price_refresh_slots"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."wallettracking_cleanup_price_refresh_slots"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."wallettracking_delete_all_user_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."wallettracking_delete_all_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."wallettracking_delete_all_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallettracking_delete_all_user_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallettracking_delete_wallet_complete"("p_wallet_id" "uuid", "p_wallet_alias_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."wallettracking_is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."wallettracking_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."wallettracking_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."wt_sync_aptmdao_tree_data_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."wt_sync_dao1_old_tree_data_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."wt_sync_tln_smartnode_data_version"() TO "service_role";



GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_cache" TO "anon";
GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_cache" TO "service_role";



GRANT ALL ON FUNCTION "public"."wt_tln_smartnode_graph_slice"("p_wallets" "text"[], "p_contract" "text", "p_max_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."wt_tln_smartnode_graph_slice"("p_wallets" "text"[], "p_contract" "text", "p_max_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."wt_tln_smartnode_graph_slice"("p_wallets" "text"[], "p_contract" "text", "p_max_depth" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."apertum_nft_history_coverage" TO "anon";
GRANT ALL ON TABLE "public"."apertum_nft_history_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."apertum_nft_history_coverage" TO "service_role";



GRANT ALL ON TABLE "public"."apertum_nft_transfer_cache" TO "anon";
GRANT ALL ON TABLE "public"."apertum_nft_transfer_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."apertum_nft_transfer_cache" TO "service_role";



GRANT ALL ON TABLE "public"."aptm_price_anchors" TO "anon";
GRANT ALL ON TABLE "public"."aptm_price_anchors" TO "authenticated";
GRANT ALL ON TABLE "public"."aptm_price_anchors" TO "service_role";



GRANT ALL ON TABLE "public"."aptm_price_coverage" TO "anon";
GRANT ALL ON TABLE "public"."aptm_price_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."aptm_price_coverage" TO "service_role";



GRANT ALL ON TABLE "public"."aptm_price_history" TO "anon";
GRANT ALL ON TABLE "public"."aptm_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."aptm_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."aptmdao_tree_graph_cache" TO "anon";
GRANT ALL ON TABLE "public"."aptmdao_tree_graph_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."aptmdao_tree_graph_cache" TO "service_role";



GRANT ALL ON TABLE "public"."aptmdao_tree_graph_state" TO "anon";
GRANT ALL ON TABLE "public"."aptmdao_tree_graph_state" TO "authenticated";
GRANT ALL ON TABLE "public"."aptmdao_tree_graph_state" TO "service_role";



GRANT ALL ON TABLE "public"."cache_data_versions" TO "anon";
GRANT ALL ON TABLE "public"."cache_data_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."cache_data_versions" TO "service_role";



GRANT ALL ON TABLE "public"."chains" TO "anon";
GRANT ALL ON TABLE "public"."chains" TO "authenticated";
GRANT ALL ON TABLE "public"."chains" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_notification_state" TO "anon";
GRANT ALL ON TABLE "public"."chat_notification_state" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_notification_state" TO "service_role";



GRANT ALL ON TABLE "public"."dao1_old_tree_graph_cache" TO "anon";
GRANT ALL ON TABLE "public"."dao1_old_tree_graph_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."dao1_old_tree_graph_cache" TO "service_role";



GRANT ALL ON TABLE "public"."dao1_old_tree_graph_state" TO "anon";
GRANT ALL ON TABLE "public"."dao1_old_tree_graph_state" TO "authenticated";
GRANT ALL ON TABLE "public"."dao1_old_tree_graph_state" TO "service_role";



GRANT ALL ON TABLE "public"."dao_partner_bot_lifecycle_cache" TO "anon";
GRANT ALL ON TABLE "public"."dao_partner_bot_lifecycle_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."dao_partner_bot_lifecycle_cache" TO "service_role";



GRANT ALL ON TABLE "public"."dao_partner_bot_scan_state" TO "anon";
GRANT ALL ON TABLE "public"."dao_partner_bot_scan_state" TO "authenticated";
GRANT ALL ON TABLE "public"."dao_partner_bot_scan_state" TO "service_role";



GRANT ALL ON TABLE "public"."defi_current_price_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."defi_current_price_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."defi_current_price_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."defi_project_tokens" TO "anon";
GRANT ALL ON TABLE "public"."defi_project_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."defi_project_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."defi_projects" TO "anon";
GRANT ALL ON TABLE "public"."defi_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."defi_projects" TO "service_role";



GRANT ALL ON TABLE "public"."defi_staking_contracts" TO "anon";
GRANT ALL ON TABLE "public"."defi_staking_contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."defi_staking_contracts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."defi_staking_contracts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."defi_staking_contracts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."defi_staking_contracts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dex_configs" TO "anon";
GRANT ALL ON TABLE "public"."dex_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."dex_configs" TO "service_role";



GRANT ALL ON TABLE "public"."discovery_cache" TO "anon";
GRANT ALL ON TABLE "public"."discovery_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."discovery_cache" TO "service_role";



GRANT ALL ON TABLE "public"."historical_dex_pair_state_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_dex_pair_state_cache" TO "service_role";



GRANT ALL ON TABLE "public"."historical_tax_chain_context_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_tax_chain_context_cache" TO "service_role";



GRANT ALL ON TABLE "public"."historical_token_balance_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_token_balance_cache" TO "service_role";



GRANT ALL ON TABLE "public"."historical_token_candidate_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."historical_token_candidate_cache" TO "service_role";



GRANT ALL ON TABLE "public"."lp_history_events" TO "anon";
GRANT ALL ON TABLE "public"."lp_history_events" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_history_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lp_history_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lp_history_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lp_history_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lp_pair_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_pair_registry" TO "service_role";



GRANT ALL ON TABLE "public"."lp_position_cache" TO "anon";
GRANT ALL ON TABLE "public"."lp_position_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_position_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lp_position_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lp_position_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lp_position_cache_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lp_staking_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."lp_staking_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."nft_cache" TO "anon";
GRANT ALL ON TABLE "public"."nft_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."nft_cache" TO "service_role";



GRANT ALL ON TABLE "public"."predefined_tokens" TO "anon";
GRANT ALL ON TABLE "public"."predefined_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."predefined_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."project_miner_ownership" TO "anon";
GRANT ALL ON TABLE "public"."project_miner_ownership" TO "authenticated";
GRANT ALL ON TABLE "public"."project_miner_ownership" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_miner_ownership_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_miner_ownership_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_miner_ownership_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_miners" TO "anon";
GRANT ALL ON TABLE "public"."project_miners" TO "authenticated";
GRANT ALL ON TABLE "public"."project_miners" TO "service_role";



GRANT ALL ON TABLE "public"."project_nft_claims" TO "anon";
GRANT ALL ON TABLE "public"."project_nft_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."project_nft_claims" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_nft_claims_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_nft_claims_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_nft_claims_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_nft_ownership" TO "anon";
GRANT ALL ON TABLE "public"."project_nft_ownership" TO "authenticated";
GRANT ALL ON TABLE "public"."project_nft_ownership" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_nft_ownership_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_nft_ownership_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_nft_ownership_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_nfts" TO "anon";
GRANT ALL ON TABLE "public"."project_nfts" TO "authenticated";
GRANT ALL ON TABLE "public"."project_nfts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_nfts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_nfts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_nfts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_scan_state" TO "anon";
GRANT ALL ON TABLE "public"."project_scan_state" TO "authenticated";
GRANT ALL ON TABLE "public"."project_scan_state" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_scan_state_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_scan_state_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_scan_state_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_transaction_asset_flows" TO "anon";
GRANT ALL ON TABLE "public"."project_transaction_asset_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."project_transaction_asset_flows" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_transaction_asset_flows_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_transaction_asset_flows_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_transaction_asset_flows_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."project_transactions" TO "anon";
GRANT ALL ON TABLE "public"."project_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."project_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."project_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."project_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."safe_tokens" TO "anon";
GRANT ALL ON TABLE "public"."safe_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."safe_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."security_crypto_tests" TO "anon";
GRANT ALL ON TABLE "public"."security_crypto_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."security_crypto_tests" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_items" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_items" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_items" TO "service_role";



GRANT ALL ON TABLE "public"."snapshots" TO "anon";
GRANT ALL ON TABLE "public"."snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."tax_asset_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_asset_prices" TO "service_role";



GRANT ALL ON TABLE "public"."tax_fx_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_fx_rates" TO "service_role";



GRANT ALL ON TABLE "public"."tln_vow_identity_global_cache" TO "anon";
GRANT ALL ON TABLE "public"."tln_vow_identity_global_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_vow_identity_global_cache" TO "service_role";



GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_state" TO "anon";
GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_state" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_vow_smartnode_graph_state" TO "service_role";



GRANT ALL ON TABLE "public"."tln_vow_staking_scan_cache" TO "anon";
GRANT ALL ON TABLE "public"."tln_vow_staking_scan_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_vow_staking_scan_cache" TO "service_role";



GRANT ALL ON TABLE "public"."tln_vow_technical_global_cache" TO "anon";
GRANT ALL ON TABLE "public"."tln_vow_technical_global_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_vow_technical_global_cache" TO "service_role";



GRANT ALL ON TABLE "public"."tln_wallet_identity_cache" TO "anon";
GRANT ALL ON TABLE "public"."tln_wallet_identity_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."tln_wallet_identity_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tln_wallet_identity_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tln_wallet_identity_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tln_wallet_identity_cache_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tm_accounts" TO "anon";
GRANT ALL ON TABLE "public"."tm_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."tm_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."tm_trades" TO "anon";
GRANT ALL ON TABLE "public"."tm_trades" TO "authenticated";
GRANT ALL ON TABLE "public"."tm_trades" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tm_trades_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tm_trades_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tm_trades_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tm_wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."tm_wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."tm_wallet_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tm_wallet_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tm_wallet_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tm_wallet_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_data_migrations" TO "anon";
GRANT ALL ON TABLE "public"."user_data_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_data_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_release_acknowledgements" TO "anon";
GRANT ALL ON TABLE "public"."user_release_acknowledgements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_release_acknowledgements" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_team_aliases_private" TO "anon";
GRANT ALL ON TABLE "public"."user_team_aliases_private" TO "authenticated";
GRANT ALL ON TABLE "public"."user_team_aliases_private" TO "service_role";



GRANT ALL ON TABLE "public"."user_ui_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_ui_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ui_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_current_price_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."wallet_current_price_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_current_price_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_fee_cache" TO "anon";
GRANT ALL ON TABLE "public"."wallet_fee_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_fee_cache" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_fee_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_fee_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_fee_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_global_current_price_snapshot" TO "anon";
GRANT ALL ON TABLE "public"."wallet_global_current_price_snapshot" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_global_current_price_snapshot" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_global_price_refresh_slots" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_refresh_state" TO "anon";
GRANT ALL ON TABLE "public"."wallet_refresh_state" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_refresh_state" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."year_end_coverage" TO "anon";
GRANT ALL ON TABLE "public"."year_end_coverage" TO "authenticated";
GRANT ALL ON TABLE "public"."year_end_coverage" TO "service_role";



GRANT ALL ON SEQUENCE "public"."year_end_coverage_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."year_end_coverage_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."year_end_coverage_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."year_end_positions" TO "anon";
GRANT ALL ON TABLE "public"."year_end_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."year_end_positions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."year_end_positions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."year_end_positions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."year_end_positions_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































