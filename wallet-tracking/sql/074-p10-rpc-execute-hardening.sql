-- WalletTracking Phase 6.39 / P10 Supabase Security Hardening
-- Build 20260927-120526
-- Status: am 27.09.2026 bereits produktiv im Supabase SQL Editor ausgeführt.
-- Diese Migration dokumentiert den produktiven Ist-Stand und ist idempotent.
-- Keine Tabellen-, RLS- oder Shared-Cache-Write-Policy wird verändert.

revoke execute on function public.enforce_discovery_cache_cooldown()
from anon, authenticated;

revoke execute on function public.wt_sync_aptmdao_tree_data_version()
from anon, authenticated;

revoke execute on function public.wt_sync_dao1_old_tree_data_version()
from anon, authenticated;

revoke execute on function public.wt_sync_tln_smartnode_data_version()
from anon, authenticated;

revoke execute on function public.wallettracking_cleanup_price_refresh_slots()
from anon, authenticated;
