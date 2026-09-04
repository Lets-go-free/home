-- WalletTracking · TLN Referral Parent-Wallet Graph
-- Änderungsstand: 04.09.2026 16:29:05 CEST
-- Migration 023 · baut auf 022-tln-wallet-identity-cache.sql auf
--
-- Ziel:
-- Wallet-Adresse bleibt die technische On-Chain-Referenz eines Partners.
-- TLN-/Node-ID und direkte Upline-Wallet werden als verifizierte Attribute gespeichert.
-- Die Parent-Wallet-Beziehung bildet die stabile Grundlage für spätere Referral-Baum-Auswertungen.
-- Eine mögliche spätere Wallet-Migration eines Partners wird hier bewusst NICHT als Identitätsgleichheit angenommen.

begin;

alter table public.tln_wallet_identity_cache
  add column if not exists parent_wallet text,
  add column if not exists parent_source text,
  add column if not exists parent_source_hash text,
  add column if not exists parent_verified_at timestamptz;

create index if not exists tln_wallet_identity_cache_parent_wallet_idx
on public.tln_wallet_identity_cache(user_id, project_key, chain_key, parent_wallet)
where parent_wallet is not null;

comment on column public.tln_wallet_identity_cache.parent_wallet is
'Direkte verifizierte Upline-Wallet dieser wallet_address. Wallet-Adressen sind die technische Referenz des Referral-Graphen.';

comment on column public.tln_wallet_identity_cache.parent_source is
'Nachweisquelle der direkten Parent-Wallet, z.B. SmartNode Getter oder historische SmartNode.join(address)-Transaktion.';

comment on column public.tln_wallet_identity_cache.parent_source_hash is
'Optionaler historischer Transaktionshash, falls die Parent-Beziehung über eine konkrete Join-Transaktion verifiziert wurde.';

comment on column public.tln_wallet_identity_cache.parent_verified_at is
'Zeitpunkt der letzten erfolgreichen On-Chain-Verifizierung der Parent-Wallet-Beziehung.';

commit;

-- Kontrolle nach Ausführung:
-- select wallet_address,
--        node_id,
--        parent_wallet,
--        referred_by_id as parent_node_id,
--        parent_source,
--        parent_source_hash,
--        parent_verified_at,
--        updated_at
-- from public.tln_wallet_identity_cache
-- where project_key = 'tln_vow'
--   and chain_key = 'bsc'
-- order by updated_at desc;
