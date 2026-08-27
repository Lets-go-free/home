-- Wallet Tracking · Phase 2y
-- Manuell ergänzte historische APTM/USD-Kurse eindeutig kennzeichnen.
-- EINMAL ausführen.

alter table public.project_transactions
  add column if not exists price_is_manual boolean not null default false;

alter table public.project_nft_claims
  add column if not exists price_is_manual boolean not null default false;

comment on column public.project_transactions.price_is_manual is
  'true = historischer APTM/USD-Kurs wurde manuell vom Benutzer eingetragen.';
comment on column public.project_nft_claims.price_is_manual is
  'true = historischer Claim-Kurs wurde manuell vom Benutzer eingetragen.';
