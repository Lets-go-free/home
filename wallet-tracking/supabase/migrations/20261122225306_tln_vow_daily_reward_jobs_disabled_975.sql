-- 9.75: Wire existing verified bonus and referral finalizers into the same
-- daily schedule as the 9.57 direct-claim job. Every claim-writing job stays
-- explicitly INACTIVE. Independent idempotent ledgers; not an atomic
-- cross-ledger transaction and NOT complete reward/indirect coverage.
-- Vault credentials are only read at execution time, never embedded.

do $install$
declare
  v_bonus_job bigint;
  v_referral_job bigint;
begin
  if not exists (
    select 1 from cron.job where jobname='tln-vow-direct-claims-daily'
  ) then
    raise exception 'Missing 9.57 direct-claims daily job; no new job installed';
  end if;
  if exists (
    select 1 from cron.job
    where jobname in ('tln-vow-direct-claims-daily',
                      'tln-vow-bonus-claims-daily',
                      'tln-vow-referral-claims-daily')
      and active
  ) then
    raise exception 'A daily TLN/VOW claim job is already active; stop and review';
  end if;

  v_bonus_job := cron.schedule('tln-vow-bonus-claims-daily', '15 3 * * *', $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-tln-reward-secret', (select decrypted_secret from vault.decrypted_secrets
                                where name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"daily-bonus-claim-cycle","commit":true}'::jsonb,
      timeout_milliseconds := 25000
    )
    where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
      and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
  $job$);
  perform cron.alter_job(v_bonus_job, active := false);

  v_referral_job := cron.schedule('tln-vow-referral-claims-daily', '20 3 * * *', $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-tln-reward-secret', (select decrypted_secret from vault.decrypted_secrets
                                where name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"referral-claim-finalize","commit":true}'::jsonb,
      timeout_milliseconds := 25000
    )
    where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
      and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
  $job$);
  perform cron.alter_job(v_referral_job, active := false);
end
$install$;
