-- Wallet Tracking · DAO1/Apertum · NFT Name · Phase 2b
-- Run once after 002-dao1-miner-ownership.sql.

alter table public.project_miner_ownership
  add column if not exists nft_name text;

alter table public.project_miners
  add column if not exists nft_name text;
