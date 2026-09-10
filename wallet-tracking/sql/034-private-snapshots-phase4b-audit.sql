-- WalletTracking
-- 034-private-snapshots-phase4b-audit.sql
-- Phase 4b – Read-only Audit für year_end_positions und snapshot_items
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset.
--
-- Es verändert KEINE Daten und KEINE Tabellenstruktur.
--
-- Interpretation:
--   year_end_positions.wallet_label und wallet_address sind private redundante Felder
--   und sollen in der späteren Cleanup-Migration entfernt/geleert werden.
--
--   snapshot_items.wallet_label ist ebenfalls redundant und privat.
--   snapshot_items.address ist dagegen KEINE Wallet-Adresse:
--   bei Token-Zeilen ist es die öffentliche Token-/Contract-Adresse und bleibt erhalten.

with audit as (
  select
    'year_end_positions'::text as table_name,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (where wallet_label is not null and btrim(wallet_label) <> '')::bigint as plaintext_wallet_label_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint as plaintext_private_wallet_address_rows,
    null::bigint as public_token_address_rows,
    null::bigint as invalid_native_address_rows
  from public.year_end_positions

  union all

  select
    'snapshot_items',
    count(*)::bigint,
    count(*) filter (where wallet_id is null)::bigint,
    count(*) filter (where wallet_label is not null and btrim(wallet_label) <> '')::bigint,
    0::bigint,
    count(*) filter (
      where coalesce(is_native,false)=false
        and address is not null
        and btrim(address) <> ''
    )::bigint,
    count(*) filter (
      where coalesce(is_native,false)=true
        and address is not null
        and btrim(address) <> ''
    )::bigint
  from public.snapshot_items
)
select *,
  case
    when wallet_id_null_rows = 0
      and coalesce(invalid_native_address_rows,0) = 0
    then 'PASS'
    else 'BLOCK'
  end as phase4b_ready
from audit
order by table_name;
