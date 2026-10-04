-- Phase 7.25 / Migration 087
-- Migration D1: direkte Browserrechte auf eindeutig backendvermittelte Tabellen entfernen.
--
-- Verifiziert im aktuellen Code:
--   * public.security_crypto_tests wird ausschliesslich durch die Edge Function wallet-private
--     mit SUPABASE_SERVICE_ROLE_KEY gelesen/geschrieben.
--   * public.user_team_aliases_private wird ausschliesslich durch wallet-private mit
--     SUPABASE_SERVICE_ROLE_KEY gelesen/geschrieben.
--   * public.chat_notification_state ist bereits seit Migration 086 service_role-only.
--   * public.wallet_global_price_refresh_slots war bereits im Live-Snapshot service_role-only;
--     Browserzugriff erfolgt ausschliesslich ueber den geschuetzten RPC
--     wallettracking_claim_price_refresh_slot(...).
--
-- Wichtig: Tabellen mit nachgewiesenem direktem Browserzugriff (z. B.
-- tln_vow_staking_scan_cache / tln_vow_technical_global_cache) sind bewusst NICHT enthalten.
-- Diese Migration verschiebt KEINE Tabelle und aendert KEINE RLS-Policy.

begin;

-- Direkten Data-API-Zugriff fuer Browserrollen entfernen.
revoke all privileges on table public.security_crypto_tests from anon, authenticated;
revoke all privileges on table public.user_team_aliases_private from anon, authenticated;

-- Service-Role explizit absichern. Vorhandene RLS-Policies bleiben unveraendert.
grant all privileges on table public.security_crypto_tests to service_role;
grant all privileges on table public.user_team_aliases_private to service_role;

-- Schutzpruefung: Browserrollen duerfen keine direkten Tabellenrechte mehr besitzen.
do $$
declare
  t text;
  r text;
  p text;
  backend_tables text[] := array[
    'public.security_crypto_tests',
    'public.user_team_aliases_private'
  ];
  browser_roles text[] := array['anon','authenticated'];
  table_privs text[] := array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
begin
  foreach t in array backend_tables loop
    foreach r in array browser_roles loop
      foreach p in array table_privs loop
        if has_table_privilege(r, t, p) then
          raise exception 'Migration 087 fehlgeschlagen: % besitzt weiterhin % auf %', r, p, t;
        end if;
      end loop;
    end loop;

    if not has_table_privilege('service_role', t, 'SELECT')
       or not has_table_privilege('service_role', t, 'INSERT')
       or not has_table_privilege('service_role', t, 'UPDATE')
       or not has_table_privilege('service_role', t, 'DELETE') then
      raise exception 'Migration 087 fehlgeschlagen: service_role CRUD auf % unvollstaendig', t;
    end if;
  end loop;

  -- Bereits gehaertete/service-only Tabellen duerfen nicht versehentlich wieder geoeffnet sein.
  foreach r in array browser_roles loop
    if has_table_privilege(r,'public.chat_notification_state','SELECT')
       or has_table_privilege(r,'public.chat_notification_state','INSERT')
       or has_table_privilege(r,'public.chat_notification_state','UPDATE')
       or has_table_privilege(r,'public.chat_notification_state','DELETE') then
      raise exception 'Migration 087 fehlgeschlagen: chat_notification_state ist nicht service_role-only';
    end if;

    if has_table_privilege(r,'public.wallet_global_price_refresh_slots','SELECT')
       or has_table_privilege(r,'public.wallet_global_price_refresh_slots','INSERT')
       or has_table_privilege(r,'public.wallet_global_price_refresh_slots','UPDATE')
       or has_table_privilege(r,'public.wallet_global_price_refresh_slots','DELETE') then
      raise exception 'Migration 087 fehlgeschlagen: wallet_global_price_refresh_slots besitzt Browserrechte';
    end if;
  end loop;
end $$;

commit;
