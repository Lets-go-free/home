-- 7.64: prerequisite pg_cron, pg_net, vault. Execute these statements only AFTER
-- deploying Edge Function tln-vow-trade-sync and setting TRADE_SYNC_SECRET.
-- In Supabase SQL Editor, replace PROJECT_REF and YOUR_RANDOM_JOB_SECRET.
-- YOUR_RANDOM_JOB_SECRET must be identical to the Edge Function TRADE_SYNC_SECRET.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
-- Vault is provided by Supabase; activate it in Dashboard > Database > Extensions if needed.

select vault.create_secret('https://cfnxuesibpnlgyklzqkj.supabase.co', 'tln_vow_trade_sync_url');
select vault.create_secret('880d6e8425ce70e52ae729e14c58d8e4bb555f0988bd283debd1cf166c6c2cb0', 'tln_vow_trade_sync_auth');

select cron.schedule('tln-vow-trade-sync-30m', '*/30 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='tln_vow_trade_sync_url') || '/functions/v1/tln-vow-trade-sync',
    headers := jsonb_build_object('Content-Type','application/json','x-trade-sync-secret',
       (select decrypted_secret from vault.decrypted_secrets where name='tln_vow_trade_sync_auth')),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$$);
