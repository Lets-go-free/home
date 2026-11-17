-- 8.85: retire six one-time legacy claim commit RPCs only after 76/76 reconciliation.
-- The canonical claim finalizers, shared pricing and regular DAO workers remain untouched.
BEGIN;

DO $guard$
DECLARE
  v_open bigint;
  v_completed bigint;
BEGIN
  SELECT
    count(*) FILTER (WHERE status = 'unassigned_legacy'),
    count(*) FILTER (WHERE status = 'ownership_verified' AND nft_id IN (818,819)
      AND payout_status = 'verified' AND claim_pipeline_status = 'completed')
    INTO v_open, v_completed
  FROM public.dao_reward_claim_candidates
  WHERE wallet_id = '8a3c5dc6-0610-482d-a327-3f3ba03db158'::uuid
    AND project_key = 'dao1' AND chain_key = 'apertum';
  IF v_open <> 0 OR v_completed < 76 THEN
    RAISE EXCEPTION
      '8.85 legacy retirement refused: open %, completed %; expected 0 and at least 76',
      v_open, v_completed;
  END IF;
END
$guard$;

DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_minebot_874(uuid,uuid,text,text,numeric,bigint) RESTRICT;
DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_preanchor_four_884(uuid,uuid,jsonb) RESTRICT;
DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_priced_bounded_882(uuid,uuid,jsonb) RESTRICT;
DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_priced_five_879(uuid,uuid,jsonb) RESTRICT;
DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_priced_five_880(uuid,uuid,jsonb) RESTRICT;
DROP FUNCTION IF EXISTS public.wallettracking_dao_commit_legacy_priced_five_881(uuid,uuid,jsonb) RESTRICT;

COMMIT;
