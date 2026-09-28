-- WalletTracking 6.63 · Build 20260928-135447
-- APTM ist der native Apertum-Asset und wird in WalletTracking dem DAO1/APTMDAO-Projektwert zugeordnet.
-- Bestehende Tabelle: keine neue GRANT-/RLS-Struktur erforderlich.

begin;

update public.predefined_tokens
set defi_project_key = 'dao1'
where lower(chain) = 'apertum'
  and (is_native = true or lower(coalesce(address, '')) = 'native')
  and coalesce(defi_project_key, '') <> 'dao1';

commit;
