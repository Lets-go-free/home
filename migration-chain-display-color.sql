-- Wallet Tracking – Chain-Anzeigefarbe zentralisieren
alter table public.chains
  add column if not exists display_color text;

update public.chains set display_color='#627eea' where chain_key='eth' and display_color is null;
update public.chains set display_color='#f0b90b' where chain_key='bsc' and display_color is null;
update public.chains set display_color='#8247e5' where chain_key='matic' and display_color is null;
update public.chains set display_color='#f7931a' where chain_key='btc' and display_color is null;
update public.chains set display_color='#6b7280' where chain_key='xrp' and display_color is null;
update public.chains set display_color='#14f195' where chain_key='sol' and display_color is null;
update public.chains set display_color='#ff414c' where chain_key='akash' and display_color is null;
update public.chains set display_color='#00c2a8' where chain_key='apertum' and display_color is null;
update public.chains set display_color='#ff060a' where chain_key='tron' and display_color is null;
update public.chains set display_color='#28a0f0' where chain_key='arb' and display_color is null;
update public.chains set display_color='#0052ff' where chain_key='base' and display_color is null;
update public.chains set display_color='#e84142' where chain_key='avax' and display_color is null;

-- Neutraler Default für neue Chains.
update public.chains set display_color='#6b7280' where display_color is null;

select chain_key,label,display_color from public.chains order by sort_order;
