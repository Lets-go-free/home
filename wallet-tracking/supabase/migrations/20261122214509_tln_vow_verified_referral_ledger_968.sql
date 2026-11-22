-- 9.68: isolated, exact and idempotent, verified referral mint payouts.
-- Existing manual snapshots and dashboard summaries are not rewritten.
-- No cron created or activated.
create table if not exists public.tln_vow_reward_referral_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check (chain_key='bsc'),
  tx_hash text not null check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  token_address text not null check (token_address ~ '^0x[0-9a-f]{40}$'),
  block_number bigint not null check (block_number>0),
  amount_raw text not null check (amount_raw ~ '^[1-9][0-9]*$'),
  mint_log_indexes jsonb not null check (jsonb_typeof(mint_log_indexes)='array' and jsonb_array_length(mint_log_indexes)>0),
  partner_wallet text not null check (partner_wallet ~ '^0x[0-9a-f]{40}$'),
  referral_level integer not null check (referral_level between 1 and 20),
  proof_kind text not null check (proof_kind='manual_step5_strong_verified_receipt_and_parent_path'),
  created_at timestamptz not null default now(),
  primary key (user_id,wallet_id,chain_key,tx_hash,token_address)
);
alter table public.tln_vow_reward_referral_claims enable row level security;
revoke all on public.tln_vow_reward_referral_claims from public,anon,authenticated;
grant select,insert on public.tln_vow_reward_referral_claims to service_role;
-- Read access is scoped to the wallet owner; no client write access.
grant select on public.tln_vow_reward_referral_claims to authenticated;
create policy tln_vow_referral_own_read_968 on public.tln_vow_reward_referral_claims
  for select to authenticated using (user_id=(select auth.uid()));
