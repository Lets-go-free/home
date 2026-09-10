-- WalletTracking
-- 039b-security-phase4c-identity-migration.sql
-- Phase 4c – bestehende TLN-Identitäten in den globalen On-Chain-Identity-Cache übernehmen
--
-- AUSFÜHRUNG:
--   Dieses Script KOMPLETT AUF EINMAL ausführen.
--   Es enthält genau EINE Ergebnis-Abfrage / EIN Resultset am Ende.
--   Nichts einzeln markieren.
--
-- Dieses Script löscht tln_wallet_identity_cache NOCH NICHT.
-- Erst Code deployen + TLN-ID/Referral/Team testen; Cleanup folgt separat.

begin;

insert into public.tln_vow_identity_global_cache(
  chain_key,registry_contract,wallet_address,node_id,source_method,source_tx_hash,source_block,
  verified_at,created_by,updated_by,updated_at
)
select distinct on (chain_key,registry_contract,wallet_address)
  chain_key,
  lower(coalesce(nullif(source_contract,''),'0x028c911c10c9e346158206991e02d09bd0a8a35b')) as registry_contract,
  lower(wallet_address) as wallet_address,
  node_id::numeric,
  coalesce(nullif(source_method,''),'nodeIdOf(address)') as source_method,
  parent_source_hash as source_tx_hash,
  null::bigint as source_block,
  verified_at,
  user_id as created_by,
  user_id as updated_by,
  now() as updated_at
from public.tln_wallet_identity_cache
where node_id is not null
  and wallet_address ~ '^0x[0-9a-fA-F]{40}$'
order by chain_key,registry_contract,wallet_address,verified_at desc
on conflict(chain_key,registry_contract,wallet_address) do update set
  node_id=excluded.node_id,
  source_method=excluded.source_method,
  source_tx_hash=coalesce(excluded.source_tx_hash,public.tln_vow_identity_global_cache.source_tx_hash),
  verified_at=greatest(public.tln_vow_identity_global_cache.verified_at,excluded.verified_at),
  updated_by=excluded.updated_by,
  updated_at=now();

commit;

-- Genau EIN Resultset. legacy_parent_edges_in_global_graph sollte 3 sein.
select
  (select count(*) from public.tln_wallet_identity_cache where node_id is not null) as legacy_identity_rows,
  (select count(*) from public.tln_vow_identity_global_cache) as global_identity_rows,
  (select count(*) from public.tln_wallet_identity_cache l
     where l.parent_wallet is not null
       and exists(select 1 from public.tln_vow_smartnode_graph_cache g
         where g.chain_key='bsc' and g.child_wallet=lower(l.wallet_address) and g.parent_wallet=lower(l.parent_wallet))) as legacy_parent_edges_in_global_graph,
  (select count(*) from public.tln_wallet_identity_cache where parent_wallet is not null) as legacy_parent_rows;
