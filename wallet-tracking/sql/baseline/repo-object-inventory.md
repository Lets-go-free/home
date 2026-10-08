# Repo-Objektinventar · Phase 7.17

Dieses Inventar ergänzt die verifizierte Live-Baseline. Es ist eine Prüfliste für Code-/DB-Abgleich und kein Ersatz für `verified/schema.sql`.

## Verifizierter Live-Stand 04.10.2026

- 69 Tabellen in `public`
- RLS auf allen 69 Tabellen
- 218 Policies
- 17 Functions in `public`
- 4 Trigger
- Migration 080 / `historical_dex_pair_state_cache`: produktiv vorhanden
- Supabase-Migrationshistorie: leer

## Vom Code referenzierte Tabellen

- admins
- apertum_nft_transfer_cache
- cache_data_versions
- chains
- chat_messages
- defi_project_tokens
- defi_projects
- defi_staking_contracts
- dex_configs
- discovery_cache
- historical_dex_pair_state_cache
- historical_tax_chain_context_cache
- historical_token_balance_cache
- historical_token_candidate_cache
- lp_history_events
- lp_pair_registry
- lp_position_cache
- lp_staking_candidates
- nft_cache
- predefined_tokens
- project_nft_ownership
- project_nfts
- project_scan_state
- safe_tokens
- snapshot_items
- snapshots
- tax_asset_prices
- tax_fx_rates
- user_data_migrations
- user_release_acknowledgements
- user_ui_preferences
- wallet_fee_cache
- wallet_fee_transactions
- wallet_refresh_state
- year_end_coverage
- year_end_positions

## Vom Code referenzierte RPCs

- mark_chat_read
- register_lp_pair_candidate
- register_lp_staking_candidate
- wallettracking_claim_price_refresh_slot

## Im aktuellen Repo vorhandene SQL-Migrationen

- 074-p10-rpc-execute-hardening.sql
- 075-aptm-native-dao1-project.sql
- 076-tax-estv-prices.sql
- 077-generic-lp-registry.sql
- 078-historical-tax-balance-cache.sql
- 079-historical-tax-chain-context-cache.sql
- 080-historical-dex-pair-state-cache.sql
- 081-auth-admin-user-id.sql
- 082-predefined-stablecoins-base-solana-avalanche.sql
- 083-predefined-polygon-stablecoin-metadata.sql

## Historische Lücke

Die Projekthistorie erwähnt mindestens die Migrationen/SQL-Stände 057, 058, 059, 063, 065, 068, 072 und 073, die im heutigen Repo fehlen. Weitere ältere Migrationen können ebenfalls fehlen. Diese Dateien werden nicht aus Vermutungen rekonstruiert.

## Separater Härtungspunkt

Der Live-Snapshot enthält ältere breite Grants auf mehreren Tabellen und historisch interne Cache-/Jobobjekte in `public`. Beides wird separat auditiert und gehärtet, ohne den verifizierten Baseline-Snapshot rückwirkend umzuschreiben.


## Ergänzung 7.48 nach Baseline

Migration 091 erzeugt `public.dao_bot_claim_reviews` für notwendige Browser-Userentscheidungen. Kein globaler/Backend-Cache. SELECT/INSERT/UPDATE/DELETE nur authenticated unter RLS `auth.uid() = user_id`; anon/public ohne Grants. PK User+Projekt+Chain+Wallet+TX, FK auf private Transaktionszeile und auth.users mit ON DELETE CASCADE. Keine Walletadresse oder Name im Klartext. Die Baseline vom 04.10. bleibt unverändert; Restore muss spätere Migrationen einschließlich 091 anwenden. Live-Schema-/RLS-/Cascade-Verifikation offen.
