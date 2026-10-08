-- Phase 7.55: globale Admin-Stammdatenoption für Projekt-Token.
-- 3 Statements in Reihenfolge, keine SELECT-Resultsets. Wiederholbar.
-- Bestehende Tabelle/RLS/Grants/Export behalten; keine Userdaten/neue Tabelle.
BEGIN;
ALTER TABLE public.predefined_tokens
  ADD COLUMN IF NOT EXISTS dashboard_price_visible boolean NOT NULL DEFAULT true;
COMMIT;
