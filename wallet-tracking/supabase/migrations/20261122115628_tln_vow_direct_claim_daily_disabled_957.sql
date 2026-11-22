-- Phase 9.57: create an INACTIVE bounded daily worker for independently
-- receipt-verified, uniquely assignable DIRECT staking claims only.
-- Requires explicit live read-only preflight before enabling. No referral,
-- bonus, indirect claim or historical-completeness assertions.
-- Secrets always resolved from Vault at invocation, never embedded in SQL.

do $install$
declare v_jobid bigint;
begin
  v_jobid := cron.schedule('tln-vow-direct-claims-daily', '10 3 * * *', $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-tln-reward-secret', (select decrypted_secret from vault.decrypted_secrets
                                where name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"daily-direct-claim-cycle","commit":true}'::jsonb,
      timeout_milliseconds := 25000
    )
    where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
      and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
  $job$);
  perform cron.alter_job(v_jobid, active := false);
end
$install$;
