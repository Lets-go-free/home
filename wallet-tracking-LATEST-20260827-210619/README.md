# Wallet Tracking – aktueller Stand

Version: 27.08.2026 21:06:19 CEST · Phase 2aa · Build 20260827-210619

## Architektur DAO1 / Apertum

`Apertum Wallet → project_transactions → Claim-Erkennung → project_nft_claims → Auswertung / Exporte`

Die Transaktionshistorie ist die zentrale Datenbasis. Wallet-Wechsel und Filter lesen ausschließlich Supabase-Daten. Blockchain-Zugriffe erfolgen nur nach explizitem Klick auf **Apertum-Historie aktualisieren** bzw. beim Mining-Scan, der dieselbe zentrale Historie nutzt.

## Neu in Phase 2aa – EVM Archive-Fallback + Solana

- Basis: letzter ausgelieferter Build `20260827-185558`; bestehende Supabase-/DAO1-Strukturen bleiben erhalten.
- `public.chains.archive_rpc_url` und `archive_rpc_provider` werden jetzt tatsächlich aus Supabase geladen und sind im Admin-Chainbereich sichtbar.
- Bestandesaufnahme EVM: kostenlose Routescan-Abfrage zuerst; bei nicht unterstützter Chain/Fehler automatisch Alchemy Archive.
- Historische Native-Balance: `eth_getBalance` am Stichtagsblock.
- Historische ERC-20/BEP-20-Balance: `balanceOf()` via `eth_call` am Stichtagsblock.
- Alchemy-Archive-Calls sind zentral serialisiert (mindestens ca. 220 ms Abstand) und haben Retry/Backoff bei 429/5xx.
- BSC, Polygon, Arbitrum und Base fallen dadurch nicht mehr allein wegen `Routescan: chain not supported` aus.
- Solana PublicNode wird im Browser übersprungen; kostenloser offizieller Solana Mainnet RPC zuerst, Alchemy erst als Fallback.
- Normales Solana-Wallet-Laden und Bestandesaufnahme verwenden dieselbe zentrale Provider-Kette.
- Native SOL bleibt die derzeitige historische Solana-Abdeckung; vollständige historische SPL/Token-2022-Abdeckung folgt separat.
- Neue einmalige Migration: `sql/011-history-rpc-alchemy.sql`.

## Neu in Phase 2y – manuelle historische APTM-Kurse

- Die bisherige Browser-Alertbox für Transaktionen ohne historischen Kurs wurde durch eine echte Tabelle ersetzt.
- Angezeigt werden Datum, Wallet, Block, Tx-Link, NFT, geclaimte APTM bzw. Gas-APTM, manueller APTM/USD-Kurs und daraus resultierender USD-Wert.
- Fehlende historische Kurse können einzeln manuell ergänzt werden.
- Manuelle Kurse werden mit `price_is_manual = true` und einer `price_source = Manuell ...` gespeichert.
- Automatische Preis-Backfills überschreiben manuell gesetzte Werte nicht.
- Excel weist mit der Spalte `Kurs manuell` ausdrücklich aus, welche Bewertungen manuell ergänzt wurden.
- `010-apertum-manual-price.sql` einmal ausführen.

## Neu in Phase 2x – Bestandesaufnahme / Browser-Fehler

- Der sichtbare Bereich **„Steuer-Stichtag“** wurde aus rechtlichen/kommunikativen Gründen in **„Bestandesaufnahme per 31.12“** umbenannt.
- Sichtbare Export-/Berichtstitel verwenden ebenfalls nicht mehr das Wort „Steuer“.
- XRP verwendet `https://s2.ripple.com/` statt Port `51234`, damit Browser-CORS nicht bereits am Preflight scheitert.
- Solana PublicNode wird für diesen Browser-Report nicht mehr mehrfach aufgerufen, wenn der Endpoint HTTP 403 liefert. Die Chain wird einmal sauber als **fehlgeschlagen / nicht berücksichtigt** im Coverage-Summary ausgewiesen.
- Ein anderer browserfähiger Solana-RPC kann weiterhin zentral über `public.chains` konfiguriert werden.
- Die Routescan-`proxy eth_call`-Abfrage für Token-Decimalseiten wurde entfernt; sie verursachte auf einzelnen Chains HTTP 500. Decimals kommen jetzt aus den vorhandenen Token-/Snapshot-Metadaten, mit ERC-20-Default 18 nur wenn Metadaten wirklich fehlen.
- Ein eingebettetes Favicon verhindert den unnötigen `/favicon.ico`-404.
- Browser-Meldungen `A listener indicated an asynchronous response...` stammen typischerweise aus einer Browser-Erweiterung und nicht aus dem Wallet-Tracking-Code.

## Neu in Phase 2w – APTM/USDT Fallback für historische Claims/Gas

- Primäre historische Preisquelle bleibt **APTM/wUSDT on-chain** über den letzten Pool-Sync am/vor dem Transaktionsblock.
- Gibt es zu diesem Zeitpunkt noch keinen belastbaren APTM/wUSDT-Poolpreis, wird für genau diesen Tag **APTM/USDT Marktpreis** als Fallback verwendet.
- Der Fallback kommt aus der CoinGecko-Tageshistorie für Apertum/APTM und wird ausdrücklich als Fallback-Quelle gespeichert.
- Der Fallback gilt sowohl für:
  - Claim-/THX-USD-Werte
  - Gas-USD-Werte
  - bereits gespeicherte historische Transaktionen ohne Kurs
- Keine Verwendung des aktuellen Kurses.
- Anzeige, Excel und PDF zeigen die tatsächlich verwendete Preisquelle.
- `009-apertum-price-source.sql` ist neu und einmal auszuführen.

## Neu in Phase 2v – Steuerbericht Coverage + PublicNode entfernt

- Historische EVM-Stichtagsbestände verwenden **Routescan Historical Balance** (`balancehistory` / `tokenbalancehistory`) statt PublicNode-Archive-State.
- Dadurch wird der Fehler `Archive requests require a personal token` im Steuerbericht nicht mehr durch historische EVM-Balanceabfragen ausgelöst.
- EVM-Stichtagsblock wird ebenfalls über Routescan `getblocknobytime` bestimmt.
- Automatisch enthalten sind damit alle in `public.chains` konfigurierten EVM-Chains, u. a. Ethereum, BSC, Polygon, Arbitrum, Base, Avalanche und Apertum, soweit Routescan die Chain unterstützt.
- Bitcoin nativ: exakter Bestand durch vollständige bestätigte Blockstream-Transaktionshistorie bis zum Stichtag.
- XRP nativ: ledgergenau über Ripple Full-History-Server `s2.ripple.com`.
- Solana nativ: heutige finalisierte Balance wird deterministisch über alle SOL-Balance-Deltas nach dem Stichtag zurückgerechnet. SPL-Token werden noch nicht geschätzt und deshalb als Teilabdeckung ausgewiesen.
- Historische Preise: CoinGecko-History für Assets mit CoinGecko-ID; APTM bevorzugt weiterhin eigener historischer APTM/USDT-Poolcache.
- Das Summary enthält neu ausdrücklich **Chains berücksichtigt** und **Chains teilweise**.
- Darunter steht eine eigene Chain-Coverage-Tabelle mit Status, Methode und Fehlern.
- Excel und PDF enthalten dieselbe Coverage-Tabelle.
- Keine neue SQL-Migration erforderlich.

## Neu in Phase 2v – Steuerbericht ohne Archive-RPC

- Der Steuer-Stichtag verwendet für **alle EVM-Chains** jetzt Routescan:
  - `getblocknobytime` für den exakten letzten Block vor dem Stichtag
  - `balancehistory` für native Coins
  - `tokenbalancehistory` für ERC-20/BEP-20-Bestände
- Dadurch benötigt der Steuerbericht **keinen PublicNode-Archive-State mehr** und der Fehler `Archive requests require a personal token` entfällt aus der Steuerlogik.
- Priorisierte EVM-Chains werden automatisch aus `public.chains` verarbeitet: Apertum, Ethereum, BSC, Polygon, Arbitrum, Base, Avalanche und weitere konfigurierte EVM-Chains.
- Bitcoin: exakter BTC-Bestand wird aus der vollständigen bestätigten Blockstream-Transaktionshistorie bis zum Stichtag rekonstruiert.
- XRP: nativer XRP-Bestand wird am historischen Ledger über einen öffentlichen Full-History-XRPL-Server gelesen.
- Solana: nativer SOL-Bestand wird aus der finalisierten Transaktionshistorie auf den Stichtag zurückgerechnet. SPL-Token sind im Steuerbericht noch als **teilweise** markiert, solange ihre historische Balance nicht exakt rekonstruiert ist.
- Der fehlerhafte PublicNode-Personal-Token wird nicht mehr an Solana-RPC-URLs angehängt; dadurch entfällt der beobachtete Solana HTTP-403 beim normalen Wallet-Laden.
- Historische Preise:
  - APTM weiterhin über den APTM/USDT-On-Chain-Pool.
  - Native Coins und vordefinierte Token mit `coingecko_id` über CoinGecko Historical Data.
  - Fehlt eine verlässliche historische Preis-ID, bleibt der Preis leer; keine Schätzung.
- Das Steuer-Summary nennt jetzt ausdrücklich:
  - vollständig berücksichtigte Chains
  - teilweise berücksichtigte Chains
  - nicht berücksichtigte/fehlgeschlagene Chains
- Die vollständige Chain-Coverage wird auch in Excel und PDF mit exportiert.
- Keine neue SQL-Migration in Phase 2v.

## Neu in Phase 2v – Steuerbericht Chain-Coverage + Preise

- Der Steuerbericht verwendet für **EVM-Stichtagsbestände keinen Archive-PublicNode mehr**, sondern Routescan `getblocknobytime`, `balancehistory` und `tokenbalancehistory`.
- Damit kann die PublicNode-Meldung `Archive requests require a personal token` aus dem Steuerlauf nicht mehr durch historische EVM-Balance-Abfragen entstehen.
- Alle in `public.chains` als `wallet_type = evm` konfigurierten Chains werden berücksichtigt, u. a. Ethereum, BSC, Polygon, Arbitrum, Base, Avalanche und Apertum, sofern eine passende Wallet-Adresse vorhanden ist.
- Bitcoin wird exakt aus der vollständigen bestätigten Blockstream-Transaktionshistorie bis zum Stichtag rekonstruiert.
- XRP nutzt einen historischen XRPL-Ledger und `account_info`.
- Solana Native SOL wird aus der finalisierten heutigen Balance und sämtlichen SOL-Balance-Deltas nach dem Stichtag exakt zurückgerechnet. Historische SPL-Token sind noch offen; Solana wird deshalb im Coverage-Report als **teilweise** markiert.
- Das Summary zeigt ausdrücklich:
  - vollständig berücksichtigte Chains,
  - teilweise berücksichtigte Chains,
  - nicht berücksichtigte/fehlgeschlagene Chains.
- Historische native Preise kommen bevorzugt aus der in `public.chains.coingecko_id` hinterlegten CoinGecko-ID. Zusätzlich existiert ein sicherer Standard-Fallback für ETH/BNB/POL/AVAX/BTC/XRP/SOL.
- APTM bleibt beim eigenen historischen APTM/USDT-Poolpreis.
- CoinGecko-History-Abfragen haben Retry bei Rate Limits.
- Routescan Keyless wird auf ca. 2 Requests/Sekunde gedrosselt, passend zum Free-Limit.
- `008-tax-native-price-ids.sql` ergänzt fehlende native CoinGecko-IDs, ohne vorhandene Werte zu überschreiben.

### Wichtig zur Preis-Coverage
Für ERC-20/BEP-20-Token wird ein historischer USD-Kurs nur dann angesetzt, wenn für diesen Token in `predefined_tokens.coingecko_id` eine eindeutige CoinGecko-ID vorhanden ist. Es wird kein heutiger Kurs und keine Symbol-Schätzung verwendet.

## Neu in Phase 2u – Kursreparatur + Archive-RPC

### Apertum historische Kurse
- Fehlende APTM/USD-Werte werden nach dem normalen Kurs-Scan gezielt pro betroffenem Block repariert.
- Die Suche läuft rückwärts in zunehmend grösseren Fenstern, bis ein echter APTM/USDT-Pool-Sync vor der Transaktion gefunden wird.
- Es wird weiterhin **kein aktueller Kurs und keine Schätzung** verwendet.
- Offene Claim-/Gas-Kurse sind im Summary anklickbar; angezeigt werden Datum, Block und Tx-Hash der Problemfälle.

### Steuer-Stichtag
- Der Steuer-RPC verwendet jetzt dieselbe zentrale `configuredRpcUrl()`-Logik wie das übrige Wallet-Tracking.
- Dadurch wird ein vorhandener PublicNode/Allnodes-Personal-Token auch bei historischen Steuer-Abfragen korrekt verwendet.
- Optional kann `public.chains.archive_rpc_url` als bevorzugter Archive-RPC konfiguriert werden.
- Archive-Fehler werden pro Chain nur einmal erkannt; danach wird die Chain sauber als nicht verifizierbar ausgewiesen statt denselben Fehler für jedes Wallet/Token zu wiederholen.
- Keine Bestände werden geschätzt.

## Neu in Phase 2t – historische USD-Werte für Claims und Gas

- **Geclaimt** zeigt den USD-Gesamtwert auf Basis des historischen APTM/USD-Poolpreises zum jeweiligen Claim-Block.
- **Gas** zeigt zusätzlich den historischen USD-Gesamtwert zum jeweiligen Transaktionsblock.
- Beim Klick auf **Apertum-Historie aktualisieren** werden fehlende historische APTM/USD- und Gas-USD-Werte für bereits gespeicherte Transaktionen nachgezogen.
- Bereits vorhandene Werte bleiben gespeichert; Folgeaufrufe ergänzen nur noch fehlende Bewertungen.
- Die Detailliste zeigt zusätzlich **Gas USD historisch**.
- Excel enthielt `Gas USD` bereits; PDF/Druck enthält diesen Wert nun ebenfalls explizit.
- Fehlen historische Poolpreise für einzelne Transaktionen, wird die Anzahl im Summary/Status ausgewiesen statt ein Wert geschätzt.

## Neu in Phase 2s – Steuer-Stichtag

- Neuer Tab **🧾 Steuer-Stichtag**.
- Priorität: **Apertum + alle in `public.chains` als EVM konfigurierten Chains mit `rpc_url`**.
- Keine Moralis-/Alchemy-Abfrage für den Stichtagsbestand.
- Stichtag wird auf den letzten Block vor `23:59:59` in der gewählten Zeitzone aufgelöst.
- Native Coins: exakter `eth_getBalance` am historischen Block.
- ERC-20/BEP-20: exakter `balanceOf()` via `eth_call` am historischen Block.
- Token-Universum: vordefinierte sichere Token + eigene sichere Token + historisch in Snapshots bekannte Token.
- Wenn ein RPC keinen Archive-State liefert, wird **nicht geschätzt**; die Position erscheint als `nicht verifizierbar`.
- Apertum/APTM: historischer Preis wird aus dem vorhandenen `aptm_price_history`-Poolcache genommen, sofern dort ein Preis bis zum Stichtagsblock vorhanden ist.
- Für andere EVM-Assets ist die historische Preisquelle in dieser ersten Phase bewusst noch nicht pauschal angenommen; Bestand kann verifiziert sein, Preis bleibt dann leer.
- Excel- und PDF-/Druckexport enthalten Wallet, Chain, Bestand, Stichtagsblock, Bestandsquelle, Preisquelle und Verifikationsstatus.
- Keine neue Supabase-Migration in Phase 2s.

### Qualitätsregel
Ein Steuerbestand wird niemals aus dem nächstgelegenen Snapshot geschätzt. Snapshots dienen nur dazu, historisch relevante Token-Contracts in das Prüf-Universum aufzunehmen. Der eigentliche Bestand wird immer am historischen Blockchain-State verifiziert.

## Neu in Phase 2r

- Die separate `⛏️ Mining-/Claim-Auswertung` wurde vollständig aus der Oberfläche entfernt.
- `📒 Apertum Transaktionshistorie` ist jetzt die einzige Auswertungsoberfläche.
- Filter erweitert um:
  - Wallet
  - Von / Bis
  - Typ
  - NFT-Klassifizierung
  - NFT
- NFT-Klassifizierung/NFT wirken direkt auf Summary, Detailliste sowie Excel-/PDF-Export.
- Historische NFTs bleiben berücksichtigt, sofern Claims zu ihnen gespeichert sind.
- Wallet-Filter enthält neu **Alle Apertum-Wallets**.
- Bei `Alle Apertum-Wallets` werden Summary und Steuerexport walletübergreifend erstellt; im Export steht die Wallet-Adresse pro Transaktion.
- `Apertum-Historie aktualisieren` verarbeitet bei Auswahl `Alle Apertum-Wallets` die Wallets sequenziell.
- In `🏷️ DAO1 NFT-Klassifizierung` gibt es neu **NFT-Tab öffnen**; die aktuell gewählte Wallet wird dort vorausgewählt.
- Keine neue Supabase-Migration in Phase 2r. `006-apertum-transaction-history.sql` bleibt aktuell.

## Neu in Phase 2q

- Der separate Bereich `⛏️ Apertum Mining Rewards` wurde entfernt.
- Die Mining-/Claim-Auswertung ist jetzt direkt in `📒 Apertum Transaktionshistorie` integriert.
- Sie erscheint dort als auf-/zuklappbarer Unterbereich `⛏️ Mining-/Claim-Auswertung`.
- Standard: **zugeklappt**.
- Mining und Transaktionshistorie verwenden damit sichtbar dieselbe zentrale Datenbasis.
- Historische NFTs werden weiterhin berücksichtigt, sofern sie in `project_nft_ownership` der Wallet geführt werden bzw. Claims zu diesen NFT-IDs gespeichert sind.
- NFT-Klassifizierung bleibt reine Auswertungs-/Filterinformation; Claim-Erkennung ist unabhängig davon.
- Keine neue Supabase-Migration in Phase 2q. `006-apertum-transaction-history.sql` bleibt die aktuelle Migration.

## Neu in Phase 2p

- Änderungen an der DAO1 NFT-Klassifizierung wirken jetzt **sofort** in der geöffneten Seite.
- Nach Speichern oder Entfernen einer Klassifizierung werden ohne Reload neu gerendert:
  - NFT-Klassifizierungstabelle
  - Mining-Auswertungsfilter
  - Mining-Summary und Claim-Tabelle
  - Apertum-Transaktionssummary und Transaktions-Detailliste
  - dadurch auch die Datenbasis für Excel-/PDF-Export
- Dafür wird **kein Blockchain-/Explorer-Scan** und keine erneute Claim-Anreicherung gestartet.
- `project_nfts` bleibt die maßgebliche Quelle; gecachte `nft_subtype`-Werte sind nur Fallback.
- Keine neue Supabase-Migration in Phase 2p. `006-apertum-transaction-history.sql` bleibt die aktuelle Migration.

## Neu in Phase 2o

### Kein 1000-Transaktionen-Limit mehr
- `project_transactions` wird in 1000er-Seiten vollständig aus Supabase gelesen, bis keine weiteren Zeilen vorhanden sind.
- Summary, Filter und Export arbeiten dadurch mit allen gespeicherten Transaktionen.
- Auch `project_nft_claims` wird paginiert gelesen.

### Wallet-Wechsel wirklich nur DB-Read
- Keine Explorer-Abfrage.
- Keine RPC-Abfrage.
- Keine Claim-Anreicherung.
- Es werden ausschließlich die gespeicherten `project_transactions` dieser Wallet geladen.

### Claim-Anreicherung
- Nur bei **Apertum-Historie aktualisieren**.
- Nur `claimReward()`-Transaktionen mit noch leerem `claim_nft_id`.
- Bereits angereicherte Claims werden nicht erneut verarbeitet.
- Historische Kurse werden nur für neue Claim-Anreicherungen ergänzt.

### Klarer Datenstatus
Während der Verarbeitung werden die Phasen sichtbar angezeigt: Explorer laden, Supabase speichern, Claims anreichern, historische Kurse ergänzen und Claim-Daten speichern.

Der Abschlussstatus lautet **✅ Bereit** und zeigt:
- Transaktionen gesamt
- angereicherte Claims
- letzter Scanzeitpunkt
- letzter gespeicherter Block
- offene Claim-Anreicherungen
- Claims ohne historischen USD-Kurs

### Aus Phase 2n weiter enthalten
- NFT-Klassifizierung live aus `project_nfts`
- Summary `Geclaimt APTM`
- Transaktions-Detailliste standardmäßig zugeklappt
- Excel/PDF mit aktueller Klassifizierung

## Supabase SQL – aktueller Migrationsstand

Bereits erfolgreich ausgeführte Migrationen **nicht erneut ausführen**.

- `001-dao1-apertum.sql`
- `002-dao1-miner-ownership.sql`
- `003-dao1-miner-nft-name.sql`
- `004-project-nft-classification.sql`
- `005-dao1-claim-cache.sql`
- `006-apertum-transaction-history.sql` – aktuellste Migration

**Phase 2o benötigt kein neues SQL.** Wenn 001–006 bereits erfolgreich ausgeführt wurden, kein SQL ausführen.

## Test nach Upload

1. Wallet wechseln → nur DB-Laden, danach `✅ Bereit`.
2. Bei >1000 gespeicherten Transaktionen muss die Anzeige >1000 zeigen.
3. `Apertum-Historie aktualisieren` → Fortschrittsphasen sichtbar.
4. Abschluss → `✅ Bereit` mit Scanstand.
5. Wallet erneut wechseln → keine Claim-Anreicherung.
6. Excel/PDF und Datumsfilter mit kompletter Historie testen.

## Supabase Migration Phase 2u

- `007-chain-archive-rpc.sql` – **neu, einmal ausführen**. Fügt nur optionale Archive-RPC-Felder zu `public.chains` hinzu.
