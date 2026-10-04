-- WalletTracking Phase 7.26
-- Read-only Live-Check für Retirement-Kandidaten. Keine Datenänderung.

-- 1) Exakte Zeilenzahl + letzte bekannte Aktivität (nur Metadaten/Aggregate)
select 'apertum_nft_history_coverage' as table_name,
       count(*)::bigint as row_count,
       max(checked_at)::text as last_activity
from public.apertum_nft_history_coverage
union all
select 'project_miner_ownership', count(*)::bigint, max(created_at)::text
from public.project_miner_ownership
union all
select 'user_settings', count(*)::bigint, null::text
from public.user_settings
union all
select 'wallet_current_price_snapshots', count(*)::bigint, max(updated_at)::text
from public.wallet_current_price_snapshots
union all
select 'tln_wallet_identity_cache', count(*)::bigint, max(updated_at)::text
from public.tln_wallet_identity_cache
order by table_name;

-- 2) Foreign-Key-Abhängigkeiten der Kandidaten
select
  con.conname as constraint_name,
  con.conrelid::regclass::text as from_table,
  con.confrelid::regclass::text as to_table,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
where con.contype = 'f'
  and (
    con.conrelid in (
      'public.apertum_nft_history_coverage'::regclass,
      'public.project_miner_ownership'::regclass,
      'public.user_settings'::regclass,
      'public.wallet_current_price_snapshots'::regclass,
      'public.tln_wallet_identity_cache'::regclass
    )
    or con.confrelid in (
      'public.apertum_nft_history_coverage'::regclass,
      'public.project_miner_ownership'::regclass,
      'public.user_settings'::regclass,
      'public.wallet_current_price_snapshots'::regclass,
      'public.tln_wallet_identity_cache'::regclass
    )
  )
order by from_table, constraint_name;

-- 3) Public Functions, deren Definition einen Kandidatennamen enthält
with candidates(name) as (
  values
    ('apertum_nft_history_coverage'),
    ('project_miner_ownership'),
    ('user_settings'),
    ('wallet_current_price_snapshots'),
    ('tln_wallet_identity_cache')
)
select
  c.name as candidate_table,
  n.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join candidates c
where n.nspname = 'public'
  and position(c.name in pg_get_functiondef(p.oid)) > 0
order by c.name, p.proname;
