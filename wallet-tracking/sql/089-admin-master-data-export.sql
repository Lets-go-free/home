-- Phase 7.37: read-only, konsistenter Stammdatenexport; Admin-Prüfung auf dem Server.
BEGIN;
CREATE OR REPLACE FUNCTION public.wallettracking_export_master_data()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE
  table_name text;
  rows_json jsonb;
  columns_json jsonb;
  result_tables jsonb := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.wallettracking_is_admin() THEN
    RAISE EXCEPTION 'Admin-Berechtigung erforderlich' USING ERRCODE = '42501';
  END IF;
  FOREACH table_name IN ARRAY ARRAY['chains','defi_projects','defi_project_tokens','defi_staking_contracts','dex_configs','predefined_tokens','project_nfts','tax_asset_prices','tax_fx_rates'] LOOP
    -- Fehlende Tabellen brechen den gesamten Export ab; keine stillen Teilsicherungen.
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)), ''[]''::jsonb) FROM public.%I r', table_name) INTO rows_json;
    SELECT jsonb_agg(a.attname ORDER BY a.attnum) INTO columns_json
      FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass(format('public.%I', table_name))
        AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '';
    result_tables := result_tables || jsonb_build_object(table_name,
      jsonb_build_object('columns', columns_json, 'rows', rows_json, 'count', jsonb_array_length(rows_json)));
  END LOOP;
  RETURN jsonb_build_object('format', 'wallettracking-master-data-v1',
    'exported_at', statement_timestamp(), 'tables', result_tables);
END
$fn$;
REVOKE ALL ON FUNCTION public.wallettracking_export_master_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_export_master_data() TO authenticated;
COMMENT ON FUNCTION public.wallettracking_export_master_data() IS 'Admin-only read-only export of nine allowlisted global tables; excludes private data and caches.';
COMMIT;
