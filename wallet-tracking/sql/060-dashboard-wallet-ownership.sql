-- WalletTracking
-- Phase 5.25: Dashboard, Wallet-Besitzer und Token-Dashboard-Auswahl
--
-- Private Besitzernamen werden wie die übrigen Walletfelder ausschliesslich
-- verschlüsselt gespeichert und über wallet-private gelesen/geschrieben.

begin;

alter table public.wallets
  add column if not exists is_own_wallet boolean not null default true,
  add column if not exists owner_name_ciphertext text;

comment on column public.wallets.is_own_wallet is
  'True = eigenes Wallet des angemeldeten Users; false = Wallet einer benannten anderen Person.';

comment on column public.wallets.owner_name_ciphertext is
  'AES-256-GCM-verschlüsselter Besitzername; Entschlüsselung ausschliesslich über wallet-private.';

alter table public.predefined_tokens
  add column if not exists dashboard_visible boolean not null default false;

comment on column public.predefined_tokens.dashboard_visible is
  'Zentrale Admin-Auswahl: aktuellen Kurs dieses Tokens im Dashboard anzeigen.';

-- Sinnvolle Erstauswahl. Weitere Token können im Admin-Tokenbestand aktiviert werden.
update public.predefined_tokens
set dashboard_visible = true
where upper(coalesce(symbol, label, '')) in ('VOW', 'V$', 'VUSD', 'APTM', 'WAPTM', 'BNB');

commit;

-- Strukturkontrolle ohne private Inhalte.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'wallets' and column_name in ('is_own_wallet', 'owner_name_ciphertext'))
    or (table_name = 'predefined_tokens' and column_name = 'dashboard_visible')
  )
order by table_name, ordinal_position;
