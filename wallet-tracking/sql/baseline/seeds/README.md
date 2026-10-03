# WalletTracking Stammdaten-Seeds

Phase 7.19 führt den ersten verifizierten, reproduzierbaren Stammdaten-Seed ein.

## Enthalten

`001-global-master-data.sql` enthält ausschließlich globale, nicht benutzerspezifische Stammdaten aus dem read-only Live-Export vom 04.10.2026 00:30 CEST:

- `chains` (12)
- `defi_projects` (3)
- `defi_project_tokens` (3)
- `defi_staking_contracts` (14)
- `dex_configs` (3)
- `predefined_tokens` (80)
- `project_nfts` (23)
- `tax_asset_prices` (35)
- `tax_fx_rates` (4)

Nicht enthalten sind Wallets, Userdaten, Snapshots, Discovery-Ergebnisse, private Aliase, Jobs oder Cache-Daten.

## Eigenschaften

- idempotent über natürliche Primary-/Unique-Keys (`ON CONFLICT DO UPDATE`)
- Foreign-Key-sichere Reihenfolge
- explizite IDs aus dem verifizierten Live-Stand bleiben bei einer frischen DB erhalten
- Sequenzen werden nach dem Seed nur vorwärts bzw. auf mindestens `MAX(id)` gesetzt, niemals rückwärts
- der Seed ist für eine leere bzw. bereits kompatible Baseline-DB gedacht

## Prüfnachweis

SHA-256 Rohdump: `040bcbc9b2af12eefeefbec768feaf51f32587b06d5980e45990b28fa3d62387`  
SHA-256 finaler Seed: `d802c7286f0702ba1173d3fef6351b53019afd4e89e21bec5ecb9c7c4acc5a9d`

Der Rohdump selbst wird nicht als produktiver Seed verwendet.
