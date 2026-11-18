-- Phase 9.03: precompute trade aggregates after the scheduled indexer run.
-- Raw, verified Swap events remain authoritative; no existing events are modified.
create table if not exists public.tln_vow_trade_rollup (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null,
  computed_at timestamptz not null,
  summary jsonb not null,
  traders jsonb not null,
  transaction_count bigint not null default 0
);
alter table public.tln_vow_trade_rollup enable row level security;
drop policy if exists tln_vow_trade_rollup_read_owner on public.tln_vow_trade_rollup;
create policy tln_vow_trade_rollup_read_owner on public.tln_vow_trade_rollup
  for select to authenticated using (user_id = auth.uid());
revoke all on public.tln_vow_trade_rollup from public, anon, authenticated;
grant select on public.tln_vow_trade_rollup to authenticated;
grant all on public.tln_vow_trade_rollup to service_role;

create or replace function public.wallettracking_refresh_tln_vow_trade_rollup_903(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_now timestamptz := clock_timestamp();
  v_summary jsonb;
  v_traders jsonb;
  v_count bigint;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_user_id is null then raise exception 'Missing user ID'; end if;

  -- Match the browser's inclusive time cutoffs, with a single common timestamp.
  with windows(k, duration) as (
    values ('24h'::text, interval '24 hours'), ('7d', interval '7 days'), ('30d', interval '30 days')
  ), expanded as (
    select w.k, c.chain_key, t.token_key, t.side, t.amount
    from public.tln_vow_trade_cache t
    join windows w on t.block_time >= v_now - w.duration
    cross join lateral (values (t.chain_key), ('total'::text)) c(chain_key)
    where t.user_id = p_user_id and t.block_time >= v_now - interval '30 days'
  ), grouped as (
    select k, chain_key, token_key, side, sum(amount) as amount, count(*) as trades
    from expanded group by k, chain_key, token_key, side
  )
  select coalesce(jsonb_agg(jsonb_build_object('period',k,'chain',chain_key,
    'token',token_key,'side',side,'amount',amount,'trades',trades)), '[]'::jsonb)
  into v_summary from grouped;

  with windows(k, duration) as (
    values ('24h'::text, interval '24 hours'), ('7d', interval '7 days'), ('30d', interval '30 days')
  ), expanded as (
    select w.k, c.chain_key, t.chain_key as source_chain, t.token_key, t.side,
      t.wallet_address, t.amount
    from public.tln_vow_trade_cache t
    join windows w on t.block_time >= v_now - w.duration
    cross join lateral (values (t.chain_key), ('total'::text)) c(chain_key)
    where t.user_id = p_user_id and t.wallet_address is not null
      and t.wallet_address <> '' and t.block_time >= v_now - interval '30 days'
  ), grouped as (
    select k,chain_key,token_key,wallet_address,
      sum(amount) filter (where side='buy') as buy,
      sum(amount) filter (where side='sell') as sell,
      count(*) filter (where side='buy') as buy_trades,
      count(*) filter (where side='sell') as sell_trades,
      array_agg(distinct source_chain order by source_chain) as chains
    from expanded group by k,chain_key,token_key,wallet_address
  ), ranked as (
    select *,row_number() over (partition by k,chain_key,token_key
      order by coalesce(buy,0)+coalesce(sell,0) desc,wallet_address) as rank
    from grouped
  )
  select coalesce(jsonb_agg(jsonb_build_object('period',k,'chain',chain_key,
    'token',token_key,'wallet',wallet_address,'buy',coalesce(buy,0),
    'sell',coalesce(sell,0),'buyTrades',buy_trades,'sellTrades',sell_trades,
    'chains',chains,'rank',rank)), '[]'::jsonb)
  into v_traders from ranked where rank <= 20;

  select count(*) into v_count from (
    select distinct chain_key, tx_hash from public.tln_vow_trade_cache
    where user_id = p_user_id and block_time >= v_now - interval '30 days'
  ) distinct_txs;

  insert into public.tln_vow_trade_rollup
    (user_id,schema_version,computed_at,summary,traders,transaction_count)
  values (p_user_id,1,v_now,v_summary,v_traders,v_count)
  on conflict (user_id) do update set schema_version=excluded.schema_version,
    computed_at=excluded.computed_at,summary=excluded.summary,
    traders=excluded.traders,transaction_count=excluded.transaction_count;
end;
$$;
revoke all on function public.wallettracking_refresh_tln_vow_trade_rollup_903(uuid) from public, anon, authenticated;
grant execute on function public.wallettracking_refresh_tln_vow_trade_rollup_903(uuid) to service_role;
