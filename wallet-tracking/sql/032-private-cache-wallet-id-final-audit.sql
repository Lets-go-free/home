-- WalletTracking
-- 032-private-cache-wallet-id-final-audit.sql
-- Phase 4a – finaler Read-only Audit vor dem Entfernen redundanter Klartext-Adressen
--
-- Zweck:
--   Sicherstellen, dass alle betroffenen privaten Cache-/Projektzeilen vollständig
--   über wallet_id verknüpft sind, bevor wallet_address auf NULL gesetzt wird.
--
-- WICHTIG:
--   Dieses Script verändert KEINE Daten und KEINE Struktur.
--   Es gibt nur Zählwerte aus; keine Wallet-Adressen werden ausgegeben.

with audit as (
  select
    'lp_history_events'::text as table_name,
    count(*)::bigint as total_rows,
    count(*) filter (where wallet_id is not null)::bigint as wallet_id_rows,
    count(*) filter (where wallet_id is null)::bigint as wallet_id_null_rows,
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')::bigint as plaintext_wallet_address_rows
  from public.lp_history_events

  union all
  select 'lp_position_cache', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.lp_position_cache

  union all
  select 'project_scan_state', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_scan_state

  union all
  select 'project_transactions', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_transactions

  union all
  select 'project_nft_claims', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_claims

  union all
  select 'project_nft_ownership', count(*),
    count(*) filter (where wallet_id is not null),
    count(*) filter (where wallet_id is null),
    count(*) filter (where wallet_address is not null and btrim(wallet_address) <> '')
  from public.project_nft_ownership
)
select *,
  case when wallet_id_null_rows = 0 then 'PASS' else 'BLOCK' end as cleanup_ready
from audit
order by table_name;

-- Gesamtsicherheitscheck:
select
  case
    when exists (
      select 1 from public.lp_history_events where wallet_id is null
      union all
      select 1 from public.lp_position_cache where wallet_id is null
      union all
      select 1 from public.project_scan_state where wallet_id is null
      union all
      select 1 from public.project_transactions where wallet_id is null
      union all
      select 1 from public.project_nft_claims where wallet_id is null
      union all
      select 1 from public.project_nft_ownership where wallet_id is null
    )
    then 'BLOCK'
    else 'PASS'
  end as phase4a_cleanup_gate;
