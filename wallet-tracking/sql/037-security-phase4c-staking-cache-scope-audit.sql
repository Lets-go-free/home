-- WalletTracking
-- 037-security-phase4c-staking-cache-scope-audit.sql
-- Phase 4c-1 – Read-only Detailaudit von tln_vow_staking_scan_cache
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset.
--   Nichts einzeln markieren.
--
-- WARUM:
--   tln_vow_staking_scan_cache wird im aktuellen Discovery-Code nicht nur für
--   eigene Wallets verwendet, sondern auch für technische/global wirkende Cache-Keys.
--   Deshalb wird wallet_address NICHT blind entfernt, bevor wir die Cache-Scopes
--   nach cache_key sauber getrennt haben.
--
-- Dieses Script verändert NICHTS und gibt keine konkreten Wallet-Adressen aus.

with x as (
  select
    cache_key,
    scanner_version,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is not null)::bigint as wallet_id_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (
      where wallet_address = '0x0000000000000000000000000000000000000000'
    )::bigint as global_zero_scope_rows,
    count(*) filter (
      where wallet_address <> '0x0000000000000000000000000000000000000000'
    )::bigint as nonzero_address_rows,
    count(distinct wallet_id) filter (where wallet_id is not null)::bigint as distinct_wallet_ids
  from public.tln_vow_staking_scan_cache
  group by cache_key, scanner_version
)
select
  *,
  case
    when wallet_id_null_rows > 0 then 'REVIEW_NULL_WALLET_ID'
    when global_zero_scope_rows > 0 then 'GLOBAL_TECH_SCOPE'
    when wallet_id_rows = total_rows then 'OWN_WALLET_CANDIDATE'
    else 'REVIEW'
  end as scope_class
from x
order by scope_class, cache_key, scanner_version;
