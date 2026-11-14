-- WalletTracking 8.42 – DAO1 fehlgeschlagene Claim-Transaktionen, 14.11.2026 12:46:58 CET.
-- Nur Audit-Klassifikation; keine Aenderung an kanonischen Claims, Rewards, Preisen, NFT-Zuordnungen oder Cron.
-- Sichere Backfill-Voraussetzung: genau eine Rohtransaktion mit status=error und passendem Block,
-- keine positive TX-Reward-Gutschrift, kein Eingang-Flow, kein kanonischer Claim,
-- keine bestehende Klassifikation, kein bereits verifizierter Kandidat.
BEGIN;

UPDATE public.dao_reward_claim_candidates c
SET audit_classification='failed_transaction', audit_classified_at=clock_timestamp()
WHERE c.project_key='dao1' AND c.chain_key='apertum'

  AND c.audit_classification IS NULL
  AND c.canonical_existing_verified IS DISTINCT FROM true
  AND c.payout_status = 'pending'
  AND c.claim_pipeline_status IS DISTINCT FROM 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_nft_claims n
    WHERE n.user_id=c.user_id AND n.project_key=c.project_key
      AND n.chain_key=c.chain_key AND lower(n.tx_hash)=lower(c.tx_hash)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.project_transaction_asset_flows f
    WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
      AND f.project_key=c.project_key AND f.chain_key=c.chain_key
      AND lower(f.tx_hash)=lower(c.tx_hash) AND f.direction='eingang'
  )
  AND (SELECT count(*) FROM public.project_transactions tt
       WHERE tt.user_id=c.user_id AND tt.wallet_id=c.wallet_id
         AND tt.project_key=c.project_key AND tt.chain_key=c.chain_key
         AND lower(tt.tx_hash)=lower(c.tx_hash))=1
  AND EXISTS (
    SELECT 1 FROM public.project_transactions t
    WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
      AND t.project_key=c.project_key AND t.chain_key=c.chain_key
      AND lower(t.tx_hash)=lower(c.tx_hash)
      AND t.block_number=c.claim_block
      AND lower(coalesce(t.status,''))='error'
      AND coalesce(t.claim_reward_aptm,0)=0
      AND coalesce(t.claim_reward_usd,0)=0
  );

-- Die zentrale Finalisierung bleibt unveraendert: sie verweigert bereits status=error.
-- Die nachfolgende service_role-Funktion markiert kuenftige gesicherte Fehlerfaelle
-- beim naechsten manuellen/geschuetzten Kandidatenabruf derselben Wallet.
CREATE OR REPLACE FUNCTION public.wallettracking_dao_next_native_claim_candidate(
 p_user uuid,p_wallet uuid,p_retry_blocked boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE c public.dao_reward_claim_candidates%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wallets WHERE id=p_wallet AND user_id=p_user) THEN RAISE EXCEPTION 'Wallet ownership mismatch';END IF;
 -- Idempotente, walletgebundene und streng nachweisbasierte Klassifikation.
 UPDATE public.dao_reward_claim_candidates c
 SET audit_classification='failed_transaction', audit_classified_at=clock_timestamp()
 WHERE c.user_id=p_user AND c.wallet_id=p_wallet
   AND c.project_key='dao1' AND c.chain_key='apertum'

  AND c.audit_classification IS NULL
  AND c.canonical_existing_verified IS DISTINCT FROM true
  AND c.payout_status = 'pending'
  AND c.claim_pipeline_status IS DISTINCT FROM 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_nft_claims n
    WHERE n.user_id=c.user_id AND n.project_key=c.project_key
      AND n.chain_key=c.chain_key AND lower(n.tx_hash)=lower(c.tx_hash)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.project_transaction_asset_flows f
    WHERE f.user_id=c.user_id AND f.wallet_id=c.wallet_id
      AND f.project_key=c.project_key AND f.chain_key=c.chain_key
      AND lower(f.tx_hash)=lower(c.tx_hash) AND f.direction='eingang'
  )
  AND (SELECT count(*) FROM public.project_transactions tt
       WHERE tt.user_id=c.user_id AND tt.wallet_id=c.wallet_id
         AND tt.project_key=c.project_key AND tt.chain_key=c.chain_key
         AND lower(tt.tx_hash)=lower(c.tx_hash))=1
  AND EXISTS (
    SELECT 1 FROM public.project_transactions t
    WHERE t.user_id=c.user_id AND t.wallet_id=c.wallet_id
      AND t.project_key=c.project_key AND t.chain_key=c.chain_key
      AND lower(t.tx_hash)=lower(c.tx_hash)
      AND t.block_number=c.claim_block
      AND lower(coalesce(t.status,''))='error'
      AND coalesce(t.claim_reward_aptm,0)=0
      AND coalesce(t.claim_reward_usd,0)=0
  );
 SELECT d.* INTO c FROM public.dao_reward_claim_candidates d
 WHERE d.user_id=p_user AND d.wallet_id=p_wallet AND d.project_key='dao1' AND d.chain_key='apertum'
  AND d.canonical_existing_verified IS DISTINCT FROM true AND d.audit_classification IS NULL
  AND d.payout_status<>'no_payout_evidence' AND d.claim_pipeline_status<>'completed'
  AND (d.claim_pipeline_status='pending' OR COALESCE(p_retry_blocked,false)
    OR d.claim_pipeline_checked_at IS NULL OR d.claim_pipeline_checked_at<now()-interval '24 hours')
  AND EXISTS(SELECT 1 FROM public.project_transactions t WHERE t.user_id=p_user AND t.wallet_id=p_wallet
   AND t.project_key='dao1' AND t.chain_key='apertum' AND t.tx_hash=d.tx_hash
   AND lower(coalesce(t.status,'')) IN ('ok','success')
   AND t.block_number=d.claim_block
   AND lower(t.selector) IN ('0x86bb8f37','0x19da4078') AND COALESCE(t.claim_reward_aptm,0)=0 AND COALESCE(t.claim_reward_usd,0)=0)
  AND NOT EXISTS(SELECT 1 FROM public.project_nft_claims n WHERE n.user_id=p_user AND n.wallet_id=p_wallet
   AND n.project_key='dao1' AND n.chain_key='apertum' AND n.tx_hash=d.tx_hash)
 ORDER BY CASE WHEN d.claim_pipeline_status='pending' THEN 0 ELSE 1 END,
  d.claim_pipeline_checked_at NULLS FIRST,d.claim_block,d.tx_hash LIMIT 1;
 IF NOT FOUND THEN RETURN NULL;END IF;
 RETURN jsonb_build_object('tx_hash',c.tx_hash,'claim_block',c.claim_block,'status',c.status,
  'nft_contract',c.nft_contract,'nft_id',c.nft_id::text,
  'payout_status',c.payout_status,'payout_checked_at',c.payout_checked_at);
END $fn$;
REVOKE ALL ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wallettracking_dao_next_native_claim_candidate(uuid,uuid,boolean) TO service_role;
COMMIT;

-- Nach Installation lesend pruefen (separater Schritt in Supabase):
-- SELECT wallet_id, audit_classification, count(*) FROM public.dao_reward_claim_candidates
-- WHERE audit_classification='failed_transaction' GROUP BY wallet_id,audit_classification;
