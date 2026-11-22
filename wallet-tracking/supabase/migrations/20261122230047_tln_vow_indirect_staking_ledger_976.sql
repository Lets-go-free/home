-- 9.76: isolated owner-scoped, trace/receipt/unique-lot proven indirect claims.
-- This is an opt-in ledger; existing manual snapshots and daily cron unchanged.
create table if not exists public.tln_vow_reward_indirect_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check (chain_key='bsc'),
  tx_hash text not null check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  token_address text not null check (token_address ~ '^0x[0-9a-f]{40}$'),
  log_index integer not null check (log_index>=0),
  block_number bigint not null check (block_number>0),
  block_timestamp timestamptz not null,
  amount_raw text not null check (amount_raw ~ '^[1-9][0-9]*$'),
  lot_stake_tx text not null check (lot_stake_tx ~ '^0x[0-9a-f]{64}$'),
  called_contract text not null check (called_contract ~ '^0x[0-9a-f]{40}$'),
  paying_contract text not null check (paying_contract ~ '^0x[0-9a-f]{40}$'),
  trace_method text not null check (trace_method in ('debug_traceTransaction','trace_transaction')),
  proof_kind text not null check (proof_kind='manual_step4_trace_backed_indirect_unique_lot'),
  created_at timestamptz not null default now(),
  primary key (user_id,wallet_id,chain_key,tx_hash,token_address,log_index)
);
alter table public.tln_vow_reward_indirect_claims enable row level security;
revoke all on public.tln_vow_reward_indirect_claims from public,anon,authenticated;
grant select,insert on public.tln_vow_reward_indirect_claims to service_role;
grant select on public.tln_vow_reward_indirect_claims to authenticated;
create policy tln_vow_indirect_own_read_976 on public.tln_vow_reward_indirect_claims
  for select to authenticated using (user_id=(select auth.uid()));
