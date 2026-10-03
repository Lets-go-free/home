-- WalletTracking · verifizierter globaler Stammdaten-Seed
-- Quelle: produktiver read-only Supabase-Export vom 04.10.2026 00:30 CEST
-- Phase 7.19 · idempotent; keine User-/Wallet-/Snapshot-/Cache-Daten.
-- Voraussetzung: verifiziertes Baseline-Schema ist bereits vorhanden.

BEGIN;

-- chains: 12 Zeilen
INSERT INTO "public"."chains" ("chain_key", "label", "native_symbol", "coingecko_id", "wallet_type", "explorer_url_template", "geckoterminal_network", "sort_order", "enabled", "notes", "created_at", "updated_at", "evm_chain_id", "rpc_url", "balance_provider", "fee_provider", "fee_api_base", "fee_finality_blocks", "fee_overlap_blocks", "fees_enabled", "discovery_enabled", "approvals_enabled", "nft_enabled", "discovery_provider", "discovery_api_base", "approvals_provider", "approvals_api_base", "nft_provider", "nft_api_base", "balance_api_base", "display_color", "archive_rpc_url", "archive_rpc_provider", "icon_path") VALUES
	('matic', 'Polygon (POL)', 'POL', 'polygon-ecosystem-token', 'evm', 'https://polygonscan.com/address/{address}', 'polygon_pos', 30, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 137, 'https://polygon-bor-rpc.publicnode.com', 'evm_rpc', 'blockscout', 'https://polygon.blockscout.com', 256, 256, true, true, true, true, 'alchemy', 'https://polygon-mainnet.g.alchemy.com/v2', 'alchemy', 'https://polygon-mainnet.g.alchemy.com/v2', 'alchemy', 'https://polygon-mainnet.g.alchemy.com/nft/v3', NULL, '#8247e5', 'https://polygon-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/polygon.svg'),
	('bsc', 'BNB Smart Chain (BSC)', 'BNB', 'binancecoin', 'evm', 'https://bscscan.com/address/{address}', 'bsc', 20, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 56, 'https://bsc-rpc.publicnode.com', 'evm_rpc', 'nodereal', NULL, 200, 200, true, true, true, true, 'alchemy', 'https://bnb-mainnet.g.alchemy.com/v2', 'alchemy', 'https://bnb-mainnet.g.alchemy.com/v2', 'alchemy', 'https://bnb-mainnet.g.alchemy.com/nft/v3', NULL, '#f0b90b', 'https://bnb-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/bnb.svg'),
	('eth', 'Ethereum (ETH)', 'ETH', 'ethereum', 'evm', 'https://etherscan.io/address/{address}', 'eth', 10, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 1, 'https://ethereum-rpc.publicnode.com', 'evm_rpc', 'routescan', 'https://api.routescan.io/v2/network/mainnet/evm/1', 64, 64, true, true, true, true, 'alchemy', 'https://eth-mainnet.g.alchemy.com/v2', 'alchemy', 'https://eth-mainnet.g.alchemy.com/v2', 'alchemy', 'https://eth-mainnet.g.alchemy.com/nft/v3', NULL, '#627eea', 'https://eth-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/eth.svg'),
	('tron', 'Tron (TRX)', 'TRX', 'tron', 'tron', 'https://tronscan.org/#/address/{address}', 'tron', 80, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', NULL, NULL, 'trongrid', 'tronscan', 'https://apilist.tronscanapi.com/api', 0, 0, true, true, false, false, 'wallet_data', NULL, NULL, NULL, NULL, NULL, 'https://api.trongrid.io', '#ff060a', NULL, NULL, './assets/crypto/trx.svg'),
	('base', 'Base (ETH)', 'ETH', 'ethereum', 'evm', 'https://basescan.org/address/{address}', 'base', 50, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 8453, 'https://base-rpc.publicnode.com', 'evm_rpc', 'blockscout', 'https://base.blockscout.com', 256, 256, true, true, true, true, 'alchemy', 'https://base-mainnet.g.alchemy.com/v2', 'alchemy', 'https://base-mainnet.g.alchemy.com/v2', 'alchemy', 'https://base-mainnet.g.alchemy.com/nft/v3', NULL, '#0052ff', 'https://base-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/base.svg'),
	('arb', 'Arbitrum (ETH)', 'ETH', 'ethereum', 'evm', 'https://arbiscan.io/address/{address}', 'arbitrum', 40, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 42161, 'https://arbitrum-one-rpc.publicnode.com', 'evm_rpc', 'blockscout', 'https://arbitrum.blockscout.com', 256, 256, true, true, true, true, 'alchemy', 'https://arb-mainnet.g.alchemy.com/v2', 'alchemy', 'https://arb-mainnet.g.alchemy.com/v2', 'alchemy', 'https://arb-mainnet.g.alchemy.com/nft/v3', NULL, '#28a0f0', 'https://arb-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/arbitrum.svg'),
	('apertum', 'Apertum (APTM)', 'APTM', 'apertum', 'evm', 'https://explorer.apertum.io/address/{address}', NULL, 70, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 2786, 'https://rpc.apertum.io/ext/bc/YDJ1r9RMkewATmA7B35q1bdV18aywzmdiXwd9zGBq3uQjsCnn/rpc', 'blockscout', 'apertum_explorer', 'https://explorer.apertum.io/api/v2', NULL, NULL, true, true, true, true, 'wallet_data', NULL, 'blockscout', 'https://explorer.apertum.io/api/v2', 'blockscout', 'https://explorer.apertum.io/api/v2', 'https://explorer.apertum.io/api/v2', '#00c2a8', NULL, NULL, './assets/crypto/aptm.svg'),
	('avax', 'Avalanche (AVAX)', 'AVAX', 'avalanche-2', 'evm', 'https://snowtrace.io/address/{address}', 'avax', 60, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', 43114, 'https://avalanche-c-chain-rpc.publicnode.com', 'evm_rpc', 'routescan', 'https://api.routescan.io/v2/network/mainnet/evm/43114', 128, 128, true, true, true, true, 'alchemy', 'https://avax-mainnet.g.alchemy.com/v2', 'alchemy', 'https://avax-mainnet.g.alchemy.com/v2', 'alchemy', 'https://avax-mainnet.g.alchemy.com/nft/v3', NULL, '#e84142', 'https://avax-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/avax.svg'),
	('btc', 'Bitcoin (BTC)', 'BTC', 'bitcoin', 'btc', 'https://mempool.space/address/{address}', NULL, 90, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', NULL, NULL, 'blockstream', 'mempool', 'https://mempool.space/api', 1, 0, true, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, 'https://blockstream.info/api', '#f7931a', NULL, NULL, './assets/crypto/btc.svg'),
	('sol', 'Solana (SOL)', 'SOL', 'solana', 'sol', 'https://solscan.io/account/{address}', NULL, 110, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', NULL, NULL, 'solana_rpc', 'solana_publicnode', 'https://solana-rpc.publicnode.com', NULL, NULL, true, true, false, false, 'wallet_data', NULL, NULL, NULL, NULL, NULL, 'https://solana-rpc.publicnode.com', '#14f195', 'https://solana-mainnet.g.alchemy.com/v2', 'alchemy', './assets/crypto/sol.svg'),
	('xrp', 'XRP', 'XRP', 'ripple', 'xrp', 'https://xrpscan.com/account/{address}', NULL, 100, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', NULL, NULL, 'xrpscan', 'xrpscan', 'https://api.xrpscan.com/api/v1', NULL, NULL, true, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, 'https://api.xrpscan.com/api/v1', '#6b7280', NULL, NULL, './assets/crypto/xrp.svg'),
	('akash', 'Akash Network (AKT)', 'AKT', 'akash-network', 'akash', 'https://www.mintscan.io/akash/address/{address}', NULL, 120, true, NULL, '2026-08-26 17:12:32.659594+00', '2026-08-26 17:12:32.659594+00', NULL, NULL, 'akash_rest', NULL, NULL, NULL, NULL, false, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, 'https://api.akashnet.net', '#ff414c', NULL, NULL, './assets/crypto/akt.svg')
ON CONFLICT ("chain_key") DO UPDATE SET
    "label" = EXCLUDED."label",
    "native_symbol" = EXCLUDED."native_symbol",
    "coingecko_id" = EXCLUDED."coingecko_id",
    "wallet_type" = EXCLUDED."wallet_type",
    "explorer_url_template" = EXCLUDED."explorer_url_template",
    "geckoterminal_network" = EXCLUDED."geckoterminal_network",
    "sort_order" = EXCLUDED."sort_order",
    "enabled" = EXCLUDED."enabled",
    "notes" = EXCLUDED."notes",
    "created_at" = EXCLUDED."created_at",
    "updated_at" = EXCLUDED."updated_at",
    "evm_chain_id" = EXCLUDED."evm_chain_id",
    "rpc_url" = EXCLUDED."rpc_url",
    "balance_provider" = EXCLUDED."balance_provider",
    "fee_provider" = EXCLUDED."fee_provider",
    "fee_api_base" = EXCLUDED."fee_api_base",
    "fee_finality_blocks" = EXCLUDED."fee_finality_blocks",
    "fee_overlap_blocks" = EXCLUDED."fee_overlap_blocks",
    "fees_enabled" = EXCLUDED."fees_enabled",
    "discovery_enabled" = EXCLUDED."discovery_enabled",
    "approvals_enabled" = EXCLUDED."approvals_enabled",
    "nft_enabled" = EXCLUDED."nft_enabled",
    "discovery_provider" = EXCLUDED."discovery_provider",
    "discovery_api_base" = EXCLUDED."discovery_api_base",
    "approvals_provider" = EXCLUDED."approvals_provider",
    "approvals_api_base" = EXCLUDED."approvals_api_base",
    "nft_provider" = EXCLUDED."nft_provider",
    "nft_api_base" = EXCLUDED."nft_api_base",
    "balance_api_base" = EXCLUDED."balance_api_base",
    "display_color" = EXCLUDED."display_color",
    "archive_rpc_url" = EXCLUDED."archive_rpc_url",
    "archive_rpc_provider" = EXCLUDED."archive_rpc_provider",
    "icon_path" = EXCLUDED."icon_path";

-- defi_projects: 3 Zeilen
INSERT INTO "public"."defi_projects" ("project_key", "name", "description", "enabled", "sort_order", "created_at") VALUES
	('tln_vow', 'TLN / VOW', 'TLN/VOW DeFi-Ökosystem; aus bisheriger Spezialkonfiguration migriert.', true, 10, '2026-08-26 19:06:47.907698+00'),
	('dao1', 'DAO1', 'DAO1 / Apertum – projektspezifische Assets und Mining', true, 20, '2026-08-27 11:39:45.222686+00'),
	('generic_lp', 'Liquidity Pools (allgemein)', 'Technischer Scope für projektlose bzw. projektübergreifend erkannte LP-/Staking-Positionen.', false, 9999, '2026-09-29 15:59:41.550501+00')
ON CONFLICT ("project_key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "enabled" = EXCLUDED."enabled",
    "sort_order" = EXCLUDED."sort_order",
    "created_at" = EXCLUDED."created_at";

-- defi_project_tokens: 3 Zeilen
INSERT INTO "public"."defi_project_tokens" ("id", "project_key", "chain_key", "role", "symbol", "contract_address", "enabled", "created_at") VALUES
	('c8a5f14c-b06a-4314-9495-f0f0324883c0', 'tln_vow', 'bsc', 'reference', 'VOW', '0xf585b5b4f22816baf7629aea55b701662630397b', true, '2026-08-26 19:06:47.907698+00'),
	('4ac92ce6-8613-44c4-974e-3709fe4bc68a', 'tln_vow', 'eth', 'reference', 'VOW', '0x1bbf25e71ec48b84d773809b4ba55b6f4be946fb', true, '2026-08-26 19:06:47.907698+00'),
	('01d49b8c-1991-478d-ab8b-894b60aae29c', 'dao1', 'apertum', 'native', 'APTM', '', true, '2026-08-27 11:39:45.222686+00')
ON CONFLICT ("project_key", "chain_key", "role", "contract_address") DO UPDATE SET
    "symbol" = EXCLUDED."symbol",
    "enabled" = EXCLUDED."enabled",
    "created_at" = EXCLUDED."created_at";

-- defi_staking_contracts: 14 Zeilen
INSERT INTO "public"."defi_staking_contracts" ("id", "project_key", "chain_key", "contract_address", "label", "pair_address", "pair_label", "role", "classify_transfers", "lock_days", "notes", "enabled", "created_at", "updated_at") VALUES
	(1, 'tln_vow', 'bsc', '0xe3d90dcb3e13d5f7488d5c538d0255b1d294d83d', 'TLN Protocol Staking Reward (shared)', NULL, NULL, 'controller', false, NULL, 'Gemeinsamer Reward/Controller; nicht allein als LP-Stake-Ziel werten.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(2, 'tln_vow', 'bsc', '0x35592ed68f69430163d5156b0e7033992a1186cd', 'BTCB / VOW LP Staking', NULL, 'BTCB / VOW LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(3, 'tln_vow', 'bsc', '0x67518d0525788a34a23cf611838635a29c03b78a', 'VOW / v$ LP Staking', NULL, 'VOW / v$ LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(4, 'tln_vow', 'bsc', '0xf7fd35c4a304b55284e3b76d2b84b8951f63987d', 'VOW / USDT LP Staking', NULL, 'VOW / USDT LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(5, 'tln_vow', 'bsc', '0xdf9dc89d6b6d61ed0239361eba69d1c999c8cdeb', 'USDC / v$ LP Staking', NULL, 'USDC / v$ LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(6, 'tln_vow', 'bsc', '0x8ab468a067983e617c37f2ee15419395caba73fb', 'vPound / vEuro LP Staking', NULL, 'v£ / v€ LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(7, 'tln_vow', 'bsc', '0x2199898e1af5ff75bf5daa23fb205ac007ab7c26', 'vEuro / VOW LP Staking', NULL, 'v€ / VOW LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(8, 'tln_vow', 'bsc', '0x3c0655c7d50f75addbd475d21a35e5660ad5f944', 'vPound / VOW LP Staking', NULL, 'v£ / VOW LP', 'staking', true, NULL, 'Bestätigtes LP-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(9, 'tln_vow', 'bsc', '0x85f82230883693f1bbff65be1f7663ee5f0aa5f8', 'PC LP VOW/v$ (Legacy)', NULL, 'PC LP VOW/v$', 'legacy', true, NULL, 'Historisches TLN-Stakingziel; Pair wird aus dem tatsächlichen LP-Transfer bestimmt.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(10, 'tln_vow', 'bsc', '0x4857d369e18aba003ff6ec934cf046148df5d590', 'PC LP TLN+ (Legacy)', NULL, 'PC LP TLN+', 'legacy', true, NULL, 'Historisches TLN-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(11, 'tln_vow', 'bsc', '0x4a050fa27861ae2f0d63fb5da986e56ac510b201', 'PC LP VOW/v$ (Legacy 2)', NULL, 'PC LP VOW/v$', 'legacy', true, NULL, 'Historisches TLN-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(12, 'tln_vow', 'bsc', '0x43e457164eff66d1f975dcb9d2504ab29e36264e', 'Higher Value Stake (Legacy)', NULL, 'Higher Value Stake', 'legacy', true, NULL, 'Historisches TLN-Stakingziel; Lock-Dauer noch nicht als verifiziert hinterlegt.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(13, 'tln_vow', 'bsc', '0x9a9e97a015ca65f48973835b45d4e28a99f89191', 'Original LPT (Legacy)', NULL, 'Original LPT', 'legacy', true, NULL, 'Historisches TLN-Stakingziel.', true, '2026-08-28 16:59:00.233767+00', '2026-08-28 16:59:00.233767+00'),
	(14, 'tln_vow', 'bsc', '0x1f4361b24ce4080ca9699ef3f9430fe5d3ce55e8', 'VOW / v$ LP Staking', NULL, 'VOW / v$ LP', 'staking', true, NULL, 'Bestätigtes TLN/VOW-Stakingziel. Neuere Staking-Variante; Stake-Event in realer Referral-Staking-Tx nachgewiesen. Pair und Lock-Dauer noch nicht verifiziert.', true, '2026-09-01 01:48:54.621077+00', '2026-09-01 01:48:54.621077+00')
ON CONFLICT ("project_key", "chain_key", "contract_address") DO UPDATE SET
    "label" = EXCLUDED."label",
    "pair_address" = EXCLUDED."pair_address",
    "pair_label" = EXCLUDED."pair_label",
    "role" = EXCLUDED."role",
    "classify_transfers" = EXCLUDED."classify_transfers",
    "lock_days" = EXCLUDED."lock_days",
    "notes" = EXCLUDED."notes",
    "enabled" = EXCLUDED."enabled",
    "created_at" = EXCLUDED."created_at",
    "updated_at" = EXCLUDED."updated_at";

-- dex_configs: 3 Zeilen
INSERT INTO "public"."dex_configs" ("id", "chain_key", "dex_key", "name", "protocol", "version", "factory_address", "router_address", "enabled", "created_at") VALUES
	('3b5061a3-62ff-46fb-8f36-4740d5a8c301', 'bsc', 'pancakeswap_v2', 'PancakeSwap V2', 'pancakeswap', 'v2', '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', NULL, true, '2026-08-26 19:06:47.907698+00'),
	('a4797b5d-5898-4b14-a6f4-0c81c0c3860b', 'eth', 'uniswap_v2', 'Uniswap V2', 'uniswap', 'v2', '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', NULL, true, '2026-08-26 19:06:47.907698+00'),
	('b821fb83-46d6-42a1-aef6-b5ee201b06d8', 'eth', 'uniswap_v3', 'Uniswap V3', 'uniswap', 'v3', '0x1F98431c8aD98523631AE4a59f267346ea31F984', NULL, true, '2026-08-26 19:06:47.907698+00')
ON CONFLICT ("chain_key", "dex_key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "protocol" = EXCLUDED."protocol",
    "version" = EXCLUDED."version",
    "factory_address" = EXCLUDED."factory_address",
    "router_address" = EXCLUDED."router_address",
    "enabled" = EXCLUDED."enabled",
    "created_at" = EXCLUDED."created_at";

-- predefined_tokens: 80 Zeilen
INSERT INTO "public"."predefined_tokens" ("chain", "address", "label", "created_at", "tln_vow_category", "symbol", "name", "coingecko_id", "decimals", "price_source", "enabled", "defi_project_key", "defi_category", "staking_asset_kind", "historical_only", "staking_contract_addresses", "valid_from_block", "valid_to_block", "origin_chain", "historical_note", "display_decimals", "summary_decimals", "dashboard_visible", "is_native") VALUES
	('eth', '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff', 'IMX', '2026-08-26 17:01:54.494284+00', NULL, 'IMX', 'Immutable', 'immutable-x', 18, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('eth', '0x4a220e6096b25eadb88358cb44068a3248254675', 'QNT', '2026-08-26 17:01:54.494284+00', NULL, 'QNT', 'Quant', 'quant-network', 18, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('bsc', '0x4cE91C45c140486A3a9d52b16015DD58254115B9', 'USDC / v$', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x8b0b4c7878623db8e5e6cb9bd0fa85c07c3b85f1', 'v£ / v€', '2026-08-22 13:02:51.688509+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0xC6585bc17b53792f281a9739579DD60535c1F9FB', 'VOW / USDT', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('bsc', '0xC51C99af9D5c31D0C37d028500b2b344DEbDf188', 'VOW / v$', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('matic', 'native', 'POL (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'POL', 'Polygon (POL)', 'polygon-ecosystem-token', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, true),
	('akash', 'native', 'AKT (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'AKT', 'Akash Network (AKT)', 'akash-network', NULL, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, true),
	('btc', 'native', 'BTC (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'BTC', 'Bitcoin (BTC)', 'bitcoin', 8, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, true),
	('eth', '0x320623b8e4f30bc88fcafa7ea7e0124aeadcede5', 'RSR', '2026-08-26 17:01:54.494284+00', NULL, 'RSR', 'Reserve Rights', 'reserve-rights', 18, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', 'native', 'APTM (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'APTM', 'Apertum (APTM)', 'apertum', 18, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, true),
	('arb', 'native', 'ETH (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'ETH', 'Arbitrum (ETH)', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, true),
	('apertum', '0x38acbfa5108d3c76d6cea4d380182e832a289b57', 'wAPTM/wUSDT Liquidity Pool', '2026-09-28 15:04:07.92007+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('eth', '0x037a54aab062628c9bbae1fdb1583c195585fe41', 'LCX (alter Contract)', '2026-10-03 09:57:30.584861+00', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('eth', '0x8cd41041505885ef0ad3858181d66f17be8aae7e', 'LCX Token 2.0', '2026-08-26 17:01:54.494284+00', NULL, 'LCX', 'LCX', 'lcx', 18, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('avax', 'native', 'AVAX (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'AVAX', 'Avalanche (AVAX)', 'avalanche-2', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, true),
	('base', 'native', 'ETH (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'ETH', 'Base (ETH)', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, true),
	('bsc', 'native', 'BNB (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'BNB', 'BNB Smart Chain (BSC)', 'binancecoin', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, true, true),
	('eth', 'native', 'ETH (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'ETH', 'Ethereum (ETH)', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, true),
	('tron', 'native', 'TRX (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'TRX', 'Tron (TRX)', 'tron', 6, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, true),
	('bsc', '0x6B27bB584F44f55E865432dCeb9eBBE9A17fd4A8', 'BTCB / VOW', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('sol', 'native', 'SOL (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'SOL', 'Solana (SOL)', 'solana', 9, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, true),
	('xrp', 'native', 'XRP (nativ)', '2026-09-19 09:25:22.115076+00', NULL, 'XRP', 'XRP', 'ripple', 6, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, true),
	('bsc', '0x55d398326f99059ff775485246999027b3197955', 'USDT', '2026-08-22 13:02:51.688509+00', NULL, 'USDT', 'Tether', 'tether', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', 'USDC', '2026-08-22 13:02:51.688509+00', NULL, 'USDC', 'USD Coin', 'usd-coin', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x6fdcdfef7c496407ccb0cec90f9c5aaa1cc8d888', 'VeChain', '2026-08-23 17:45:13.71252+00', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('eth', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'WETH', '2026-08-22 13:02:51.688509+00', NULL, 'WETH', 'Wrapped Ether', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, false),
	('arbitrum', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', 'WETH', '2026-09-28 15:43:39.203464+00', NULL, 'WETH', 'Wrapped Ether', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0x3ddA9eA88136EceDe768CD374a2af37219da55e7', 'TLNX Token', '2026-08-22 14:13:00.85216+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('base', '0x4200000000000000000000000000000000000006', 'WETH', '2026-09-28 15:43:39.203464+00', NULL, 'WETH', 'Wrapped Ether', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0x2170ed0880ac9a755fd29b2688956bd959f933f8', 'Binance-Peg ETH', '2026-09-28 15:43:39.203464+00', NULL, 'ETH', 'Binance-Peg Ethereum Token', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0xf75dd43f59cba81329f2fa3d98d0c0908cffebb8', 'wAVAX', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('polygon', '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', 'WETH', '2026-09-28 15:43:39.203464+00', NULL, 'WETH', 'Wrapped Ether', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('avalanche', '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab', 'WETH.e', '2026-09-28 15:43:39.203464+00', NULL, 'WETH.e', 'Wrapped Ether (Bridged)', 'ethereum', 18, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0xf3074054737b9e83d73c3c17a007939e12698d5c', 'wBNB', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, false),
	('solana', '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', 'ETH (Wormhole)', '2026-09-28 15:43:39.203464+00', NULL, 'ETH', 'Wrapped Ether (Wormhole)', 'ethereum', 8, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('matic', '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', 'USDC', '2026-08-22 14:34:39.559976+00', NULL, 'USDC', 'USD Coin', 'usd-coin', 6, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('matic', '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', 'USDT', '2026-08-22 14:34:39.559976+00', NULL, 'USDT', 'Tether USD', 'tether', 6, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('apertum', '0xd979f41e12a69aa82f04866444ea91e8e8faefd9', 'wUSDC', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x6c559d849f70477723dc94405018a436fa9fdc12', 'v$ (VOW DOLLAR ETH)', '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('apertum', '0x110ac02ba3384bc055c13a87766049a74517beda', 'wAPTM', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, false),
	('bsc', '0x9c23942ca2c35e06d1d20747f33705983a18d2ab', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('apertum', '0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f', 'wUSDT', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x387afA0Ece06B1bD60C407F3B916b7Bbc4575bBF', 'v£ / VOW', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0xf081daa36f367f4a5f93ac68c14fb39b50a58ef8', 'wSOL', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('apertum', '0x01882c43aa0bee891b54857c15cc19a3df946f01', 'wETH', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0x75598b9f54df1472bb2bdc3b5dc791bdb109a52b', 'wBTC', '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('eth', '0xdac17f958d2ee523a2206206994597c13d831ec7', 'USDT', '2026-08-22 14:34:39.559976+00', NULL, 'USDT', 'Tether', 'tether', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('tron', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'USDT', '2026-08-22 14:40:56.032284+00', NULL, 'USDT', 'Tether', 'tether', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'USDC', '2026-08-22 14:34:39.559976+00', NULL, 'USDC', 'USD Coin', 'usd-coin', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x1e7Ea2ec47199191Dc3B642BB6c24ED03Cc1a641', 'TLN Gold / USDT', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('tron', 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', 'USDC', '2026-08-22 14:40:56.032284+00', NULL, 'USDC', 'USD Coin', 'usd-coin', NULL, 'coingecko', true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x29280091fa7f3abe4739ad5f1f7c5287feaf7736', 'TLN+', '2026-08-23 15:51:22.256032+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('bsc', '0xAa90a8CDAB8B8E902293a2817d1d286f66cBcec5', 'TLN Gold Token', '2026-08-22 14:13:00.85216+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, true, false),
	('bsc', '0x72dcf845ae36401e82e681b0e063d0703bac0bba', 'vUSD / VOW', '2026-08-22 13:02:51.688509+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0x8fC5E4cC4768449bc7fEb0Bf094BCdc3e4B16975', 'PancakeSwap V2 (v€/v$) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16', 'PancakeSwap V2 (WBNB/BUSD) LP', '2026-08-22 13:02:51.688509+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', NULL, '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('bsc', '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', NULL, '2026-08-22 13:02:51.688509+00', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('eth', '0x1E49768714E438E789047f48FD386686a5707db2', 'Uniswap V2 (VOW/USDT) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0xc84b40231e270b827ceb0a27b78aa3fba443cf46', 'PUGLORD', '2026-08-28 02:29:04.643494+00', NULL, 'PUG', 'PUGLORD', NULL, 18, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 3, NULL, false, false),
	('bsc', '0xc0d8daa6516bab4efce440860987e735bab44160', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, true, false),
	('bsc', '0x1C8Dd0DC515166b4349a9B8bd7dB3945445c5E52', 'v€ / VOW', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x8F1D83FEb2D65f04ce7DA4f1f476F5272821dFDf', 'PancakeSwap V2 (v£/v$) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x30812dbe89b40b5b7ac1bc9134e82ebbc0b57995', 'TLN Legacy LPT', '2026-08-29 21:54:29.539058+00', NULL, 'LPT', NULL, NULL, NULL, NULL, false, 'tln_vow', 'defi_token', 'legacy_staking_token', true, '{0x9a9e97a015ca65f48973835b45d4e28a99f89191}', NULL, NULL, 'eth', 'Historischer TLN-LPT. Ursprüngliche TLN-Liquidität lief auf Ethereum/Uniswap; LPT konnten später auf BSC gebridgt und dort im Original-LPT-Programm gestakt werden. Heute nicht mehr stakebar.', 6, NULL, false, false),
	('bsc', '0xf7d142a354322c7560250caa0e2a06c89649e4c2', 'TLN', '2026-08-23 15:51:22.256032+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('eth', '0x72bf018df20fbacf542f5ec159c6a7f0d7850967', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('eth', '0x448fa53be5b9f792d6f799428df8d4c89eb9f04a', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false),
	('bsc', '0x2182aaD4Bf07a96d347C653a126e2016Edf0eff3', 'TLN Gold / v$', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('eth', '0x1bbf25e71ec48b84d773809b4ba55b6f4be946fb', NULL, '2026-08-22 13:02:51.688509+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('eth', '0x0fc6c0465c9739d4a42daca22eb3b2cb0eb9937a', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('bsc', '0x6ea1734df1627453daa6834776cb0403abc401b1', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('bsc', '0x3745e245612f130b57589688060454a8ae43276c', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, true, false),
	('bsc', '0xf585b5b4f22816baf7629aea55b701662630397b', NULL, '2026-08-22 13:02:51.688509+00', 'tln_vow_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, true, false),
	('apertum', '0x724843c32f36813c382f7480bc8db16c4546207e', 'wAPTM/ANOUBIS LP', '2026-09-30 22:37:17.759837+00', NULL, NULL, NULL, NULL, NULL, NULL, true, 'dao1', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('apertum', '0x8d38afbd54020c15f02f7f1f848ec66e17c1004c', 'ANOUBIS', '2026-08-28 02:29:23.458235+00', NULL, 'ANOUBIS', 'ANOUBIS', NULL, 18, NULL, true, 'dao1', 'defi_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 3, NULL, false, false),
	('eth', '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', 'Uniswap V3 (WETH/USDC) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 6, NULL, false, false),
	('eth', '0x97BE09f2523B39B835Da9EA3857CfA1D3C660cBb', 'Uniswap (VOW/vUSD) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 1, NULL, false, false),
	('eth', '0x7FdEB46b3a0916630f36E886D675602b1007Fcbb', 'Uniswap (VOW/WETH) LP', '2026-08-22 14:13:00.85216+00', 'lp_token', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'lp_token', NULL, false, '{}', NULL, NULL, NULL, NULL, 4, NULL, false, false),
	('eth', '0xba7fe208e0167e4047a996e1efea830515f433f8', NULL, '2026-08-22 13:02:51.688509+00', 'v_currency', NULL, NULL, NULL, NULL, NULL, true, 'tln_vow', 'voucher_currency', NULL, false, '{}', NULL, NULL, NULL, NULL, 2, NULL, false, false)
ON CONFLICT ("chain", "address") DO UPDATE SET
    "label" = EXCLUDED."label",
    "created_at" = EXCLUDED."created_at",
    "tln_vow_category" = EXCLUDED."tln_vow_category",
    "symbol" = EXCLUDED."symbol",
    "name" = EXCLUDED."name",
    "coingecko_id" = EXCLUDED."coingecko_id",
    "decimals" = EXCLUDED."decimals",
    "price_source" = EXCLUDED."price_source",
    "enabled" = EXCLUDED."enabled",
    "defi_project_key" = EXCLUDED."defi_project_key",
    "defi_category" = EXCLUDED."defi_category",
    "staking_asset_kind" = EXCLUDED."staking_asset_kind",
    "historical_only" = EXCLUDED."historical_only",
    "staking_contract_addresses" = EXCLUDED."staking_contract_addresses",
    "valid_from_block" = EXCLUDED."valid_from_block",
    "valid_to_block" = EXCLUDED."valid_to_block",
    "origin_chain" = EXCLUDED."origin_chain",
    "historical_note" = EXCLUDED."historical_note",
    "display_decimals" = EXCLUDED."display_decimals",
    "summary_decimals" = EXCLUDED."summary_decimals",
    "dashboard_visible" = EXCLUDED."dashboard_visible",
    "is_native" = EXCLUDED."is_native";

-- project_nfts: 23 Zeilen
INSERT INTO "public"."project_nfts" ("id", "project_key", "chain_key", "nft_contract", "nft_id", "nft_name", "category", "subtype", "notes", "enabled", "created_at", "updated_at") VALUES
	(1, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 7993, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:03:32.616233+00', '2026-08-27 13:03:32.616233+00'),
	(2, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 7994, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:37.384034+00', '2026-08-27 13:08:37.384034+00'),
	(3, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 10294, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:39.308739+00', '2026-08-27 13:08:39.308739+00'),
	(4, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 10295, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:41.109639+00', '2026-08-27 13:08:41.109639+00'),
	(5, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 37174, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:42.85501+00', '2026-08-27 13:08:42.85501+00'),
	(6, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 38483, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:45.433837+00', '2026-08-27 13:08:45.433837+00'),
	(7, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 40938, 'MineBot', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:47.765235+00', '2026-08-27 13:08:47.765235+00'),
	(8, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90268, 'MineBot #90268', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:50.980325+00', '2026-08-27 13:08:50.980325+00'),
	(9, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90269, 'MineBot #90269', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:52.584949+00', '2026-08-27 13:08:52.584949+00'),
	(10, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90348, 'MineBot #90348', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:55.105826+00', '2026-08-27 13:08:55.105826+00'),
	(11, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90349, 'MineBot #90349', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:08:58.120674+00', '2026-08-27 13:08:58.120674+00'),
	(12, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90350, 'MineBot #90350', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:00.117541+00', '2026-08-27 13:09:00.117541+00'),
	(13, 'dao1', 'apertum', '0x3ae2dfc3b795267e284cbab7eff9a0cefdab401d', 31722, 'MinerBot MB1', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:03.606469+00', '2026-08-27 13:09:03.606469+00'),
	(14, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90227, 'Nebula', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:06.001932+00', '2026-08-27 13:09:06.001932+00'),
	(15, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90270, 'Nebula', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:08.296143+00', '2026-08-27 13:09:08.296143+00'),
	(16, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90289, 'Solar', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:10.048925+00', '2026-08-27 13:09:10.048925+00'),
	(17, 'dao1', 'apertum', '0xa1b761890c36e356f49f9df8d495fcffa76857ad', 90351, 'Solar', 'Bot', 'Mining-Bot', NULL, true, '2026-08-27 13:09:11.819344+00', '2026-08-27 13:09:11.819344+00'),
	(19, 'dao1', 'apertum', '0xde72695e54bb44beb1844c35cd3ea50f4f785f2d', 21043, '21043', 'Identity', 'DID', NULL, true, '2026-08-27 13:11:01.864724+00', '2026-08-27 13:11:01.864724+00'),
	(18, 'dao1', 'apertum', '0x0e1d3df5ce689df2c429216fb44caec064acbbaa', 7315, '7315', 'Membership', 'DAO / Membership', NULL, true, '2026-08-27 13:10:14.42662+00', '2026-08-27 13:10:14.42662+00'),
	(21, 'dao1', 'apertum', '0xa0f34a5da71994bd8caacc8150e05d4158ce50c8', 1321, 'Flux', 'Bot', 'Trading-Bot', NULL, true, '2026-08-27 13:28:17.97627+00', '2026-08-27 13:28:17.97627+00'),
	(22, 'dao1', 'apertum', '0xde72695e54bb44beb1844c35cd3ea50f4f785f2d', 25924, '25924', 'Identity', 'DID', NULL, true, '2026-08-27 13:28:21.614997+00', '2026-08-27 13:28:21.614997+00'),
	(23, 'dao1', 'apertum', '0xa0f34a5da71994bd8caacc8150e05d4158ce50c8', 11262, 'Spark Rapid', 'Bot', 'Trading-Bot', NULL, true, '2026-08-27 13:28:26.045864+00', '2026-08-27 13:28:26.045864+00'),
	(24, 'dao1', 'apertum', '0xde72695e54bb44beb1844c35cd3ea50f4f785f2d', 18438, '18438', 'Identity', 'DID', NULL, true, '2026-09-21 23:59:16.130107+00', '2026-09-21 23:59:16.130107+00')
ON CONFLICT ("project_key", "chain_key", "nft_contract", "nft_id") DO UPDATE SET
    "nft_name" = EXCLUDED."nft_name",
    "category" = EXCLUDED."category",
    "subtype" = EXCLUDED."subtype",
    "notes" = EXCLUDED."notes",
    "enabled" = EXCLUDED."enabled",
    "created_at" = EXCLUDED."created_at",
    "updated_at" = EXCLUDED."updated_at";

-- tax_asset_prices: 35 Zeilen
INSERT INTO "public"."tax_asset_prices" ("tax_year", "asset_code", "price_chf", "effective_date", "source_type", "source_name", "source_url", "imported_at") VALUES
	(2022, 'AVAX', 10.084990000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'BNB', 227.828140000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'BTC', 15345.739085000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'ETH', 1109.251223000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'MATIC', 0.701320000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'SOL', 9.208330000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'TRX', 0.050410000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'USDC', 0.925228000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2022, 'USDT', 0.924920000000, '2022-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'AVAX', 33.712637000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'BNB', 263.007535000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'BTC', 35541.630896000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'ETH', 1948.008419000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'MATIC', 0.819431000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'SOL', 89.191430000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'TRX', 0.089101000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'USDC', 0.841910000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'USDT', 0.842165000000, '2023-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843870/9aaec15ba3c17310bc6382bb3d9cd07e/token%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'AVAX', 33.176629000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'BNB', 644.162505000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'BTC', 85926.486363000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'ETH', 3083.556280000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'MATIC', 0.425047000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'SOL', 179.620701000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'TRX', 0.232241000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'USDC', 0.906168000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'USDT', 0.905075000000, '2024-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180452/dc9f45ed73edcbc5c677c96789a5b22f/token%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'AVAX', 9.847814000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'BNB', 681.908093000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'BTC', 69571.988489000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'ETH', 2364.081066000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'SOL', 99.191777000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'TRX', 0.224242000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'USDC', 0.791977000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'USDT', 0.791468000000, '2025-12-31', 'estv_direct', 'ESTV / ICTax · Kryptowährungen 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541169/73f4d9d3477fa63ec398022b00dea232/token%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00')
ON CONFLICT ("tax_year", "asset_code") DO UPDATE SET
    "price_chf" = EXCLUDED."price_chf",
    "effective_date" = EXCLUDED."effective_date",
    "source_type" = EXCLUDED."source_type",
    "source_name" = EXCLUDED."source_name",
    "source_url" = EXCLUDED."source_url",
    "imported_at" = EXCLUDED."imported_at";

-- tax_fx_rates: 4 Zeilen
INSERT INTO "public"."tax_fx_rates" ("tax_year", "from_currency", "to_currency", "rate", "effective_date", "source_name", "source_url", "imported_at") VALUES
	(2022, 'USD', 'CHF', 0.925228000000, '2022-12-31', 'ESTV / ICTax · Devisen – Freie Devise 31.12.2022', 'https://www.ictax.admin.ch/extern/api/download/2642581/ab7d51e8632cd6aebea5abf106f211e2/devisen%20kursliste_2022_V3%20ohne%20Fusszeile.pdf', '2026-09-28 16:17:07.743989+00'),
	(2023, 'USD', 'CHF', 0.841624000000, '2023-12-31', 'ESTV / ICTax · Devisen – Freie Devise 31.12.2023', 'https://www.ictax.admin.ch/extern/api/download/2843868/ce0b4c37eef3e2a632cae3f776a046b9/devisen%20kursliste_2023_V1.pdf', '2026-09-28 16:17:07.743989+00'),
	(2024, 'USD', 'CHF', 0.906250000000, '2024-12-31', 'ESTV / ICTax · Devisen – Freie Devise 31.12.2024', 'https://www.ictax.admin.ch/extern/api/download/3180473/51b3e99569cee58a31107a8baedd391e/devisen%20kursliste_2024.pdf', '2026-09-28 16:17:07.743989+00'),
	(2025, 'USD', 'CHF', 0.792250000000, '2025-12-31', 'ESTV / ICTax · Devisen – Freie Devise 31.12.2025', 'https://www.ictax.admin.ch/extern/api/download/3541175/9537bf2c952d842d7b4c3f5423b4a712/devisen%20kursliste_2025.pdf', '2026-09-28 16:17:07.743989+00')
ON CONFLICT ("tax_year", "from_currency", "to_currency") DO UPDATE SET
    "rate" = EXCLUDED."rate",
    "effective_date" = EXCLUDED."effective_date",
    "source_name" = EXCLUDED."source_name",
    "source_url" = EXCLUDED."source_url",
    "imported_at" = EXCLUDED."imported_at";

-- Sequenzen niemals rückwärts setzen.
SELECT pg_catalog.setval('public.defi_staking_contracts_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.defi_staking_contracts), (SELECT last_value FROM public.defi_staking_contracts_id_seq)), true);
SELECT pg_catalog.setval('public.project_nfts_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.project_nfts), (SELECT last_value FROM public.project_nfts_id_seq)), true);

COMMIT;
