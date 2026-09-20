-- WalletTracking
-- Migration 067: Private Cache Plaintext Guard
-- Stand: 2026-09-20
--
-- Zweck:
--   Nach dem wallet_id-Cutover dürfen private Wallet-Caches keine eigene
--   Wallet-Adresse mehr in wallet_address persistieren. Frühere Cleanup-
--   Migrationen haben die Daten bereinigt; diese Migration ergänzt die
--   fehlende Defense-in-Depth für LP- und TLN/VOW-Caches.
--
-- Ausführung: komplett als ein Script, mit RLS/Admin-Rechten.

begin;

do $$
begin
  if exists (select 1 from public.lp_history_events where wallet_id is null)
     or exists (select 1 from public.lp_position_cache where wallet_id is null)
     or exists (select 1 from public.tln_vow_staking_scan_cache where wallet_id is null)
  then
    raise exception 'BLOCK: Private Cache enthält Zeilen ohne wallet_id.';
  end if;
end $$;

alter table public.lp_history_events alter column wallet_address drop not null;
alter table public.lp_position_cache alter column wallet_address drop not null;
alter table public.tln_vow_staking_scan_cache alter column wallet_address drop not null;

update public.lp_history_events set wallet_address=null where wallet_address is not null;
update public.lp_position_cache set wallet_address=null where wallet_address is not null;
update public.tln_vow_staking_scan_cache set wallet_address=null where wallet_address is not null;

-- Restrictive Policies wirken zusätzlich zu den normalen Own-Row-RLS-Regeln.
drop policy if exists lp_history_events_no_plain_wallet_insert on public.lp_history_events;
create policy lp_history_events_no_plain_wallet_insert
on public.lp_history_events as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists lp_history_events_no_plain_wallet_update on public.lp_history_events;
create policy lp_history_events_no_plain_wallet_update
on public.lp_history_events as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists lp_position_cache_no_plain_wallet_insert on public.lp_position_cache;
create policy lp_position_cache_no_plain_wallet_insert
on public.lp_position_cache as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists lp_position_cache_no_plain_wallet_update on public.lp_position_cache;
create policy lp_position_cache_no_plain_wallet_update
on public.lp_position_cache as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists tln_vow_staking_scan_cache_no_plain_wallet_insert on public.tln_vow_staking_scan_cache;
create policy tln_vow_staking_scan_cache_no_plain_wallet_insert
on public.tln_vow_staking_scan_cache as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists tln_vow_staking_scan_cache_no_plain_wallet_update on public.tln_vow_staking_scan_cache;
create policy tln_vow_staking_scan_cache_no_plain_wallet_update
on public.tln_vow_staking_scan_cache as restrictive for update to authenticated
using (true) with check (wallet_address is null);

commit;

select * from (
  select 'lp_history_events'::text table_name,count(*)::bigint total_rows,
         count(*) filter(where wallet_id is null)::bigint wallet_id_null_rows,
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')::bigint plaintext_wallet_rows
  from public.lp_history_events
  union all
  select 'lp_position_cache',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.lp_position_cache
  union all
  select 'tln_vow_staking_scan_cache',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.tln_vow_staking_scan_cache
) x order by table_name;
