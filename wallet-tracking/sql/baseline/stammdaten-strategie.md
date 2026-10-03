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

Verifizierte Seed-Reihenfolge ab Phase 7.19:

1. `chains`
2. `defi_projects`
3. `defi_project_tokens`
4. `defi_staking_contracts`
5. `dex_configs`
6. `predefined_tokens`
7. `project_nfts`
8. `tax_asset_prices`
9. `tax_fx_rates`

Abhängigkeiten/FKs sind vor dem finalen Seed-Export gegen den verifizierten Schema-Stand zu prüfen.

## Pflege

- Änderungen an globalen Stammdaten müssen künftig entweder über eine dauerhafte Migration oder über eine aktualisierte Seed-Datei nachvollziehbar sein.
- Seeds ersetzen keine Migrationen für Schemaänderungen.
- Produktive Datenänderungen werden nicht automatisch durch einen Seed-Export ins Repo übernommen; jeder Seed-Update wird geprüft.

## Export-Workflow ab Phase 7.18 / finaler Seed ab Phase 7.19

Der read-only Helper `_wt-db-seed-export.command` liefert einen kontrollierten Rohdump nur aus der oben definierten Allowlist. Der am 04.10.2026 geprüfte Export wurde in Phase 7.19 erstmals in den finalen Seed `sql/baseline/seeds/001-global-master-data.sql` überführt.

Wichtig:

- Vor jedem Datenexport wird das aktuelle Live-Schema neu gelesen. Dadurch werden auch später neu hinzugekommene Tabellen standardmäßig ausgeschlossen.
- Alle nicht erlaubten `public`-Tabellen werden explizit vom Data-Dump ausgeschlossen.
- Nach dem Dump wird geprüft, welche Tabellen tatsächlich in `INSERT INTO`/`COPY` vorkommen. Bei einem Treffer außerhalb der Allowlist wird der Rohdump gelöscht und der Vorgang abgebrochen.
- Nach Review wird der Rohdump in deterministische `INSERT ... ON CONFLICT DO UPDATE`-Seeds mit stabilen Schlüsseln umgewandelt. Der aktuelle verifizierte Seed umfasst neun globale Tabellen und ist idempotent.
- Der Exporthelper führt keine Schreiboperation an der produktiven DB aus.
