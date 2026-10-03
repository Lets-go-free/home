-- WalletTracking Phase 7.21 / Migration 084
-- Supabase-Härtung A: anonyme / PUBLIC-Ausführung von RPCs reduzieren.
--
-- Ziel:
--   * kein Pre-Login-/anon-Zugriff auf Wallet-/Admin-/Team-RPCs
--   * PUBLIC darf die geschützten Functions nicht indirekt wieder freigeben
--   * authenticated erhält nur die tatsächlich browserseitig benötigten RPCs
--   * Trigger-/Maintenance-Functions bleiben service_role-only
--   * künftige public-Functions werden nicht automatisch an PUBLIC/anon freigegeben
--
-- Idempotent: REVOKE/GRANT können erneut ausgeführt werden.

begin;

-- Sichere Defaults für künftig von postgres angelegte Functions im public-Schema.
-- Jede neue Browser-RPC muss danach im selben Migrationsskript explizit freigegeben werden.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;

-- Zuerst implizite PUBLIC- und direkte anon-Ausführung für alle derzeitigen
-- WalletTracking-public-Functions entfernen. Trigger bleiben davon funktional
-- unberührt; Client-Zugriff wird unten explizit wieder vergeben.
revoke execute on function public.current_user_is_admin() from public, anon;
revoke execute on function public.enforce_discovery_cache_cooldown() from public, anon, authenticated;
revoke execute on function public.is_admin(uuid) from public, anon;
revoke execute on function public.mark_chat_read(uuid) from public, anon;
revoke execute on function public.register_lp_pair_candidate(text,text,text,text,text,text,text,integer) from public, anon;
revoke execute on function public.register_lp_staking_candidate(text,text,text,text) from public, anon;
revoke execute on function public.tm_ist_admin() from public, anon;
revoke execute on function public.tm_ist_admin_email(text) from public, anon;
revoke execute on function public.wallettracking_claim_price_refresh_slot(text,text) from public, anon;
revoke execute on function public.wallettracking_cleanup_price_refresh_slots() from public, anon, authenticated;
revoke execute on function public.wallettracking_delete_all_user_data() from public, anon;
revoke execute on function public.wallettracking_delete_wallet_complete(uuid,text) from public, anon;
revoke execute on function public.wallettracking_is_admin() from public, anon;
revoke execute on function public.wt_sync_aptmdao_tree_data_version() from public, anon, authenticated;
revoke execute on function public.wt_sync_dao1_old_tree_data_version() from public, anon, authenticated;
revoke execute on function public.wt_sync_tln_smartnode_data_version() from public, anon, authenticated;
revoke execute on function public.wt_tln_smartnode_graph_slice(text[],text,integer) from public, anon;

-- Browser-RPCs: nur eingeloggte User + Backend/service_role.
grant execute on function public.current_user_is_admin() to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.mark_chat_read(uuid) to authenticated, service_role;
grant execute on function public.register_lp_pair_candidate(text,text,text,text,text,text,text,integer) to authenticated, service_role;
grant execute on function public.register_lp_staking_candidate(text,text,text,text) to authenticated, service_role;
grant execute on function public.tm_ist_admin() to authenticated, service_role;
grant execute on function public.tm_ist_admin_email(text) to authenticated, service_role;
grant execute on function public.wallettracking_claim_price_refresh_slot(text,text) to authenticated, service_role;
grant execute on function public.wallettracking_delete_all_user_data() to authenticated, service_role;
grant execute on function public.wallettracking_delete_wallet_complete(uuid,text) to authenticated, service_role;
grant execute on function public.wallettracking_is_admin() to authenticated, service_role;
grant execute on function public.wt_tln_smartnode_graph_slice(text[],text,integer) to authenticated, service_role;

-- Wartung / Trigger: kein direkter Browser-Aufruf nötig.
grant execute on function public.enforce_discovery_cache_cooldown() to service_role;
grant execute on function public.wallettracking_cleanup_price_refresh_slots() to service_role;
grant execute on function public.wt_sync_aptmdao_tree_data_version() to service_role;
grant execute on function public.wt_sync_dao1_old_tree_data_version() to service_role;
grant execute on function public.wt_sync_tln_smartnode_data_version() to service_role;

-- Harte Abschlussprüfung: Keiner der geschützten RPCs darf für anon effektiv
-- ausführbar bleiben (auch nicht indirekt über PUBLIC).
do $$
declare
  v_bad text[] := array[]::text[];
  v_sig text;
begin
  foreach v_sig in array array[
    'public.current_user_is_admin()',
    'public.is_admin(uuid)',
    'public.mark_chat_read(uuid)',
    'public.register_lp_pair_candidate(text,text,text,text,text,text,text,integer)',
    'public.register_lp_staking_candidate(text,text,text,text)',
    'public.tm_ist_admin()',
    'public.tm_ist_admin_email(text)',
    'public.wallettracking_claim_price_refresh_slot(text,text)',
    'public.wallettracking_cleanup_price_refresh_slots()',
    'public.wallettracking_delete_all_user_data()',
    'public.wallettracking_delete_wallet_complete(uuid,text)',
    'public.wallettracking_is_admin()',
    'public.wt_tln_smartnode_graph_slice(text[],text,integer)'
  ] loop
    if has_function_privilege('anon', v_sig, 'EXECUTE') then
      v_bad := array_append(v_bad, v_sig);
    end if;
  end loop;

  if coalesce(array_length(v_bad, 1), 0) > 0 then
    raise exception 'Migration 084: anon kann weiterhin Functions ausführen: %', array_to_string(v_bad, ', ');
  end if;
end
$$;

commit;
