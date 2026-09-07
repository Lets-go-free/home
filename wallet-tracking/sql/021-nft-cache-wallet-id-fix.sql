-- Wallet Tracking · NFT-Cache Schema-Reparatur · Phase 4.3
-- Version: 07.09.2026 20:14:23 CEST · Build 20260907-201423
--
-- Ursache des aktuellen HTTP-400ers:
-- Die App verwendet UUID-Wallet-IDs. Die produktive nft_cache-Tabelle stammt offenbar
-- aus einem älteren Schema, in dem wallet_id nicht zuverlässig als text vorliegt.
-- Ein Filter wie wallet_id=eq.<uuid> kann dann bereits vor dem eigentlichen UPDATE
-- mit HTTP 400 scheitern. Das Soll-Schema des Projekts definiert wallet_id als text.
--
-- Diese Migration passt die bestehende Tabelle verlustfrei an das Soll-Schema an.

begin;

alter table public.nft_cache
  add column if not exists wallet_label text,
  add column if not exists selected_chains text[] not null default '{}',
  add column if not exists nfts jsonb not null default '[]'::jsonb,
  add column if not exists refreshed_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- UUIDs aus public.wallets müssen ohne Typfehler filterbar/speicherbar sein.
alter table public.nft_cache
  alter column wallet_id type text using wallet_id::text;

-- Leere Altwerte auf sichere Defaults normalisieren.
update public.nft_cache
set wallet_label = coalesce(wallet_label, ''),
    selected_chains = coalesce(selected_chains, '{}'::text[]),
    nfts = coalesce(nfts, '[]'::jsonb),
    refreshed_at = coalesce(refreshed_at, now()),
    updated_at = coalesce(updated_at, now());

alter table public.nft_cache
  alter column wallet_label set not null,
  alter column wallet_id set not null,
  alter column user_id set not null;

-- Pro User + Wallet darf nur ein Cache-Datensatz existieren. Falls das produktive
-- Altschema diese Eindeutigkeit noch nicht erzwungen hat, wird sie hier ergänzt.
create unique index if not exists nft_cache_user_wallet_uq
  on public.nft_cache(user_id, wallet_id);

alter table public.nft_cache enable row level security;

drop policy if exists "nft_cache_select_own" on public.nft_cache;
drop policy if exists "nft_cache_insert_own" on public.nft_cache;
drop policy if exists "nft_cache_update_own" on public.nft_cache;
drop policy if exists "nft_cache_delete_own" on public.nft_cache;

create policy "nft_cache_select_own"
on public.nft_cache for select to authenticated
using (auth.uid() = user_id);

create policy "nft_cache_insert_own"
on public.nft_cache for insert to authenticated
with check (auth.uid() = user_id);

create policy "nft_cache_update_own"
on public.nft_cache for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "nft_cache_delete_own"
on public.nft_cache for delete to authenticated
using (auth.uid() = user_id);

commit;

-- Kontrolle nach Ausführung:
select
  column_name,
  data_type,
  udt_name,
  is_nullable
from information_schema.columns
where table_schema='public' and table_name='nft_cache'
order by ordinal_position;
