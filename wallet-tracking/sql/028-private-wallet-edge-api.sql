-- WalletTracking
-- 028-private-wallet-edge-api.sql
-- Phase 3a: Vorbereitung der produktiven wallets-Tabelle für serverseitig
-- verschlüsselte Wallet-Daten.
--
-- WICHTIG:
-- - Bestehende Wallet-Zeilen werden NICHT verändert oder migriert.
-- - Es werden KEINE Plaintext-Daten gelöscht.
-- - Nur die bisher NOT-NULL-Spalte label wird nullable gemacht, damit neue
--   verschlüsselte Zeilen ausschließlich Ciphertext enthalten können.
-- - Bestehende RLS-Policies bleiben unverändert aktiv.
--
-- Voraussetzung:
-- 026-security-private-wallet-phase1.sql wurde bereits ausgeführt.

begin;

alter table public.wallets
  alter column label drop not null;

comment on column public.wallets.label is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in label_ciphertext.';

comment on column public.wallets.evm_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in evm_address_ciphertext.';

comment on column public.wallets.btc_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in btc_address_ciphertext.';

comment on column public.wallets.xrp_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in xrp_address_ciphertext.';

comment on column public.wallets.sol_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in sol_address_ciphertext.';

comment on column public.wallets.tron_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in tron_address_ciphertext.';

comment on column public.wallets.akash_address is
  'Legacy-Plaintext. Nach Security-Migration NULL; privater Wert liegt verschlüsselt in akash_address_ciphertext.';

commit;

-- Audit: nur Struktur prüfen; keine Dateninhalte ausgeben.
select
  c.column_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'wallets'
  and c.column_name in (
    'label',
    'encryption_version',
    'key_version',
    'label_ciphertext',
    'evm_address_ciphertext',
    'btc_address_ciphertext',
    'xrp_address_ciphertext',
    'sol_address_ciphertext',
    'tron_address_ciphertext',
    'akash_address_ciphertext'
  )
order by c.ordinal_position;

select
  relrowsecurity as rls_enabled
from pg_class
where oid = 'public.wallets'::regclass;
