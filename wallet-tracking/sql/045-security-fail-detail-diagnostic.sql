-- WalletTracking
-- 045-security-fail-detail-diagnostic.sql
-- Detaildiagnose zu den FAIL-Bereichen aus Audit 044
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält viele interne SQL-Statements, aber NICHT mehrere einzeln
--   auszuführende Abfragen.
--   Am Ende gibt es genau EINE Ergebnis-Abfrage / EIN Resultset.
--   Nichts einzeln markieren.
--   Für den vollständigen Admin-Audit: "Without RLS" verwenden.
--
-- WICHTIG:
--   READ ONLY in Bezug auf produktive Tabellen.
--   Das Script legt nur eine TEMP-Tabelle an.
--   Es zeigt KEINE konkreten Wallet-Adressen, Partnernamen oder Ciphertexte.
--
-- ZWECK:
--   Exakt zeigen, WARUM Audit 044 in folgenden Bereichen FAIL meldete:
--   - project_nft_ownership
--   - project_scan_state
--   - project_transactions
--   - user_team_aliases_private
--   - wallets / wallets_encryption_fields
--
-- HINWEIS:
--   Die Prüfung ist schema-tolerant: optionale Spalten werden über to_jsonb(row)
--   gelesen. Nicht vorhandene Spalten erzeugen daher keinen SQL-Fehler.

drop table if exists _wallettracking_security_diag_045;

create temp table _wallettracking_security_diag_045 (
  object_name text,
  check_name text,
  rows_count bigint,
  status text,
  explanation text
) on commit preserve rows;

-- =====================================================================
-- A) PROJECT TABLES
-- =====================================================================

-- project_nft_ownership
insert into _wallettracking_security_diag_045
select
  'project_nft_ownership',
  'rows_with_plaintext_wallet_address',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0 then 'PASS' else 'REVIEW' end,
  'Zeilen mit nichtleerer wallet_address.'
from public.project_nft_ownership t;

insert into _wallettracking_security_diag_045
select
  'project_nft_ownership',
  'plaintext_wallet_rows_with_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is not null
  )::bigint,
  'INFO',
  'Wenn dieser Wert dem Klartext-Wert entspricht, ist wallet_address sehr wahrscheinlich nur redundant; wallet_id existiert bereits.'
from public.project_nft_ownership t;

insert into _wallettracking_security_diag_045
select
  'project_nft_ownership',
  'plaintext_wallet_rows_without_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )=0 then 'PASS' else 'BLOCK_CLEANUP' end,
  'Vor einer Bereinigung darf keine Klartext-Wallet-Zeile ohne wallet_id übrig sein.'
from public.project_nft_ownership t;

-- project_scan_state
insert into _wallettracking_security_diag_045
select
  'project_scan_state',
  'rows_with_plaintext_wallet_address',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0 then 'PASS' else 'REVIEW' end,
  'Zeilen mit nichtleerer wallet_address.'
from public.project_scan_state t;

insert into _wallettracking_security_diag_045
select
  'project_scan_state',
  'plaintext_wallet_rows_with_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is not null
  )::bigint,
  'INFO',
  'Redundanzprüfung: Klartext-Wallet-Adresse bei bereits vorhandener wallet_id.'
from public.project_scan_state t;

insert into _wallettracking_security_diag_045
select
  'project_scan_state',
  'plaintext_wallet_rows_without_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )=0 then 'PASS' else 'BLOCK_CLEANUP' end,
  'Vor Bereinigung müssen alle betroffenen Zeilen eine wallet_id besitzen.'
from public.project_scan_state t;

-- project_transactions
insert into _wallettracking_security_diag_045
select
  'project_transactions',
  'rows_with_plaintext_wallet_address',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
  )=0 then 'PASS' else 'REVIEW' end,
  'Zeilen mit nichtleerer wallet_address.'
from public.project_transactions t;

insert into _wallettracking_security_diag_045
select
  'project_transactions',
  'plaintext_wallet_rows_with_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is not null
  )::bigint,
  'INFO',
  'Redundanzprüfung: Klartext-Wallet-Adresse bei bereits vorhandener wallet_id.'
from public.project_transactions t;

insert into _wallettracking_security_diag_045
select
  'project_transactions',
  'plaintext_wallet_rows_without_wallet_id',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'wallet_address'),'') <> ''
      and nullif(to_jsonb(t)->>'wallet_id','') is null
  )=0 then 'PASS' else 'BLOCK_CLEANUP' end,
  'Vor Bereinigung müssen alle betroffenen Zeilen eine wallet_id besitzen.'
from public.project_transactions t;

-- =====================================================================
-- B) USER TEAM ALIASES PRIVATE
-- =====================================================================

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'total_rows',
  count(*)::bigint,
  'INFO',
  'Gesamtzahl verschlüsselter Alias-Zeilen.'
from public.user_team_aliases_private;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'reference_ciphertext_missing',
  count(*) filter (
    where coalesce(to_jsonb(t)->>'reference_ciphertext','')=''
  )::bigint,
  case when count(*) filter (
    where coalesce(to_jsonb(t)->>'reference_ciphertext','')=''
  )=0 then 'PASS' else 'FAIL' end,
  'Muss 0 sein.'
from public.user_team_aliases_private t;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'alias_ciphertext_missing',
  count(*) filter (
    where coalesce(to_jsonb(t)->>'alias_ciphertext','')=''
  )::bigint,
  case when count(*) filter (
    where coalesce(to_jsonb(t)->>'alias_ciphertext','')=''
  )=0 then 'PASS' else 'FAIL' end,
  'Muss 0 sein.'
from public.user_team_aliases_private t;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'reference_hmac_missing',
  count(*) filter (
    where coalesce(to_jsonb(t)->>'reference_hmac','')=''
  )::bigint,
  case when count(*) filter (
    where coalesce(to_jsonb(t)->>'reference_hmac','')=''
  )=0 then 'PASS' else 'FAIL' end,
  'Muss 0 sein.'
from public.user_team_aliases_private t;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'encryption_version_not_1',
  count(*) filter (
    where coalesce((to_jsonb(t)->>'encryption_version')::int,0)<>1
  )::bigint,
  case when count(*) filter (
    where coalesce((to_jsonb(t)->>'encryption_version')::int,0)<>1
  )=0 then 'PASS' else 'FAIL' end,
  'Zeigt, ob encryption_version existiert und = 1 ist.'
from public.user_team_aliases_private t;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'key_version_not_1',
  count(*) filter (
    where coalesce((to_jsonb(t)->>'key_version')::int,0)<>1
  )::bigint,
  case when count(*) filter (
    where coalesce((to_jsonb(t)->>'key_version')::int,0)<>1
  )=0 then 'PASS' else 'FAIL' end,
  'Zeigt, ob key_version existiert und = 1 ist.'
from public.user_team_aliases_private t;

insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'unexpected_plaintext_named_fields',
  count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'reference'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'alias'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'partner_name'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'')<>''
  )::bigint,
  case when count(*) filter (
    where coalesce(btrim(to_jsonb(t)->>'reference'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'alias'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'partner_name'),'')<>''
       or coalesce(btrim(to_jsonb(t)->>'wallet_address'),'')<>''
  )=0 then 'PASS' else 'FAIL' end,
  'Muss 0 sein; prüft versehentliche Klartextspalten.'
from public.user_team_aliases_private t;

-- Welche Spalten existieren tatsächlich? Nur Namen/Datentypen, keine Inhalte.
insert into _wallettracking_security_diag_045
select
  'user_team_aliases_private',
  'schema_columns',
  count(*)::bigint,
  'INFO',
  string_agg(column_name||':'||data_type, ', ' order by ordinal_position)
from information_schema.columns
where table_schema='public'
  and table_name='user_team_aliases_private';

-- =====================================================================
-- C) WALLETS
-- =====================================================================

insert into _wallettracking_security_diag_045
select
  'wallets',
  'total_rows',
  count(*)::bigint,
  'INFO',
  'Gesamtzahl Wallet-Zeilen.'
from public.wallets;

-- Klartext je möglichem privaten Feld separat
insert into _wallettracking_security_diag_045
select 'wallets','plaintext_label_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'label'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'label'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-Label.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_evm_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'evm_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'evm_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-EVM-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_btc_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'btc_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'btc_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-BTC-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_xrp_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'xrp_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'xrp_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-XRP-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_sol_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'sol_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'sol_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-Solana-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_tron_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'tron_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'tron_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-TRON-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','plaintext_akash_address_rows',
  count(*) filter (where coalesce(btrim(to_jsonb(w)->>'akash_address'),'')<>'')::bigint,
  case when count(*) filter (where coalesce(btrim(to_jsonb(w)->>'akash_address'),'')<>'')=0 then 'PASS' else 'FAIL' end,
  'Klartext-AKASH-Adresse.'
from public.wallets w;

-- Verschlüsseltes Label / Versionen separat
insert into _wallettracking_security_diag_045
select 'wallets','label_ciphertext_missing',
  count(*) filter (where coalesce(to_jsonb(w)->>'label_ciphertext','')='')::bigint,
  case when count(*) filter (where coalesce(to_jsonb(w)->>'label_ciphertext','')='')=0 then 'PASS' else 'FAIL' end,
  'Jede Wallet-Zeile sollte ein verschlüsseltes Label besitzen.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encryption_version_not_1',
  count(*) filter (where coalesce((to_jsonb(w)->>'encryption_version')::int,0)<>1)::bigint,
  case when count(*) filter (where coalesce((to_jsonb(w)->>'encryption_version')::int,0)<>1)=0 then 'PASS' else 'FAIL' end,
  'Soll 0 sein.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','key_version_not_1',
  count(*) filter (where coalesce((to_jsonb(w)->>'key_version')::int,0)<>1)::bigint,
  case when count(*) filter (where coalesce((to_jsonb(w)->>'key_version')::int,0)<>1)=0 then 'PASS' else 'FAIL' end,
  'Soll 0 sein.'
from public.wallets w;

-- Verschlüsselte Chain-Adressen je Typ: nur Coverage, kein Zwang falls Chain unbenutzt.
insert into _wallettracking_security_diag_045
select 'wallets','encrypted_evm_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'evm_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter EVM-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encrypted_btc_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'btc_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter BTC-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encrypted_xrp_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'xrp_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter XRP-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encrypted_sol_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'sol_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter Solana-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encrypted_tron_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'tron_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter TRON-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select 'wallets','encrypted_akash_address_rows',
  count(*) filter (where coalesce(to_jsonb(w)->>'akash_address_ciphertext','')<>'')::bigint,
  'INFO',
  'Anzahl Wallets mit verschlüsselter AKASH-Adresse.'
from public.wallets w;

insert into _wallettracking_security_diag_045
select
  'wallets',
  'schema_columns',
  count(*)::bigint,
  'INFO',
  string_agg(column_name||':'||data_type, ', ' order by ordinal_position)
from information_schema.columns
where table_schema='public'
  and table_name='wallets';

-- =====================================================================
-- Genau EIN Resultset
-- =====================================================================
select
  object_name,
  check_name,
  rows_count,
  status,
  explanation
from _wallettracking_security_diag_045
order by
  case object_name
    when 'project_nft_ownership' then 1
    when 'project_scan_state' then 2
    when 'project_transactions' then 3
    when 'user_team_aliases_private' then 4
    when 'wallets' then 5
    else 9
  end,
  check_name;
