-- WalletTracking
-- 044-security-global-plaintext-audit.sql
-- Gesamt-Sicherheitsaudit nach Abschluss der Verschlüsselungsphasen
-- KORRIGIERTE, SCHEMA-TOLERANTE VERSION
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--   Für einen vollständigen Admin-Audit: "Without RLS" verwenden.
--
-- WICHTIG:
--   READ ONLY in Bezug auf permanente Tabellen.
--   Das Script legt nur TEMP-Objekte für den Audit an.
--   Es verändert KEINE produktiven Daten, KEINE RLS-Policies und KEINE Constraints.
--
-- WARUM SCHEMA-TOLERANT:
--   Frühere Tabellen wurden während der Security-Migration bereits umgebaut.
--   Deshalb werden optionale/alte Klartextspalten über to_jsonb(row) geprüft.
--   Fehlt eine Spalte bereits, entsteht KEIN SQL-Fehler.
--
-- PRIVAT:
--   eigene Wallet-Adressen/-Labels, Partnernamen/Aliase,
--   user-spezifische Wallet-Zuordnungen.
--
-- BEWUSST ÖFFENTLICH:
--   Token-/Contract-Adressen, globale TLN Wallet↔TLN-ID-Fakten,
--   globale SmartNode Child↔Parent-Beziehungen.

drop table if exists _wallettracking_security_audit_044;

create temp table _wallettracking_security_audit_044 (
  object_name text,
  category text,
  total_rows bigint,
  private_plaintext_rows bigint,
  expected_private_plaintext_rows bigint,
  status text,
  note text
) on commit preserve rows;

-- ---------------------------------------------------------------------
-- 1) Eigene Wallets
-- Aktuelles Schema:
-- plaintext: label, evm_address, btc_address, xrp_address,
--            sol_address, tron_address, akash_address
-- ciphertext: jeweilige *_ciphertext-Spalten.
insert into _wallettracking_security_audit_044
select
  'wallets',
  'OWN_WALLETS',
  count(*)::bigint,
  count(*) filter (
    where coalesce(btrim(to_jsonb(w)->>'label'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'evm_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'btc_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'xrp_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'sol_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'tron_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'akash_address'),'') <> ''
       -- toleriert ältere/alternative Schemas:
       or coalesce(btrim(to_jsonb(w)->>'wallet_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'wallet_label'),'') <> ''
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(w)->>'label'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'evm_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'btc_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'xrp_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'sol_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'tron_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'akash_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'wallet_address'),'') <> ''
       or coalesce(btrim(to_jsonb(w)->>'wallet_label'),'') <> ''
  ) = 0 then 'PASS' else 'FAIL' end,
  'Eigene Wallet-Namen und -Adressen dürfen in der Wallet-Tabelle nicht mehr im Klartext stehen.'
from public.wallets w;

-- ---------------------------------------------------------------------
-- 2) Eigene Wallets: Verschlüsselung vorhanden/versioniert.
-- Leere Chain-Felder sind erlaubt; das Label muss aber verschlüsselt sein.
insert into _wallettracking_security_audit_044
select
  'wallets_encryption_fields',
  'OWN_WALLETS_ENCRYPTION',
  count(*)::bigint,
  count(*) filter (
    where coalesce(to_jsonb(w)->>'label_ciphertext','') = ''
       or coalesce((to_jsonb(w)->>'encryption_version')::int,0) <> 1
       or coalesce((to_jsonb(w)->>'key_version')::int,0) <> 1
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(to_jsonb(w)->>'label_ciphertext','') = ''
       or coalesce((to_jsonb(w)->>'encryption_version')::int,0) <> 1
       or coalesce((to_jsonb(w)->>'key_version')::int,0) <> 1
  ) = 0 then 'PASS' else 'FAIL' end,
  'Jede Wallet braucht ein verschlüsseltes Label sowie Encryption-/Key-Version 1. Leere ungenutzte Chain-Adressen sind erlaubt.'
from public.wallets w;

-- Zusatzinfo: wie viele Wallet-Zeilen mindestens eine verschlüsselte Adresse besitzen.
insert into _wallettracking_security_audit_044
select
  'wallets_encrypted_address_coverage',
  'OWN_WALLETS_ENCRYPTION_INFO',
  count(*)::bigint,
  0::bigint,
  0::bigint,
  'PASS',
  ('Wallets mit mindestens einer verschlüsselten Adresse: ' ||
   count(*) filter (
     where coalesce(to_jsonb(w)->>'evm_address_ciphertext','') <> ''
        or coalesce(to_jsonb(w)->>'btc_address_ciphertext','') <> ''
        or coalesce(to_jsonb(w)->>'xrp_address_ciphertext','') <> ''
        or coalesce(to_jsonb(w)->>'sol_address_ciphertext','') <> ''
        or coalesce(to_jsonb(w)->>'tron_address_ciphertext','') <> ''
        or coalesce(to_jsonb(w)->>'akash_address_ciphertext','') <> ''
   )::text || ' von ' || count(*)::text)
from public.wallets w;

-- ---------------------------------------------------------------------
-- 3) Partner-Aliase: Referenz + Alias vollständig verschlüsselt.
insert into _wallettracking_security_audit_044
select
  'user_team_aliases_private',
  'PARTNER_ALIASES',
  count(*)::bigint,
  count(*) filter (
    where coalesce(to_jsonb(a)->>'reference_ciphertext','') = ''
       or coalesce(to_jsonb(a)->>'alias_ciphertext','') = ''
       or coalesce(to_jsonb(a)->>'reference_hmac','') = ''
       or coalesce((to_jsonb(a)->>'encryption_version')::int,0) <> 1
       or coalesce((to_jsonb(a)->>'key_version')::int,0) <> 1
       -- Falls irgendwann versehentlich Klartextspalten hinzukämen:
       or coalesce(btrim(to_jsonb(a)->>'reference'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'alias'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'partner_name'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'wallet_address'),'') <> ''
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(to_jsonb(a)->>'reference_ciphertext','') = ''
       or coalesce(to_jsonb(a)->>'alias_ciphertext','') = ''
       or coalesce(to_jsonb(a)->>'reference_hmac','') = ''
       or coalesce((to_jsonb(a)->>'encryption_version')::int,0) <> 1
       or coalesce((to_jsonb(a)->>'key_version')::int,0) <> 1
       or coalesce(btrim(to_jsonb(a)->>'reference'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'alias'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'partner_name'),'') <> ''
       or coalesce(btrim(to_jsonb(a)->>'wallet_address'),'') <> ''
  ) = 0 then 'PASS' else 'FAIL' end,
  'Partner-Referenz und Partnername müssen user-spezifisch und verschlüsselt sein; HMAC ist nur der Lookup-Schlüssel.'
from public.user_team_aliases_private a;

-- ---------------------------------------------------------------------
-- 4) Legacy Identity Cache muss leer sein.
insert into _wallettracking_security_audit_044
select
  'tln_wallet_identity_cache',
  'LEGACY_PRIVATE_RELATION',
  count(*)::bigint,
  count(*)::bigint,
  0::bigint,
  case when count(*)=0 then 'PASS' else 'FAIL' end,
  'Legacy User↔Wallet/TLN-Zuordnung muss nach Script 043 leer sein.'
from public.tln_wallet_identity_cache;

-- ---------------------------------------------------------------------
-- 5) Privater TLN/VOW Cache: keine Klartext-Wallet-Adresse.
insert into _wallettracking_security_audit_044
select
  'tln_vow_staking_scan_cache',
  'PRIVATE_WALLET_CACHE',
  count(*)::bigint,
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0
   and count(*) filter (
     where nullif(to_jsonb(t)->>'wallet_id','') is null
   )=0
  then 'PASS' else 'FAIL' end,
  'Wallet-Zuordnung muss über wallet_id laufen; wallet_address darf nicht im Klartext stehen.'
from public.tln_vow_staking_scan_cache t;

-- ---------------------------------------------------------------------
-- 6) Snapshot/Jahresend – schema-tolerant.
insert into _wallettracking_security_audit_044
select
  'snapshot_items',
  'SNAPSHOT',
  count(*)::bigint,
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_label'),'') <> ''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_label'),'') <> ''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0
   and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
  then 'PASS' else 'FAIL' end,
  'Öffentliche Token-/Contract-Adresse in snapshot_items.address ist ausdrücklich erlaubt; private Wallet-Daten nicht.'
from public.snapshot_items t;

insert into _wallettracking_security_audit_044
select
  'year_end_positions',
  'YEAR_END',
  count(*)::bigint,
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_label'),'') <> ''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  0::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_label'),'') <> ''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0
   and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
  then 'PASS' else 'FAIL' end,
  'Wallet-Bezug muss über wallet_id laufen.'
from public.year_end_positions t;

-- ---------------------------------------------------------------------
-- 7) Bereits migrierte Projekt-/DAO1-/LP-Tabellen.
-- to_jsonb macht diese Prüfungen tolerant, falls die Klartextspalte schon
-- physisch entfernt wurde.
insert into _wallettracking_security_audit_044
select 'lp_history_events','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.lp_history_events t;

insert into _wallettracking_security_audit_044
select 'lp_position_cache','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.lp_position_cache t;

insert into _wallettracking_security_audit_044
select 'project_nft_claims','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.project_nft_claims t;

insert into _wallettracking_security_audit_044
select 'project_nft_ownership','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.project_nft_ownership t;

insert into _wallettracking_security_audit_044
select 'project_scan_state','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.project_scan_state t;

insert into _wallettracking_security_audit_044
select 'project_transactions','PROJECT_CACHE',count(*)::bigint,
       count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')::bigint,
       0::bigint,
       case when count(*) filter (where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> '')=0
             and count(*) filter (where nullif(to_jsonb(t)->>'wallet_id','') is null)=0
            then 'PASS' else 'FAIL' end,
       'Keine private Klartext-Wallet-Adresse; wallet_id vollständig.'
from public.project_transactions t;

-- ---------------------------------------------------------------------
-- 8) Globale öffentliche On-Chain-Caches – dokumentiert, nicht als Fehler.
insert into _wallettracking_security_audit_044
select
  'tln_vow_identity_global_cache','PUBLIC_ONCHAIN_GLOBAL',
  count(*)::bigint,0::bigint,0::bigint,'PASS',
  'Wallet↔TLN-ID ist ein öffentlicher, user-unabhängiger On-Chain-Fakt.'
from public.tln_vow_identity_global_cache;

insert into _wallettracking_security_audit_044
select
  'tln_vow_smartnode_graph_cache','PUBLIC_ONCHAIN_GLOBAL',
  count(*)::bigint,0::bigint,0::bigint,'PASS',
  'Child↔Parent ist ein öffentlicher, user-unabhängiger SmartNode-On-Chain-Fakt.'
from public.tln_vow_smartnode_graph_cache;

-- ---------------------------------------------------------------------
-- 9) Zusätzlicher Schema-Wächter:
-- Zeigt an, ob in PUBLIC Tabellen noch verdächtig benannte Klartextspalten
-- existieren. Das ist nur ein Schema-Hinweis; vorhandene Spalten sind nicht
-- automatisch ein Fehler, solange ihre Werte leer sind oder sie bewusst global sind.
insert into _wallettracking_security_audit_044
select
  'schema_sensitive_column_watch',
  'SCHEMA_WATCH',
  count(*)::bigint,
  0::bigint,
  0::bigint,
  'PASS',
  case
    when count(*)=0 then 'Keine zusätzlich verdächtig benannten Spalten gefunden.'
    else 'Gefundene sensible/prüfenswerte Spalten im public-Schema: ' ||
      string_agg(table_name||'.'||column_name, ', ' order by table_name,column_name)
  end
from information_schema.columns
where table_schema='public'
  and (
       column_name ilike '%wallet%address%'
    or column_name ilike '%wallet%label%'
    or column_name ilike '%partner%name%'
    or column_name ilike '%team%alias%'
  )
  and column_name not ilike '%ciphertext%'
  and column_name not ilike '%hmac%'
  and table_name not in (
    'tln_vow_identity_global_cache',
    'tln_vow_smartnode_graph_cache'
  );

-- ---------------------------------------------------------------------
-- Genau EIN Resultset.
select
  object_name,
  category,
  total_rows,
  private_plaintext_rows,
  expected_private_plaintext_rows,
  status,
  note
from (
  select
    object_name,
    category,
    total_rows,
    private_plaintext_rows,
    expected_private_plaintext_rows,
    status,
    note
  from _wallettracking_security_audit_044

  union all

  select
    '=== OVERALL ===',
    'SUMMARY',
    sum(total_rows)::bigint,
    sum(private_plaintext_rows)::bigint,
    0::bigint,
    case when count(*) filter (where status <> 'PASS')=0 then 'PASS' else 'FAIL' end,
    case when count(*) filter (where status <> 'PASS')=0
         then 'Keine unerwarteten privaten Klartextdaten in den geprüften Bereichen gefunden.'
         else 'Mindestens ein geprüfter Bereich benötigt noch Korrektur.'
    end
  from _wallettracking_security_audit_044
) audit_result
order by
  case when object_name='=== OVERALL ===' then 2 else 1 end,
  object_name;
