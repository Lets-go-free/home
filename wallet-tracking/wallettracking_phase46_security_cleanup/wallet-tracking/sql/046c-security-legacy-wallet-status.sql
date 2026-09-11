-- WalletTracking
-- 046c-security-legacy-wallet-status.sql
-- READ ONLY – zeigt nur aggregierte Restbestände, keine User-IDs/Adressen/Namen.
--
-- AUSFÜHRUNG:
--   Komplett auf einmal, "Without RLS".
--   Genau 1 Resultset.

select
  count(*)::bigint as total_wallet_rows,
  count(*) filter (
    where encryption_version=1
      and key_version=1
      and label_ciphertext is not null
      and btrim(label_ciphertext)<>''
  )::bigint as encrypted_wallet_rows,
  count(*) filter (
    where not (
      encryption_version=1
      and key_version=1
      and label_ciphertext is not null
      and btrim(label_ciphertext)<>''
    )
  )::bigint as legacy_wallet_rows,
  count(distinct user_id) filter (
    where not (
      encryption_version=1
      and key_version=1
      and label_ciphertext is not null
      and btrim(label_ciphertext)<>''
    )
  )::bigint as users_with_legacy_wallets,
  count(*) filter (
    where coalesce(btrim(label),'')<>''
       or coalesce(btrim(evm_address),'')<>''
       or coalesce(btrim(btc_address),'')<>''
       or coalesce(btrim(xrp_address),'')<>''
       or coalesce(btrim(sol_address),'')<>''
       or coalesce(btrim(tron_address),'')<>''
       or coalesce(btrim(akash_address),'')<>''
  )::bigint as rows_with_plaintext
from public.wallets;
