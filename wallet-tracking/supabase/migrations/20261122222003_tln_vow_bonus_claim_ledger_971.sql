-- 9.71: Separate owner-scoped, idempotent bonus reward evidence ledger.
-- No job/cron and no changes to manually saved discovery snapshots.
create table if not exists public.tln_vow_reward_bonus_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check (chain_key='bsc'),
  tx_hash text not null check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  token_address text not null check (token_address ~ '^0x[0-9a-f]{40}$'),
  block_number bigint not null check (block_number>0),
  block_timestamp timestamptz not null,
  amount_raw text not null check (amount_raw ~ '^[1-9][0-9]*$'),
  wallet_net_raw text not null check (wallet_net_raw ~ '^[1-9][0-9]*$'),
  called_contract text not null check (called_contract ~ '^0x[0-9a-f]{40}$'),
  claim_selector text not null check (claim_selector ~ '^0x[0-9a-f]{8}$'),
  log_indexes jsonb not null check (jsonb_typeof(log_indexes)='array' and jsonb_array_length(log_indexes)>0),
  proof_kind text not null check (proof_kind='manual_step4_explicit_bonus_verified_receipt'),
  created_at timestamptz not null default now(),
  primary key (user_id,wallet_id,chain_key,tx_hash,token_address)
);
alter table public.tln_vow_reward_bonus_claims enable row level security;
revoke all on public.tln_vow_reward_bonus_claims from public,anon,authenticated;
grant select,insert on public.tln_vow_reward_bonus_claims to service_role;
grant select on public.tln_vow_reward_bonus_claims to authenticated;
create policy tln_vow_bonus_own_read_971 on public.tln_vow_reward_bonus_claims
  for select to authenticated using (user_id=(select auth.uid()));
