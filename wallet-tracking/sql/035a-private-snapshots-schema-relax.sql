-- WalletTracking
-- 035a-private-snapshots-schema-relax.sql
-- Phase 4b – Schema vorbereiten
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--
-- REIHENFOLGE:
--   1. ZUERST dieses Script ausführen.
--   2. DANACH die neue app.js deployen.
--   3. Snapshot/Stichtag kurz testen.
--   4. ERST DANACH 035b ausführen.
--
-- Dieses Script löscht/ändert KEINE bestehenden Werte.
-- Es erlaubt lediglich NULL in den künftig nicht mehr verwendeten
-- privaten Klartextfeldern.

begin;

alter table public.year_end_positions
  alter column wallet_label drop not null,
  alter column wallet_address drop not null;

alter table public.snapshot_items
  alter column wallet_label drop not null;

commit;

-- Genau EIN Resultset:
select
  table_name,
  column_name,
  is_nullable
from information_schema.columns
where table_schema='public'
  and (
    (table_name='year_end_positions' and column_name in ('wallet_label','wallet_address'))
    or
    (table_name='snapshot_items' and column_name='wallet_label')
  )
order by table_name,column_name;
