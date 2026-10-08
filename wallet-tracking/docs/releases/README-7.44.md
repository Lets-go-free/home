# WalletTracking 7.44 · 08.10.2026 01:11:21 CEST

## Installation
Gelieferte Frontend-Dateien ersetzen/veröffentlichen und Seite neu laden. Kein Edge-Deployment und keine neue SQL-Migration für dieses Update.

## Korrektur
Erwerbs-/Mint-TX wird unter NFT beim Ersterwerb und bei Bots im DAO-Baum direkt beim Datum verlinkt, auch ohne Kaufpreis. Ein davon abweichender Wallet-Eingang erscheint unter „In diesem Wallet seit“ als Wallet-Transfer-TX. Identische TX werden dort nicht doppelt angezeigt; fehlende TX-Hashes werden nicht ergänzt oder geraten.

Die bisherige NFT-Ausgabe prüfte CHAIN_META.explorer, das in der DB-basierten Chain-Konfiguration gar nicht gesetzt wird. EVM-TX-Links verwenden nun CHAIN_CONFIG.explorerUrlTemplate (/address/{address} → /tx/<hash>). Im DAO-Baum und in der Bot-Übersicht wird acquisition_tx_hash beim Erwerbsdatum angezeigt. Die Wallet-Transfer-TX stammt ausschließlich aus entry_tx_hash der angezeigten aktuellen Wallet-Besitzperiode; sie wird nicht aus der Erwerbs-/Kauf-TX abgeleitet. Datenquellen, Caches und Ladejobs bleiben gleich; die Darstellung löst keine neuen Abfragen aus.

## Prüfung
Lokale Regression: Erwerb und späterer Wallet-Transfer, gleicher Hash ohne Doppelanzeige, früherer Erwerb aus globalem Cache, fehlende Hashes/Explorer-Konfiguration sowie DAO-Bots ohne Kaufpreis. Bestehende Regressionen und JS-Syntax geprüft. Produktiver Retest: NFT mit Walletwechsel muss zwei unterschiedliche Links zeigen; NFT ohne Wechsel nur den Erwerbslink. Michaela-Bots im DID-Detail und der Bot-Übersicht müssen den Erwerbslink auch bei offenem Preis zeigen, sofern ein Hash belegt ist.

## Stand
Metadaten-404 aus 7.43 produktiv bestätigt: found:false/status:404; Netzwerkfehler verschwunden. Extern fehlende Metadaten für #120469 und Kaufpreisprüfung bleiben separate offene Punkte. Restore-Test weiterhin zurückgestellt.
