-- Phase 9.39: schedule evidence-only workers as INACTIVE jobs.
-- Does not enable automatic reward/claim/referral processing.
-- Required Vault entries BEFORE activation:
--   tln_vow_trade_sync_url      = existing base URL used by active trade sync
--   tln_vow_reward_refresh_auth = TLN_REWARD_CRON_SECRET from Edge env
-- Never put the plaintext secret in cron.job.command or this migration.

do $install$
declare v_jobid bigint;
begin
v_jobid := cron.schedule('tln-vow-evidence-stage-5m', '3-59/5 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-tln-reward-secret', (select decrypted_secret from vault.decrypted_secrets
                              where name='tln_vow_reward_refresh_auth')),
    body := '{"mode":"delta-work-cycle"}'::jsonb,
    timeout_milliseconds := 25000
  )
  where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
    and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
$job$);
perform cron.alter_job(v_jobid, active := false);
end
$install$;

do $install$
declare v_jobid bigint;
begin
v_jobid := cron.schedule('tln-vow-evidence-receipts-5m', '4-59/5 * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-tln-reward-secret', (select decrypted_secret from vault.decrypted_secrets
                              where name='tln_vow_reward_refresh_auth')),
    body := '{"mode":"delta-receipt-verify"}'::jsonb,
    timeout_milliseconds := 25000
  )
  where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
    and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
$job$);
perform cron.alter_job(v_jobid, active := false);
end
$install$;
