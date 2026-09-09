-- WalletTracking
-- Migration 026: Security / Private Wallet Architecture - Phase 1
-- Stand: 2026-09-09
--
-- Zweck:
--   1) Bereitet die spätere serverseitige Verschlüsselung der privaten Wallet-Stammdaten vor.
--   2) Ergänzt private wallet_address-basierte Tabellen um eine stabile wallet_id (UUID).
--   3) Füllt wallet_id nur dann automatisch zurück, wenn user_id + EVM-Adresse eindeutig
--      genau einem Datensatz in public.wallets zugeordnet werden kann.
--   4) Legt Foreign Keys und Indizes für wallet_id an.
--   5) Löscht KEINE bestehenden Klartextspalten und verändert KEINE bestehenden Primary Keys.
--
-- WICHTIG:
--   - Diese Phase aktiviert noch KEINE Verschlüsselung.
--   - Bestehende Frontend-/Discovery-Logik kann unverändert weiterlaufen.
--   - Unklare bzw. nicht zuordenbare Datensätze bleiben mit wallet_id = NULL bestehen und
--     werden am Ende der Migration im Prüfresultat ausgewiesen.
--   - Erst nach erfolgreicher Prüfung wird in einer späteren Phase auf wallet_id umgestellt.

begin;

-- ---------------------------------------------------------------------------
-- 1. Wallet-Stammdaten für spätere Verschlüsselung vorbereiten
-- ---------------------------------------------------------------------------
-- Der Ciphertext wird später als versioniertes Envelope-Format gespeichert
-- (z.B. JSON/Base64 als Text mit Ciphertext + IV/Nonce + Formatversion).
-- Die Klartextspalten bleiben in Phase 1 bewusst bestehen.

alter table public.wallets
  add column if not exists encryption_version integer,
  add column if not exists key_version integer,
  add column if not exists label_ciphertext text,
  add column if not exists evm_address_ciphertext text,
  add column if not exists btc_address_ciphertext text,
  add column if not exists xrp_address_ciphertext text,
  add column if not exists sol_address_ciphertext text,
  add column if not exists tron_address_ciphertext text,
  add column if not exists akash_address_ciphertext text;

comment on column public.wallets.encryption_version is
  'Version des serverseitigen Verschluesselungsformats; Phase 1 noch NULL.';
comment on column public.wallets.key_version is
  'Version des serverseitigen Encryption Keys; Phase 1 noch NULL.';
comment on column public.wallets.label_ciphertext is
  'Serverseitig verschluesseltes Wallet-Label; Phase 1 noch NULL.';
comment on column public.wallets.evm_address_ciphertext is
  'Serverseitig verschluesselte EVM-Adresse; Phase 1 noch NULL.';

-- ---------------------------------------------------------------------------
-- 2. Private Tabellen um wallet_id ergänzen
-- ---------------------------------------------------------------------------

alter table public.lp_history_events
  add column if not exists wallet_id uuid;

alter table public.lp_position_cache
  add column if not exists wallet_id uuid;

alter table public.project_miners
  add column if not exists wallet_id uuid;

alter table public.project_miner_ownership
  add column if not exists wallet_id uuid;

alter table public.project_nft_claims
  add column if not exists wallet_id uuid;

alter table public.project_nft_ownership
  add column if not exists wallet_id uuid;

alter table public.project_scan_state
  add column if not exists wallet_id uuid;

alter table public.project_transactions
  add column if not exists wallet_id uuid;

alter table public.tln_vow_staking_scan_cache
  add column if not exists wallet_id uuid;

alter table public.tln_wallet_identity_cache
  add column if not exists wallet_id uuid;

-- year_end_positions besitzt wallet_id bereits laut Live-Schema.
-- Dort wird in Phase 1 nichts am bestehenden Datentyp/Constraint verändert.

-- ---------------------------------------------------------------------------
-- 3. Eindeutige Wallet-Zuordnung bilden und wallet_id zurückfüllen
-- ---------------------------------------------------------------------------
-- Absichtlich KEIN blindes "LIMIT 1":
-- Wenn ein User dieselbe EVM-Adresse mehrfach in public.wallets gespeichert hat,
-- gilt die Zuordnung als mehrdeutig und wird NICHT automatisch befüllt.

create temporary table wt_phase1_unique_evm_wallet_map
on commit drop
as
select
  w.user_id,
  lower(trim(w.evm_address)) as normalized_address,
  (array_agg(w.id order by w.id))[1] as wallet_id
from public.wallets w
where nullif(trim(coalesce(w.evm_address, '')), '') is not null
group by
  w.user_id,
  lower(trim(w.evm_address))
having count(distinct w.id) = 1;

create index wt_phase1_unique_evm_wallet_map_idx
  on wt_phase1_unique_evm_wallet_map (user_id, normalized_address);

update public.lp_history_events t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.lp_position_cache t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_miners t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_miner_ownership t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_nft_claims t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_nft_ownership t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_scan_state t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.project_transactions t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.tln_vow_staking_scan_cache t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

update public.tln_wallet_identity_cache t
set wallet_id = m.wallet_id
from wt_phase1_unique_evm_wallet_map m
where t.wallet_id is null
  and t.user_id = m.user_id
  and lower(trim(t.wallet_address)) = m.normalized_address;

-- ---------------------------------------------------------------------------
-- 4. Foreign Keys zu public.wallets(id)
-- ---------------------------------------------------------------------------
-- NO ACTION ist in Phase 1 absichtlich konservativ.
-- Die finale Purge-/CASCADE-Strategie wird erst nach Umstellung der Anwendung
-- auf wallet_id festgelegt.

do $$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('lp_history_events',          'lp_history_events_wallet_id_fkey'),
      ('lp_position_cache',          'lp_position_cache_wallet_id_fkey'),
      ('project_miners',             'project_miners_wallet_id_fkey'),
      ('project_miner_ownership',    'project_miner_ownership_wallet_id_fkey'),
      ('project_nft_claims',         'project_nft_claims_wallet_id_fkey'),
      ('project_nft_ownership',      'project_nft_ownership_wallet_id_fkey'),
      ('project_scan_state',         'project_scan_state_wallet_id_fkey'),
      ('project_transactions',       'project_transactions_wallet_id_fkey'),
      ('tln_vow_staking_scan_cache', 'tln_vow_staking_scan_cache_wallet_id_fkey'),
      ('tln_wallet_identity_cache',  'tln_wallet_identity_cache_wallet_id_fkey')
    ) as x(table_name, constraint_name)
  loop
    if not exists (
      select 1
      from pg_constraint c
      join pg_class rel on rel.oid = c.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname = 'public'
        and rel.relname = r.table_name
        and c.conname = r.constraint_name
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (wallet_id) references public.wallets(id)',
        r.table_name,
        r.constraint_name
      );
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 5. Indizes für neue wallet_id-Zugriffe
-- ---------------------------------------------------------------------------

create index if not exists lp_history_events_user_wallet_id_idx
  on public.lp_history_events (user_id, wallet_id);

create index if not exists lp_position_cache_user_wallet_id_idx
  on public.lp_position_cache (user_id, wallet_id);

create index if not exists project_miners_user_wallet_id_idx
  on public.project_miners (user_id, wallet_id);

create index if not exists project_miner_ownership_user_wallet_id_idx
  on public.project_miner_ownership (user_id, wallet_id);

create index if not exists project_nft_claims_user_wallet_id_idx
  on public.project_nft_claims (user_id, wallet_id);

create index if not exists project_nft_ownership_user_wallet_id_idx
  on public.project_nft_ownership (user_id, wallet_id);

create index if not exists project_scan_state_user_wallet_id_idx
  on public.project_scan_state (user_id, wallet_id);

create index if not exists project_transactions_user_wallet_id_idx
  on public.project_transactions (user_id, wallet_id);

create index if not exists tln_vow_staking_scan_cache_user_wallet_id_idx
  on public.tln_vow_staking_scan_cache (user_id, wallet_id);

create index if not exists tln_wallet_identity_cache_user_wallet_id_idx
  on public.tln_wallet_identity_cache (user_id, wallet_id);

-- Bestehende wallet_id-Spalte zusätzlich für spätere Join-Zugriffe absichern.
create index if not exists year_end_positions_user_wallet_id_idx
  on public.year_end_positions (user_id, wallet_id);

commit;

-- ===========================================================================
-- 6. POST-MIGRATION-PRÜFUNG
-- ===========================================================================
-- Diese Abfrage verändert nichts.
--
-- Erwartung für eine vollständige automatische Phase-1-Zuordnung:
--   unmatched_rows = 0
--
-- Wenn einzelne Tabellen > 0 anzeigen:
--   NICHTS löschen und noch NICHT mit Phase 2 fortfahren.
--   Das Ergebnis exportieren/weitergeben; die Zeilen werden gezielt analysiert.

with audit as (
  select 'lp_history_events' as table_name,
         count(*)::bigint as total_rows,
         count(*) filter (where wallet_id is not null)::bigint as mapped_rows,
         count(*) filter (where wallet_id is null)::bigint as unmatched_rows
  from public.lp_history_events

  union all
  select 'lp_position_cache', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.lp_position_cache

  union all
  select 'project_miners', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_miners

  union all
  select 'project_miner_ownership', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_miner_ownership

  union all
  select 'project_nft_claims', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_nft_claims

  union all
  select 'project_nft_ownership', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_nft_ownership

  union all
  select 'project_scan_state', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_scan_state

  union all
  select 'project_transactions', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.project_transactions

  union all
  select 'tln_vow_staking_scan_cache', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.tln_vow_staking_scan_cache

  union all
  select 'tln_wallet_identity_cache', count(*),
         count(*) filter (where wallet_id is not null),
         count(*) filter (where wallet_id is null)
  from public.tln_wallet_identity_cache
)
select
  table_name,
  total_rows,
  mapped_rows,
  unmatched_rows,
  case
    when unmatched_rows = 0 then 'PASS'
    else 'PRUEFEN'
  end as status
from audit
order by table_name;
