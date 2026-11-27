-- 10.26: install only; no approvals, cursor updates or cron changes.
BEGIN;
CREATE TABLE wallettracking_internal.tln_prefix_cursor_audit (
 wallet_id uuid PRIMARY KEY REFERENCES public.wallets(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 observed_first bigint NOT NULL CHECK (observed_first > 1),
 approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 source text NOT NULL DEFAULT 'operator-bscscan' CHECK (source='operator-bscscan'),
 state text NOT NULL DEFAULT 'approved' CHECK (state IN ('approved','committed','reverted')),
 old_cursor bigint, old_updated timestamptz, new_cursor bigint, new_updated timestamptz,
 committed_at timestamptz, reverted_at timestamptz
);
ALTER TABLE wallettracking_internal.tln_prefix_cursor_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wallettracking_internal.tln_prefix_cursor_audit FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION public.wallettracking_tln_prefix_commit_1026(p_user uuid,p_wallet uuid,p_first bigint,p_cursor bigint,p_updated timestamptz,p_cipher text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE a wallettracking_internal.tln_prefix_cursor_audit%ROWTYPE; w public.wallets%ROWTYPE; v_stamp timestamptz; n integer;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF p_first IS NULL OR p_cursor IS NULL OR p_updated IS NULL OR p_cipher IS NULL OR p_cursor <= 0 OR p_first <= p_cursor+1 THEN RAISE EXCEPTION 'Invalid bounds'; END IF;
 SELECT * INTO STRICT w FROM public.wallets WHERE id=p_wallet AND user_id=p_user FOR UPDATE;
 IF w.evm_address_ciphertext IS DISTINCT FROM p_cipher OR w.encryption_version IS DISTINCT FROM 1 OR w.key_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Wallet changed'; END IF;
 SELECT * INTO STRICT a FROM wallettracking_internal.tln_prefix_cursor_audit WHERE wallet_id=p_wallet AND user_id=p_user FOR UPDATE;
 IF a.state <> 'approved' OR a.observed_first <> p_first OR a.approved_at < clock_timestamp()-interval '24 hours' THEN RAISE EXCEPTION 'No fresh matching approval'; END IF;
 v_stamp := greatest(clock_timestamp(),p_updated+interval '1 millisecond');
 UPDATE public.tln_vow_staking_scan_cache SET last_scanned_block=p_first-1,updated_at=v_stamp
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='tln_vow' AND chain_key='bsc' AND cache_key='erc20-history-v1'
 AND scanner_version='erc20-raw-v1' AND complete_from_block=0 AND payload='[]'::jsonb AND last_scanned_block=p_cursor AND updated_at=p_updated
 RETURNING updated_at INTO v_stamp;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Cache CAS failed'; END IF;
 UPDATE wallettracking_internal.tln_prefix_cursor_audit SET state='committed',old_cursor=p_cursor,old_updated=p_updated,new_cursor=p_first-1,new_updated=v_stamp,committed_at=clock_timestamp() WHERE wallet_id=p_wallet;
 RETURN jsonb_build_object('ok',true,'persisted',true,'auditPersisted',true);
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_tln_prefix_commit_1026(uuid,uuid,bigint,bigint,timestamptz,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wallettracking_tln_prefix_commit_1026(uuid,uuid,bigint,bigint,timestamptz,text) TO service_role;
-- Operator-only rollback, restricted to untouched empty cache. Never discards later data.
CREATE FUNCTION wallettracking_internal.tln_prefix_revert_1026(p_wallet uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE a wallettracking_internal.tln_prefix_cursor_audit%ROWTYPE; n integer;
BEGIN
 SELECT * INTO STRICT a FROM wallettracking_internal.tln_prefix_cursor_audit WHERE wallet_id=p_wallet FOR UPDATE;
 IF a.state <> 'committed' THEN RAISE EXCEPTION 'No committed jump'; END IF;
 UPDATE public.tln_vow_staking_scan_cache SET last_scanned_block=a.old_cursor,updated_at=greatest(clock_timestamp(),a.new_updated+interval '1 millisecond')
 WHERE wallet_id=a.wallet_id AND user_id=a.user_id AND project_key='tln_vow' AND chain_key='bsc' AND cache_key='erc20-history-v1' AND scanner_version='erc20-raw-v1' AND complete_from_block=0 AND payload='[]'::jsonb AND last_scanned_block=a.new_cursor AND updated_at=a.new_updated;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Cache changed; manual reconciliation required'; END IF;
 UPDATE wallettracking_internal.tln_prefix_cursor_audit SET state='reverted',reverted_at=clock_timestamp() WHERE wallet_id=p_wallet;
END $$;
REVOKE ALL ON FUNCTION wallettracking_internal.tln_prefix_revert_1026(uuid) FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
