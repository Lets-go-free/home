-- 8.17: repair missing reward_running value in DAO staging state constraint.
-- This is additive DDL only. No job, snapshot, NFT, claim or reward rows are changed.
-- Safe to run even when the equivalent manual hotfix was already applied.
BEGIN;
ALTER TABLE public.wallet_reward_refresh_attempts
 DROP CONSTRAINT IF EXISTS wallet_reward_refresh_attempts_state_check;
ALTER TABLE public.wallet_reward_refresh_attempts
 ADD CONSTRAINT wallet_reward_refresh_attempts_state_check
 CHECK (state IN ('pending','running','partial','staged','reward_running','failed','completed'));
COMMIT;
