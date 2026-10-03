# WalletTracking · Stammdaten-Strategie

## Ziel

Eine frische Datenbank soll nicht nur strukturell, sondern auch fachlich startfähig sein. Dafür werden ausschließlich globale, nicht userbezogene Stammdaten reproduzierbar gehalten.

## Seed-Allowlist

Als globale Stammdaten vorgesehen sind aktuell:

- `chains`
- `predefined_tokens`
- `defi_projects`
- `defi_project_tokens`
- `defi_staking_contracts`
- `dex_configs`
- `project_nfts`
- `tax_asset_prices`
- `tax_fx_rates`

Vor jedem Export ist zu prüfen, ob eine Tabelle inzwischen personenbezogene oder installationsspezifische Inhalte enthält. Nur freigegebene Tabellen dürfen als Seed ins Repo.

## Explizit nicht als Seed exportieren

Nicht ins Repository gehören insbesondere:

- `admins`
- `safe_tokens`
- `chat_messages`
- `snapshots` / `snapshot_items`
- Discovery-/Wallet-/Fee-/NFT-/LP-Caches mit Userbezug
- `user_*` Tabellen
- Walletadressen, Partnernamen/Aliase oder andere userbezogene Daten
- technische Laufzeit-Caches und Jobzustände, sofern sie aus On-Chain-/Backenddaten neu aufgebaut werden können

## Format

Stammdaten sollen künftig als deterministische SQL-Seeds unter `sql/baseline/seeds/` liegen. Bevorzugt werden explizite `INSERT ... ON CONFLICT DO UPDATE`-Statements mit stabilen fachlichen Schlüsseln, nicht rohe Dumps mit zufälliger Reihenfolge.

Für Tabellen mit UUID-Primärschlüsseln ist zu prüfen, ob die UUID fachlich referenziert wird. Falls nicht, sollen Seeds über natürliche/fachliche Unique Keys idempotent bleiben.

## Reihenfolge

Empfohlene Seed-Reihenfolge:

1. `chains`
2. `defi_projects`
3. `dex_configs`
4. `predefined_tokens`
5. `defi_project_tokens`
6. `defi_staking_contracts`
7. `project_nfts`
8. `tax_fx_rates`
9. `tax_asset_prices`

Abhängigkeiten/FKs sind vor dem finalen Seed-Export gegen den verifizierten Schema-Stand zu prüfen.

## Pflege

- Änderungen an globalen Stammdaten müssen künftig entweder über eine dauerhafte Migration oder über eine aktualisierte Seed-Datei nachvollziehbar sein.
- Seeds ersetzen keine Migrationen für Schemaänderungen.
- Produktive Datenänderungen werden nicht automatisch durch einen Seed-Export ins Repo übernommen; jeder Seed-Update wird geprüft.
