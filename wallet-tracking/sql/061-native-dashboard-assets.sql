-- WalletTracking · Phase 5.26
-- Native Coins als echte predefined_tokens-Stammdaten fuer Dashboard-Auswahl und Anzeigepräzision.
-- Idempotent: vorhandene native Datensätze werden nicht überschrieben.

begin;

alter table public.predefined_tokens
  add column if not exists is_native boolean not null default false;

insert into public.predefined_tokens (
  chain,address,label,symbol,name,coingecko_id,decimals,display_decimals,summary_decimals,dashboard_visible,is_native,enabled
)
select
  c.chain_key,
  'native',
  coalesce(nullif(c.native_symbol,''),upper(c.chain_key)) || ' (nativ)',
  coalesce(nullif(c.native_symbol,''),upper(c.chain_key)),
  coalesce(nullif(c.label,''),nullif(c.native_symbol,''),upper(c.chain_key)),
  c.coingecko_id,
  case lower(coalesce(c.wallet_type,''))
    when 'evm' then 18 when 'sol' then 9 when 'tron' then 6 when 'btc' then 8 when 'xrp' then 6 else null end,
  6,
  null,
  upper(coalesce(c.native_symbol,''))='BNB',
  true,
  true
from public.chains c
where c.enabled=true
  and not exists (select 1 from public.predefined_tokens p where p.chain=c.chain_key and lower(p.address)='native');

update public.predefined_tokens
set is_native=true
where lower(address)='native' and coalesce(is_native,false)=false;

commit;

select chain,address,label,symbol,display_decimals,summary_decimals,dashboard_visible,is_native
from public.predefined_tokens
where lower(address)='native'
order by chain;
