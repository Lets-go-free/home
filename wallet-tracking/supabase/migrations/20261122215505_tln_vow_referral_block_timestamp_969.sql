-- 9.69: historical on-chain timestamp for accurate referral reward periods.
-- Existing records remain null until independently verified; no backfill guess.
alter table public.tln_vow_reward_referral_claims
  add column if not exists block_timestamp timestamptz;
alter table public.tln_vow_reward_referral_claims
  add column if not exists wallet_net_raw text
  check (wallet_net_raw ~ '^[1-9][0-9]*$');
alter table public.tln_vow_reward_referral_claims
  add column if not exists staking_contract text
  check (staking_contract ~ '^0x[0-9a-f]{40}$');
