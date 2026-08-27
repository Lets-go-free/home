# Wallet Tracking – aktueller Stand

Version: 27.08.2026 15:56:47 CEST · Phase 2i · Build 20260827-155647

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

## Neu in Phase 2i

- Historische APTM-Preisermittlung blockiert den Claim-Scan nicht mehr.
- Der frühere große `eth_getLogs`-Abruf über den gesamten Claim-Zeitraum wurde entfernt.
- Vorhandene Werte aus `aptm_price_history` werden zuerst verwendet.
- Nur tatsächlich noch nicht abgedeckte Claim-Blöcke lösen neue Pool-Sync-Abfragen aus.
- Pool-Syncs werden in maximal 10.000-Block-Bereiche geteilt.
- Bei Timeout wird ein Bereich automatisch rekursiv weiter verkleinert.
- Selbst ein nicht abrufbarer kleiner Preisbereich bricht die Mining-Auswertung nicht ab.
- Claims werden gespeichert, auch wenn der historische USD-Kurs vorübergehend fehlt.
- Fehlende USD-Kurse werden bei späteren Scans automatisch erneut ergänzt.
- Ein Fehler beim Laden der Logs einer einzelnen Claim-Transaktion überspringt nur diese Transaktion und nicht mehr den gesamten Wallet-Scan.
- Keine neue Supabase-Migration in Phase 2i. `005-dao1-claim-cache.sql` bleibt die aktuelle Migration.

## Neu in Phase 2h

- Button `Mining-Auswertung starten` wird während des gesamten Scans deaktiviert.
- Während des Scans lautet der Button `Mining-Auswertung läuft…`.
- Nach Erfolg oder Fehler wird er automatisch wieder aktiviert.
- Explorer- und RPC-Abfragen haben Retry + 30-Sekunden-Timeout.
- `Failed to fetch` wird jetzt mit der betroffenen Quelle angezeigt, z. B. Wallet-Transaktionen, Tx-Logs oder Apertum-RPC.
- Für den RPC wird zusätzlich eine in `public.chains` konfigurierte Apertum-RPC-URL verwendet, sofern vorhanden.
- Ein Netzwerkfehler löscht keine bereits gespeicherten Claim-/Preis-Daten.
- Keine neue Supabase-Migration in Phase 2h. `005-dao1-claim-cache.sql` bleibt die zuletzt neue Migration.

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
