-- 019-cache-data-versioning.sql
-- Phase 2av: fachliche Daten-/Cache-Version pro Wallet, Chain und Datentyp.
-- EINMAL nach 018 ausführen.
-- 001-018 NICHT erneut ausführen, wenn sie bereits erfolgreich gelaufen sind.

alter table public.wallet_refresh_state
  add column if not exists data_version integer not null default 0;

comment on column public.wallet_refresh_state.data_version is
  'Fachliche Cache-/Algorithmus-Version. Unter Soll-Version muss der Bereich vor Tageslimit/Activity-Check neu aufgebaut werden.';
