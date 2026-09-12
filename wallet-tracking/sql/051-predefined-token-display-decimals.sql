-- WalletTracking Migration 051
-- Zentrale UI-Anzeigepräzision pro vordefiniertem Token.
-- WICHTIG: Diese Felder beeinflussen ausschließlich die Darstellung.
-- public.predefined_tokens.decimals bleibt die technische Blockchain-Präzision.

alter table public.predefined_tokens
  add column if not exists display_decimals smallint,
  add column if not exists summary_decimals smallint;

update public.predefined_tokens
set display_decimals = case
  when upper(coalesce(symbol, label, '')) in ('USDT','USDC','BUSD','DAI','V$','V€','V£','VUSD') then 2
  when upper(coalesce(symbol, label, '')) in ('VOW','TLN') then 4
  when defi_category = 'lp_token' then 6
  else 6
end
where display_decimals is null;

alter table public.predefined_tokens
  alter column display_decimals set default 6;

alter table public.predefined_tokens
  alter column display_decimals set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'predefined_tokens_display_decimals_chk'
      and conrelid = 'public.predefined_tokens'::regclass
  ) then
    alter table public.predefined_tokens
      add constraint predefined_tokens_display_decimals_chk
      check (display_decimals between 0 and 18);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'predefined_tokens_summary_decimals_chk'
      and conrelid = 'public.predefined_tokens'::regclass
  ) then
    alter table public.predefined_tokens
      add constraint predefined_tokens_summary_decimals_chk
      check (summary_decimals is null or summary_decimals between 0 and 18);
  end if;
end $$;

comment on column public.predefined_tokens.display_decimals is
  'Reine UI-Anzeigepräzision für Tokenmengen; verändert keine Blockchain-decimals oder Berechnungen.';

comment on column public.predefined_tokens.summary_decimals is
  'Optionale UI-Anzeigepräzision für Summaries/Kennzahlen. NULL = display_decimals verwenden.';

select chain, symbol, label, decimals as technical_decimals, display_decimals, summary_decimals
from public.predefined_tokens
order by chain, coalesce(symbol, label, address);
