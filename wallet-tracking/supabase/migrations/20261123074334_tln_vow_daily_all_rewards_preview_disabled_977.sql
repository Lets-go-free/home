-- WalletTracking 9.77: one combined READ-ONLY daily preview at 03:10 UTC.
-- Existing direct/bonus/referral writing jobs remain disabled. This migration
-- does not enable ANY job, change any receipt, ledger, claim or cursor.
do $install$
declare v_job bigint;
begin
  if exists (
    select 1 from cron.job
    where jobname in ('tln-vow-direct-claims-daily',
                      'tln-vow-bonus-claims-daily',
                      'tln-vow-referral-claims-daily') and active
  ) then
    raise exception 'An existing TLN/VOW writing job is active; abort without changes';
  end if;
  if exists (select 1 from cron.job where jobname='tln-vow-all-rewards-preview-daily') then
    raise exception 'Preview job already exists; inspect configuration before reinstalling';
  end if;
  v_job := cron.schedule('tln-vow-all-rewards-preview-daily','10 3 * * *',$job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-reward-refresh',
      headers := jsonb_build_object('Content-Type','application/json',
        'x-tln-reward-secret',(select decrypted_secret from vault.decrypted_secrets
                               where name='tln_vow_reward_refresh_auth')),
      body := '{"mode":"daily-all-rewards-preview","commit":false}'::jsonb,
      timeout_milliseconds := 25000
    )
    where exists(select 1 from vault.decrypted_secrets where name='tln_vow_trade_sync_url')
      and exists(select 1 from vault.decrypted_secrets where name='tln_vow_reward_refresh_auth');
  $job$);
  perform cron.alter_job(v_job,active := false);
end
$install$;
