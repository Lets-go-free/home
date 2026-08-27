# Wallet Tracking – aktueller Stand

Version: 27.08.2026 15:37:17 CEST · Phase 2g · Build 20260827-153717

## Verzeichnisstruktur

- `/wallet-tracking.html`
  - Weiterleitung auf `/wallet-tracking/`
- `/wallet-tracking/index.html`
  - Hauptseite
- `/wallet-tracking/css/wallet-tracking.css`
  - gemeinsames Layout
- `/wallet-tracking/js/app.js`
  - zentrale Wallet-Tracking-Logik
- `/wallet-tracking/projects/tln-vow/tln-vow.js`
  - TLN/VOW-Projektmodul
- `/wallet-tracking/projects/dao1/dao1.js`
  - DAO1/Apertum-Projektmodul
- `/wallet-tracking/sql/`
  - Supabase-Migrationen

## Neu in Phase 2g

### DAO1 NFT-Klassifizierung
- Gehört jetzt in den Bereich **DAO1 Projekt-Konfiguration**.
- Ist als auf-/zuklappbare Tabelle umgesetzt.
- **Default: zugeklappt**.
- Klassifizierung bleibt projektweit an der NFT hängen und bleibt bei Wallet-Transfers bestehen.
- Historische NFT-Namen werden bevorzugt aus `project_nfts` bzw. nachgeladenen NFT-Metadaten übernommen.

### DAO1 Mining-Auswertung
- Zeile **NFT-Bestand / Besitzerhistorie aktualisieren** steht jetzt vor den Wallet-/NFT-Filtern.
- Auswahlfolge:
  1. Wallet
  2. Klassifizierung, z. B. `Mining-Bot`
  3. NFT
- Im NFT-Feld gibt es neu **Alle (N)**.
- Bei `Alle` wird die Wallet-Transaktionshistorie nur **einmal** geladen.
- Danach werden alle passenden `claimReward()`-Calls nach NFT-ID gruppiert und sequenziell ausgewertet.
- Ergebnis enthält Gesamtsummen und eine aufklappbare Aufschlüsselung je NFT.

### Inkrementeller Claim-Scan
- Erster Scan: vollständige Wallet-Historie.
- Folge-Scan: nur ab dem letzten gespeicherten Block minus **250 Block Puffer**.
- Bereits bekannte Claims werden per Upsert über Tx-Hash aktualisiert, nicht verdoppelt.
- Scanstand wird in `project_scan_state` gespeichert.
- Claims werden dauerhaft in `project_nft_claims` gespeichert.
- Historische APTM-Preise verwenden weiterhin den gemeinsamen `aptm_price_history`-Cache.

## Supabase SQL – aktueller Migrationsstand

Die Migrationen werden nummeriert und **nur einmal** ausgeführt.

### 001-dao1-apertum.sql
Frühere Migration.  
**Nicht erneut ausführen, wenn bereits erfolgreich ausgeführt.**

### 002-dao1-miner-ownership.sql
Frühere Migration.  
**Nicht erneut ausführen, wenn bereits erfolgreich ausgeführt.**

### 003-dao1-miner-nft-name.sql
Frühere Migration.  
**Nicht erneut ausführen, wenn bereits erfolgreich ausgeführt.**

### 004-project-nft-classification.sql
Frühere Migration für `project_nfts` + `project_nft_ownership`.  
**Nicht erneut ausführen, wenn bereits erfolgreich ausgeführt.**

### 005-dao1-claim-cache.sql
**NEU IN PHASE 2g – einmal ausführen.**

Erstellt:
- `project_scan_state`
- `project_nft_claims`

Wenn 001–004 bereits ausgeführt wurden, ist für diese Version **nur 005 neu auszuführen**.

## Betriebsregel für SQL

Eine bereits erfolgreich ausgeführte nummerierte Migration **nicht nochmals ausführen**, außer dies wird ausdrücklich verlangt.

## Nach Upload / Migration testen

1. Login
2. Wallet Summary
3. Snapshots
4. NFT-Tab Apertum
5. DAO1-Tab öffnen
6. DAO1 Projekt-Konfiguration → Klassifizierung aufklappen
7. Mining-Bot-Klassifizierungen prüfen
8. Mining-Bereich: Wallet wählen
9. `Mining-Bot` wählen
10. NFT `Alle` wählen
11. Mining-Auswertung starten
12. Zweiten Scan starten und prüfen, dass Status `inkrementell ab Block ...` meldet
13. TLN/VOW kurz gegenprüfen
