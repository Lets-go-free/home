-- 015-puglord-predefined-token.sql
-- Wallet Tracking · PUGLORD als vordefinierter Apertum-/DAO1-Token · Phase 2ag
-- Einmal nach 014 ausführen. Idempotent: Insert oder Metadaten-Aktualisierung.

insert into public.predefined_tokens
  (chain, address, label, symbol, name, decimals, defi_project_key, defi_category, enabled)
values
  ('apertum', '0xc84b40231e270b827ceb0a27b78aa3fba443cf46', 'PUGLORD', 'PUG', 'PUGLORD', 18, 'dao1', 'defi_token', true)
on conflict (chain, address) do update set
  label = excluded.label,
  symbol = excluded.symbol,
  name = excluded.name,
  decimals = excluded.decimals,
  defi_project_key = excluded.defi_project_key,
  defi_category = excluded.defi_category,
  enabled = excluded.enabled;
