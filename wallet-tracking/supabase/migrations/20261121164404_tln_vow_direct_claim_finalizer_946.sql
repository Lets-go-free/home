-- Phase 9.46: isolated, idempotent direct Staking-Claim ledger.
-- Does not alter legacy/manual TLN/VOW snapshots or existing reward totals.
-- The daily cron does NOT invoke the opt-in finalizer yet.
create table if not exists public.tln_vow_reward_direct_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  chain_key text not null default 'bsc' check (chain_key = 'bsc'),
  tx_hash text not null check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  token_address text not null check (token_address ~ '^0x[0-9a-f]{40}$'),
  log_index integer not null check (log_index >= 0),
  block_number bigint not null check (block_number > 0),
  amount_raw text not null check (amount_raw ~ '^[1-9][0-9]*$'),
  lot_stake_tx text not null check (lot_stake_tx ~ '^0x[0-9a-f]{64}$'),
  called_contract text not null check (called_contract ~ '^0x[0-9a-f]{40}$'),
  proof_kind text not null check (proof_kind = 'direct_explicit_staking_claim_with_unique_lot_and_verified_receipt'),
  created_at timestamptz not null default now(),
  primary key (user_id, wallet_id, chain_key, tx_hash, token_address, log_index)
);
alter table public.tln_vow_reward_direct_claims enable row level security;
revoke all on public.tln_vow_reward_direct_claims from public, anon, authenticated;
grant select, insert on public.tln_vow_reward_direct_claims to service_role;
