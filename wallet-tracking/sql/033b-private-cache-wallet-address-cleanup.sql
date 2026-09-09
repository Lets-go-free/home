-- WalletTracking
-- 033b-private-cache-wallet-address-cleanup.sql
-- KORRIGIERTE Version von 033
--
-- Ursache des Fehlers in 033:
--   In mehreren Tabellen ist wallet_address noch als NOT NULL definiert.
--   Deshalb muss zuerst die Spalten-Constraint gelockert werden, bevor die
--   redundanten Klartext-Adressen auf NULL gesetzt werden.
--
-- Ausführung:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es gibt am Ende genau EINE Ergebnis-Tabelle.
--
-- Sicherheit:
--   - Der fehlgeschlagene Lauf von 033 wurde wegen BEGIN/Fehler vollständig
--     zurückgerollt; es ist kein Teil-Cleanup übrig geblieben.
--   - Keine Zeilen werden gelöscht.
--   - wallet_id bleibt unverändert.
--   - TLN/VOW-Identity-/Team-Caches sowie year_end_positions/snapshot_items
--     sind weiterhin NICHT enthalten.
--   - Vor jeder Änderung wird erneut geprüft, dass keine wallet_id fehlt.

begin;

do $$
begin
  if exists (select 1 from public.lp_history_events where wallet_id is null) then
    raise exception 'BLOCK: lp_history_events enthält Zeilen ohne wallet_id';
  end if;

  if exists (select 1 from public.lp_position_cache where wallet_id is null) then
    raise exception 'BLOCK: lp_position_cache enthält Zeilen ohne wallet_id';
  end if;

  if exists (select 1 from public.project_scan_state where wallet_id is null) then
    raise exception 'BLOCK: project_scan_state enthält Zeilen ohne wallet_id';
  end if;

  if exists (select 1 from public.project_transactions where wallet_id is null) then
    raise exception 'BLOCK: project_transactions enthält Zeilen ohne wallet_id';
  end if;

  if exists (select 1 from public.project_nft_claims where wallet_id is null) then
    raise exception 'BLOCK: project_nft_claims enthält Zeilen ohne wallet_id';
  end if;

  if exists (select 1 from public.project_nft_ownership where wallet_id is null) then
    raise exception 'BLOCK: project_nft_ownership enthält Zeilen ohne wallet_id';
  end if;
end $$;

-- 1) wallet_address darf künftig leer sein, weil wallet_id die private Zuordnung trägt.
alter table public.lp_history_events
  alter column wallet_address drop not null;

alter table public.lp_position_cache
  alter column wallet_address drop not null;

alter table public.project_scan_state
  alter column wallet_address drop not null;

alter table public.project_transactions
  alter column wallet_address drop not null;

alter table public.project_nft_claims
  alter column wallet_address drop not null;

alter table public.project_nft_ownership
  alter column wallet_address drop not null;

-- 2) Redundante Klartext-Wallet-Adressen entfernen.
update public.lp_history_events
set wallet_address = null
where wallet_address is not null;

update public.lp_position_cache
set wallet_address = null
where wallet_address is not null;

update public.project_scan_state
set wallet_address = null
where wallet_address is not null;

update public.project_transactions
set wallet_address = null
where wallet_address is not null;

update public.project_nft_claims
set wallet_address = null
where wallet_address is not null;

update public.project_nft_ownership
set wallet_address = null
where wallet_address is not null;

commit;

-- 3) Abschlusskontrolle: genau EINE Ergebnis-Tabelle.
with audit as (
  select 'lp_history_events'::text as table_name,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint as plaintext_wallet_address_rows
  from public.lp_history_events

  union all
  select 'lp_position_cache', count(*),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.lp_position_cache

  union all
  select 'project_scan_state', count(*),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_scan_state

  union all
  select 'project_transactions', count(*),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_transactions

  union all
  select 'project_nft_claims', count(*),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_claims

  union all
  select 'project_nft_ownership', count(*),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_ownership
)
select *,
  case
    when wallet_id_null_rows = 0 and plaintext_wallet_address_rows = 0
    then 'PASS'
    else 'FAIL'
  end as cleanup_status
from audit
order by table_name;
