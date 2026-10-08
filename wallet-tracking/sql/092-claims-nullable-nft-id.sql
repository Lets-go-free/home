-- Phase 7.54: belegte Bot-Claims ohne identifizierbares NFT speichern.
-- Wiederholbar; bestehende Claims, RLS, Grants und Schlüssel bleiben erhalten.
BEGIN;
ALTER TABLE public.project_nft_claims ALTER COLUMN nft_id DROP NOT NULL;
COMMIT;
