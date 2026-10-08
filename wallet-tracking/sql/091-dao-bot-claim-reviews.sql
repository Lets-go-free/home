-- WalletTracking 7.48: user decisions for separate, unassigned bot payouts.
-- Run this complete file before publishing 7.48. 13 SQL statements, in order.
-- No SELECT resultsets. BEGIN/COMMIT make the migration atomic and repeatable.
-- Browser access is needed for this user's review UI; therefore public + RLS.
-- No plaintext wallet addresses/names. Wallet/account/reset deletion cascades
-- through the existing project_transactions row (and auth.users).
begin;
create table if not exists public.dao_bot_claim_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null default 'dao1' check (project_key = 'dao1'),
  chain_key text not null default 'apertum' check (chain_key = 'apertum'),
  wallet_id uuid not null,
  tx_hash text not null,
  decision text not null check (decision in ('confirmed', 'ignored')),
  updated_at timestamptz not null default now(),
  primary key (user_id, project_key, chain_key, wallet_id, tx_hash),
  foreign key (user_id, project_key, chain_key, wallet_id, tx_hash)
    references public.project_transactions (user_id, project_key, chain_key, wallet_id, tx_hash) on delete cascade
);
alter table public.dao_bot_claim_reviews enable row level security;
revoke all on table public.dao_bot_claim_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.dao_bot_claim_reviews to authenticated;
grant all on table public.dao_bot_claim_reviews to service_role;
drop policy if exists dao_bot_claim_reviews_select on public.dao_bot_claim_reviews;
create policy dao_bot_claim_reviews_select on public.dao_bot_claim_reviews for select to authenticated using (user_id = auth.uid());
drop policy if exists dao_bot_claim_reviews_write on public.dao_bot_claim_reviews;
create policy dao_bot_claim_reviews_write on public.dao_bot_claim_reviews for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
comment on table public.dao_bot_claim_reviews is 'User-specific confirmed/ignored decisions. No NFT assignment and no chain-data mutation. FK to own transaction; cascade on wallet/data/account deletion.';
notify pgrst, 'reload schema';
commit;
