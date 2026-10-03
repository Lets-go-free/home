# Repo-Objektinventar · Phase 7.16

Dieses Inventar basiert auf den Supabase-Aufrufen im aktuellen Frontend-/Admin-Code. Es ist **kein** Ersatz für den Live-Schema-Dump, sondern eine Prüfliste.

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

## Nachweislich referenzierte, aktuell fehlende ältere Migrationen

Die Projekt-Historie in `admin/ideas.js` erwähnt mindestens:

- Migration 057
- Migration 058
- Migration 059
- Migration 063
- Migration 065
- Migration 068
- SQL 072
- SQL 073

Weitere ältere Migrationen können ebenfalls fehlen. Deshalb wird die vollständige Baseline aus dem produktiven Live-Schema verifiziert und nicht aus dieser Liste geraten.
