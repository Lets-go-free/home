-- WalletTracking
-- 030-private-cache-wallet-id-phase4a.sql
-- Phase 4a: Programm-/DB-Schlüssel von wallet_address auf wallet_id vorbereiten.
--
-- WICHTIG:
-- - Keine Daten werden gelöscht oder genullt.
-- - wallet_address bleibt vorerst als Legacy-/Kompatibilitätsfeld bestehen.
-- - Bestehende RLS-Policies bleiben unverändert.
-- - Die neuen Unique-Constraints erlauben Upserts über wallet_id.
-- - Erst nach erfolgreichem Funktionstest folgt in einer separaten Migration
--   das Entfernen/Nullen der redundanten Klartext-Adressen.

begin;

-- Safety: Phase 1 muss vollständig sein.
do $$
begin
  if exists (select 1 from public.lp_history_events where wallet_id is null)
     or exists (select 1 from public.lp_position_cache where wallet_id is null)
     or exists (select 1 from public.project_scan_state where wallet_id is null)
     or exists (select 1 from public.project_transactions where wallet_id is null)
     or exists (select 1 from public.project_nft_claims where wallet_id is null)
     or exists (select 1 from public.project_nft_ownership where wallet_id is null)
  then
    raise exception 'Phase 4a abgebrochen: mindestens eine relevante Zeile hat wallet_id IS NULL.';
  end if;
end $$;

-- Safety: unter wallet_id dürfen keine Konflikte entstehen.
do $$
begin
  if exists (
    select 1 from public.lp_history_events
    group by user_id, project_key, chain_key, wallet_id, pair_address, tx_hash, event_type
    having count(*) > 1
  ) then raise exception 'Duplikate für lp_history_events / wallet_id gefunden.'; end if;

  if exists (
    select 1 from public.lp_position_cache
    group by user_id, project_key, chain_key, wallet_id, pair_address
    having count(*) > 1
  ) then raise exception 'Duplikate für lp_position_cache / wallet_id gefunden.'; end if;

  if exists (
    select 1 from public.project_scan_state
    group by user_id, project_key, chain_key, wallet_id, scan_type
    having count(*) > 1
  ) then raise exception 'Duplikate für project_scan_state / wallet_id gefunden.'; end if;

  if exists (
    select 1 from public.project_transactions
    group by user_id, project_key, chain_key, wallet_id, tx_hash
    having count(*) > 1
  ) then raise exception 'Duplikate für project_transactions / wallet_id gefunden.'; end if;
end $$;

-- Neue Konfliktschlüssel für den produktiven Code.
alter table public.lp_history_events
  drop constraint if exists lp_history_events_wallet_id_key;
alter table public.lp_history_events
  add constraint lp_history_events_wallet_id_key
  unique (user_id, project_key, chain_key, wallet_id, pair_address, tx_hash, event_type);

alter table public.lp_position_cache
  drop constraint if exists lp_position_cache_wallet_id_key;
alter table public.lp_position_cache
  add constraint lp_position_cache_wallet_id_key
  unique (user_id, project_key, chain_key, wallet_id, pair_address);

alter table public.project_scan_state
  drop constraint if exists project_scan_state_wallet_id_key;
alter table public.project_scan_state
  add constraint project_scan_state_wallet_id_key
  unique (user_id, project_key, chain_key, wallet_id, scan_type);

alter table public.project_transactions
  drop constraint if exists project_transactions_wallet_id_key;
alter table public.project_transactions
  add constraint project_transactions_wallet_id_key
  unique (user_id, project_key, chain_key, wallet_id, tx_hash);

-- wallet_id-basierte Leseindizes für die stark genutzten Caches.
create index if not exists lp_history_events_wallet_id_block_idx
  on public.lp_history_events (user_id, project_key, chain_key, wallet_id, block_number desc);

create index if not exists lp_position_cache_wallet_id_scope_idx
  on public.lp_position_cache (user_id, project_key, chain_key, wallet_id);

create index if not exists project_scan_state_wallet_id_lookup_idx
  on public.project_scan_state (user_id, project_key, chain_key, wallet_id, scan_type);

create index if not exists project_transactions_wallet_id_time_idx
  on public.project_transactions (user_id, project_key, chain_key, wallet_id, tx_timestamp desc);

create index if not exists project_transactions_wallet_id_block_idx
  on public.project_transactions (user_id, project_key, chain_key, wallet_id, block_number desc);

create index if not exists project_nft_claims_wallet_id_block_idx
  on public.project_nft_claims (user_id, project_key, chain_key, wallet_id, block_number);

create index if not exists project_nft_ownership_wallet_id_nft_idx
  on public.project_nft_ownership (user_id, project_key, wallet_id, nft_contract, nft_id);

commit;

-- Audit: keine privaten Adressen ausgeben.
select 'lp_history_events' as table_name, count(*) total_rows,
       count(*) filter (where wallet_id is not null) wallet_id_rows
from public.lp_history_events
union all
select 'lp_position_cache', count(*), count(*) filter (where wallet_id is not null)
from public.lp_position_cache
union all
select 'project_scan_state', count(*), count(*) filter (where wallet_id is not null)
from public.project_scan_state
union all
select 'project_transactions', count(*), count(*) filter (where wallet_id is not null)
from public.project_transactions
union all
select 'project_nft_claims', count(*), count(*) filter (where wallet_id is not null)
from public.project_nft_claims
union all
select 'project_nft_ownership', count(*), count(*) filter (where wallet_id is not null)
from public.project_nft_ownership;
