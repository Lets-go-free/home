-- Wallet Tracking · Phase 2u
-- Optionaler dedizierter Archive-RPC für exakte historische Steuer-Stichtagsbestände.
-- Einmal ausführen. Bestehende rpc_url bleibt unverändert.

alter table public.chains
  add column if not exists archive_rpc_url text,
  add column if not exists archive_rpc_provider text;

comment on column public.chains.archive_rpc_url is
  'Optionaler Archive-RPC für historische State-Abfragen (Steuer-Stichtag). Wenn leer, wird rpc_url verwendet.';
comment on column public.chains.archive_rpc_provider is
  'Optionale Bezeichnung des Archive-RPC-Providers.';
