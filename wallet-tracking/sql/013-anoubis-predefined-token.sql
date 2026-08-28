-- 013-anoubis-predefined-token.sql
-- Run once after 012-year-end-snapshots.sql.
-- Idempotent: inserts ANOUBIS on Apertum or refreshes its metadata.

insert into public.predefined_tokens
  (chain, address, label, symbol, name, decimals, defi_project_key, defi_category, enabled)
values
  ('apertum', '0x8d38afbd54020c15f02f7f1f848ec66e17c1004c', 'ANOUBIS', 'ANOUBIS', 'ANOUBIS', 18, 'dao1', 'defi_token', true)
on conflict (chain, address) do update set
  label = excluded.label,
  symbol = excluded.symbol,
  name = excluded.name,
  decimals = excluded.decimals,
  defi_project_key = excluded.defi_project_key,
  defi_category = excluded.defi_category,
  enabled = excluded.enabled;
