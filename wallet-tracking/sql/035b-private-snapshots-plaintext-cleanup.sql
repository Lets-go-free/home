-- WalletTracking
-- 035b-private-snapshots-plaintext-cleanup.sql
-- Phase 4b – vorhandene redundante Klartextdaten entfernen
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--
-- VORAUSSETZUNG:
--   - 035a wurde erfolgreich ausgeführt.
--   - die neue app.js ist deployed.
--   - Datenbestand per 31.12. und Snapshot-Funktionen wurden kurz getestet.
--
-- WICHTIG:
--   snapshot_items.address bleibt ABSICHTLICH erhalten.
--   Es handelt sich dort bei Token-Zeilen um die öffentliche Token-/Contract-Adresse.
--
-- Keine Zeilen werden gelöscht.

begin;

do $$
begin
  if exists (select 1 from public.year_end_positions where wallet_id is null) then
    raise exception 'BLOCK: year_end_positions enthält Zeilen ohne wallet_id';
  end if;
  if exists (select 1 from public.snapshot_items where wallet_id is null) then
    raise exception 'BLOCK: snapshot_items enthält Zeilen ohne wallet_id';
  end if;
end $$;

update public.year_end_positions
set wallet_label=null,
    wallet_address=null
where wallet_label is not null
   or wallet_address is not null;

update public.snapshot_items
set wallet_label=null
where wallet_label is not null;

commit;

-- Genau EIN Resultset:
select
  'snapshot_items'::text as table_name,
  count(*)::bigint as total_rows,
  count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
  count(*) filter (where wallet_label is not null and btrim(wallet_label)<>'')::bigint as plaintext_wallet_label_rows,
  0::bigint as plaintext_private_wallet_address_rows,
  count(*) filter (
    where coalesce(is_native,false)=false
      and address is not null
      and btrim(address)<>''
  )::bigint as retained_public_token_address_rows,
  case
    when count(*) filter (where wallet_id is null)=0
     and count(*) filter (where wallet_label is not null and btrim(wallet_label)<>'')=0
    then 'PASS' else 'FAIL'
  end as cleanup_status
from public.snapshot_items

union all

select
  'year_end_positions',
  count(*)::bigint,
  count(*) filter (where wallet_id is null)::bigint,
  count(*) filter (where wallet_label is not null and btrim(wallet_label)<>'')::bigint,
  count(*) filter (where wallet_address is not null and btrim(wallet_address)<>'')::bigint,
  null::bigint,
  case
    when count(*) filter (where wallet_id is null)=0
     and count(*) filter (where wallet_label is not null and btrim(wallet_label)<>'')=0
     and count(*) filter (where wallet_address is not null and btrim(wallet_address)<>'')=0
    then 'PASS' else 'FAIL'
  end
from public.year_end_positions
order by table_name;
