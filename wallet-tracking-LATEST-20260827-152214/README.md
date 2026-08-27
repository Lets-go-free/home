# Wallet Tracking – aktueller Stand

Version: 27.08.2026 15:22:14 CEST · Phase 2f · Build 20260827-152214

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

## Neu in Phase 2f

- Apertum-NFT-Scan verwendet jetzt primär Blockscout `/addresses/{wallet}/nft` (aktuell gehaltene NFTs).
- `/nft/collections` bleibt als ergänzende Quelle; Ergebnisse werden per Contract + Token-ID zusammengeführt.
- Ziel: NFTs, die DAO1 als aktuell gehalten erkennt, auch im normalen NFT-Tab vollständig anzeigen.
- Im NFT-Tab kann ein Provider-Spamverdacht jetzt manuell mit `Spam-Verdacht ignorieren` übersteuert werden.
- Diese Ausnahme wird im bestehenden `nft_cache` gespeichert und bleibt auch nach einer NFT-Aktualisierung erhalten.
- Die Ausnahme kann mit `Spam-Verdacht wieder beachten` rückgängig gemacht werden.
- Keine neue Supabase-Migration in Phase 2f.

## Neu in Phase 2e

- DAO1 NFT-Klassifizierung: Spaltenreihenfolge jetzt `NFT | Klassifizierung | Contract`.
- Contract-Spalte kompakter; lange Adressen brechen innerhalb der Spalte um.
- Keine neue Supabase-Migration für Phase 2e.

## Neu in Phase 2d

DAO1/Apertum-NFTs können jetzt projektweit klassifiziert werden.

Vorgesehene Klassifizierungen:
- Mining-Bot
- Trading-Bot
- DID
- DAO / Membership
- Sonstige

Die Klassifizierung gehört zur NFT selbst und bleibt daher erhalten, wenn die NFT später zu einer anderen Wallet übertragen wird.

Für die APTM-Claim-Auswertung gilt:
1. DAO1/Apertum-Wallet wählen.
2. Klassifizierung wählen – Standard ist `Mining-Bot`.
3. Passende NFT wählen.
4. Mining-Auswertung laden.

Die NFT-Besitzhistorie ist jetzt generisch in `project_nft_ownership` abgelegt. Frühere Daten aus `project_miner_ownership` werden durch Migration 004 übernommen.

## Supabase SQL – sehr wichtig

Die SQL-Dateien sind absichtlich nummeriert und werden **in dieser Reihenfolge** ausgeführt.

### 001-dao1-apertum.sql
Frühere Migration.

Erstellt u. a.:
- DAO1-Grundkonfiguration
- `aptm_price_history`
- `project_miners`

**Nicht erneut ausführen, wenn sie in deinem Supabase bereits erfolgreich ausgeführt wurde.**

### 002-dao1-miner-ownership.sql
Frühere Migration.

Erstellt:
- `project_miner_ownership`

**Nicht erneut ausführen, wenn sie bereits erfolgreich ausgeführt wurde.**

### 003-dao1-miner-nft-name.sql
Frühere Migration.

Ergänzt NFT-Namen in den bisherigen Miner-/Ownership-Tabellen.

**Nicht erneut ausführen, wenn sie bereits erfolgreich ausgeführt wurde.**

### 004-project-nft-classification.sql
**NEU IN DIESER VERSION – einmal ausführen.**

Erstellt:
- `project_nfts`
- `project_nft_ownership`

Außerdem:
- übernimmt vorhandene historische Besitzdaten aus `project_miner_ownership`
- lässt die alten Tabellen vorerst bestehen, damit ein Rollback möglich bleibt

Wenn 001–003 bereits ausgeführt wurden, ist für diese Version **nur 004 neu auszuführen**.

## Wichtiger Hinweis zu mehrfacher Ausführung

Die Migrationen sind weitgehend defensiv mit `if not exists` / `drop policy if exists` aufgebaut. Trotzdem gilt als Betriebsregel:

**Eine bereits erfolgreich ausgeführte nummerierte Migration nicht erneut ausführen, außer dies wird ausdrücklich verlangt.**

Damit bleibt eindeutig nachvollziehbar, auf welchem Schema-Stand Supabase ist.

## Nach dem Upload testen

1. Login
2. Wallet Summary
3. Snapshots
4. NFT-Tab → Apertum-Wallet aktualisieren
5. DAO1-Tab sichtbar
6. DAO1-Wallet wählen
7. NFT-Klassifizierung als Admin setzen
8. Filter `Mining-Bot` testen
9. NFT wählen
10. APTM-Claim-Auswertung laden
11. TLN/VOW-Tab kurz gegenprüfen

