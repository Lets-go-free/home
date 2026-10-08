# WalletTracking 7.40 · 05.10.2026 19:23:08 CEST

## Installation
Nur mitgelieferte Dateien ersetzen/veröffentlichen und Seite neu laden. Keine SQL-Migration und kein Edge-Deployment. Danach den üblichen Daten-/NFT-Aktualisierungslauf ausführen; Resolver v5 ergänzt betroffene Upgrade-Nachweise gezielt. Kein neuer Wallet-Vollscan.

## Erwerbsdatum unabhängig vom Preis
Alte NFT-Mint-/Transferhistorie liefert Datum/Tx/Block auch ohne Kaufpreis. Neuer Miner speichert dies als originalAcquisition im vorhandenen privaten NFT-Nachweis. Bestätigter Kauf behält Kaufdatum/-Tx; preisloser Mint wird als ursprünglicher Erwerb gezeigt. Ist nur eine spätere Teilhistorie belegt, steht „Frühester belegter Erwerb“. Geschenk/Kostenfreiheit werden nicht aus fehlenden Zahlungen abgeleitet. Upgrade-Datum/-Tx bleiben separat.

## Offener Historienfehler
apertum-nft-history HTTP 500 im User-Screenshot kann die Ergänzung blockieren. Vorhandene Nachweise bleiben erhalten; fehlgeschlagene Original-Historie wird als „Historie nicht verfügbar“ bezeichnet. Edge-Response/-Logs und Edge-Quellcode werden zur Ursachenklärung benötigt. Dieses Update behebt keinen unbekannten serverseitigen Fehler.

## Prüfung
Lokale Regressionstests für Preis-/Datumstrennung, Mint/Transfer, Tx-Zeitstempel, Teilhistorie, Contract-/Blockgrenzen, Cacheversion und vorhandene Upgrade-Kaufpreise bestanden. Produktiver Test/Response-Diagnose noch offen. Backup-/Restore-Logik unverändert; Restore-Test zurückgestellt.
