-- WalletTracking · TLN/VOW globaler SmartNode-Graph-Cache
-- Änderungsstand: 05.09.2026 02:23:14 CEST
-- Migration 025 · globaler, walletunabhängiger Chain-Fakten-Cache für Step 6
--
-- Ziel:
-- - vollständige verifizierte SmartNode.join(address)-Child→Parent-Beziehungen global speichern
-- - nicht pro Nutzer duplizieren und nicht mit walletbezogenen Analyse-Caches vermischen
-- - einmaliger historischer Seed; danach inkrementelle Aktualisierung mit Block-Overlap
-- - bestehender DEV-Button für Wallet-Cache-Löschung berührt diese Tabellen bewusst nicht

begin;

create table if not exists public.tln_vow_smartnode_graph_cache (
  chain_key text not null,
  contract_address text not null,
  child_wallet text not null,
  parent_wallet text not null,
  join_tx_hash text,
  join_block bigint,
  source text not null default 'SmartNode.join(address _referrer)',
  verified_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tln_vow_smartnode_graph_cache_pk primary key (chain_key, contract_address, child_wallet),
  constraint tln_vow_smartnode_graph_cache_child_format check (child_wallet ~ '^0x[0-9a-f]{40}$'),
  constraint tln_vow_smartnode_graph_cache_parent_format check (parent_wallet ~ '^0x[0-9a-f]{40}$'),
  constraint tln_vow_smartnode_graph_cache_contract_format check (contract_address ~ '^0x[0-9a-f]{40}$'),
  constraint tln_vow_smartnode_graph_cache_not_self check (child_wallet <> parent_wallet)
);

create index if not exists tln_vow_smartnode_graph_cache_parent_idx
  on public.tln_vow_smartnode_graph_cache(chain_key, contract_address, parent_wallet);
create index if not exists tln_vow_smartnode_graph_cache_join_block_idx
  on public.tln_vow_smartnode_graph_cache(chain_key, contract_address, join_block);
create unique index if not exists tln_vow_smartnode_graph_cache_tx_idx
  on public.tln_vow_smartnode_graph_cache(chain_key, contract_address, join_tx_hash)
  where join_tx_hash is not null;

create table if not exists public.tln_vow_smartnode_graph_state (
  chain_key text not null,
  contract_address text not null,
  last_verified_block bigint not null default 0,
  transfer_count bigint not null default 0,
  edge_count bigint not null default 0,
  verified_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tln_vow_smartnode_graph_state_pk primary key (chain_key, contract_address),
  constraint tln_vow_smartnode_graph_state_contract_format check (contract_address ~ '^0x[0-9a-f]{40}$'),
  constraint tln_vow_smartnode_graph_state_nonnegative check (last_verified_block >= 0 and transfer_count >= 0 and edge_count >= 0)
);

alter table public.tln_vow_smartnode_graph_cache enable row level security;
alter table public.tln_vow_smartnode_graph_state enable row level security;

-- Dieser Cache enthält ausschließlich öffentliche, verifizierbare BSC-Chain-Fakten.
-- Alle angemeldeten WalletTracking-Nutzer dürfen ihn lesen und ergänzen.
drop policy if exists "smartnode_graph_authenticated_select" on public.tln_vow_smartnode_graph_cache;
create policy "smartnode_graph_authenticated_select"
on public.tln_vow_smartnode_graph_cache for select
to authenticated using (true);

drop policy if exists "smartnode_graph_authenticated_insert" on public.tln_vow_smartnode_graph_cache;
create policy "smartnode_graph_authenticated_insert"
on public.tln_vow_smartnode_graph_cache for insert
to authenticated with check (created_by = auth.uid());

drop policy if exists "smartnode_graph_authenticated_update" on public.tln_vow_smartnode_graph_cache;
create policy "smartnode_graph_authenticated_update"
on public.tln_vow_smartnode_graph_cache for update
to authenticated using (true) with check (created_by = auth.uid());

drop policy if exists "smartnode_state_authenticated_select" on public.tln_vow_smartnode_graph_state;
create policy "smartnode_state_authenticated_select"
on public.tln_vow_smartnode_graph_state for select
to authenticated using (true);

drop policy if exists "smartnode_state_authenticated_insert" on public.tln_vow_smartnode_graph_state;
create policy "smartnode_state_authenticated_insert"
on public.tln_vow_smartnode_graph_state for insert
to authenticated with check (updated_by = auth.uid());

drop policy if exists "smartnode_state_authenticated_update" on public.tln_vow_smartnode_graph_state;
create policy "smartnode_state_authenticated_update"
on public.tln_vow_smartnode_graph_state for update
to authenticated using (true) with check (updated_by = auth.uid());

comment on table public.tln_vow_smartnode_graph_cache is
'Globaler TLN/VOW SmartNode Child→Parent-Graph aus verifizierten join(address)-Transaktionen. Nicht wallet- oder user-spezifisch.';
comment on table public.tln_vow_smartnode_graph_state is
'Globaler Scan-Fortschritt für den TLN/VOW SmartNode-Graph. Ermöglicht inkrementelle Aktualisierung statt vollständiger Historien-Neuberechnung.';

commit;

-- Kontrolle nach dem ersten vollständigen Step-6-Seed:
-- select count(*) as edges from public.tln_vow_smartnode_graph_cache
-- where chain_key='bsc' and contract_address='0x028c911c10c9e346158206991e02d09bd0a8a35b';
--
-- Erwarteter historischer Referenzstand zum Entwicklungszeitpunkt: ca. 12'924 Kanten.
-- select * from public.tln_vow_smartnode_graph_state
-- where chain_key='bsc' and contract_address='0x028c911c10c9e346158206991e02d09bd0a8a35b';
