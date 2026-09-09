-- WalletTracking
-- 033-private-cache-wallet-address-cleanup.sql
-- Phase 4a – Entfernen redundanter Klartext-Wallet-Adressen
--
-- Voraussetzung:
--   032-private-cache-wallet-id-final-audit.sql muss PASS liefern.
--
-- Zweck:
--   wallet_address ist in den hier betroffenen privaten Tabellen redundant,
--   weil jede Zeile bereits vollständig über wallet_id an public.wallets gebunden ist.
--
-- WICHTIG:
--   - Es werden KEINE Zeilen gelöscht.
--   - Es werden nur wallet_address-Werte auf NULL gesetzt.
--   - wallet_id bleibt unverändert.
--   - TLN/VOW-Identity-/Team-Caches sind ABSICHTLICH NICHT enthalten.
--   - year_end_positions / snapshot_items sind ABSICHTLICH NICHT enthalten.
--
-- Das Script bricht vollständig ab, sobald irgendwo wallet_id IS NULL vorkommt.

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

-- Nur redundante Klartext-Adressen entfernen.
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

-- Audit nach Cleanup:
with audit as (
  select 'lp_history_events'::text as table_name, count(*)::bigint total_rows,
    count(*) filter (where wallet_id is null)::bigint wallet_id_null_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint plaintext_wallet_address_rows
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
