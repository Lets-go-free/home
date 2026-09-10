-- WalletTracking
-- 042-security-phase4d-alias-encryption-audit.sql
-- NACH erfolgreichem UI-Test ausfuehren.
-- Komplett auf einmal; genau 1 Resultset; READ ONLY.
select
  count(*)::bigint as alias_rows,
  count(distinct user_id)::bigint as users_with_aliases,
  count(*) filter (where reference_ciphertext like 'wt1.k1.%')::bigint as encrypted_reference_rows,
  count(*) filter (where alias_ciphertext like 'wt1.k1.%')::bigint as encrypted_alias_rows,
  count(*) filter (where reference_hash ~ '^[0-9a-f]{64}$')::bigint as hmac_reference_rows,
  count(*) filter (where encryption_version=1 and key_version=1)::bigint as version_ok_rows,
  case when count(*)=count(*) filter (
    where reference_ciphertext like 'wt1.k1.%'
      and alias_ciphertext like 'wt1.k1.%'
      and reference_hash ~ '^[0-9a-f]{64}$'
      and encryption_version=1 and key_version=1
  ) then 'PASS' else 'FAIL' end as encryption_status
from public.user_team_aliases_private;
