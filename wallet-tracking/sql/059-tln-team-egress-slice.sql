-- Phase 4.95 · TLN/VOW Team Egress-Optimierung
-- Liefert für normale Team-Ansicht nur die tatsächlich relevanten Graph-Kanten:
-- Downline bis p_max_depth ab JEDEM eigenen Leader + vollständige Upline-Kette der Leader.
-- RETURNS SETOF der Originaltabelle hält den Payload schemaoffen: neue Tabellenspalten
-- werden von PostgREST automatisch mitgeliefert und gehen im Browser-Cache nicht verloren.

create or replace function public.wt_tln_smartnode_graph_slice(
  p_wallets text[],
  p_contract text,
  p_max_depth integer default 20
)
returns setof public.tln_vow_smartnode_graph_cache
language sql
stable
security invoker
set search_path = public
as $$
  with recursive
  roots(wallet) as (
    select distinct lower(x)
    from unnest(coalesce(p_wallets, array[]::text[])) x
    where x ~* '^0x[0-9a-f]{40}$'
  ),
  downline as (
    select g.child_wallet, 1 as depth, array[lower(g.parent_wallet), lower(g.child_wallet)]::text[] as path
    from public.tln_vow_smartnode_graph_cache g
    join roots r on lower(g.parent_wallet)=r.wallet
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
    union all
    select g.child_wallet, d.depth+1, d.path || lower(g.child_wallet)
    from downline d
    join public.tln_vow_smartnode_graph_cache g on lower(g.parent_wallet)=lower(d.child_wallet)
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
      and d.depth < greatest(1, least(coalesce(p_max_depth,20),100))
      and not lower(g.child_wallet)=any(d.path)
  ),
  upline as (
    select g.child_wallet, g.parent_wallet, 1 as depth, array[lower(g.child_wallet),lower(g.parent_wallet)]::text[] as path
    from public.tln_vow_smartnode_graph_cache g
    join roots r on lower(g.child_wallet)=r.wallet
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
    union all
    select g.child_wallet, g.parent_wallet, u.depth+1, u.path || lower(g.parent_wallet)
    from upline u
    join public.tln_vow_smartnode_graph_cache g on lower(g.child_wallet)=lower(u.parent_wallet)
    where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract)
      and u.depth < 1000
      and not lower(g.parent_wallet)=any(u.path)
  ),
  wanted(child_wallet) as (
    select child_wallet from downline
    union
    select child_wallet from upline
  )
  select g.*
  from public.tln_vow_smartnode_graph_cache g
  join wanted w on lower(g.child_wallet)=lower(w.child_wallet)
  where g.chain_key='bsc' and lower(g.contract_address)=lower(p_contract);
$$;

grant execute on function public.wt_tln_smartnode_graph_slice(text[], text, integer) to authenticated;
