-- WalletTracking 8.02: revalidatable, transaction-local payout evidence.
-- DDL only; no candidate backfill, no cron, no canonical reward/price changes.
BEGIN;
ALTER TABLE public.dao_reward_claim_candidates
 ADD COLUMN IF NOT EXISTS payout_coverage jsonb,
 ADD COLUMN IF NOT EXISTS payout_check_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.dao_reward_claim_candidates
 DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_payout_status_check;
ALTER TABLE public.dao_reward_claim_candidates
 ADD CONSTRAINT dao_reward_claim_candidates_payout_status_check
 CHECK (payout_status IN ('pending','verified','needs_review','no_payout_evidence'));
ALTER TABLE public.dao_reward_claim_candidates
 DROP CONSTRAINT IF EXISTS dao_reward_claim_candidates_no_payout_check;
ALTER TABLE public.dao_reward_claim_candidates
 ADD CONSTRAINT dao_reward_claim_candidates_no_payout_check CHECK (
  payout_status <> 'no_payout_evidence' OR COALESCE((
   payout_checked_at IS NOT NULL AND payout_reason IS NOT NULL
   AND payout_token_address IS NULL AND payout_amount_raw IS NULL
   AND payout_token_decimals IS NULL AND payout_flow_count IS NULL
   AND payout_coverage @> '{"source":"blockscout-tx-v1","complete":true,"transaction":true,"token_transfers":true,"internal_transactions":true,"observed_incoming":false}'::jsonb
   AND payout_coverage->>'tx_hash'=tx_hash
   AND payout_coverage->>'block_number'=claim_block::text
  ),false)
 );
CREATE INDEX IF NOT EXISTS dao_reward_claim_candidates_payout_recheck_idx
 ON public.dao_reward_claim_candidates (user_id,wallet_id,payout_checked_at,claim_block)
 WHERE payout_status IN ('needs_review','no_payout_evidence');

CREATE OR REPLACE FUNCTION public.wallettracking_dao_record_payout_check(
 p_user uuid,p_wallet uuid,p_tx text,p_expected_checked_at timestamptz,
 p_status text,p_reason text,p_coverage jsonb,
 p_token text,p_amount text,p_decimals integer,p_flow_count integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
 c public.dao_reward_claim_candidates%ROWTYPE;
 history jsonb;
 checked timestamptz;
BEGIN
 -- Service-only; no new browser/API access to this internal staging table.
 IF p_status IS NULL OR p_status NOT IN ('verified','needs_review','no_payout_evidence')
    OR p_reason IS NULL OR length(p_reason)>200 OR p_coverage IS NULL
    OR jsonb_typeof(p_coverage)<>'object' THEN
  RAISE EXCEPTION 'Invalid payout evidence';
 END IF;
 SELECT * INTO c FROM public.dao_reward_claim_candidates
 WHERE user_id=p_user AND wallet_id=p_wallet AND project_key='dao1'
  AND chain_key='apertum' AND tx_hash=p_tx FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF c.payout_status='verified' OR c.canonical_existing_verified
    OR c.payout_checked_at IS DISTINCT FROM p_expected_checked_at THEN RETURN false; END IF;
 -- Defence against already persisted incoming evidence arriving concurrently
 -- with the external negative scan. Such a candidate must remain reviewable.
 IF p_status='no_payout_evidence' AND EXISTS (
  SELECT 1 FROM public.project_transaction_asset_flows f
  WHERE f.user_id=p_user AND f.wallet_id=p_wallet AND f.project_key='dao1'
   AND f.chain_key='apertum' AND f.tx_hash=p_tx
   AND (f.direction IS NULL OR f.direction NOT IN ('eingang','ausgang','intern','sonst')
    OR (f.direction IN ('eingang','intern') AND
     CASE WHEN f.amount_raw ~ '^[0-9]+$' THEN f.amount_raw::numeric>0 ELSE true END))
 ) THEN RETURN false; END IF;
 IF p_status='verified' AND (p_token IS NULL OR p_amount IS NULL
    OR p_amount !~ '^[0-9]+$' OR length(p_amount)>100 OR p_amount::numeric<=0
    OR p_decimals IS NULL OR p_decimals NOT BETWEEN 0 AND 36
    OR p_flow_count IS NULL OR p_flow_count NOT BETWEEN 1 AND 10000) THEN
  RAISE EXCEPTION 'Invalid positive payout evidence';
 END IF;
 checked=clock_timestamp();
 -- Ten most recent attempts preserve negative and incomplete checks, including
 -- transitions back to needs_review or forward to verified after new evidence.
 SELECT COALESCE(jsonb_agg(v ORDER BY n),'[]'::jsonb) INTO history FROM (
  SELECT v,n FROM jsonb_array_elements(c.payout_check_history || jsonb_build_array(
   jsonb_build_object('checked_at',checked,'previous_status',c.payout_status,
    'status',p_status,'reason',p_reason,'coverage',p_coverage))) WITH ORDINALITY AS e(v,n)
  ORDER BY n DESC LIMIT 10
 ) recent;
 UPDATE public.dao_reward_claim_candidates SET
  payout_status=p_status,payout_reason=p_reason,payout_checked_at=checked,
  payout_coverage=p_coverage,payout_check_history=history,
  payout_token_address=CASE WHEN p_status='verified' THEN p_token END,
  payout_amount_raw=CASE WHEN p_status='verified' THEN p_amount END,
  payout_token_decimals=CASE WHEN p_status='verified' THEN p_decimals END,
  payout_flow_count=CASE WHEN p_status='verified' THEN p_flow_count END
 WHERE user_id=p_user AND wallet_id=p_wallet AND chain_key='apertum' AND tx_hash=p_tx;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_record_payout_check(uuid,uuid,text,timestamptz,text,text,jsonb,text,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_record_payout_check(uuid,uuid,text,timestamptz,text,text,jsonb,text,text,integer,integer) TO service_role;
COMMIT;
