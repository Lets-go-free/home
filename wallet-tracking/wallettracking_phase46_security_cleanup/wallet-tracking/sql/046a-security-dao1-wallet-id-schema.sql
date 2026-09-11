-- WalletTracking
-- 046a-security-dao1-wallet-id-schema.sql
-- DAO1 private Wallet-Address Cleanup – Schema vorbereiten
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   "Without RLS" verwenden.
--
-- Dieses Script löscht/NULLt noch KEINE wallet_address-Werte.
-- Es stellt nur sicher, dass DAO1 künftig vollständig über wallet_id arbeiten kann.

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
    raise exception 'BLOCK: Mindestens eine DAO1-Zeile mit wallet_address hat keine wallet_id.';
  end if;
end $$;

alter table public.project_nft_ownership alter column wallet_address drop not null;
alter table public.project_scan_state alter column wallet_address drop not null;
alter table public.project_transactions alter column wallet_address drop not null;
alter table public.project_nft_claims alter column wallet_address drop not null;
alter table public.project_miners alter column wallet_address drop not null;
alter table public.project_miner_ownership alter column wallet_address drop not null;

-- project_miners: alten privaten Konfliktschlüssel ersetzen.
alter table public.project_miners
  drop constraint if exists project_miners_user_id_project_key_wallet_address_nft_id_key;

alter table public.project_miners
  drop constraint if exists project_miners_wallet_id_key;

alter table public.project_miners
  add constraint project_miners_wallet_id_key
  unique (user_id, project_key, wallet_id, nft_id);

create index if not exists project_miners_wallet_id_idx
  on public.project_miners(user_id, project_key, wallet_id, enabled);

create index if not exists project_miner_ownership_wallet_id_lookup_idx
  on public.project_miner_ownership(user_id, project_key, wallet_id, nft_contract, nft_id);

create index if not exists project_nft_ownership_wallet_id_lookup_idx
  on public.project_nft_ownership(user_id, project_key, wallet_id, nft_contract, nft_id);

commit;

-- Genau EIN Resultset:
select
  table_name,
  column_name,
  is_nullable
from information_schema.columns
where table_schema='public'
  and column_name='wallet_address'
  and table_name in (
    'project_nft_ownership','project_scan_state','project_transactions',
    'project_nft_claims','project_miners','project_miner_ownership'
  )
order by table_name;
