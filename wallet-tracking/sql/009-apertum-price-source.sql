-- Wallet Tracking · Phase 2w
-- Preisquelle für historische APTM-Bewertung nachvollziehbar speichern.
-- Einmal ausführen.

alter table public.project_transactions
  add column if not exists price_source text;

alter table public.project_nft_claims
  add column if not exists price_source text;

comment on column public.project_transactions.price_source is
  'Historische APTM/USD-Quelle, z.B. APTM/wUSDT Pool Sync oder APTM/USDT Marktpreis-Fallback.';
comment on column public.project_nft_claims.price_source is
  'Historische APTM/USD-Quelle für den Claim.';
