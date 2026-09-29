-- WalletTracking 6.78 · Build 20260929-174845
-- Projektübergreifende LP-/Staking-Discovery.
-- LP-Pairs sind globale On-Chain-Fakten. Neue Funde werden nur als pending registriert;
-- Verifikation/Ignore bleibt Admin-Aufgabe. Staking-Kandidaten werden niemals automatisch
-- als Vermögen klassifiziert, bevor ein Admin sie verifiziert hat.

begin;

-- Technischer Projekt-Key für projektlose LP-/Staking-Caches. Deaktiviert, damit er
-- nicht als eigenes DeFi-Projekt in der User-Navigation erscheint. Gleichzeitig ist
-- damit ein allfälliger FK von lp_*_cache.project_key auf defi_projects erfüllt.
insert into public.defi_projects(project_key,name,description,sort_order,enabled)
values ('generic_lp','Liquidity Pools (allgemein)','Technischer Scope für projektlose bzw. projektübergreifend erkannte LP-/Staking-Positionen.',9999,false)
on conflict (project_key) do update set enabled=false;

create table if not exists public.lp_pair_registry (
  chain_key text not null,
  pair_address text not null,
  factory_address text,
  token0_address text,
  token0_symbol text,
  token1_address text,
  token1_symbol text,
  decimals integer,
  project_key text,
  status text not null default 'pending' check (status in ('pending','verified','ignored')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  verified_at timestamptz,
  notes text,
  primary key (chain_key, pair_address)
);

create table if not exists public.lp_staking_candidates (
  chain_key text not null,
  pair_address text not null,
  contract_address text not null,
  project_key text,
  label text,
  evidence_tx_hash text,
  status text not null default 'pending' check (status in ('pending','verified','ignored')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  verified_at timestamptz,
  notes text,
  primary key (chain_key, pair_address, contract_address)
);

alter table public.lp_pair_registry enable row level security;
alter table public.lp_staking_candidates enable row level security;

revoke all on table public.lp_pair_registry from anon;
revoke all on table public.lp_staking_candidates from anon;
grant select, insert, update, delete on table public.lp_pair_registry to authenticated;
grant select, insert, update, delete on table public.lp_staking_candidates to authenticated;

-- Alle eingeloggten User dürfen die globale Registry lesen.
drop policy if exists lp_pair_registry_read_authenticated on public.lp_pair_registry;
create policy lp_pair_registry_read_authenticated on public.lp_pair_registry
for select to authenticated using (
  status = 'verified'
  or exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email'))
);

drop policy if exists lp_staking_candidates_read_authenticated on public.lp_staking_candidates;
create policy lp_staking_candidates_read_authenticated on public.lp_staking_candidates
for select to authenticated using (
  status = 'verified'
  or exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email'))
);

-- Direkte Änderungen nur Admin. Normale User registrieren Funde ausschließlich via RPC unten.
drop policy if exists lp_pair_registry_admin_write on public.lp_pair_registry;
create policy lp_pair_registry_admin_write on public.lp_pair_registry
for all to authenticated
using (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')))
with check (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')));

drop policy if exists lp_staking_candidates_admin_write on public.lp_staking_candidates;
create policy lp_staking_candidates_admin_write on public.lp_staking_candidates
for all to authenticated
using (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')))
with check (exists (select 1 from public.admins a where lower(a.email)=lower(auth.jwt()->>'email')));

create or replace function public.register_lp_pair_candidate(
  p_chain_key text,
  p_pair_address text,
  p_factory_address text default null,
  p_token0_address text default null,
  p_token0_symbol text default null,
  p_token1_address text default null,
  p_token1_symbol text default null,
  p_decimals integer default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.lp_pair_registry(chain_key,pair_address,factory_address,token0_address,token0_symbol,token1_address,token1_symbol,decimals,status,last_seen_at)
  values(lower(trim(p_chain_key)),lower(trim(p_pair_address)),nullif(lower(trim(coalesce(p_factory_address,''))),''),nullif(lower(trim(coalesce(p_token0_address,''))),''),nullif(trim(coalesce(p_token0_symbol,'')),''),nullif(lower(trim(coalesce(p_token1_address,''))),''),nullif(trim(coalesce(p_token1_symbol,'')),''),p_decimals,'pending',now())
  on conflict (chain_key,pair_address) do update set
    factory_address=coalesce(excluded.factory_address,lp_pair_registry.factory_address),
    token0_address=coalesce(excluded.token0_address,lp_pair_registry.token0_address),
    token0_symbol=coalesce(excluded.token0_symbol,lp_pair_registry.token0_symbol),
    token1_address=coalesce(excluded.token1_address,lp_pair_registry.token1_address),
    token1_symbol=coalesce(excluded.token1_symbol,lp_pair_registry.token1_symbol),
    decimals=coalesce(excluded.decimals,lp_pair_registry.decimals),
    last_seen_at=now();
end;
$$;

create or replace function public.register_lp_staking_candidate(
  p_chain_key text,
  p_pair_address text,
  p_contract_address text,
  p_evidence_tx_hash text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.lp_staking_candidates(chain_key,pair_address,contract_address,evidence_tx_hash,status,last_seen_at)
  values(lower(trim(p_chain_key)),lower(trim(p_pair_address)),lower(trim(p_contract_address)),nullif(lower(trim(coalesce(p_evidence_tx_hash,''))),''),'pending',now())
  on conflict (chain_key,pair_address,contract_address) do update set
    evidence_tx_hash=coalesce(excluded.evidence_tx_hash,lp_staking_candidates.evidence_tx_hash),
    last_seen_at=now();
end;
$$;

revoke all on function public.register_lp_pair_candidate(text,text,text,text,text,text,text,integer) from public, anon;
revoke all on function public.register_lp_staking_candidate(text,text,text,text) from public, anon;
grant execute on function public.register_lp_pair_candidate(text,text,text,text,text,text,text,integer) to authenticated;
grant execute on function public.register_lp_staking_candidate(text,text,text,text) to authenticated;

commit;
