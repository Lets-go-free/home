# Wallet Tracking – aktueller Stand

Version: 28.08.2026 04:37:06 CEST · Phase 2ah · Build 20260828-043706

## Architektur DAO1 / Apertum

`Apertum Wallet → project_transactions → Claim-Erkennung → project_nft_claims → Auswertung / Exporte`

Die Transaktionshistorie ist die zentrale Datenbasis. Wallet-Wechsel und Filter lesen ausschließlich Supabase-Daten. Blockchain-Zugriffe erfolgen nur nach explizitem Klick auf **Apertum-Historie aktualisieren** bzw. beim Mining-Scan, der dieselbe zentrale Historie nutzt.

## Neu in Phase 2ah – lesbare LP-Historie

- Add-/Remove-Liquidity-Historie hat feste, großzügige Spaltenbreiten und einen permanenten horizontalen Scrollbereich.
- Underlying bleibt zweizeilig; historischer USD-Wert und Preisquelle haben eine eigene breite Spalte.
- Add ist grün, Remove ist rot.

## Phase 2ag – Discovery-Metadaten, Solana-Default und Apertum-Livekurse

- **Entdecken:** alle in `public.chains` mit `discovery_enabled = true` aktivierten Chains sind beim Öffnen standardmäßig ausgewählt – damit auch Solana. Eine alte gespeicherte Chain-Auswahl deaktiviert neu hinzugekommene Chains nicht mehr unbemerkt.
- **Historische EVM-/Apertum-Token:** Symbol, Name und Decimals werden auch bei aktuellem Bestand 0 direkt vom Token-Contract geladen und im lokalen Metadaten-Cache gespeichert. Dadurch erscheinen z. B. historische Tokens mit Namen statt nur als gekürzte Contract-Adresse.
- **Vordefinierte Token / Apertum:** Wrapped-Token zeigen Live-Kurse ausschließlich on-chain aus Apertum-V2-Pools. Geprüft werden direkte Token/wUSDT-Routen und Token/wAPTM → wAPTM/wUSDT; existieren beide, gewinnt die Route mit der größeren USD-bewerteten Referenzreserve. Kein CoinGecko-Fallback für diese Apertum-Wrapped-Kurse.
- **Liquidity Pools:** die zwei Underlying-Token werden in allen LP-Tabellen konsequent auf zwei separaten Zeilen dargestellt.
- Neue Migration `sql/015-puglord-predefined-token.sql`: PUGLORD (`PUG`, `0xc84b...cf46`) auf Apertum als DAO1-`defi_token`, 18 Decimals, ohne CoinGecko-ID.
- **Migration jetzt:** `015-puglord-predefined-token.sql` einmal ausführen. `014` und ältere Migrationen nicht erneut ausführen, sofern bereits erfolgreich ausgeführt.

## Neu in Phase 2af – persistenter LP/PCLP-History-Cache

- Neue generische Tabelle `public.lp_history_events` für DAO1/Apertum sowie TLN/VOW auf BSC und Ethereum.
- **Add-/Remove-Liquidity-Ereignisse, LP-Delta, Underlying-Mengen und historische USD-Werte werden dauerhaft in Supabase gespeichert.**
- Der erste Aufruf eines Liquidity-Pools-Tabs liest die relevante historische ERC-20-Transferhistorie. Danach wird über `public.project_scan_state` mit `scan_type = lp_history_v2` nur noch inkrementell ab dem letzten Scanstand synchronisiert; 50 Blöcke Überlappung schützen gegen Reorg-/Randfälle.
- Bei transienten Receipt/RPC-Fehlern wird der Scanstand bewusst nicht über den fehlgeschlagenen Block hinausgeschoben, damit beim nächsten Aufruf erneut versucht wird.
- Aktuelle LP-Balance, aktuelle Reserven und Pool-Anteil bleiben bewusst **live on-chain** und werden nicht als vermeintlich aktueller Wert in der DB eingefroren.
- Liquidity-Pools-Tabs zeigen zusätzlich eine gecachte Add-/Remove-Historie mit laufendem LP-Saldo.
- Apertum historische Token-/LP-Preise verwenden jetzt konsequent die Apertum-On-Chain-Routen; für Apertum gibt es keinen CoinGecko-Fallback. Historische V2-Preise verwenden den letzten `Sync` am oder vor dem Zielblock.
- Neue Migration `sql/014-lp-history-cache.sql`.
- **Migration jetzt:** Falls `013-anoubis-predefined-token.sql` noch nicht ausgeführt wurde, zuerst 013 ausführen; danach **014 einmal ausführen**. `012` und ältere Migrationen nicht erneut ausführen, sofern bereits erfolgreich ausgeführt.

## Neu in Phase 2ae – generische LP/PCLP-Integration und historische Discovery

- Neue gemeinsame `js/lp-engine.js`: erkennt V2-kompatible LP-Contracts generisch über `token0`, `token1`, `getReserves`, `totalSupply`, `balanceOf` und `factory`.
- BSC-LP-Token werden in der Oberfläche als **PCLP (Pancake-LP)** bezeichnet; Apertum als DAO1-LP.
- **Entdecken** berücksichtigt jetzt auch historische ERC-20-Kandidaten aus Transferhistorien. Damit können vollständig verkaufte Token und vollständig entfernte LP-Positionen wiedergefunden werden.
- Entdeckte V2-Paare werden automatisch als LP/PCLP klassifiziert; keine einzelne Pooladresse muss für die Erkennung hardcodiert werden.
- Aktuelle LP-Positionen werden im normalen Token-Bestand mit Poolpaar, Underlyings, Pool-Anteil und USD-Bewertung angereichert.
- **Bestand per 31.12.** erweitert den Token-Kandidatenraum um historische Transfers. Generisch erkannte LPs erhalten einen historischen LP-Kurs aus Underlying-Werten, Reserven und LP-Supply. Apertum verwendet für historische LP-Zustände Sync-/Transfer-Events statt unzuverlässiger alter `getReserves()`-Calls.
- DAO1 erhält einen Unter-Tab **Liquidity Pools**; TLN/VOW ebenfalls, für **BSC und Ethereum**. Historisch gehaltene LPs werden auch bei aktuellem Saldo 0 berücksichtigt.
- Apertum-Preislogik für DAO1 bleibt on-chain: wUSDT/wUSDC als USD-Referenz, wAPTM und weitere Assets über Apertum-V2-Routen. Keine CoinGecko-Abhängigkeit für diese DAO1-Poolbewertung.
- DAO1-PDF Transaktionshistorie enthält jetzt Summary am Anfang und eine Total-Zeile für Claims/Gas und historische USD-Werte.
- Neue einmalige, idempotente Migration `sql/013-anoubis-predefined-token.sql`: ANOUBIS (`0x8d38...004c`), 18 Decimals, Apertum, DAO1, `defi_token`, ohne CoinGecko-ID.
- **Migration:** `013-anoubis-predefined-token.sql` jetzt einmal ausführen. `012-year-end-snapshots.sql` und ältere Migrationen NICHT erneut ausführen, sofern bereits ausgeführt.

## Neu in Phase 2ad – Handbuch, Projekt-Untertabs, Jahres-PDF und historische Preise

- Menügruppe **Support & Info** steht jetzt an erster Stelle.
- **Chain-Abdeckung** wurde aus dem Admin-Menü in **Hilfe / Handbuch** verschoben und um **Bestand per 31.12.** erweitert.
- Allgemeine Hilfe zu einem Benutzerhandbuch ausgebaut; projektspezifische Hilfe liegt in den jeweiligen Projekten.
- DAO1 besitzt Unter-Tabs **Übersicht / Transaktionen & Claims / Konfiguration / Hilfe**; TLN/VOW besitzt **Übersicht / Hilfe** und kann später um weitere Unter-Tabs erweitert werden.
- PDF Bestandesaufnahme: überall 1,5 cm Seitenrand; Seite 1 Gesamtübersicht, Seite 2 Summary nach Chain mit aggregiertem Tokenbestand und Chain-Subtotal; danach beginnt jede Wallet auf einer neuen Seite.
- **Überholt durch Phase 2ag:** Apertum-Wrapped-Kurse werden aktuell und historisch ausschließlich on-chain aus Apertum-V2-Pools bestimmt; keine globale Underlying-/CoinGecko-Parität mehr für wBTC/wETH/wBNB/wAVAX usw.
- TLN/VOW `lp_token`: historische V2-LP-Bewertung aus historischen Reserven beider Poolseiten und historischer LP-TotalSupply. Damit ist u.a. `0x72dcf845ae36401e82e681b0e063d0703bac0bba` abgedeckt, sofern beide Underlyings am Stichtag bewertet werden können.
- XRP-Stichtag verwendet browserfreundlichen XRPL-Cluster mit Full-History-Server als Fallback.
- Solana-Stichtag bestimmt jetzt einen chain-globalen historischen Slot per `getBlockTime`, statt den letzten Wallet-Signatur-Slot zu verwenden; dadurch werden auch eingehende Änderungen ohne Wallet-Signatur korrekt zeitlich erfasst.
- Tron bleibt beim Bestand per 31.12. bewusst **nicht unterstützt**, solange keine belastbare exakte historische Account-State-Quelle integriert ist; es wird nichts aus Transfers geschätzt.
- Keine neue SQL-Migration. `012-year-end-snapshots.sql` bleibt die neueste Migration und ist einmal auszuführen, falls noch nicht geschehen.

## Neu in Phase 2ac – persistente Jahresbestände, PDF je Wallet, Apertum-Wrapped-Preise

- Neue einmalige Migration `sql/012-year-end-snapshots.sql`.
- Bestandesaufnahmen werden je User + Stichtag + Wallet + Chain + Asset in `year_end_positions` gespeichert; Chain-Coverage separat in `year_end_coverage`.
- Beim Öffnen/Wechseln von Stichtag oder Wallet wird ein vorhandener Snapshot automatisch aus Supabase geladen – ohne neue Blockchain-Abfragen.
- `Neu berechnen` ersetzt die gespeicherten Positionen für die gewählten Wallets am Stichtag.
- `Nur Kurse aktualisieren` behält die verifizierten historischen Bestände und erneuert nur Preis/Wert/Preisquelle.
- PDF: erste Seite Gesamt-Summary über alle ausgewählten Wallets; danach je Wallet eigene Tabelle und jedes neue Wallet beginnt auf einer neuen Seite; Wallet-Summen plus Gesamtsumme.
- Apertum Wrapped-Preisauflösung robuster: wUSDT/wAPTM werden aus den gesamten `predefined_tokens`-Metadaten erkannt, nicht nur aus SAFE_ADDRESSES; danach Poolroute Token/wUSDT bzw. Token/wAPTM → APTM/USD.
- `011-history-rpc-alchemy.sql` nicht erneut ausführen, sofern bereits ausgeführt.

## Neu in Phase 2ab – Bestandesaufnahme, Solana, DEX-Preise, Apertum Voll-Scan
- Basis: Phase 2aa / Build `20260827-210619`; DB-Anbindungen bleiben erhalten.
- Solana direkt über Alchemy; keine Browser-Aufrufe mehr an die beiden 403-blockierten kostenlosen RPCs.
- Solana-Stichtag: Native SOL via Account Archive `getBalance(..., slot)`; SPL/Token-2022 via `getTokenAccountsByOwnerAtSlot`.
- EVM: kostenlose historische Quelle zuerst, Alchemy Archive nur als Fallback.
- TLN/VOW Ethereum: historische VOW-, v-/Voucher- und Projekt-Token-Preise über projektdefinierte V2-Poolrouten am Stichtagsblock.
- Apertum: APTM aus APTM/wUSDT-Historie; wUSDT 1 USD; wAPTM = APTM; weitere Wrapped Assets über Token/wUSDT oder Token/wAPTM → APTM/USD, sofern Apertum V2 in `dex_configs` konfiguriert ist.
- PDF „Bestandesaufnahme per 31.12“ neu gestaltet, inklusive Datenqualität, Chain-Coverage, Quellen und Summenzeile.
- Apertum Voll-Scan aktualisiert zusätzlich NFT-Bestand und Besitzerhistorie der gewählten Wallets; manuelle Spam-/Safe-Markierungen bleiben erhalten.
- Keine neue SQL-Migration. `011-history-rpc-alchemy.sql` bleibt die zuletzt neu auszuführende Migration.

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

Bereits erfolgreich ausgeführte Migrationen **nicht erneut ausführen**. Maßgeblich ist diese Liste; ältere Phase-Abschnitte weiter unten sind nur Changelog.

- `001-dao1-apertum.sql` bis `011-history-rpc-alchemy.sql` – Bestand; nicht erneut ausführen, sofern bereits erfolgreich.
- `012-year-end-snapshots.sql` – einmalig erforderlich für persistente 31.12.-Bestände; nur ausführen, falls noch nicht geschehen.
- `013-anoubis-predefined-token.sql` – einmalig/idempotent für ANOUBIS; nur ausführen, falls noch nicht geschehen.
- `014-lp-history-cache.sql` – Phase 2af; nicht erneut ausführen, sofern bereits erfolgreich.
- `015-puglord-predefined-token.sql` – **NEU in Phase 2ag, jetzt einmal ausführen**.

Empfohlene Reihenfolge für einen älteren Stand: **013 → 014 → 015**. Wenn 013 und 014 bereits ausgeführt wurden, jetzt nur **015** ausführen.

## Test nach Upload

1. Wallet wechseln → nur DB-Laden, danach `✅ Bereit`.
2. Bei >1000 gespeicherten Transaktionen muss die Anzeige >1000 zeigen.
3. `Apertum-Historie aktualisieren` → Fortschrittsphasen sichtbar.
4. Abschluss → `✅ Bereit` mit Scanstand.
5. Wallet erneut wechseln → keine Claim-Anreicherung.
6. Excel/PDF und Datumsfilter mit kompletter Historie testen.

## Historischer Changelog – Supabase Migration Phase 2u

- `007-chain-archive-rpc.sql` – war in Phase 2u neu; heute nur ausführen, falls diese ältere Migration tatsächlich noch fehlt. Fügt nur optionale Archive-RPC-Felder zu `public.chains` hinzu.