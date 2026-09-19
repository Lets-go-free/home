-- WalletTracking Phase 5.37
-- Einmalige Semantik-Migration:
-- Vor Phase 5.36 bedeutete summary_decimals=0 faktisch "Anzeige übernehmen".
-- Neu gilt: NULL = Anzeige übernehmen, 0 = wirklich 0 Nachkommastellen.
update public.predefined_tokens
set summary_decimals = null
where summary_decimals = 0;

comment on column public.predefined_tokens.summary_decimals is
  'Dashboard/Summary-Anzeige: NULL = display_decimals übernehmen; 0..18 = explizite Nachkommastellen (0 ist gültig).';
