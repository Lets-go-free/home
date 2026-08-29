-- 020-project-scan-diagnostics.sql
-- Phase 2aw: Diagnosewerte für Projekt-/LP-Scans.
-- EINMAL nach 019 ausführen.
-- 001-019 NICHT erneut ausführen, wenn bereits erfolgreich gelaufen.

alter table public.project_scan_state
  add column if not exists last_transfers_seen integer not null default 0,
  add column if not exists last_candidate_contracts integer not null default 0,
  add column if not exists last_project_pairs integer not null default 0,
  add column if not exists last_events_saved integer not null default 0,
  add column if not exists last_staking_events integer not null default 0,
  add column if not exists last_scan_result text,
  add column if not exists last_scan_message text;

comment on column public.project_scan_state.last_transfers_seen is 'ERC20-Transfers im letzten Discovery-Lauf';
comment on column public.project_scan_state.last_candidate_contracts is 'Unterschiedliche ERC20-Contracts, die als LP-Kandidaten geprüft wurden';
comment on column public.project_scan_state.last_project_pairs is 'Als Projekt-LPs erkannte Pair-Contracts im letzten Lauf';
comment on column public.project_scan_state.last_events_saved is 'Neu gespeicherte LP-/Staking-Events im letzten Lauf';
comment on column public.project_scan_state.last_staking_events is 'Davon neu erkannte Stake-/Unstake-Events';
