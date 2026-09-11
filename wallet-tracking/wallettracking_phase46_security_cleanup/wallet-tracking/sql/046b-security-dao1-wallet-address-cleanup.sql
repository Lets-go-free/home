-- WalletTracking
-- 046b-security-dao1-wallet-address-cleanup.sql
-- DAO1 private Wallet-Address Cleanup – Daten bereinigen + Wiedereintrag verhindern
--
-- AUSFÜHRUNG:
--   ERST nachdem die neue projects/dao1/dao1.js deployed und getestet wurde.
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   "Without RLS" verwenden.
--
-- Sicherheit:
--   - keine Zeile wird gelöscht
--   - wallet_address wird nur NULL gesetzt
--   - wallet_id muss für alle betroffenen Zeilen vorhanden sein
--   - RESTRICTIVE RLS-Policies verhindern, dass alte Frontends wallet_address
--     erneut im Klartext schreiben.

begin;

do $$
begin
  if exists (select 1 from public.project_nft_ownership where wallet_address is not null and wallet_id is null)
     or exists (select 1 from public.project_scan_state where wallet_address is not null and wallet_id is null)
     or exists (select 1 from public.project_transactions where wallet_address is not null and wallet_id is null)
     or exists (select 1 from public.project_nft_claims where wallet_address is not null and wallet_id is null)
     or exists (select 1 from public.project_miners where wallet_address is not null and wallet_id is null)
     or exists (select 1 from public.project_miner_ownership where wallet_address is not null and wallet_id is null)
  then
    raise exception 'BLOCK: DAO1 Cleanup abgebrochen – wallet_id fehlt.';
  end if;
end $$;

update public.project_nft_ownership set wallet_address=null where wallet_address is not null;
update public.project_scan_state set wallet_address=null where wallet_address is not null;
update public.project_transactions set wallet_address=null where wallet_address is not null;
update public.project_nft_claims set wallet_address=null where wallet_address is not null;
update public.project_miners set wallet_address=null where wallet_address is not null;
update public.project_miner_ownership set wallet_address=null where wallet_address is not null;

-- Alte address-basierte Indizes/Constraints sind nach der Migration nicht mehr fachlich nötig.
alter table public.project_scan_state
  drop constraint if exists project_scan_state_user_id_project_key_chain_key_wallet_add_key;
alter table public.project_transactions
  drop constraint if exists project_transactions_user_id_project_key_chain_key_wallet_a_key;

drop index if exists public.project_scan_state_lookup_idx;
drop index if exists public.project_transactions_wallet_time_idx;
drop index if exists public.project_transactions_wallet_block_idx;
drop index if exists public.project_transactions_claim_idx;
drop index if exists public.project_nft_ownership_wallet_idx;
drop index if exists public.project_miner_ownership_lookup_idx;
drop index if exists public.project_nft_claims_wallet_block_idx;
drop index if exists public.project_nft_claims_nft_idx;

-- Defense in depth: authentifizierte Clients dürfen diese Klartextspalte nicht mehr befüllen.
drop policy if exists project_nft_ownership_no_plain_wallet_insert on public.project_nft_ownership;
create policy project_nft_ownership_no_plain_wallet_insert
on public.project_nft_ownership as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_nft_ownership_no_plain_wallet_update on public.project_nft_ownership;
create policy project_nft_ownership_no_plain_wallet_update
on public.project_nft_ownership as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists project_scan_state_no_plain_wallet_insert on public.project_scan_state;
create policy project_scan_state_no_plain_wallet_insert
on public.project_scan_state as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_scan_state_no_plain_wallet_update on public.project_scan_state;
create policy project_scan_state_no_plain_wallet_update
on public.project_scan_state as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists project_transactions_no_plain_wallet_insert on public.project_transactions;
create policy project_transactions_no_plain_wallet_insert
on public.project_transactions as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_transactions_no_plain_wallet_update on public.project_transactions;
create policy project_transactions_no_plain_wallet_update
on public.project_transactions as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists project_nft_claims_no_plain_wallet_insert on public.project_nft_claims;
create policy project_nft_claims_no_plain_wallet_insert
on public.project_nft_claims as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_nft_claims_no_plain_wallet_update on public.project_nft_claims;
create policy project_nft_claims_no_plain_wallet_update
on public.project_nft_claims as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists project_miners_no_plain_wallet_insert on public.project_miners;
create policy project_miners_no_plain_wallet_insert
on public.project_miners as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_miners_no_plain_wallet_update on public.project_miners;
create policy project_miners_no_plain_wallet_update
on public.project_miners as restrictive for update to authenticated
using (true) with check (wallet_address is null);

drop policy if exists project_miner_ownership_no_plain_wallet_insert on public.project_miner_ownership;
create policy project_miner_ownership_no_plain_wallet_insert
on public.project_miner_ownership as restrictive for insert to authenticated
with check (wallet_address is null);

drop policy if exists project_miner_ownership_no_plain_wallet_update on public.project_miner_ownership;
create policy project_miner_ownership_no_plain_wallet_update
on public.project_miner_ownership as restrictive for update to authenticated
using (true) with check (wallet_address is null);

commit;

-- Genau EIN Resultset:
select * from (
  select 'project_nft_ownership'::text table_name, count(*)::bigint total_rows,
         count(*) filter (where wallet_id is null)::bigint wallet_id_null_rows,
         count(*) filter (where wallet_address is not null and btrim(wallet_address)<>'')::bigint plaintext_wallet_rows
  from public.project_nft_ownership
  union all
  select 'project_scan_state',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.project_scan_state
  union all
  select 'project_transactions',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.project_transactions
  union all
  select 'project_nft_claims',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.project_nft_claims
  union all
  select 'project_miners',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.project_miners
  union all
  select 'project_miner_ownership',count(*),count(*) filter(where wallet_id is null),
         count(*) filter(where wallet_address is not null and btrim(wallet_address)<>'')
  from public.project_miner_ownership
) x
order by table_name;
