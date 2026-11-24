> **9.98 (24.11.2026 19:58:22 CET, Build 20261124-195822):** `delta-work-cycle` kann nach regulärer Evidence-Arbeit optional genau einen bestehenden ERC-20-Rohscan starten; separate ausdrückliche Bestätigung für Roh-Preview oder geschützten Raw-CAS-Commit, Start nur unter 8 s Evidence-Zeit und bei unkritischem Stop-Grund. Bestehende Crons unverändert, keine neuen SQL-Funktionen/Jobs. WICHTIG: Evidence schreibt im Test weiterhin; 8 s sind keine RPC-Gesamtdeadline. Live-Lasttest und Cron-Freigabe offen. Reward-Buchungsjobs bleiben aus. Details: `docs/releases/9.98-tln-post-evidence-raw-catchup-optin.md`.

> **9.97 (24.11.2026 17:30:59 CET, Build 20261124-173059):** Expliziter Read-only-Kapazitätstest `rawCatchupBudgetPreview:true` innerhalb des bestehenden `delta-work-cycle` prüft den vorhandenen 5’000-Block-Rohscanner auch bei noch vorhandenen Evidence-Kandidaten, ohne den schreibenden Evidence-Zweig auszuführen. Antwort zählt Kandidaten und misst `previewElapsedMs`; das ist kein gemeinsamer Live-Zeitbudget-/Cron-Nachweis. Normaler Cron ohne Opt-in unverändert. Tägliche Reward-Jobs deaktiviert. **Offen:** Read-only-Live-Abnahme; danach Budget für die spätere optionale Nachführung bewerten und Konkurrenzschutz nachweisen. Siehe `docs/releases/9.97-tln-evidence-contention-raw-budget-preview.md`.

> **9.94 (24.11.2026 16:00:48 CET, Build 20261124-160048):** Bestehender geschützter TLN/VOW-ERC-20-Rohdaten-Scanner erlaubt einmaligen explizit bestätigten 101–5’000-Block-Commit (`confirm:single-raw-cache-large-chunk` plus `chunkBlocks`); bisheriger 100-Block-Commit unverändert. Keine neuen SQL-Funktionen, Tabellen oder Cron-Jobs; tägliche Reward-Buchungen deaktiviert. **Offen:** 5’000-Block-Live-Schreibtest, gespeicherte Transfers/Scan-Grenzen nachprüfen und erst später Cron-Nachführung. Siehe `docs/releases/9.94-tln-guarded-large-chunk-one-shot.md`.

> **9.93 (24.11.2026 15:52:39 CET, Build 20261124-155239):** Geschützter Rohdatenmodus unterstützt neu optional `chunkBlocks` 1–5’000 nur im Read-only-Test (Standard 100); produktiver Commit bleibt explizit bei 100 Blöcken. Kein neuer Scanner, Cron, SQL oder Reward-Write. **Offen:** Live-Laufzeit der 5’000-Block-Read-only-Prüfung und danach kontrollierte Integration in bestehenden 5-Minuten-Evidence-Ablauf; geschützten Schreibumfang nicht automatisch erhöhen. Details `docs/releases/9.93-tln-guarded-scan-capacity-preview.md`.

> **9.92 (24.11.2026 10:32:21 CET, Build 20261124-103221):** Im bestehenden geschützten TLN/VOW-Rohdaten-Scanner wird die Auswahl mehrerer relevanter Wallets fair: Zunächst erhalten Wallets ohne `erc20-history-v1`-Cache einen initialen 100-Block-Scan; anschliessend erfolgt die Fortsetzung nach ältestem gültigem `updated_at`, mit der bisherigen 24-Block-Überlappung. Keine neue Datenbankfunktion, kein neuer Cron, keine automatische Freigabe von Schreibzugriffen oder Reward-Buchungen. **Offen:** Read-only-Live-Prüfung der Auswahl, danach kontrollierter Einzel-Commit und wiederholte Wallet-Rotation; Prüfung der Cache-Grenzen und lückenlosen historischen Nachführung. Kooperatives `updated_at`-CAS schützt nicht vor alten ungeschützten Browser-Tabs. Siehe `docs/releases/9.92-tln-erc20-fair-selection.md`.

> **9.91 (24.11.2026 08:24:21 CET, Build 20261124-082421):** Bestehender Edge-Scanner `inspectWalletTransfers()` kann vollständige, manuell kompatible ERC-20-Cache-Belege für einen begrenzten Abschnitt erfassen. Neuer `encrypted-wallet-scan-guarded-stage-preview` standardmässig Read-only; atomisch bedingter `updated_at`-CAS-Schreibpfad nur mit `commit:true` und `confirm:"single-raw-cache-chunk"`, bewusst noch nicht live freigegeben. Keine neue SQL-Funktion/Tabelle, keine Reward-Klassifizierung, keine Cron-Änderung. 12 lokale Tests (9.80–9.91) bestanden. **Offen:** Read-only-Live-Abnahme, kontrollierter Einzel-Schreibtest, unkooperative alte Browser-Tabs, vollständige historische Scans und Reward-Abdeckung. Tägliche Reward-Buchungsjobs bleiben deaktiviert. Siehe `docs/releases/9.91-tln-erc20-guarded-stage.md`.

> **9.90 (24.11.2026 08:13:07 CET, Build 20261124-081307):** Bestehende manuelle `savePersistentErc20Cache()`-Speicherung durch bedingtes `updated_at`-UPDATE mit erneuter Payload-Zusammenführung, monotone Cursor und Konfliktabbruch abgesichert. Keine neue SQL-/Edge-Funktion, keine Migration, keine Cron-Änderung. Lokale Tests (neu + 11 Regressionen) bestanden; Browser-Live-Abnahme offen. Alte Browser-Tabs/unkooperative `upsert`-Schreiber bleiben ein Risiko, serverseitige volle Rohdaten-Payload fehlt weiterhin. **Keine automatischen Schreibscans oder täglichen Reward-Buchungsjobs aktivieren.** Siehe `docs/releases/9.90-manual-erc20-cache-guarded-save.md`.

> **9.89 (24.11.2026 07:57:54 CET, Build 20261124-075754):** Read-only `encrypted-wallet-scan-adaptive-parity-preview` prüft einen belegten historischen ERC-20-Transfer über den vorhandenen `inspectWalletTransfers()`-Scanner. Nur im neuen Diagnosemodus: vollständige Pagination oder begrenzte adaptive Halbierung (max. 100 Blöcke, 4 Teilungsstufen), sonst sicherer Abbruch. Produktive Reward-Pfade unverändert; keine Writes. Lokale Regressionstests 9.80–9.89 bestanden; Live-Test offen. Keine globale Rohdaten-/Reward-Vollständigkeit, tägliche Buchungsjobs aus. Siehe `docs/releases/9.89-tln-erc20-adaptive-pagination-readonly.md`.

## Version 9.88 – Positiver historischer ERC-20-Rohdatenbeleg ohne Tokenfilter (20261124-064944)

- `encrypted-wallet-scan-raw-evidence-preview` bestätigt einen existierenden Rohdaten-Transfer über denselben bestehenden Alchemy-Scanner, möglichst mit nicht vordefiniertem Token. Maximal 100 Blöcke, strikt Read-only.
- Lokale Tests 9.80–9.88 + Work-Cycle 9.38 bestanden; **Live-Test ausstehend**. Keine neuen DB-Funktionen oder Schreibzugriffe.
- TODO: Live-Gegentreffer beurteilen; danach bestehende manuelle Pagination/Bereichsteilung und Speicherschutz prüfen. Tägliche Reward-Buchungsjobs bleiben deaktiviert.
- Siehe `docs/releases/9.88-tln-raw-erc20-positive-evidence-readonly.md`.

## Version 9.87 – ERC-20-Rohdaten-Scan lesend an manuelle Token-Auswahl angeglichen (20261123-221719)

- `encrypted-wallet-scan-raw-parity-preview`: bestehender serverseitiger Scanner zählt im 100-Block-Test auch ERC-20-Transfers **ausserhalb** der Projekt-Token-Liste; Transferidentität nach manueller Discovery, keine IDs in Antwort. Bestehende Reward-Filter unverändert.
- Keine neuen Datenbankfunktionen, SQL-Migrationen, Cron-Jobs oder Schreibzugriffe. Pagination weiterhin strikt auf acht Seiten pro Richtung begrenzt; adaptive Teilung und sichere konkurrierende Speicherung offen.
- Lokale Tests 9.80–9.87 bestanden. **Live-Test noch offen**. Tägliche Reward-Buchungsjobs bleiben deaktiviert.
- Details: `docs/releases/9.87-tln-server-raw-erc20-parity-readonly.md`.

## Version 9.86 – Read-only-Schreibplan für ERC-20-Rohcache (20261123-220217)

- Neuer geschützter Modus `encrypted-wallet-scan-write-plan-preview`. Bewertet vorhandene Rohcache-Einträge, Duplikatschlüssel und fehlende Transferidentitäten, wählt maximal einen künftigen 100-Block-Abschnitt als Simulation; kein RPC-Scan, keine Datenbankschreibzugriffe.
- Verbindliche Sicherheitsbedingung vor schreibendem Worker: Datenbankseitig atomare Merge-/Compare-and-Swap-Operation mit Cursor-Guard, deduplizierter Payload-Vereinigung und vollständiger Pagination. Der bestehende Browser-Read-then-Upsert ist **nicht** atomar.
- Offen: SQL-/RPC-Design und separate Verifikation der Atomizität, Provider-Resultatstruktur, konkurrierende Browser-Schreiber, Payload-Grössen und vollständige vier Reward-Pfade. Keine Freigabe der täglichen Buchungsjobs.

> **9.81 (23.11.2026 14:07:30 CET):** Neues geschütztes Read-only-Audit `encrypted-wallet-scan-coverage-preview` für exakt die Wallets der serverseitigen 9.80-Auswahl; der bisherige Prüfmodus bleibt kompatibel. Prüft je relevanter Wallet das `erc20-history-v1`-Rohcache-Schema, Blockgrenzen und aktuellen BSC-Head, gibt nur aggregierte Kategorien aus (fehlend, ungültig, partieller Bereich, Genesis-bis-Head). Ein vollständiger Cache-Blockbereich ist **kein** Beweis vollständiger Reward-Erkennung; `historicalScanCoverageVerified` und `canEnableWritingCron` bleiben false. Keine Writes, kein SQL, keine Cron-Aktivierung. Lokale Tests erfolgreich; Live-Test offen. Build 20261123-140730. Siehe `docs/releases/9.81-tln-wallet-raw-scan-coverage-audit.md`.
> **9.80 (23.11.2026 13:09:46 CET):** Read-only-Coverage prüft nun zusätzlich zur historischen Wallet-Auswahl die aktuelle BSC-`balanceOf`-Token-Relevanz der bisher unklassifizierten Wallets. Aktive, nicht historische TLN/VOW-Token nach manueller Auswahlregel; RPC-Fehler bleiben `unknown` statt falsche Negativtreffer. Nur aggregierte Werte, keine DB-Writes. Lokale Tests bestanden; Live-Test und historische Scan-Vollständigkeit offen; tägliche Buchungsjobs deaktiviert. Build 20261123-130946. Siehe `docs/releases/9.80-tln-current-token-balance-gate.md`.
> **9.79 (23.11.2026 13:01:46 CET):** Korrektur des Read-only-Modus `encrypted-wallet-coverage-preview`: SmartNode-Graph und Identitäten nur noch auf die serverseitig entschlüsselten Wallet-Adressen abfragen, nicht die gesamte Graph-Tabelle paginieren. Grosses Graph-Archiv ist dadurch kein künstlicher Abbruchgrund mehr. Keine Buchungen; Abdeckung weiterhin nicht bestätigt, `balanceOf` offen. Edge-Deploy/Live-Test offen. Build 20261123-130146. Siehe `docs/releases/9.79-wallet-coverage-targeted-graph-lookup.md`.
> **9.78 (23.11.2026 09:50:55 CET):** Geschützte, rein lesende Bestandsaufnahme verschlüsselter EVM-Wallets und historischer TLN/VOW-Projektbezüge (Scan-Cache, Identitäten, SmartNode-Graph). Keine Wallet-Adressen/IDs nach aussen. Aktuelle `balanceOf`-Auswahlregel, historische Vollständigkeit und Cron-Freigabe bleiben offen. Edge-Deploy und Live-Abnahme offen. Build 20261123-095055. Siehe `docs/releases/9.78-tln-encrypted-wallet-coverage-preview.md`.
> **9.77 (23.11.2026 07:43:34 CET):** Gemeinsamer `daily-all-rewards-preview` für direkte Staking-, Bonus-, Referral- und indirekte Staking-Finalizer in fixierter Reihenfolge, alle `commit:false`. Blockiert bei unvollständiger Receipt-Inventur/Fehler und lehnt `commit:true` ab. Neuer täglicher Vorschaujob wird SQL-seitig inaktiv angelegt; drei bestehende Schreib-Crons bleiben inaktiv. Keine Behauptung vollständiger Wallet-/Historienabdeckung, kein Cross-Ledger-Commit. Build 20261123-074334. Siehe `docs/releases/9.77-tln-all-rewards-daily-read-only-orchestrator.md`.

> **9.15 (18.11.2026 22:32:33 CET):** TLN/VOW `tln-vow-reward-refresh` erhält read-only `rpc-range-diagnostic`: Alchemy BNB Mainnet jeweils derselbe Contract/Transfer-Topic, historische `eth_getLogs`-Fenster mit 1, 2, 5, 10, 11 und 100 Blöcken plus 10 aktuelle Blöcke. Diagnose: 9.14 zeigte Einzelblock HTTP 200, 100 Blöcke HTTP 400. Alchemy dokumentiert Free-Tarif-Limit 10 Blöcke für BNB; konkretes Kontolimit weiterhin live zu prüfen. Kein Wechsel des RPC-Providers, keine echten Rewards, kein Cursor-/Cache-Write, kein Cron. Sichtbare Phase 9.15, Build 20261118-223233. Deploy, danach `{"mode":"rpc-range-diagnostic"}`; `docs/releases/9.15-tln-vow-bsc-rpc-range-limit.md`.

> **9.14 (18.11.2026 22:27:33 CET):** TLN/VOW-Edge `tln-vow-reward-refresh` um geschützten read-only Modus `rpc-diagnostic` ergänzt. Sechs definierte BSC-RPC-Kompatibilitätstests (Netzwerk, Einzelcontract, 100-Block-Fenster, Contract-Array, Wallet-Topic, jüngster Block); Fehlercodes sicher gekürzt. `eth_getLogs` HTTP 400 aus 9.13 noch ursächlich ungeklärt. Kein Cron, kein Reward-/Cache-/Cursor-Write. Sichtbare Version 9.14, Build 20261118-222733. Nach Deploy `{"mode":"rpc-diagnostic","maxBlocks":100}` testen. `docs/releases/9.14-tln-vow-bsc-rpc-filter-diagnosis.md`.

> **9.11 (18.11.2026 21:59:19 CET):** TLN/VOW-Edge `delta-preview` liefert zusätzlich einen read-only **ersten 5'000-Block-Chunk** mit inklusivem Endblock, hypothetischem Folgestart und Restanzahl. Keine Blockchain-Logs, keine Reward-Verarbeitung, keine Datenbank-/Cursor-Schreibzugriffe und **kein Cron**. Sichtbare Phase und Build aktualisiert. Nach ZIP-Installation Edge Function deployen, danach Live-Preview prüfen. `docs/releases/9.11-tln-vow-bounded-delta-chunk-preview.md`.

> 9.10 (18.11.2026): TLN/VOW-Edge-Preflight um **rein lesende Einzelwallet-Delta-Fenstervorschau** ergänzt (`mode=delta-preview`, BSC-Head via Alchemy, 128 Block Overlap, Guards, keine Writes). **Kein vollständiger Rewards-Delta-Worker; kein Cron!** Siehe `docs/releases/9.10-tln-vow-single-wallet-delta-preview.md`.

> 9.09 (18.11.2026 21:20:18 CET): TLN/VOW read-only Edge-Preflight hinzugefügt, **kein Reward-Delta-Worker oder Cron**. Discovery Claim-Link-Heuristik gegen Unicode-Formatzeichen gehärtet; Live-Abnahme offen. Siehe `docs/releases/9.09-tln-rewards-preflight-and-discovery.md`.

### Phase 9.08 – Discovery und TLN/VOW-Rewards-Audit (18.11.2026 20:30:20 CET)

- Discovery: Link-/Claim-/Airdrop-Phishingmuster unabhängig von GoPlus, für vorhandene Funde ohne Blockchain-Neuscan; manuelle Spam-Entscheidungen haben Vorrang. Offene Spam-Verdachte und manuell markierte Spam-Token werden getrennt gezählt.
- Admin → Vordefinierte Token: Spalte Kursübersicht mit `(Bestand > 1 USD)` ergänzt (Immer-anzeigen-Ausnahme unverändert).
- TLN/VOW-Rewards: rein statischer Bestandsaudit zeigt vorhandene Discovery-/sanitisierte Summary-Caches, aber keinen belegten fertigen eigenständigen täglichen Worker. Zuerst Live-Cron-/Cache-Audit, dann kontrolliertes Delta-Testdesign. Kein Job aktiviert.
- Details: `docs/releases/9.08-discovery-claim-links-and-labels.md`, `docs/audits/9.08-tln-vow-rewards-inventory.md`. Browser-/Live-Audit noch offen.

### Phase 9.00 – Wallet-Bestand: horizontales Scrollen je Wallet (18.11.2026)

- Frontend-Update vorbereitet: Header und alle Chain-Tabellen desselben Wallets teilen sich beim Scrollen die horizontale Position. Andere Wallets bleiben unabhängig. Keine SQL-/Edge-Änderungen. Browser-Test nach Installation offen. Details: `docs/releases/9.00-wallet-horizontal-scroll.md`.

 > **8.82 · Aktuell (16.11.2026, vorbereitet):** Nach unabhängiger DB-Abnahme 8.81 insgesamt 16/76 Legacy kanonisch; 56 priced und 4 pre-price offen. Nächste fünf live 5/5 geprüft. Ab 8.82 **einmaliger generischer service-only 1–5-Claim-Batch** für dieselbe Test-Wallet: keine hartcodierten Hashes, aber SQL-eigener oldest-five-Abgleich und frische Chain-/Preisbelege, manuelle doppelte Bestätigung, atomarer Rollback. Je Stapel Preview → manuell committen → unabhängige DB-Kontrolle; keine Cron-/Worker-Freigabe, kein Auto-Loop, vier pre-price gesondert offen. ZIP/SQL/Edge/Live-Test ausstehend. `docs/releases/8.82-dao-legacy-reusable-bounded-commit.md`.

 > **8.81 · Aktuell (16.11.2026, vorbereitet):** 8.80 unabhängig per Supabase bestätigt; 11 von 76 Legacy kanonisch, 61 historisch preisfähig + 4 pre-price offen. Nächste fünf (2337881, 2396232, 2743281, 2743285, 2803236) live 5/5 exact-v13 verifiziert ohne Writes. 8.81 separates service-only SQL, Edge und doppelt bestätigter UI-Commit, kompletter Rollback bei Abweichung. Installieren/SQL/deployen/read-only prüfen/erst dann bewusst committen und SQL abnehmen. DAO-Cron/Live-Worker AUS. `docs/releases/8.81-dao-legacy-third-five-atomic-commit.md`.

 > **8.80 · Aktuell (16.11.2026, vorbereitet):** 8.79 live DB-abgenommen, sechs Legacy-Claims insgesamt kanonisch, 70 offen (66 bewertbar/4 pre-price). 8.78 weitere fünf Blöcke 1839700/1858236/2185604/2185862/2337875 mit exact-v13, Mint und Ownership live verifiziert, 0 Writes. 8.80 manuell freizugebender eigener atomarer 5er-Commit; SQL, Edge und Admin-UI vorbereitet. Nach Installation/Deploy/Live-Test, dann erst Commit; danach DB-Abnahme. DAO-Cron/Live-Worker AUS. `docs/releases/8.80-dao-legacy-second-five-atomic-commit.md`.

 > **8.79 · Aktuell (16.11.2026):** 5/5 priced Legacy-Claims per 8.78 live verifiziert, kein Write. 8.79 manuell freizugebender, fester atomarer 5er-Commit vorbereitet; vier Pre-Price-Claims ausgenommen. Installation, SQL und Deploy offen. DAO-Cron/Live-Worker AUS. `docs/releases/8.79-dao-legacy-priced-five-atomic-commit.md`.

> **Aktuell 8.78 (16.11.2026):** Live 8.77: 5/5 verified_preview, 0 Writes, 4 Pre-Market-Claims ohne exakten USD-Anker; Block165133 späterer Claim exact-v13 verifiziert. 8.78 trennt vorerst die beiden Gruppen sicher: Admin-only read-only 5er-Vorschau filtert `claim_block>=88356` innerhalb fixed Test-Wallet und `unassigned_legacy/pending`, Preisnachweis pro Claim zwingend, Stop bei erster Abweichung. Noch **keine** Stapelbuchung; unveränderte frühe 4 für späteren separaten unpriced Finalizer. Siehe `docs/releases/8.78-dao-legacy-priced-five-preview.md`.

> **Aktuell 8.77 (16.11.2026):** 8.76 Einzel-Claim #818 Block 957942 in DB bestätigt (1 kanonischer Claim, 1 Asset-Flow, Reward 15.167495057030400213 APTM / 19.85128241097073681207126347197496 USD, Candidate ownership_verified/verified/completed). 75 offene Legacy-Claims. Neue Admin-only 5er-Vorschau 8.77 prüft ausschliesslich die nächsten fünf `unassigned_legacy/pending` nach Block, live Trace+MintEvent, Eigentumsintervall, Duplikate und exact-v13-Preis; beendet bei erster Abweichung, **keine** DB-/Job-Änderung. Test/Deploy offen. `docs/releases/8.77-dao-legacy-five-preview.md`.

> **Aktuell 8.76 (16.11.2026):** Nach 8.75-Log-Index-Fix erreichte der Single-Commit den Guard `Canonical post-condition missing` und rollte vollständig zurück. Ursache per SQL eindeutig: kanonischer `wallettracking_dao_raw_decimal` liefert 15.167495057030400213, übliche `numeric / 1e18` rundet auf 15.1674950570304002. 8.76 ersetzt nur die service-only Commit-Funktion, verwendet zentralen Decimal-Parser sowohl beim nativen Flow als auch im Abschlussvergleich. Kein Eingriff in Preisalgorithmus oder Canonical Finalizer; 75 andere Legacy-Claims unangetastet. `docs/releases/8.76-dao-legacy-raw-decimal-postcondition.md`.

> **Aktuell 8.75 (16.11.2026):** 8.74 Single-Commit für MineBot #818/Block 957942 lieferte 409 wegen NULL in NOT-NULL-Spalte `project_transaction_asset_flows.log_index`; bestätigte DB-Kontrolle 0 kanonische Claims, 0 Flows, 0 Preisanker, Kandidat weiterhin pending/unassigned. Ursache beheben via 8.75 SQL `CREATE OR REPLACE` mit `log_index=-1` (entspricht produktivem nativen Flow-Builder), UI zeigt HTTP-Fehlerdetail. Installation/Migration und kontrollierter Wiederholungstest ausstehend; keine Cron- oder anderen Legacy-Claims aktivieren. `docs/releases/8.75-dao-legacy-native-flow-log-index-fix.md`.

> **Aktuell 8.74 (16.11.2026):** Atomarer service-only Einzel-Commit für festgelegten Claim `0xc27e0aa5…` (#818, Block 957942) vorbereitet, noch nicht live ausgeführt. Live-Preisbeleg exact-v13 1.3088042775902748 USD/APTM, Native Mint 15.167495057030400213 APTM. Installations-SQL legt nur Funktion an; anschliessend Edge deployen und Commit in Admin-UI separat zweifach freigeben. Strikte SQL-Guards für Wallet/Hash/Betrag/Preis/NFT/Ownership/Duplikate und bestehenden kanonischen Finalizer; Fehler = Rollback. 75 weitere Legacy-Claims bleiben unangetastet. Keine Jobs einschalten. `docs/releases/8.74-dao-legacy-single-commit.md`.

> **Aktuell 8.73 (16.11.2026):** 8.72 bei frühem #819 und späterem #818-Claim live verified_preview ohne Blocker/Writes. 8.73 ergänzt lesende historische exact-v13-Preisprobe für späteren Einzelclaim: derselbe bestehende exactAnchor-Algorithmus (Archiv-Pool-State, sonst verifizierter Sync-Vorgänger), keine DB-Upserts; USD-Reward nur indikativ. Fehler liefert exact_v13_proof_unavailable. Installation/Edge-Deployment/Live-Test offen. 76 Claims pending, 16 failed unangetastet, Cron/Worker AUS. Details docs/releases/8.73-dao-legacy-single-exact-price.md.

> **Aktuell 8.72 (16.11.2026):** 8.71-SQL installiert und DB-Abnahme für historische MineBots #818/#819 erfolgreich. 76 Claims (42/34), native Mints insgesamt 224.410053146163331226 APTM, 0 kanonische Claims/Flows, 0 Rewards/USD, alle `payout_status=pending`; 4 vor erstem belegten Pool-Block 88356. **8.72:** einzelne read-only Vorschau über Admin-Audit: Claim-Hash, festgelegte Test-Wallet, erneut Native-Minter Trace/Event und NFT-Eigentum, Duplikatschutz, Preisfähigkeitsstatus. Weder Preisermittlung noch DB-Write; exakter USD-Beleg für 72 spätere Claims bleibt offen. Installation/Edge-Deploy und Live-Test offen. `docs/releases/8.72-dao-legacy-single-preview.md`.

> **Aktuell 8.71 (16.11.2026):** 8.70-SQL-Ausführung mit `42702` abgebrochen (mehrdeutiger Variablenname `wallet_address`). Zwei read-only Abfragen: keine Stammdaten/Ownership für 818/819. Korrigierte eigenständige 8.71-Migration bereit; Installation/DB-Abnahme offen. Keine Claim-, Reward-, Preis- oder Job-Änderungen. Siehe `docs/releases/8.71-dao-legacy-minebot-sql-fix.md`.

> **Aktuell 8.70 (16.11.2026):** 8.69 installiert und im Browser live abgeschlossen: **76/76** Legacy-Native-Minter-Claims read-only verifiziert, **224.410053146163331226 APTM**, 0 Abweichungen, 0 Writes. Historischer ERC-721-MineBot-Vertrag `0xa1b76189…`: Claim-Vault-IDs #818 (42) und #819 (34) stimmen mit ihren NFT-IDs überein; beide an dieselbe Wallet in Block 10'904 geprägt, vollständige Transferhistorie bestätigt, Exit-Blöcke 11'448'349/11'448'526. Alle 76 Claims liegen innerhalb dieser Eigentumszeiträume. **8.70-Migration vorbereitet, noch nicht installiert:** nur 2 NFT-Stammdaten plus 2 nicht-aktuelle Ownership-Intervalle, strenge Guards, keine kanonischen Claims, Preise, Miner-Aktivierung oder Cron/Worker. Nächster Schritt: ZIP installieren und genau diese SQL-Migration einmal ausführen, Ergebnis zurückmelden. Details `docs/releases/8.70-dao-legacy-minebot-ownership.md`.

> **Historischer Eintrag 8.69 (16.11.2026):** 30/76 Legacy-Minter-Claims zunächst einzeln geprüft; Browser-Serie für restliche 46 entwickelt und erfolgreich live abgeschlossen. Details `docs/releases/8.69-dao-legacy-mint-browser-drain.md`.

> **Historischer Eintrag 8.68 (16.11.2026):** 8.67-Live-Wiederholung weiterhin 5× `invalid-mint-event`; 8.68 ergänzt prüfbare Modulkennung und feldspezifische Diagnosen. Inzwischen 30/76 historische Native-Minter-Payouts per 8.68 live verifiziert. Details `docs/releases/8.68-dao-legacy-mint-diagnostics.md`.

> **Historischer Eintrag 8.67 (16.11.2026):** Erste fünf Legacy-TX mit installierter 8.66 read-only geprüft: 5× `needs_review / invalid-mint-event`, 0 Claims. Echter Blockscout-v2-Log aus Block 40'707 enthält drei Topics plus `null`. 8.67 erlaubte dieses Format; Live-Wiederholung blieb auffällig. Details `docs/releases/8.67-dao-native-mint-log-null-topic.md`.

> **Historischer Eintrag 8.66 (16.11.2026):** Read-only Admin-Prüfung alter `claimReward`-Transaktionen über Native-Minter-Call **und** `NativeCoinMinted`-Event. Historische Test-Wallet: 76 `unassigned_legacy` ohne Standard-Flows; 16 `failed_transaction` bleiben unberührt. Zuletzt 2'527/2'527 konsistente exact-v13-Claims. Keine NFT-Zuordnung aus Vault-IDs, keine kanonischen Claims, Preise, Cursors oder Jobs aktiviert. Details: `docs/releases/8.66-dao-legacy-native-mint-preview.md`.

> **Historischer Eintrag 8.57:** 8.56 Drei-Miner-Preview live: 3/3 blockiert wegen mehrerer RewardClaimed-Events pro Transaktion, keine Writes. Explorer zeigt mehrere Collection-IDs für dieselbe NFT-ID/Staker. 8.57 addiert diese Ereignisse nur bei eindeutiger Identität und exakter Wei-/Payout-Gleichheit, weiterhin **nur read-only**. Nächster Schritt: Update-ZIP einspielen und vier Edge-Dateien gemeinsam deployen; Rückmeldung abwarten. Details `docs/releases/8.57-dao-multi-reward-event-aggregation.md`. DAO-Cron/Live-Worker AUS.

### Phase 8.97 – DAO1: Kandidatenabruf nach SQLSTATE 42702 reparieren (18.11.2026)

- 8.96 installiert und live geprüft: 542 Reto-Kandidaten, 0 unresolved; alle 16 bekannten Fehltransaktionen erfüllen belegte Ausnahme-Guards. 15/15 heutige Wallets in zwei manuellen Import-Batches plus Einzeltest auf `staged`, 0 Importfehler, 0 neue kanonische Claims/Rewards. Staged-Read-only-Preview: 15, Live-Worker aus.
- Erster `cron-staged-one` **fehlgeschlagen mit SQL 42702** (`c.user_id ambiguous`). Queue-Wallet `e8b5c835…` steht auf `failed`, attempt_count=2, step_count=2, failure_count=1; übrige 14 staged. Ursache: in service-only 8.42-RPC `wallettracking_dao_next_native_claim_candidate` heisst der PL/pgSQL-Record und der UPDATE-Tabellenalias beide `c`.
- **8.97 SQL-only-Fix:** Record `v_candidate`, unveränderte UPDATE-/Select-Guards, keine DML beim Installieren. Nächster Schritt: ZIP installieren, neue Migration ausführen, unabhängige read-only SQL-Prüfung; danach **separaten kontrollierten Retry der einen failed-Queue-Zeile** planen. Ungeprüftes wiederholtes `cron-staged-one` würde andere Wallets bearbeiten, nicht diese `failed`-Zeile. DAO-Cron/Live-Worker AUS. `docs/releases/8.97-dao-reward-candidate-sql-alias-fix.md`.

### Phase 8.96 – DAO1: DailyJob-Readiness für 16 belegte Fehltransaktionen korrigieren (18.11.2026)

- **8.95 live abgeschlossen:** 16/16 erfolgreiche Transaktionen ohne Auszahlungsnachweis (9+6+1 Wallets) in maximal drei Einzelfällen pro Admin-Aufruf klassifiziert. Unabhängige SQL-Abnahme: 16/16 vollständige Coverage, kein positiver Flow/Reward, keine kanonische oder Preisänderung.
- **DAO-Gesamtaudit live:** 2'807 Kandidaten über alle Wallets: 2'768 regulär kanonisch/Flow/Reward konsistent, vier weitere Prelaunch mit positivem APTM aber beabsichtigt fehlender USD-Bewertung, 19 ohne belegte Auszahlung korrekt klassifiziert, 16 fehlgeschlagene TX ohne Claim/Flow. Keine festgestellte Abweichung.
- Rohscans 15 Wallets je Scanart: 7 `complete`, 8 `empty_verified` (alle 15 gültig). Ältere Tagesqueue: am letzten Lauf 14.11. alle 15 `staged`, `last_error` null. **Kein DAO-Cron registriert**. Separate historische Queue-Tage 09.–14.11. nicht löschen oder pauschal als completed markieren.
- **Readiness-Blocker bestätigt:** Alle 15 Wallets `unresolved=0`; Reto `8a3c5dc6…` hat 16 `unrecognizedExceptions` ausschliesslich wegen der bereits geprüften `failed_transaction`. 8.96 installiert eine **SQL-only**, service-only Guard-Korrektur: nur nachweislich fehlgeschlagene TX ohne Claim/positiven Eingangsflow werden als bekannte Ausnahme akzeptiert. Unbekannte/zweifelhafte Klassifizierungen bleiben blockiert.
- **Nächster Schritt:** ZIP 8.96 installieren, **nur** SQL-Migration ausführen, Rückmeldung abwarten; danach kontrollierte read-only Prüfung der neuen Readiness. Noch kein Edge-Deploy, kein neuer Cron, Live-Worker AUS. `docs/releases/8.96-dao-readiness-failed-transaction-exception.md`.

### Phase 8.95 – DAO1: 16 historische Claims begründet als ohne Payout-Beleg klassifizieren (18.11.2026)

- 8.94 deployed: read-only über alle 16 Claims in drei Wallets, 9+6+1 geprüft, alle `no_payout_evidence_preview`, vollständige indizierte Transaktion/Token-/Internal-Transfers, **kein beobachteter Eingang** und 0 Writes. Kein unabhängiger Beweis für on-chain Null.
- 8.95 ergänzt expliziten Admin-Commit `admin-zero-payout-commit-895`: nur genau diese drei Wallets, feste 9/6/1-Kohorte, manuelle Bestätigung, maximal drei noch pending pro Aufruf. **Vor dem ersten Write werden alle ausgewählten TX erneut vollständig mit Explorer geprüft**; bei unvollständigem Beleg/Positiv-Flow keine Änderungen des Stapels. Bestehende guarded SQL-RPC führt je Kandidat Payout-Status/Begründung/Zeitpunkt/Coverage/History; vorherige erfolgreiche Einzelupdates bleiben bei späterem Fehler erkennbar (nicht 3er-atomar). Keine Claims/Flows/Preise oder Cron-Änderungen. ZIP/Deploy/erste kontrollierte 3er-Live-Abnahme offen. `docs/releases/8.95-dao-zero-payout-guarded-commit.md`.
- Parallel TLN/VOW 8.92: vier Cron-HTTP-200 (20:56–21:11 UTC), keine Timeouts; BSC-Rückstand 514'218→441'405, ETH 14'737→6'884 Blöcke, noch vorläufig bis vollständig synchron.

### Phase 8.94 – DAO1: 16 Null-Reward-Claim-Aufrufe lesend auf Payout-Belege prüfen (17.11.2026)

- 8.93 SQL installiert; 8.91-Reconciliation Preview 1706/1690/16/1 korrekt, `true` Commit erfolgreich (marked 1690, 0 neue Flows/Claims). Unabhängige SQL-Abnahme: 2094 Kandidaten insgesamt (388 früher + 1690 neu markiert + 16 ohne Flow), 2078/2078 korrekt, 0 fehlerhaft.
- Verbliebene 16: drei Wallets 9/6/1, alle Transaktionen `ok`, Selector `0x86bb8f37`, Claim-Contract `0x2096...`, 16 Raw-Inputs, kein positiver Reward, kein USD, kein Eingangsflow, keine Payout-Prüfung/Begründung. Fehlende Speicherung ist **kein** eigenständiger On-Chain-Nullbeweis.
- 8.94 erweitert ausschliesslich die Admin-Edge Function um festen **read-only** Preview-Modus für diese drei Wallets und maximal drei TX je Aufruf. Bestehende Blockscout-Transaction-/Transfer-Pagination plus strenge `noPayoutEvidenceAllowed`-Entscheidung, keine Datenbank-Writes; vor Commit separat vollständige 16er-Prüfung nötig. ZIP/Deploy/Live-Tests offen, DAO-Cron aus. `docs/releases/8.94-dao-zero-claim-evidence-preview.md`.

### Phase 8.93 – DAO1: drei historische Claim-Contracts beim Existing-Reconcile (17.11.2026)

- 8.91 installiert; read-only `wallettracking_dao_reconcile_existing_native_891(false)` stoppte bei Prelaunch Block 41'856, obwohl NFT-ID/Contract, Claim-APTM, Raw/Flow-APTM, Selector und USD-NULL exakt konsistent sind. Ursache: 8.91 fixiert nur Transaktionsziel `0x2096...`, während die 1'706 bestehenden Kandidaten nach SQL **drei** bestätigte Empfänger besitzen: `0x2096...` (1'698), `0xdb330...` (7), `0xa1b761...` (1); jeweils Selector `0x86bb8f37`.
- 8.93 ändert **nur** diese Allowlist-Bedingung in der bestehenden service-only 8.91-Reconciliation. Installation führt keinen Commit aus, Betrags-/Preis-/NFT-/Flow- und Zählguards bleiben erhalten. ZIP/SQL installieren, **zuerst nur read-only Preview wiederholen**. Erst nach 1'706/1'690/16/1-Freigabe separat committen; DAO-Cron AUS. `docs/releases/8.93-dao-historical-contract-reconciliation.md`.

### DRINGEND / Phase 8.92 – TLN/VOW-Handelscache: RPC 429 und fehlende Receipts (17.11.2026)

- Produktiver Cron `tln-vow-trade-sync-5m` (Job 4) läuft alle fünf Minuten, jedoch bestätigten 20 HTTP-Antworten Status 500. BSC: `Receipt missing` bei wechselnden TX-Hashes; ETH: wiederholt `RPC HTTP 429` (auch `eth_blockNumber`), gelegentlich ebenfalls fehlende Receipts. Letzte Cache-Checkpoints 15.11.2026 BSC 02:01, ETH 13:51. Handelsvolumen bleiben berechtigt `SCAN UNVOLLSTÄNDIG`.
- 8.92: begrenzte RPC-Wiederholungen bei HTTP 429/503, geteilte Anfrage-Taktung sowie individuelle Nachladung fehlender Batch-Receipts. Niemals fehlende Transaktionen als 0 klassifizieren oder ungeprüfte Fenster als vollständig speichern. **Edge-Deployment und unabhängige Live-Abnahme offen.** Keine Cron-/DAO-/Preisänderung.
- Danach `net._http_response` und `tln_vow_trade_scan_state` für beide Chains prüfen; erst bei frischen und vollständig aufgeholten Checkpoints Handelsansicht abnehmen. Bei fortgesetzten 429 Provider-Kapazität und Aufrufrate messen/erhöhen bzw. Scanfenster weiter verkleinern. Details `docs/releases/8.92-tln-vow-trade-rpc-resilience.md`.

### Phase 8.91 – Konsistente vorhandene DAO1-Claims markieren (17.11.2026)

- 8.90 live erfolgreich: alle 161 verbleibenden historischen Flows übernommen, unabhängig SQL abgenommen: **164/164** genau 1 kanonischer Claim, genau 1 Native-Flow, Original-APTM/USD korrekt, Kandidat vollständig abgeschlossen.
- Neue globale Statistik: 1'706 noch `pending/pending/pending` und canonical false ohne Auditklassifikation; alle mit 1 kanonischem Claim, davon **1'690 mit genau 1 Native-Eingangsflow** und 16 ohne Flow. SQL-Audit für alle 1'690 bestätigt Native 18, erfolgreiche Claim-TX, APTM-Menge innerhalb 1e-12, USD identisch; ein echter unbewerteter Prelaunch.
- 8.91 als **SQL-only** vorbereitete Reconciliation: Vorschau ohne Writes, optionaler **atomarer** Commit erst nach ausdrücklicher separater Freigabe. Strikter fixer 1706/1690/16/1-Schutz; markiert beim Commit nur kanonisch bereits bestehende Claims. Historische USD NULL bleibt. 16 ohne Flow separat; Cron/Worker AUS. ZIP/SQL/Preview/Commit noch offen.
- Nächster Schritt ZIP 8.91 installieren, SQL-Migration ausführen, anschliessend einzeln **nur Preview** `wallettracking_dao_reconcile_existing_native_891(false)` kontrollieren. `docs/releases/8.91-dao-existing-native-reconciliation.md`.

### Phase 8.90 – Sequenzielle Übernahme der restlichen 161 historischen DAO1-Flows (17.11.2026)

- 8.89 live **installiert, SQL ausgeführt, Edge deployed**. Erster Commit `flowsCreated=3`, `claimsCreated=0`. SQL-Abnahme bestätigt für jede der drei TX: genau 1 vorhandener kanonischer Claim, 1 nativer Eingangsflow, Original-Wei und USD korrekt, Kandidat abgeschlossen. Keine Duplikate.
- 8.90 **nur Frontend**: Ein Admin-Klick startet alle verbleibenden 161 über unveränderte service-only 8.89-Edge-/SQL-Belege; je maximal 3 atomar, nach jedem vollständigen Stapel Checkpoint/Restanzeige, Sofortstopp bei Abweichung oder unklarer Antwort, kein automatischer Retry, manueller Stopp zwischen Stapeln. Keine SQL/Edge-Änderung, DAO-Cron und Live-Worker AUS.
- Nächster Schritt 8.90 ZIP installieren, Admin → Audit → „Alle verbleibenden 161 Flows übernehmen“, danach unabhängige SQL-Gesamtabnahme aller 164 und verbleibender Kandidaten. `docs/releases/8.90-dao-historical-flow-sequential-commit.md`.

### Phase 8.89 – Historische native Flows für kanonische DAO1-Claims (17.11.2026)

- 8.88 unter Admin bestätigt: automatischer read-only Durchlauf bis **164/164**, letzte Gruppe Offset 162–164 ohne Blocker (zwei Mint-Calls/Events, 397 Wei Abweichung), 0 Writes.
- Supabase live geprüft: 164 kanonische NFT-Claims alle mit positiven APTM- und USD-Werten und historischer Preisquelle, keine fehlende USD-Bewertung; `project_transaction_asset_flows` hat einen eindeutigen `flow_key`, aber keine `tx_hash`-Unique-Constraint und keine benutzerdefinierten Trigger.
- **8.89 vorbereitet:** neuer expliziter Admin-Commit für genau die ältesten 1–3 verbleibenden Claims, frisch nachgewiesener historischer NFT-Besitz und Native-Minter-Call/Event, service-only atomare SQL-Übernahme von genau einem Flow pro Transaktion, Kandidat abgeschlossen; kanonische Claims und Preise unverändert. **Install/SQL/Edge/Live-Test noch ausstehend**. Kein Massencommit ohne unabhängige DB-Abnahme des ersten Stapels. DAO-Cron/Live-Worker AUS.
- Nächster Schritt ZIP 8.89 installieren, SQL `20261117112925_dao_historical_existing_claim_flows_889.sql` ausführen, Edge `dao-reward-refresh/index.ts` **mit allen im Release aufgelisteten unveränderten Importmodulen** deployen. Danach genau eine bestätigte Admin-Dreierübernahme testen und JSON melden. Siehe `docs/releases/8.89-dao-historical-canonical-flow-commit.md`.

### Phase 8.88 – Historische 164 DAO1-Claims automatisch lesen (17.11.2026)

- 8.87 installiert/deployed. Erste 6 von 164 historischen Claims live verified: frischer NFT-Eigentumsnachweis, Original-Native-Minter-Trace/Event, genaue APTM-Menge. Darunter 2 Mint-Calls und 2 Events; bis 623 Wei Abweichung (innerhalb 1e-12-APTM-Grenze), 0 Writes.
- 8.88 erweitert **nur die Admin-Oberfläche**: automatischer serieller Lesedurchlauf der übrigen 158 Claims in unveränderten 3er-Edge-Aufrufen. Sofortiger Stopp bei Abweichung, Stopptaste zwischen Aufrufen, sichtbarer Offset, Session-Checkpoint, Fortsetzung. Startoffset 6 ist durch Live-Vorschau bestätigt. Keine Flow-Commits, kein SQL; DAO-Cron und Live-Worker aus.
- Nächster Schritt ZIP 8.88 installieren, **kein Edge-Deploy**, kein SQL; Admin → Audit → «Alle verbleibenden prüfen», Ergebnis melden. Erst nach vollständigem unabhängigen Nachweis gesonderte kanonische Flow-Ergänzung planen.
- `docs/releases/8.88-dao-historical-flow-full-read-only-check.md`

### Phase 8.52 – DAO1 historische Reto-Claims: Live-Abnahme abgeschlossen (14.11.2026 21:39:51 CET)
- **Version 8.52 installiert und live getestet:** `wallettracking_dao_finalize_single_claim` schreibt die Begleitfelder in `project_transactions` und `project_nft_claims.reward_usd` atomar. Der zuvor unvollständige Claim zu NFT #21 wurde durch `wallettracking_dao_repair_single_claim_852` repariert und einzeln vollständig geprüft. Neue Claim-Erstellung, Wiederholungsschutz und historischer `exact-v13`-Preis wurden live bestätigt.
- **Historische NFT-Lücke:** 125 Claims einer weiteren Wallet hatten `project_nft_claims.nft_id IS NULL`, während die eindeutige `project_transactions.claim_nft_id` samt Name, Typ und Contract vorhanden war. Reward-APTM und USD stimmten bereits überein. 1 Einzelreparatur (Claim-ID 29305), dann 124 weitere mit strengen Gleichheitsbedingungen durchgeführt. Die 17 betroffenen Miner-NFTs waren nicht vollständig in `project_nfts` katalogisiert (1 vorhanden, 16 nicht); es wurden **keine Stammdaten erfunden**. Danach 2'078/2'078 `exact-v13`-Claims konsistent.
- **Reto-Batch-Verarbeitung:** Insgesamt 393 Kandidaten der Reto-Wallet, davon **377 verifizierte native APTM-Auszahlungen vollständig kanonisch übernommen**, 16 nicht verifizierte Kandidaten unberührt. Erst Einzeltest, dann Batches 5 + 20 + 50 + 50 + 50 + 50 + 50 + 50 + 50 (zusammen mit den ersten 2 = 377). Jede Batch-Transaktion bricht bei nicht vollständig erfolgreicher Verarbeitung ab. Nach jedem Batch wurde die kanonische Konsistenz kontrolliert.
- **Abschlussaudit Schritte 52–70:** 393 Kandidaten / **377 kanonisch abgeschlossen** / **16 bereits als `failed_transaction` klassifiziert** / **0 weiter verarbeitbar**. Globaler `exact-v13`-Gesamtcheck nach letztem Batch: **2'454/2'454 konsistent, 0 Abweichungen**. Ausführliche neue Ergebnisse im Nachtrag „Schritte 53–70“ weiter unten.
- SQL-Repair der 125 historischen NFT-IDs wurde im Supabase SQL Editor direkt ausgeführt; seine geprüften Schutzbedingungen und Mengen sind unter `docs/releases/8.52-dao-canonical-reward-consistency.md` archiviert. Es wurde **keine weitere produktive Migration** nach 8.52 installiert. Dieses Paket ist Dokumentation, keine neue App- oder DB-Änderung.
- **Weiter offen:** Die allgemeine DAO-Reward-Pipeline (inkrementell, ERC20, Referral, Mehrbenutzer- und Job-Abnahme). Die 16 historischen Fehltransaktionen sind bereits geschützt klassifiziert. **DAO-Cron und Live-Worker bleiben deaktiviert.**


### Phase 8.51 – DAO1 historischer NFT-Eigentumsnachweis (Installation offen)
- Six ownership intervals for Reto's 377 claims are covered by a single verified sender. `wallet_address` is NULL in all 125 ownership rows; all 7 associated wallet EVM addresses are encrypted. **Do not backfill plaintext wallet addresses**.
- 8.51 SQL corrects the finalizer's redundant plaintext comparison: UUID-linked ownership period plus independently verified complete transfer history and exact last NFT owner remain required. No claim/reward/data updates run by migration.
- Install SQL, test exactly one existing 8.50 admin single-claim route, audit resulting canonical row; DAO Cron and Live Worker remain disabled.


## Phase 8.50 — Boot-Fehler bei 8.49 korrigiert (14.11.2026)

- Fehler beim Start von `dao-reward-refresh`: `price-target-worker.ts` lieferte bei Deployment nicht den erwarteten Export `processExactPriceTargets` (BOOT_ERROR 503).
- 8.50 liefert `index.ts` (Stand 8.49) **und** die unveränderte, korrekte `price-target-worker.ts` (Stand 8.48) ausdrücklich zusammen; kein neues SQL.
- Offen: beide Dateien gemeinsam deployen, Boot und `admin-miner-claim-preview-849` ohne Datenänderung testen; danach erst kontrollierte Claim-Übernahme.
- DAO-Cron und Live-Worker deaktiviert lassen.

## 8.49 – 14.11.2026 19:52:27 CET

Phase 8.49 vorbereitet: 377/377 historisch verifizierte native APTM-Miner-Claims; null kanonisch. Streng geprüfte 1-Claim-Übernahme mit bestehendem Finalizer, Admin-Preview/Single, SQL- und Edge-Installation sowie Live-Regression offen. DAO-Cron/Live-Worker bleiben aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

## 8.49 – 14.11.2026 19:52:00 CET

Phase 8.49 vorbereitet: 377/377 historisch verifizierte native APTM-Miner-Claims; null kanonisch. Streng geprüfte 1-Claim-Übernahme mit bestehendem Finalizer, Admin-Preview/Single, SQL- und Edge-Installation sowie Live-Regression offen. DAO-Cron/Live-Worker bleiben aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

## Phase 8.48 – Zentraler DAO1/APTM-Preisnachlauf (noch nicht installiert)

Stand 14.11.2026 18:22:40 CET. Der Browser-Backfill ist auf den angemeldeten Benutzer beschränkt; der serverseitige DAO-Worker konnte bisher nur vorhandene exakte Anker anwenden. Neue service-role-only Auswahl über alle Benutzer (`wallettracking_dao_next_price_targets_848`) plus serverseitiger, begrenzter `exact-v13`-Preisnachlauf (bis vier Zielblöcke). Read-only Admin-Preview, manueller Admin-Batch und separat per Secret/Flag gesperrte Cron-Route. Die 316 bereits bewerteten APTM-Auszahlungsflows bleiben unverändert; 61 fehlende Zielblock-Anker bei Retos Wallet müssen nachgezogen werden. **Keine kanonische Reward-, Claim-, Bot- oder NFT-Änderung.** Migration, Edge-Deployment und Live-Test stehen aus; DAO-Cron/Live-Worker bleiben aus. Details und Einzel-Schritt-Abnahme: `docs/releases/8.48-dao-global-exact-pricing.md`.

## 8.47 – CORS-Fix DAO-Browser-Verifikation

Stand 14.11.2026 17:09:05 CET. Phase 8.46: `Failed to send a request to the Edge Function`, obwohl direkter Supabase-Test des Modus 8.45 erfolgreich. Ursache im Quellcode: Batch-Response ohne CORS-Headers; 8.47 setzt vorhandene Header auf alle JSON-Antworten dieser Route. **Edge Function muss separat deployt werden**. Verifikation per Browser danach live testen; 149/377 unabhängig bestätigt, tatsächlichen DB-Stand nach nicht lesbarem Browser-Response prüfen. Kein SQL, keine Änderung der Prüflogik, DAO-Cron/Live-Worker bleiben aus. Dokumentation: `docs/releases/8.47-dao-payout-cors.md`.


## 8.46 – Browser-gesteuerte manuelle DAO-Payout-Verifikation

Stand 14.11.2026 16:14:05 CET. Version 8.46 ergänzt Admin → Audit um eine manuelle Start-/Stopp-Steuerung, die die geprüfte 8.45-Edge-Function sequenziell aufruft, maximal 25 Aufrufe zu je 12. Stoppt bei Fehler, `no_pending` und Benutzer-Stopp; Browser-Tab muss offen bleiben. Ausgangsstand **137/377 verifiziert, 240 offen** laut letzten 10 erfolgreichen Multi-Batch-Meldungen; Live-Test 8.46 offen. **Kein SQL/Edge-Deployment, Cron/Live-Worker aus.** Details: `docs/releases/8.46-manual-dao-payout-drain.md`.

## Phase 8.45 – Kontrollierte Mehrfachverifikation nativer DAO-Auszahlungen

Stand 14.11.2026 15:32:49 CET. Neuer Modus `verify-native-payout-multi-batch-845` bis 3×4 Auszahlungen, 50s Zeitbudget, unveraenderte 8.43-Explorer/RPC-Pruefregeln; keine SQL-Migration. Installation/Live-Abnahme offen. Letzter nachgewiesener Stand Wallet `8a3c5dc6…`: 17 von 377 verifiziert, 360 offen, ohne Fehler und ohne kanonische Writes. Weiter nur manuell mit Admin-JWT; DAO-Cron/Live-Worker deaktiviert. Details: `docs/releases/8.45-native-payout-multi-batch.md`.

---

## Phase 8.44 – Native DAO-Auszahlungen, begrenzte Verifikation

# WalletTracking 8.44 – begrenzter manueller Batch fuer native DAO1-Auszahlungen

Stand: 14.11.2026 15:21:33 CET. Installation und Live-Abnahme ausstehend.

## Kontext

Die 8.43-Einzelverifikation wurde an einer Blockchain-Transaktion erfolgreich live getestet. `payout_status=verified`, `payout_reason=explorer-native-matches-persisted-flow`, 18 Dezimalstellen, 1 Flow; keine kanonischen Reward-, Preis- oder NFT-Writes. Bei der Wallet `8a3c5dc6-0610-482d-a327-3f3ba03db158` waren initial 377 positive native APTM-Flows; einer wurde bereits bestaetigt (verbleibende Anzahl im Live-System vor Batch erneut pruefen).

## Implementierung

Neuer Admin-Modus `verify-native-payout-batch-844` in `supabase/functions/dao-reward-refresh/index.ts`. Request `{"mode":"verify-native-payout-batch-844","walletId":"<uuid>"}`. Kein Cron-Secret; Admin-Bearer-JWT. Voraussetzung `DAO_REWARD_ENABLE_TEST_IMPORT=true`, `DAO_REWARD_ENABLE_LIVE_WORKER` ungleich `true`.

Nur die vier aeltesten `pending` Kandidaten mit `status=pending`, `audit_classification IS NULL` und `canonical_existing_verified=false` fuer die angegebene Wallet. Je Transaktion: erfolgreicher Claim-Selector, Mining-Contract, Blockabgleich, live erneut ermittelte direkte positive Internal-Transaction-Auszahlung aus Apertum Explorer, dann unveraenderte `wallettracking_dao_verify_single_native_payout_843` RPC. Deren SQL-Sicherheitsregeln bleiben massgebend (Wallet, Transaction, Flow, Wei-Gleichheit, CAS, Existing-Claim-Schutz). Externe Fehler, fehlende/abweichende Nachweise und unerwartete RPC-Resultate stoppen den Batch, ohne dem betroffenen Kandidaten einen Verifikationsstatus zu geben. Vor weiteren API-Anfragen Zeitbudget 45 Sekunden, maximal vier Kandidaten.

Nur `dao_reward_claim_candidates.payout_*` und begrenzte Pruefhistorie koennen bei erfolgreichem Nachweis aktualisiert werden. Keine kanonischen Claims, keine Preise, keine NFT-Zuordnungen, keine Cron- oder Queue-Writes. **Keine SQL-Migration erforderlich**: bestehende 8.43-RPC wird wiederverwendet. Das alte `check-pending-native-payouts-test-wallet` ist wegen vorausgesetztem kanonischen Reward-Betrag weiterhin nicht fuer die 377 Kandidaten geeignet.

## Installation und Abnahme

1. Update-ZIP einspielen; nur `dao-reward-refresh/index.ts` in Supabase deployen. Kein SQL.
2. Ein Batch fuer `8a3c5dc6-0610-482d-a327-3f3ba03db158` mit Admin-JWT und dem obigen Body; JSON pruefen. Keine unkontrollierten Wiederholungen.
3. Anschliessend pro Status SQL verifizieren, insbesondere keinen kanonischen Claim/Preis/NFT-Write und nachvollziehbare Menge verifizierter Auszahlungen.
4. Erst nach erfolgreicher Batch-Abnahme weitere Kandidaten kontrolliert verifizieren. DAO-Cron und Live-Worker deaktiviert lassen.

---

## Phase 8.43 – Explorer-gestuetzte Einzelpruefung nativer DAO-Auszahlungen

# WalletTracking 8.43 – Eine native DAO1-Auszahlung gezielt verifizieren

Stand: 14.11.2026 13:02:10 CET. Installation und Live-Test **ausstehend**.

Die 377 nativen APTM-Kandidaten besitzen persistierte Flows, aber `claim_reward_aptm` ist leer. Die alte Funktion `wallettracking_dao_check_pending_native_payouts` wuerde sie als `needs_review` markieren. **Diese Bestandsfunktion bleibt unveraendert und darf fuer diese Wallet nicht verwendet werden.**

Neue service-role-only RPC `wallettracking_dao_verify_single_native_payout_843` prueft exakt einen expliziten TX-Hash, nur `pending` ohne bisherige Audit-Klassifikation / kanonischen Claim, eindeutige erfolgreiche TX, Mining-Contract, genau einen positiven nativen Eingang, korrekte 18 Dezimalstellen, einen `claim-native:` Flow und exakte Wei-Gleichheit. Die Edge Function re-traced zuvor dieselbe TX live ueber alle Explorer-Internal-Transaction-Seiten zur entschluesselten Empfaenger-Wallet; nur direkter Contract-Payout ist im 8.43-Pilot erlaubt. Fehler/Inkongruenz: **keine** Verifikation. Bei Erfolg werden ausschliesslich `payout_*` Felder und die begrenzte Pruefhistorie via bestehender CAS-RPC geschrieben.

**Erster manueller Test:** Nur die zuvor unabhaengig gepruefte Transaktion `0xe42ec5ba745314680879313587e05995bc5fee27706d819b8a7bebc249024ccb` der Wallet `8a3c5dc6-0610-482d-a327-3f3ba03db158` pruefen. Edge Function Modus `verify-one-native-payout-843`, Body {"mode":"verify-one-native-payout-843","walletId":"8a3c5dc6-0610-482d-a327-3f3ba03db158","txHash":"0xe42ec5ba745314680879313587e05995bc5fee27706d819b8a7bebc249024ccb"}, Auth: Admin Bearer JWT (nicht Cron-Secret). Flags `DAO_REWARD_ENABLE_TEST_IMPORT=true` und `DAO_REWARD_ENABLE_LIVE_WORKER` ungleich `true` erforderlich.

Keine Massenverifikation, kein USD-Preis, kein kanonischer Claim, keine NFT-/Ownership-Aenderung. DAO-Cron und DAO-Live-Worker deaktiviert lassen. Nach dem ersten Erfolg die weiteren Auszahlungen einzeln/gebuendelt nur nach gesonderter Freigabe abnehmen.

---

## Phase 8.42 – DAO fehlgeschlagene Claim-Transaktionen (14.11.2026 12:46:58 CET)

Erstellt: 14.11.2026 12:46:58 CET. Installation in Supabase **noch ausstehend**.

- Die 16 nachgewiesenen fehlgeschlagenen Miner-Claim-Transaktionen (`error`) der Wallet `8a3c5dc6…` sind das Testziel; nach Migration Anzahl und Klassifikation per SQL verifizieren. Weitere Faelle werden nur bei denselben strengen Voraussetzungen klassifiziert.
- `audit_classification='failed_transaction'` nur bei genau einer passenden Fehlertransaktion, passendem Block, ohne Eingang-Flow, ohne bestehenden kanonischen Claim, ohne bestehende Klassifikation, ohne verifizierten bisherigen Claim und ohne TX-Reward-Gutschrift. `status`, `payout_status` und NFT-Zuordnung bleiben unberuehrt.
- `wallettracking_dao_next_native_claim_candidate`: Automatische Klassifikation vor Auswahl fuer die betroffene Wallet; Kandidatenauswahl setzt Transaktionsstatus `ok`/`success` und passenden Block voraus. Service-Role- und Wallet-Berechtigungspruefung unveraendert.
- Zentrale Finalisierung **nicht** angefasst; sie prueft Status, Auszahlungsflows, Preisnachweis und Schutz bestehender Rewards bereits selbst.
- Keine Cron-/Live-Worker-Aktivierung. Kein Update bestehender Preise, Rewards, NFT- oder kanonischer Claim-Daten.
- Gezielter Live-Test nach SQL-Installation erforderlich, einschliesslich unveraenderter 377 APTM-Flow-Kandidaten und Schutz von `unpriced_before_exact_anchor` / `no_payout_evidence`.


---

## Phase 8.41 – DAO1 Tageslimit geschuetzter Verarbeitungs-Schritte ( 14.11.2026 12:29:07 CET )

- Die beiden service-role-geschuetzten RPCs `wallettracking_dao_reward_claim_v2(date)` und `wallettracking_dao_reward_claim_staged_v3(date)` reservieren nun **höchstens 32 statt 8 Schritte pro Wallet und Schweizer Kalendertag** (`step_count < 32`).
- **Keine Änderung** an der Fehlergrenze von 3, Leasing/Lease-Token, SKIP LOCKED, Queue-Auswahl, Batch-Limit (10), individuellem Explorer-Zeitbudget oder den historischen Checkpoints.
- Die Grenze gilt gemeinsam über beide Phasen, da `wallet_reward_refresh_attempts.step_count` pro Wallet/Tag geführt wird. Bereits auf 8 stehende Wallets können nach Installation der SQL-Migration am selben Tag kontrolliert weiterlaufen; Zähler werden nicht zurückgesetzt.
- **Keine** Aktivierung von Cron oder DAO-Live-Worker. Keine Änderungen an kanonischen Claims, Reward-Beträgen, Preisen oder NFT-Zuordnungen. Migration muss erst manuell in Supabase installiert und lesend verifiziert werden. Noch nicht live getestet.
- Vor der Freigabe der automatischen DAO-Verarbeitung weiterhin historische `partial`-Scans, Claim-/Reward-, Preis- und Referral-Prüfungen abschliessen.


## Phase 8.40 – Nullbestands-Token in Snapshot-Spalten ausblenden (14.11.2026 12:07:26 CET)
- Zeilen werden nur angezeigt, wenn ein aktueller positiver Bestand, ein positiver gestakter LP-Bestand oder ein positiver Bestand in einem geladenen angezeigten Snapshot vorliegt.
- Historische Token-Zeilen und zusätzliche Chain-Karten werden nicht länger durch ausschliessliche Nullbestände und gespeicherte Kurse erzeugt.
- Früher positiv gehaltene Token bleiben als «nur historisch» sichtbar, wenn der positive Stichtag in den angezeigten Snapshots liegt. Fehlende Daten bleiben «–» und werden nicht als Null angenommen.
- Die fünf neuesten automatischen Snapshot-Spalten und die Option «Alle Snapshots anzeigen» bleiben bestehen; sämtliche gespeicherten Positionen bleiben unverändert. Kein SQL und kein Edge-Deployment.
- Noch offen: Langfristige Verdichtung weiter beobachten und Bitcoin-Fallback bei tatsächlichem Provider-Ausfall nachweisen.

## Phase 8.39 – Fünf automatische Snapshot-Spalten als Standard (14.11.2026 12:00:00 CET)
- Unter «Wallet-Bestände» erscheinen **ohne manuelle Auswahl** die fünf neuesten verfügbaren automatischen Stichtage als historische Spalten in Summary und Wallet-Details, auch wenn die Verlaufsliste zugeklappt ist.
- Checkbox «Alle Snapshots anzeigen» im automatischen Bestandsverlauf blendet sämtliche verfügbaren archivierten Stichtage als Spalten ein; beim Abwählen wieder die fünf neuesten. Keine einzelne Tagesauswahl und keine Begrenzung auf vier Stichtage mehr.
- Gespeicherte Tages-/Wochen-/Monatsaufnahmen werden unverändert gelesen, keine Änderung der Verdichtungsregel (7 Tage täglich, danach wöchentlich, danach monatlich). Fehlende historische Wallet-Positionen bleiben «–».
- Historische Positionen werden nur für eingeblendete Tage in kleinen Gruppen mit der bestehenden benutzergebundenen RLS-Berechtigung abgefragt. Keine Datenänderungen, keine SQL-Migration und kein Edge-Deployment.
- Test: fünf Standardstichtage, «Alle»-Einblendung, Rückkehr auf fünf, Wiederverwendung bereits geladener Daten und Benutzerisolation bestanden. Live-Test im Browser offen.
- Weiter offen: tatsächlicher Bitcoin-Fallback-Einsatz bei HTTP 429 noch nicht nachgewiesen; langfristige Snapshot-Verdichtung beobachten.

## Phase 8.38 – Automatische historische Bestände in Snapshot-Spalten (14.11.2026 11:51:11 CET)
- Auswahl im automatischen Bestandsverlauf ergänzt. Maximal vier automatische Stichtage als zusätzliche Spalten in den Wallet- und Summary-Tabellen; historische Beträge aus dem vorhandenen Archiv, manuelle Snapshots unverändert.
- Fehlende historische Wallets/Token: „–“ statt Null; nur historisch vorhandene Tokens entsprechend gekennzeichnet. Kein SQL, keine Edge Function.
- Live-Test der Spaltenauswahl offen; Bitcoin-Fallback unter tatsächlichem HTTP 429 weiterhin nicht direkt nachgewiesen.

## Phase 8.37 – GoPlus-Cache und Rate-Limit-Steuerung (14.11.2026 11:16:58 CET)
- Ursache: GoPlus meldete `api-code-4029` (Anfragelimit erreicht); bisherige Einzel-Fallbacks erzeugten zusätzliche Requests.
- `token-risk` verwendet einen gemeinsamen, benutzerunabhängigen Cache pro EVM-Chain-ID und öffentlicher Contract-Adresse: erfolgreiche GoPlus-Bewertung 24 Stunden; nicht verfügbare Einzelergebnisse 15 Minuten (ausser bei 4029). Cachewerte sind Risikosignale, keine Freigabe.
- Serverseitige, transaktionsgesperrte GoPlus-Anfragefreigabe: mindestens 3 Sekunden Abstand zwischen Freigaben, 60 Minuten Cooldown bei `api-code-4029` oder HTTP 429. Maximal ein GoPlus-Batch pro Edge-Aufruf, keine automatischen Einzel-Retries bei Teilergebnissen. Die tatsächliche Verarbeitung kann bei hoher Last gedrosselt sein; nicht geprüfte Contracts bleiben als solche gekennzeichnet.
- Diagnose: `providerStatus` unterscheidet `ok`, `api-code-4029`, `api-code-4029-cooldown`, `request-throttled` und sonstige Providerfehler; Cache-Treffer `cacheStatus: hit`. Bekannter BscScan-Phishing-Contract bleibt als Warnsignal. Manuelle Spam-Bestätigung unverändert.
- Zugriff: JWT weiterhin Pflicht, Cache speichert ausschliesslich öffentliche Contract-Daten; Tabellen mit RLS ohne `anon`/`authenticated`-Zugriff, RPC nur für `service_role`. Bei Cache-/Gate-DB-Fehler keine unkontrollierten GoPlus-Anfragen.
- **Installation in dieser Reihenfolge:** SQL-Migration `20261114111546_token_risk_goplus_cache_837.sql` einmalig in Supabase ausführen, ZIP einspielen, anschliessend `token-risk/index.ts` neu deployen. Kein anderer Edge-Worker und keine Änderung an Wallets/DAO/Cron.
- Lokale Tests: Cache-Hit ohne zweiten Provider-Aufruf, API-Code 4029 und Abkühlzeit, Fail-Closed-Verhalten bestanden. Live-Abnahme offen (GoPlus-Limit kann noch aktiv sein).
- Danach: Bitcoin-Fallback 8.25 unter realem HTTP 429 prüfen, Snapshot-Betrieb weiter beobachten.

## Phase 8.36 – GoPlus-Provider-Diagnose (14.11.2026 11:05:55 CET)
- Live-Retest 8.35: Zwei BSC-Contracts lieferten `checked:false`, obwohl einer zuvor geprueft wurde und die direkte Browser-Abfrage fuer den zweiten `code=1` lieferte. Die Ursache ist noch nicht identifiziert; Netzwerkfehler, Rate-Limits, Zeitueberschreitungen und fehlende Datensaetze wurden bisher gleich behandelt.
- `token-risk` liefert nun `providerStatus` pro Contract (`http-429`, `http-403`, `timeout`, `network-error`, `invalid-json`, `api-code-*`, `missing-contract-result`, `ok`) ohne Geheimnisse oder unkontrollierte Provider-Nachrichten. Bei nicht verfuegbaren Daten bleibt `checked:false` und die manuelle Spam-Kennzeichnung unveraendert.
- Installation: Edge Function `token-risk/index.ts` neu deployen; keine SQL-Migration. Anschliessend Network-Response fuer `0xed019f84763497417c211107705742bbb061da9b` und `0x2ca0ce162ae5ca5fc1c735772b71b9cedcfd4681` pruefen; `providerStatus` mitteilen. Bitcoin-Fallback danach offen.

## Phase 8.35 – GoPlus-Teilantworten pro Contract nachpruefen (14.11.2026 10:49:00 CET)
- Bei GoPlus-Sammelantworten mit fehlenden Contract-Eintraegen folgt eine einmalige, begrenzte Einzelabfrage je fehlender Adresse (maximal 10 Zusatzanfragen, Gruppen zu 3). Auch HTTP-200-Teilantworten werden nicht als Vollstaendigkeit missverstanden.
- Nur `code=1` und ein nichtleerer Datensatz fuer die exakt angefragte Adresse gelten als geprueft; Felder wie `is_open_source=0` bleiben Warnhinweise, kein Betrugsbeweis.
- Fehlen auch nach Einzelabfrage Daten, bleibt `checked:false` / «GoPlus nicht verfuegbar». Bekannte Phishing-Labels und manuelle Spam-Markierung unveraendert.
- Edge Function `token-risk/index.ts` neu deployen; keine SQL-Migration. Lokale Regressionstests und Live-Test des BSC-Contracts `0xed019f84763497417c211107705742bbb061da9b` nach Deployment erforderlich.
- Offen danach: Bitcoin-Fallback bei echtem HTTP 429, Snapshot-Monitoring.

## Phase 8.34 – Token-Risiko-Chain-Aliase (14.11.2026 10:34:28 CET)
- `token-risk`: `arb`/`arbitrum`, `avax`/`avalanche`, `matic`/`polygon`/`pol` korrekt zugeordnet; Fehlerantworten für Adressen, unbekannte Chains und nicht unterstützte Non-EVM-Prüfungen getrennt.
- Manuelle Spam-Bestätigung unverändert; GoPlus-Ausfall ist weiterhin keine Freigabe.
- Edge-Deployment `token-risk/index.ts` erforderlich. Keine SQL-Migration. Tests lokal; authentifizierter Live-Retest offen.
- Danach offener Bitcoin-Fallback-Livetest und historische Snapshot-Kontrolle.

#### Phase 8.33 – Vereinheitlichte Chain-Aliase (14.11.2026 10:04:32 CET)
- Technische Token-Metadaten: UI-Schlüssel `arbitrum`, `avalanche`, `polygon`, `solana` werden nur für `public.chains` zu `arb`, `avax`, `matic`, `sol` normalisiert; Original-Keys in Token-/Cache-Tabellen bleiben erhalten.
- SQL-Migration und `token-metadata/index.ts` erforderlich. Live-Tests Polygon WETH, Avalanche WETH.e und Solana-Mint offen. Sicherheits-/Bitcoin-Fallback-Retest weiterhin offen.

## Phase 8.32 – Arbitrum-Metadaten-Alias (13.11.2026 14:49:48 CET)
- Ursache `unknown-chain`: UI-/Token-Key `arbitrum`, Datenbank-Registry `public.chains.chain_key = arb` (EVM Chain-ID 42161).
- Edge Function `token-metadata/index.ts` liest Konfiguration über `arb`, behält `arbitrum` für vorhandene Stammdaten und Metadaten-Cache bei. Die Chain-ID wird vor `eth_call` verifiziert; Arbitrum-RPC-Fallback verwendet den registrierten Key.
- SQL-Migration: `wallettracking_metadata_address` erkennt den Alias, ohne `chains`, `predefined_tokens` oder historische Werte umzubenennen.
- Deployment: **zuerst SQL-Migration einmalig ausführen**, danach `token-metadata/index.ts` neu deployen. Test: Arbitrum WETH `0x82af49447d8a07e3bd95bd0d56f35241523fbab1` via Admin → Vordefinierte Token → Prüfen. Erwartete technische Dezimalstellen: 18, verifiziert on-chain.
- Kein Eingriff in Preise, Wallet-Bestände, Rewards, DAO-Jobs oder Cron. Token-Sicherheitsprüfung bleibt getrennt. Danach Bitcoin-Fallback- und Snapshot-Retest fortsetzen.

### Phase 8.31 – Risikosignale und Metadaten-Diagnose (13.11.2026)
- Neue authentifizierte `token-risk` Edge Function (GoPlus, bei BSC best-effort Explorer-Label, fehlende Prüfbarkeit sichtbar); dokumentierter BSC `Fake_Phishing1123827`-Contract als Verdacht. Technische Dezimalstellen ≠ Sicherheitsfreigabe.
- `token-metadata` liefert verständliche Diagnose beim Einzelaufruf und lesenden Arbitrum-RPC-Fallback. Beide Edge Functions nach ZIP-Installation neu deployen. Keine SQL.
- Details, Grenzen, Tests: `docs/releases/8.31-token-risk-metadata-diagnostics.md`. Danach Bitcoin-Fallback und Snapshot-Historie prüfen.

### Phase 8.30 – Automatische Batch-Verarbeitung technischer Token-Metadaten (13.11.2026)
- Admin → Vordefinierte Token: Der bestehende Sammel-Button prüft nach einem Klick alle Token in seriellen, vom vorhandenen `token-metadata`-Dienst gelieferten Batches zu je maximal zwölf Einträgen; kein erneutes Klicken pro Batch mehr nötig.
- Laufende Zähler für geprüft, bestätigt, Pooladressen, Konflikte und offene/fehlgeschlagene Ergebnisse, dazu verarbeitete Batches; Abschlussmeldung.
- Bei Request-/Netzwerkfehler bleibt der Cursor für die nächste Wiederaufnahme erhalten. Wiederholte/ungültige Cursors und maximal 200 Batches stoppen sicher; es gibt keinen unbeschränkten Aufruf-Loop.
- Auch der persönliche Button „Technische Metadaten prüfen“ verwendet den gleichen Ablauf. Einzel-Token-„Prüfen“ bleibt verfügbar.
- Keine neuen SQL-Migrationen oder Edge-Function-Änderungen. Datenbank-Konfliktregeln, Rate-Limits, Preise und Walletbestände unverändert. Keine stillschweigend angenommenen Dezimalstellen.
- Live-Abnahme: mindestens eine Tokenliste mit mehr als 12 Einträgen vollständig durchlaufen lassen, Fortschrittsanzeige und abschliessende offene Token prüfen.
- Nach Live-Abnahme: Bitcoin-Fallback 8.25 und Bestandsverlaufs-Retention 8.27 weiter prüfen.


### Phase 8.29 – Token-Metadaten gezielt prüfen (13.11.2026)
- In Admin → Vordefinierte Token erscheint bei technischen Dezimalstellen „offen“/„Konflikt“ ein Knopf **Prüfen** pro Token.
- Umgeht die 12er-Paginierung des Sammelimports und fordert eine erneute serverseitige Prüfung des konkreten Contracts an.
- `token-metadata` akzeptiert `refresh:true` nur mit Admin-JWT oder Service-Role und meldet Status/Grund zurück. Keine geratenen Token-Dezimalstellen, kein Schreiben von Kursen oder Beständen.
- Diagnose XAUt (`0x68749665ff8d2d112fa859aa293f07a622782f38`) und DSYNC (`0xf94e7d0710709388bce3161c32b4eea56d3f91cc`): technische Werte derzeit unverified; Live-Bestätigung nach Deployment offen.
- **Deployment nötig:** `supabase/functions/token-metadata`; reine ZIP-Installation aktualisiert diese Funktion nicht.

## Phase 8.28 – Token-Promotion / Dashboard-Kursflag (13.11.2026 10:19:50 CET)

- Sichere Token werden beim Übernehmen in `predefined_tokens` umgehend zur technischen ERC20-Metadatenauflösung an den vorhandenen Dienst `token-metadata` gegeben. Bei nicht erreichbarem Provider bleibt die Übernahme bestehen und ein Hinweis erklärt den manuellen Admin-Nachtest.
- «In der Dashboard-Kursübersicht anzeigen» auch für allgemeine, nicht projektgebundene Token aktivierbar/deaktivierbar. Gehaltene allgemeine Token sind bei vorhandenem Preis und Bestand > 1 USD oder explizitem «immer anzeigen» weiterhin sichtbar, sofern das Kurs-Flag eingeschaltet ist.
- Projekt-Token benötigen unverändert eine Beteiligung am betreffenden Projekt. Keine erfundenen Preise oder Dezimalstellen.
- Live-Abnahme: Ethereum XAUD und DSYNC auf technisches Dezimalstellenresultat und Flag-Persistenz prüfen. Der bestehende `token-metadata`-Dienst muss installiert sein.
- Nach Abschluss wieder zu Bitcoin-Fallback-Livetest und Snapshot-Kontrolle zurückkehren.

## Phase 8.27 – Aufbewahrung automatischer Bestandsverläufe (13.11.2026 09:59:58 CET)

- SQL-Korrektur für `wallettracking_compact_balance_history(date)` am 13.11.2026 vom Benutzer bereits erfolgreich in Supabase ausgeführt; Migration für Git-Projekt nachgeliefert.
- **Retention:** Alter 0–6 Tage täglich, Alter 7–365 Tage neuester Wert je ISO-Woche, ab 366 Tagen neuester Wert je Kalendermonat. Manuelle Snapshots unangetastet.
- **Live:** Snapshot-/Archivierungs-Trigger nach Fix am 13.11. wieder aktiv; frühere Bestandsverlaufslücke 02.–12.11.2026 bleibt, keine künstliche Rekonstruktion aus aktuellen Beständen.
- **Offen:** Bitcoin-Fallback Phase 8.25 bei realem 429 kontrollieren; tägliche Archivierung künftig weiter beobachten; Verdichtung langfristig anhand echter historischer Daten verifizieren.
- **Arbeitsregel:** Jede Scriptänderung ausschliesslich als versioniertes ZIP mit geänderten Projektdateien ausliefern, auch wenn SQL zuvor direkt in Supabase getestet wurde.

## Phase 8.26 – Wallet-Verwaltung kompakt (13.11.2026 08:11:57 CET)

Wallet-Eingaben standardmaessig eingeklappt, nur Wallet-Namen sichtbar; je Wallet und alle gemeinsam auf-/zuklappbar. Keine SQL-/Edge-Änderungen. Browser-Livetest am 13.11.2026 bestätigt.

## Phase 8.24 – Referral-DID Cache-first (12.11.2026 17:02:17 CET)

Historische DID-Transferdaten werden je DID innerhalb einer Seiteninstanz nur einmal geladen; weitere Tab-Wechsel verwenden die vorhandenen Daten. Historisch gehaltene DIDs aus `project_nft_ownership` bleiben Kandidaten, selbst wenn die DID inzwischen umgezogen ist. Die persistente NFT-Transferhistorie liegt weiterhin serverseitig; keine Klartext-Wallet-Adressen oder DID-Namen im Browser-Storage. Neue Seiteninstanzen fragen den Server-Cache erneut ab. Vollstaendiges inkrementelles On-Chain-Nachladen ist damit **nicht** neu implementiert und bleibt an die bestehende Edge-Cache-Strategie gebunden. Keine SQL-Migration, kein Eingriff in Reward-Betraege, NFT-Zuordnungen oder historische Preise. DAO-Cron und Live-Worker bleiben deaktiviert. Live-Retest der DID-Anzeige offen.

## Release 8.23 · 12.11.2026 16:55:21 CET · 20261112-165521

**Referral DID-/Namensanzeige (nur Browser-Code):** Bei Contract-Withdrawals ohne explizit transaktionsbelegte DID wird die ERC-721-Transferhistorie der im Account bekannten DAO1-DIDs über bestehende `apertum-nft-history`-Funktion geladen. Zuordnung ausschliesslich bei genau einer DID, deren letzte gültige Besitzer-Transferposition vor dem Auszahlungsblock auf die betreffende Wallet zeigt. Gespeicherter DID-Alias aus `team_alias_list`, sonst `DID #<ID>`. Bei mehrfachen DIDs, unvollständiger Transferkette oder fehlendem History-Zugriff keine geratenen Namen/IDs. Historische DID-Ownership ist **kein Nachweis für die wirtschaftliche Entstehung des Rewards**.
**Live-Kontrollfälle:** 9 Auszahlungen Wallet `4c16c7a8…` → DID 21043; 8 Auszahlungen Wallet `0f49c5a3…` → DID 18438 (2 NFT-Transfers pro DID im Explorer und Cache). Weiterhin UI-Test, Cache-Verfügbarkeit und Mehrfach-DID-Regressionsprüfung nötig. **Keine SQL-Migration / keine Edge-Function-Änderung; bestehende Rewards, Preise, NFT-Claims und Scans unverändert. DAO-Cron und Live-Worker OFF.**

## Release 8.22 · 12.11.2026 16:21:40 CET · 20261112-162140

**DAO1/APTMDAO-Referral-Auswertung (Code vorbereitet; noch keine produktive Freigabe):**
- Feste Referral-Empfänger-Wallet entfernt. Server- und Browser-Klassifikation verwenden weiter einen **erfolgreichen Contract-Aufruf** an `0xcd40…f856` und einen **tatsächlich eingehenden wUSDT-Flow vom selben Contract**; DID-markierte Transaktionen bleiben ein gesonderter, beleggebundener Pfad. Beliebige wUSDT-Eingänge oder blosses `withdraw` sind kein ausreichender Nachweis für die wirtschaftliche Referral-Herkunft; Vertragssemantik und neue Wallets sind weiterhin live zu validieren.
- Gezielter wUSDT-Transfer-Import auch für weitere registrierte Apertum-Wallets; bei fehlender eigener TX nur echte erfolgreiche Explorer-TX-Details für Contract-Kandidaten nachladen. Kein pauschales Referral-Posting, keine Aktualisierung vorhandener Claims, Preise oder NFT-Zuordnungen. Roh-Import folgt bestehenden Idempotenz-/Checkpoint-Regeln.
- Server-Referral-Audit ist walletübergreifend. Der staged-Abschluss prüft jetzt einen wirklich `complete`/`empty_verified` Referral-Scan-Checkpoint, statt allein aufgrund einer bestimmten Wallet oder bisher leerer Eingangsflows Vollständigkeit anzunehmen. DAO-Tageslimite bleiben unverändert.
- Anzeige «DID / Name»: bevorzugt ausdrücklich an der TX belegte DID und gespeicherten Alias. Ohne TX-DID wird eine einzelne **aktuell** zugeordnete Wallet-DID als solche gekennzeichnet; bei mehreren DIDs «nicht eindeutig» statt willkürlicher Zuordnung. Historische DID-Zuordnung nicht aus aktuellem Besitzer erfunden.
- **Noch offen / Live-Abnahme:** Deployment der aktualisierten Edge Function, Browser- und Server-Gegenprobe für alle Wallets (insbesondere `0f49c5a3…` mit 8 möglichen Contract-Auszahlungen); Referral-Contract-Semantik und DID-Transaktionen prüfen, Schutz gegen Doppelzählung über Wallets, USD-Preise unabhängig über zentralen Preisweg, historische Scans fertigstellen. Keine SQL-Migration. **DAO-Cron und DAO-Live-Worker OFF**, Freigabe nur ausdrücklich nach E2E-Audit.

## Live-Nachtrag 8.21 · 12.11.2026 13:17:11 CET · DAO-Jobtests (12.11.2026)

**Verifiziert in Supabase / Edge Function (nicht allgemeine Produktionsfreigabe):**
- Manuelle Aktualisierung kann im UI nur **für alle Wallets** gestartet werden; Test für alle Wallets durchgeführt. Danach `dao_bot_claim_reviews`: genau **25 `confirmed` auf 2 Wallets**, 25 unterschiedliche `(wallet_id,tx_hash)`; nach serverseitigem Batch per LEFT JOIN weiterhin **16 + 9**, `fehlende_transaktionsdaten=0`, `mit_nft_zuordnung=0`. Kein erkennbares Duplikat **in diesen 25 Einträgen**. Nicht getestet: komplett neue Wallet mit echten Nachzahlungen, die automatisch als neue Prüfkandidaten erscheint.
- Auszahlungsprovenienz: wAPTM `0x110ac02ba3384bc055c13a87766049a74517beda`, Absender `0x6d0539de11b95e18cb202a55098e3854b0313022`; alte MineBot-NFTs `0xa1b761890c36e356f49f9df8d495fcffa76857ad`, 16 + 9 historische individuelle NFTs. NFT-Migrationen an `0x1ad197d8f5ac4731d9fb3fe7a8ff0c6a21f84d0c`. Beispiel-Auszahlung On-Chain: ausschliesslich ERC-20-`transfer`, kein NFT-Identifier in Logs/Raw Trace; Einzelzuordnung nicht behaupten. Die Aussage „Nachzahlung für alte MineBots“ ist aus Anzahl/Zeitfolge/Nutzerkontext gut begründet, keine on-chain gesicherte 1:1-Bot-ID.
- Queue-RPC `wallettracking_dao_reward_claim_v2(p_day)` legt bei **jedem Aufruf** für alle verschlüsselten EVM-Wallets des Tages Queue-Einträge `ON CONFLICT DO NOTHING` an. Neue Benutzer/Wallets benötigen **keinen separaten Registrierungshook**; Aufnahme nur bei tatsächlichem Jobaufruf, nicht während deaktiviertem Cron. 8 Schritte und 3 Fehlversuche pro Wallet/Tag; 4-Minuten-Lease.
- `project_scan_state` am 11.11.: 12 Wallets, bei TX 4 `complete`, 5 `empty_verified`, 3 `partial`; bei Flows 6 `complete`, 5 `empty_verified`, 1 `partial`. Fünf leere Wallets je zwei Verarbeitungsschritte, am 11.11. `completed`, kein Fehler. `empty_verified` mit Block 0 wird beim nächsten Tag als `initial-history` wieder geprüft, mögliche **Effizienzoptimierung**, aber kein nachgewiesener Datenfehler.
- 12.11., erster `cron-multi-wallet-one`: `e8b5c835-0db2-4449-bbee-258e28b42bbb` → `staged`, 10 TX beobachtet, 1 Flow, 10 Kandidaten beobachtet, keine kanonischen Claims, keine Fehler; `Observed` bedeutet nicht neue Einträge.
- 12.11., drei manuelle `cron-multi-wallet-batch`-Aufrufe à 10 Schritten: **alle drei Batches ok, 0 Fehler, 0 neue kanonische Claims**. Batch 1: 7 staged / 3 partial; Batch 2: 1 staged / 9 partial; Batch 3: 1 staged / 9 partial. Drei historische Scans machten in jedem Durchlauf Fortschritte; `ecbc2543-98fe-4b67-bf24-141c7ff20b15` wurde bei Schritt 6 `staged`. `8b93754f-983d-4693-bafd-53267205a29c` und `8a3c5dc6-0610-482d-a327-3f3ba03db158` endeten jeweils bei Schritt **8 auf `partial`**, Transaktions- bzw. beide Scans noch offen; Checkpoints gespeichert. **Erst am nächsten Schweizer Kalendertag** fortsetzen; nicht zurücksetzen oder Schrittgrenze umgehen.
- `staged` bedeutet **nur Rohdatenimport abgeschlossen**, nicht alle Rewards verifiziert oder Tagesjob insgesamt `completed`. `cron-staged-one` kann einen kanonischen Claim schreiben und wurde in diesen Batch-Tests **nicht ausgeführt**. `DAO_REWARD_ENABLE_LIVE_WORKER` bleibt **aus**, DAO-Cron aus.

**Offene DAO-Prioritäten (verbindlich):**
1. Die zwei `partial`-Wallets am Folgetag mit geschütztem Staging fortsetzen und Vollständigkeit/Checkpointfortschritt auditieren; Status der übrigen Queue-Wallets nach Tageswechsel prüfen.
2. Für sämtliche Wallets **Staged-Kandidaten → kanonische Claims** prüfen: verifizierte positive Payouts, historische NFT-Ownership, richtige Legacy-/New-Miner-Klassifikation, fehlende/Null-Payouts, keine Duplikate, kein Überschreiben existierender Werte. Die früheren 231 Kandidaten / 17 Wei-Präzisionsabweichungen / 164 ergänzten Altclaims in 8.20 bleiben relevant; aktuelle Gesamtzahlen nach Import erneut **lesen**, nicht extrapolieren.
3. Exakte historische USD-Bewertung nach **applikationsweitem** Preisweg; kein nachträglicher Kurs-Fallback, keine Schätzwerte. Null-/unpriced Fälle explizit beibehalten.
4. DAO1 Referral/DID und APTMDAO (ältere und neue Miner, unterschiedliche Claim-Assets) Ende-zu-Ende durchtesten. Der aktuelle Server-Referral-Check ist spezifisch für das bereits bekannte Referral-Wallet; keine globale Fertigmeldung.
5. Neue echte DAO-Wallet mit Legacy-wAPTM-Nachzahlung: sowohl `Daten aktualisieren` (alle Wallets) als auch Server-Staging testen; `pending`-Review bis manuelle Entscheidung, `confirmed` einmal gezählt, `ignored` nicht gezählt. Bei aktuell keiner neuen DAO-Wallet Test **aufgeschoben**, nicht bestanden.
6. Erst danach `cron-staged-preview`, kontrollierte begrenzte Staged-Claim-Probe mit Backup/Audit der kanonischen Werte, Tagesabschluss und vollautomatischen E2E-Ablauf testen. Cron/Live-Worker nur nach ausdrücklicher Freigabe aktivieren.
7. Später Performance: Bei 5 `empty_verified` Wallets bleibt Block 0; wiederholte leere Explorer-Erstprüfung optimieren **ohne Aktivitäten zu übersehen**. Momentan zurückgestellt.

**Arbeitsregeln:** Pro Antwort nur die **eine nächste** ausführbare SQL-Abfrage oder ein Test; auf Nutzerresultat warten. Keine unkontrollierten Datenbank-Updates. SQL-Dateien `YYYYMMDDHHMMSS_beschreibung_version.sql` mit tatsächlichem Schweizer Zeitpunkt; ZIP-Updates nur geänderte Dateien unter `wallet-tracking/`; keine Versionsänderung für diese reine Dokumentationsnachführung.

## Release 8.21 · 12.11.2026 10:05:13 CET · 20261112-100513
- Legacy-MineBot-Nachzahlungen: Server-Staging stellt für positive wAPTM-Eingänge vom bekannten Absender eine fehlende Transaction-ID insert-only bereit. Vorhandene ältere Flows werden beim nächsten Staging-Lauf ebenfalls erkannt. Browser-Vollrefresh bestehendes Verhalten beibehalten. Beliebige Nutzer-/Wallet-ID, keine Wallet-Whitelist.
- Bestätigte Einträge als „Miner-Nachzahlung (bestätigt) · Alte MineBots“ bezeichnet, ohne behauptete NFT-ID. Erst manuell bestätigte Zahlungen zählen als Claims; ignorierte bleiben ignoriert.
- Edge Function muss für die Job-Verarbeitung neu deployed werden; DAO Live/Auto-Cron bleibt OFF. Funktion ist kein produktionsreifer vollständiger Reward-Worker.
- Validierung gegen reale Supabase-/Explorer-Daten nach Deployment offen. Keine Migration erforderlich.

## Release 8.20 · 12.11.2026 07:59:11 CET · 20261112-075911
Browser-seitige DAO1-Native-Claim-Flows erhalten den Rohbetrag direkt aus der ursprünglichen erfolgreichen Explorer-Internal-Transaction bzw. Wallet-Receipt-Log; exakte `BigInt`-Werte für `amount_raw` und `amount` (Dezimalstring). Ohne Originalrohbeleg kein neuer nativer Flow aus gerundetem Legacy-Claim. Historische 164 bereits kanonische Claims wurden vom User in Supabase ergänzt (APTM/native/18, Mengen/Preise unverändert und geprüft), unabhängig von diesem Release. 231 Staged-Kandidaten weiterhin nicht synchronisiert; bei `d82b6059…` 17 Rohbetrags-/Legacy-Number-Abweichungen. Die drei Staged-Wallets nicht automatisch vollenden; vor Markierung unabhängige On-Chain-Provenienz, eindeutige Claim-/NFT-Zuordnung und gesonderte Prüfung des Null-Reward-Claims erforderlich. Keine SQL-Migration; DAO-Cron/Live-Worker aus.

## Release 8.19 · 11.11.2026 06:37:58 CET · 20261111-063758
Manueller DAO1-Queue-Batch: fest maximal zehn Staging-Schritte mit 65-Sekunden-Startbudget, gleicher `v2`-Lease/Checkpoint-Logik wie Einzelmodus, Fehler pro Wallet sicher abschliessen und ggf. weiteren Schritt bearbeiten. Keine kanonischen Claim-/Referral-Buchungen, keine SQL-Migration, kein Cron. Tageswechsel-Fortsetzung (`resume-history`) am 11.11.2026 live bestaetigt, Batch-Livetest offen. Interne Gegenparteien weiterhin nur fuer **neue** Imports datensparsam behandelt. DAO-Live-Worker aus.

## Release 8.18 · 10.11.2026 22:33:32 CET · 20261110-223332
Browser und Edge Function verwenden für neue DAO1-ERC20-Rohflows nun dieselbe Regel zur Gegenpartei: Eigene Wallet-zu-Wallet-Transfers speichern `counterparty_address=NULL`, externe Absender/Empfänger (einschliesslich Null-Adresse) bleiben für Audit und Referral-Nachweis erhalten. Alle weiteren Scan-, Claim-, NFT- und Reward-Regeln unverändert. Bestandsdaten nicht umgeschrieben; 29 bestehende NULL-Fälle nicht pauschal reparieren. Weitere offene Prüfung: Nachweis der 13 eingehenden Transfers über ERC20-Logs, Echt-Test neuer Cross-Wallet-Flows und historische Fortsetzung am Tageswechsel. Keine Aktivierung automatischer DAO-Jobs.

## Release 8.17 · 10.11.2026 20:03:18 CET · 20261110-200318
Bestätigter 8.16-HTTP-500: `reward_running` fehlte in DB-CHECK; manuell live bereits behoben, jetzt als reproduzierbare Migration enthalten. Strukturierte Supabase-Fehler erscheinen nicht mehr als `[object Object]`; ungenutzte, nicht deklarierte Browser-Variable `fetched` im DAO1-Inkrementalscan entfernt. Historische DAO-Server-Cursor werden in `project_scan_state.last_scan_message` persistiert; neuer Tageslauf noch nicht live verifiziert. Raw-Staging- und Staged-Claim-Phase für leeres Wallet manuell geprüft; reale Claim-/Referral-Fälle und APTMDAO weiter offen. Keine Preise, NFT-Klassifikation, Rewards oder TLN/VOW geändert. Cron und Live-Worker aus.

## Release 8.16 · 10.11.2026 06:41:13 CET · 20261110-064113
DAO1 staged-Reward-Einzelphase implementiert. Live-Abnahme offen: erst Preview, dann einmaliger schreibender Test. APTMDAO und vollständige Referral-E2E-Verarbeitung nicht freigegeben, Cron und Live-Worker aus.

## Release 8.14 · 09.11.2026 21:18:27 CET · 20261109-211827
Geschützte DAO1-Multi-Wallet-Staging-Queue: Lease-Token, begrenzte Schritte und Fehlversuche, nur manueller Test. Keine automatische Reward-Verbuchung oder Cron-Aktivierung. Siehe `docs/releases/8.14-dao-multi-wallet-queue.md`.

## Release 8.13 · 09.11.2026 20:53:16 CET · 20261109-205316
Einzelwallet-Cron-Probelauf `cron-test-wallet-one` mit eigenem DAO-Secret, nur bei Testimport-Freigabe und deaktiviertem Live-Worker. Schreibt optional Rohdaten und höchstens einen belegten Claim; keine Reward-Doppelbuchung oder Queue-Abschluss. Kein Cron aktiviert. Siehe `docs/releases/8.13-dao-fixed-wallet-cron-rehearsal.md`.

## Release 8.12 · 09.11.2026 20:19:02 CET · 20261109-201902
Dedicated DAO cron secret `DAO_REWARD_CRON_SECRET` replaces the previous accidental reuse of the wallet-daily-refresh credential. New fixed modes `cron-auth-check` (read-only) and `cron-stage-one` (single bounded raw staging pass, only after explicit `DAO_REWARD_ENABLE_LIVE_WORKER=true`). All other cron modes denied. No SQL migration; no cron or secrets created automatically. DAO canonical claim/Referral finalization and end-to-end completion are **not** production-ready. See `docs/releases/8.12-dao-cron-auth-preparation.md`.

## Release 8.11 · 09.11.2026 17:12:22 CET · 20261109-171222
Historische DAO1-NFT-Zuordnung in gemeinsame SQL-RPC für Browser und Edge Function überführt; 125 Fälle als Prüfziel, Live-Backfill noch offen. Beträge, Preise und Rewards unverändert. DAO-Cron bleibt deaktiviert. Siehe `docs/releases/8.11-historical-nft-claims.md`.

# WalletTracking – verbindlicher Entwicklungsstatus und offene Punkte

**Dokumentationsstand:** 12.11.2026 13:17:11 CET (Europe/Zurich) · **aktuelle sichtbare App-Phase:** 8.21, Build 20261112-100513. Technischer DAO-Cron weiterhin aus.

Diese Datei ist die zusammengeführte Arbeits- und Übergabeübersicht. Status hier beschreibt belegte Live-Tests, nicht eine pauschale Produktivfreigabe. Bestehende Fach- und Release-Dokumentation bleibt gültig.

## Phase 8.10 – Referral-Audit Timeout-Korrektur (Live-Abnahme offen)

Die 8.09-Audit-Auswertung lief auf HTTP 504 nach 150 Sekunden. In `dao-reward-refresh` wurden die mehrfachen per-TX-Batch-Queries durch zwei parallel und vollständig seitenweise eingelesene Ströme ersetzt (Transaktionen und eingehende Token-Flows). Beide Datenstromabfragen haben ein 30-Sekunden-Budget, unvollständige Ergebnisse werden als Fehler gemeldet statt als Teilsumme. Die Klassifikation, Reward-Werte und NFT-Ownership-Logik bleiben unverändert. DAO-Live-Worker und Cron bleiben deaktiviert. Live-Audit muss nach Deployment erneut ausgeführt werden.

## Phase 8.09 – DAO1-Referral serverseitig / NFT-Zuordnung Diagnose (lokal implementiert, Live-Test offen)

Die bereits vorhandene Browser-Klassifikation verifizierter DID-/Contract-Referral-Auszahlungen ist serverseitig jetzt als **lesende Auswertung aus kanonischen Transaktionen/Flows** in `dao-reward-refresh` implementiert. Kein neuer Reward-Post, kein eigener Summen-Speicher, keine Änderung der bestehenden Werte. Zusätzlicher Admin-Audit `audit-referrals-test-wallet`. Für nicht zugeordnete Bot-Claims ist der lesende `audit-nft-candidates-test-wallet` ergänzt. Die tatsächliche Ursache der fehlenden NFT-Zuordnung bleibt bis zum Live-Diagnoseergebnis offen; historische NFT-Ownership darf nicht durch aktuelle Inventardaten ersetzt werden. DAO-Cron/Live-Worker **bleiben aus**. Keine SQL-Migration. 16 gezielte Tests bestanden. Details `docs/releases/8.09-dao-server-referrals-nft-audit.md`.

## DAO1/APTMDAO – zuletzt live bestätigt

- Test-Wallet: `0x239c5822a0d2A67E629D7A3b5C8180721E228B47` auf Apertum; Datenbank mit 395 Claim-Kandidaten.
- Historischer Transaktionsscan abgeschlossen (gespeicherter oberer Block 15'670'355); Token-Flows und Referral-wUSDT-Scans ebenfalls als `complete` gespeichert. Checkpoints, Cursorfortsetzung, Idempotenz und inkrementeller Delta-Modus manuell getestet. `complete` bezieht sich auf die Explorer-Paginierung, **nicht** auf unabhängig verifizierte Vollständigkeit bis zum aktuellen Chain-Tip.
- 388 vorhandene Claims: `canonical_existing_verified=true`; darunter 284 und nach präzisem Dezimalvergleich weitere 4 per Guard gekennzeichnet. Zweiter Aufruf: `newlyMarked=0`, `markedAfter=388`. Native Auszahlungen stimmen mit dem kanonisch gespeicherten Betrag innerhalb 0.000000000000001 APTM überein; keine Neuanlage von Reward-Buchungen.
- 4 frühe positive APTM-Claims bei Blöcken 60'731, 72'665, 81'698, 81'700: `audit_classification=unpriced_before_exact_anchor` und `audit_classified_at` **dauerhaft in Supabase verifiziert**. Zentraler exakter Preisanker beginnt erst bei Block 88'356. Kein Ersatzkurs, USD-Wert bleibt `NULL`; Klassifikation ist unabhängig von Auszahlungs-Verifikation. 8.04-Live-Test und separate SQL-Abfrage bestätigen inzwischen `payout_status=verified`, exakt gespeicherte Raw-Mengen 4650944472418586884 (zweimal) und 4031915382788697322 (zweimal), je einen Protokolleintrag, unverändertes `canonical_existing_verified=false` und USD NULL. Vorhandene Claim-Mengen 4.650944472418587 / 4.031915382788697 bleiben unangetastet; Abweichungen zum Rawbetrag 116 / 322 Wei liegen innerhalb der begrenzten Toleranz. Wiederholung: checked=0, results leer, pendingPayoutChecks=0; keine erneuten Protokolleinträge laut SQL-Kontrolle.
- 3 Transaktionen mit Reward=0 bei Blöcken 403'915 (Bot 37174), 10'791'488 (Bot 10295), 11'254'937 (Bot 10294): nach 8.03 **live als `no_payout_evidence` klassifiziert**, TX-/Token-/Internal-Coverage vollständig, keine Token-Transfers und 17/7/7 interne Aufrufe ohne erkannten Eingang. Dauerhafte Speicherung separat per SQL bestätigt: `payout_checked_at` 08.11.2026 12:45:20–12:45:21 CET, zu diesem Zeitpunkt je zwei Protokolleinträge und passender letzter Status. Anschliessende erneute manuelle Prüfung ebenfalls erfolgreich (`noPayoutEvidenceClaims=3`, `payoutsNeedingReview=0`, `verifiedPayoutClaims=0`, `pendingPayoutChecks=4`, keine konkurrierenden Skips). Explorer-indexierter Negativbefund, kein endgültiges On-Chain-Nullurteil.
- Rohdaten-Import und Klassifikation liefen kontrolliert/manuell; produktiver DAO-Rewards-Worker und Cron bleiben deaktiviert (`DAO_REWARD_ENABLE_LIVE_WORKER=false`). Kein vollständiger End-to-End-Live-Test neuer Rewards/Referral/Bot-Zuordnung.

## Phase 8.08 – chainübergreifende Metadaten und private Anzeige-Einstellungen implementiert, Live-Prüfung offen

8.08 erweitert technische Metadaten auf alle zwölf aktuell unterstützten Chains und eigene sichere Token. Gemeinsame neue Edge Function token-metadata für Browser, DAO-Claim-Pfad und täglichen Bestandsjob. Globale öffentliche Contract-/Mint-Metadaten liegen in wallettracking_internal.token_metadata (nicht über die Data API exponiert, RLS aktiv, keine Client-Tabellenrechte). Keine User-ID, Wallet-Adresse oder private Safe-Token-Bezeichnung in diesem Cache. Bekannte Masterwerte in predefined_tokens werden gespiegelt; nichtleere technische Werte, Namen und Bezeichnungen bleiben geschützt. Persönliche Anzeige- und Summary-Dezimalstellen bleiben separat bei safe_tokens und werden nur für die eigene Liste geladen.

## Abruf und Wiederverwendung

- Neue Funktion token-metadata besteht aus index.ts und metadata.ts im selben Funktionsverzeichnis. resolve benötigt User-JWT oder den bestehenden serverseitigen Service-Key. Der Request liefert nur Chain/Adresse; technische Werte, Quelle und fremde User-IDs aus dem Request werden ignoriert. Historischer Block nur bei internem Service-Aufruf zulässig. Keine Preise, Rewards, Wallet-Entschlüsselung, Scan-Cursor oder Queue-Schreibvorgänge.
- EVM: konfigurierte RPC-Chain-ID prüfen, decimals() strikt als 32-Byte-ABI-Wert auswerten, 0–36 zulässig. Name/Symbol optional (String oder bytes32), kein Symbol als Identitätsbeweis. Vorhandene gültige Werte werden wiederverwendet; ein fehlender Wert wird nie als 18 geraten. Archive-/Alchemy-Endpunkt nur bei vorübergehend fehlendem RPC, niemals zur Überdeckung einer falschen Chain oder widersprüchlichen Antwort. Bereits konfigurierte projektweite Alchemy-Secrets wiederverwenden.
- Apertum: Explorer-Token-Metadaten zuerst, Antwortadresse/Token-Typ soweit geliefert prüfen; bei fehlenden Daten EVM-RPC. Zwölf Token/LPs mit 18 und unveränderte Anzeige-Werte sind aus 8.07 live bestätigt. Die alte 8.07-Apertum-Adminroute bleibt kompatibel; der neue DAO-Claim-Pfad verwendet den gemeinsamen Dienst. Aktuelle Stammdaten und zentraler Cache werden vor Wiederverwendung auf Widersprüche geprüft.
- Solana: konfigurierte RPC bzw. Alchemy-Archive-Konfiguration (bei leerem rpc_url) verwenden, getAccountInfo/jsonParsed am initialisierten Mint. Token-Program/Token-2022-Owner und Mint-Typ prüfen. Mint-Adressen bleiben gross-/kleinschreibungssensitiv; Token-Account-Skala muss zum zentralen Mint-Wert passen. Keine EVM-Adressnormalisierung auf Solana/Tron anwenden.
- Tron: decimals() über die konfigurierte /wallet/triggerconstantcontract-API mit sichtbaren Base58-Adressen. Erfolgsflag und ABI-Wert prüfen, kein universeller 6-Fallback bei TRC20-Beständen.
- Native Einheiten: explizite Protokollwerte für die aktuell unterstützten Chain-/Symbol-Kombinationen (BTC 8, XRP/TRX/AKT 6, SOL 9, bekannte EVM-Coins 18). Unbekannte zukünftige Protokolle erhalten keinen Typ-Default. Insbesondere AKT/uakt erhält 6, obwohl die ursprüngliche Native-Importfunktion Akash bislang offen liess. Für benannte Cosmos-Denoms sind passende base-/display-Einheiten und Exponent aus Bank-Metadaten erforderlich.
- V3-Pooladressen werden nur nach fehlender/revertierender decimals()-Funktion UND strukturell passenden slot0/fee/token0/token1-Antworten als not_applicable / v3_pool markiert. Technische Dezimalstellen bleiben dort NULL, UI zeigt Pool statt eines fehlenden Tokenwerts; normale ERC20-LP-Token behalten echte Contract-Decimale. Keine Erkennung allein anhand LP-Label. Pool-/Fungible-Token-Widersprüche erzeugen Konflikt.

## Persistenz und Konflikte

Service-only Speicher-/Lese-RPCs begrenzen technische Metadaten nach Chain+normalisierter Contract-/Mint-Adresse. Nur EVM-Adressen werden kleingeschrieben. Zeilen-/Advisory-Locks, Vergleich vorhandener Master-/Cachewerte, sticky conflict, Originalwert und beobachteter Wert sowie Quelle/Prüfzeit und zehn letzte Beobachtungen. Widersprüche werden nicht automatisch überschrieben oder aufgelöst. Fehlerhafte Providerantworten bleiben unavailable. Ein neuer Abruffehler löscht keinen bereits bestätigten Cachewert; refreshFailed weist auf den fehlgeschlagenen Refresh hin. Unmittelbare automatische Wiederholungen eines unavailable-Werts frühestens nach 60 Sekunden; manuelle Admin-Prüfung darf gezielt neu lesen. Ein bestätigter Contract-Wert braucht keinen RPC pro Claim. Zentrale aktuelle Metadaten sind keine Behauptung historisch unveränderter Contract-Eigenschaften; bestehende Payout-/Flow-Skalen müssen weiterhin übereinstimmen.

predefined_tokens bekommt nur fehlende technische Werte/Namen/Bezeichnungen ergänzt. Keine Neuanlage globaler Token-Definitionen für private Custom-Token. enabled/historical_only, bestehende Anzeige-Dezimalstellen, Preise und Zuordnungen unverändert. Reine technische Cache-Ergebnisse geben einen Token nicht automatisch als DAO-Reward-Asset oder sicheren Bestand frei. Die bekannte DAO-Contract-Whitelist bleibt bestehen. Alte 8.07-Felder/Funktionen bleiben erhalten, ausgeführte Migrationen werden nicht gelöscht.

## Eigene sichere Token und Browser

safe_tokens erhält nullable display_decimals und summary_decimals mit 0–18-Constraints. Leere Felder erben den vorhandenen Stammdaten-/Formatstandard. Eine persönliche Anzeige-Einstellung überschreibt die globale Darstellung nur für diesen User; leere persönliche Summary folgt dann der persönlichen Anzeige. Technische Skalierung wird dadurch nie verändert. Vorhandene globale Anzeige-Werte werden nicht auf private Listen kopiert. Eigene Bezeichnungen bleiben bestehen.

Neue read-only RPC wallettracking_list_own_safe_tokens bindet die interne technische Information nur an auth.uid()s eigene Einträge. Bestehende Safe-Token-RLS bleibt aktiv; Browser speichert persönliche Änderungen zusätzlich mit eigener User-ID und Datensatz-ID. Andere User-Listen werden weder enumeriert noch in den technischen Cache kopiert. Beim Accountwechsel werden manuelle Metadaten-Batch-Fortsetzungen zurückgesetzt.

Unter „Eigene sichere Token“ sind technische Werte/Pool/Konflikt und persönliche Anzeige-/Summary-Eingaben sichtbar. Dort prüft ein Button nur die eigene Liste. Im vordefinierten Bereich gibt es einen Admin-Button für den Katalog. Es sind jeweils höchstens zwölf Contracts pro Aufruf und vier parallele Provider-Anfragen; nextAfter wird beim nächsten manuellen Klick fortgesetzt, keine automatische Dauer-Schleife. refresh-catalog erfordert echten Admin-JWT und verarbeitet globale Definitionen plus eigene sichere Token; refresh-own benötigt User-JWT und ist nur dessen eigene Liste. Keine Request-User-ID und kein Katalogzugriff allein durch den internen Service-Key. Ergebnisse zählen verified/not_applicable/conflict/unavailable; fehlende Providerdaten bleiben sichtbar offen.

Browser-Metadaten für aktuelle/historische Preise, positive EVM-Bestände, Tron, sichere Solana-Mints und DAO-Receipt-Token verwenden den gemeinsamen Resolver. Aktuelle EVM-Nullbestände benötigen keine Metadaten. Unklare positive Bestände oder widersprüchliche Skalen führen zu einem offenen Fehler und keinem geratenen Betrag. Historische gespeicherte Flows/Rewards/Preise werden nicht umgeschrieben. Es wird keine neue Preisroute eingeführt.

## Hintergrund-Integration

DAO-Claim-Treiber verwendet den neuen Dienst und übergibt weiterhin die nachgewiesene technische Skala an den bestehenden 8.07-Finalizer. Auszahlungsbelege, NFT-Ownership und zentraler exakter Preisweg bleiben getrennt geprüft; kein Preis-/NFT-/Reward-Backfill in diesem Release.

wallet-daily-refresh liest den internen technischen Cache in begrenzten 200er-Paketen und löst fehlende Skalen positiver sicherer Token über denselben Dienst auf. Keine separate RPC-decimals-Fallbackberechnung; Konflikte stoppen die betroffene Chain statt falsche Mengen zu speichern. Native Einheiten und vorhandene Snapshot-/Retry-Logik bleiben erhalten; Solana-Mint-/Tron-Adressen werden jetzt auch im Job korrekt case-sensitiv erhalten. Bereits verifizierte V3-Pools werden aus ERC20-Beständen ausgeschlossen. Der separat vorhandene Wallet-Bestandscron wird nicht neu konfiguriert. DAO-Cron und DAO_REWARD_ENABLE_LIVE_WORKER bleiben deaktiviert; es wird kein Metadaten-Cron angelegt.

## Belegter Stand und Tests

- 8.07 live: zwölf Apertum-ERC20-/LP-Contracts verified / technische 18, Quelle Explorer, zehn vorherige NULL ergänzt, alle 13 Anzeige-Einstellungen unverändert. Proof per JSON und separater SQL-Persistenz. Natives APTM war von diesem ERC20-Test ausgenommen (technisch bereits 18).
- Nutzer-Diagnose: weitere fehlende Stammdaten auf BSC/ETH/Tron, AKT native; eigene ATOM/LPT/LCX beziehen Werte allenfalls aus Stammdaten, ZIG hat keine globale Zuordnung. Diese Werte sind vor dem Live-Abruf nicht geraten oder schon als ergänzt markiert.
- 241 relevante lokale Tests bestanden: DAO/Rewards inklusive PostgreSQL, Provideradapter, echtes SQL für Cache/Füllung/Konflikte/Pools/History/RLS/User-Isolation, HTTP-Handler/JWT/Admin-Gates/Continuation, Browser-Konvertierung/Cache/Präferenzen und täglicher Bestandsjob. Providerantworten lokal kontrolliert; 8.08-Live-Abruf/Benutzeroberfläche/Job-Integration noch offen.
- Breiter Lauf über alle tests/*.mjs: 264 Tests, 262 bestanden; zwei bereits vorhandene Fehler in docs-cleanup-regression.mjs (Erwartung an die historische Archivliste) und rpc-refresh-regression.mjs (veralteter Snapshot-Mock ohne sb.rpc). Beide Fehler separat mit unverändertem 8.07-app.js/alten Hilfsdateien reproduziert. createSnapshot ist bytegleich zu 8.07. Kein Snapshot-/Cleanup-Fix in diesem Release. Vier Preis-/Dashboard-Regressionsskripte sowie übrige breite Tests bestanden.


Details/Quellen/Deployment: docs/releases/8.08-cross-chain-token-metadata.md. Historische Abschnitte darunter sind früherer Entwicklungsstand.

## Live-Nachtrag 8.07 · 08.11.2026 22:23:00 CET

8.07-Migration und Edge-Deployment laut User abgeschlossen. Admin-Test refresh-apertum-token-decimals: checked=12, alle zwölf ERC20-/LP-Contracts verified, storedDecimals=observedDecimals=18, Quelle apertum-explorer-token-metadata, nextAfter=null. Zehn zuvor fehlende technische Werte ergänzt; ANOUBIS/PUGLORD vorhandene 18 bestätigt. Separate Live-SQL-Abfrage bestätigt Speicherung in predefined_tokens und unveränderte Anzeige-Dezimalstellen aller 13 Apertum-Zeilen. Prüfzeit 08.11.2026 22:20:03.874794–22:20:04.433249 CET (SQL liefert UTC). Auch gewrappte wBTC/wUSDT/wUSDC haben auf Apertum 18 technische Decimale. Natives APTM weiterhin technisch 18 / Anzeige 2; decimals_status=unverified, source/checked_at NULL, weil kein ERC20-Contract geprüft wurde. Das ist kein fehlender technischer Wert und keine negative Prüfung. Keine belegten Konflikte. Cache-Wiederverwendung ohne Explorer/RPC noch nicht separat live getestet; neue kanonische ERC20-Claim-Buchung ebenfalls weiterhin offen. DAO-Cron/Live-Worker aus.

Neue Nutzer-Rückmeldung: Token anderer Chains sowie „Eigene sichere Token“ haben ebenfalls fehlende Kommastellen. 8.07 löst nur Apertum/predefined_tokens, nicht die vollständige chainübergreifende Erfassung. Codeprüfung: safe_tokens lädt/speichert bisher user_id, chain, address, label; der verifizierte Schema-Baseline-Stand enthält keine technischen oder Anzeige-Dezimalfelder. Technische Custom-Metadaten werden vor allem im Browser-Cache gehalten; eine vorhandene Live-Schema-Erweiterung ist noch nicht ausgeschlossen. Andere EVM-Pfade enthalten weiterhin angenommene 18-Fallbacks. Nächste Analyse muss technische Skalierung und persönliche Anzeige-Einstellung unterscheiden: zentral wiederverwendbare technische Metadaten nach Chain+Contract/Mint, userbezogene Safe-Listen/Anzeigepräferenzen nicht globalisieren. Chain-native Metadatenquelle je Plattform verwenden; keine EVM-Regel für Solana/Tron erzwingen und keine Werte raten. Bestehende technische Werte/Konfliktschutz und User-Isolation erhalten. Vor Umsetzung nur eine lesende Bestandsabfrage über predefined_tokens und safe_tokens zeigen; keine neue Migration/Cron-Aktivierung freigegeben.

Die folgenden Release-Abschnitte beschreiben den ursprünglichen Implementierungsstand; der Live-Nachtrag oben führt den Abnahmestand.

## Phase 8.07 – Apertum-Abruf und Speicherung live bestätigt

Fehlende technische Apertum-Dezimalstellen werden über die Explorer-Token-Metadaten ermittelt, in predefined_tokens gespeichert und von Browser und DAO-Worker wiederverwendet. Ein vorhandener gültiger Wert benötigt keinen RPC-Aufruf pro Claim. display_decimals und summary_decimals bleiben unverändert. Kein pauschaler 18-Fallback für die geänderten Apertum-Konvertierungen. NULL, leere Werte, boolesche Werte und ungültige Skalen werden nicht als 0 akzeptiert; technische 0 ist zulässig.

Vorhandene technische Werte werden niemals automatisch überschrieben. Eine abweichende Beobachtung markiert decimals_status=conflict und speichert Originalwert, zuletzt beobachteten Wert, Quelle und Prüfzeit. Konflikte bleiben gesperrt und benötigen eine gesonderte geprüfte Admin-Korrektur; wiederholte Abrufe löschen sie nicht. Noch kein eigener Konflikt-Auflösungsdialog. Pro Session gespeicherte Browserwerte werden beim erneuten Laden der Stammdaten aktualisiert.

Primärquelle ist https://explorer.apertum.io/api/v2/tokens/<Contract>. Antwortadresse/Token-Typ werden geprüft, soweit geliefert. Dezimalstellen 0–36 strikt validieren. Nur fehlende Explorer-Metadaten eines Claim-Tokens benötigen den bisherigen chain-geprüften decimals()-RPC am Claim-Block. Eine widersprechende Contract-Adresse wird nicht durch einen Fallback verdeckt. Zentrale Explorer-Metadaten sind aktuelle Contract-Metadaten, keine Behauptung eines historischen eth_call-Nachweises. Diese tatsächliche Quelle wird auch in claim_pipeline_asset_evidence protokolliert. Bestehende historische Flow-Skalen werden nicht rückwirkend umgeschrieben; Abweichungen zwischen Payout/Flows und zentralen Einheiten blockieren den Claim wie bisher.

Browser-Live-/historische Preis-Metadaten, bekannte Token-Bestände, Apertum-Explorer-Bestände und DAO-Receipt-Token-Metadaten verwenden denselben Resolver. Der DAO-Rohimport akzeptiert vollständige Transfer-Metadaten weiterhin, verwirft jedoch den bisherigen geratenen 18-Fallback; fehlende/ungültige Skalen halten den Import offen. Bekannte technische Konflikte blockieren die anschliessende kanonische ERC20-Verarbeitung. Unregistrierte Custom-Token dürfen Metadaten temporär nutzen, erzeugen aber keine neuen globalen Stammdatenzeilen und werden dadurch nicht als Reward-Assets freigegeben.

Zwei begrenzte Metadaten-Modi in der bestehenden dao-reward-refresh-Funktion: resolve-apertum-token-decimals prüft einen echten User-JWT und verarbeitet einen Contract. refresh-apertum-token-decimals ist Admin-only, erfordert das bestehende Test-Import-Flag und ausgeschalteten Live-Worker; höchstens 20 Katalog-Contracts je Aufruf, vier parallele Explorer-Anfragen, after/nextAfter bei weiteren Contracts. Kein Request akzeptiert technische Werte oder Quellen vom Browser. Globale Schreib-RPC und kanonische Abschluss-RPC bleiben service-only; vorhandene browserlesbare Token-Stammdatentabelle wird erweitert, keine neue exponierte Job-Tabelle.

8.06 ist laut User installiert/deployt; allgemeiner Einzel-Claim-Test lieferte no_eligible_claim und claimsCreated=0. Alle Rohströme complete/incremental-delta, keine neueren Ereignisblöcke. Das ist kein Live-Beweis einer neuen ERC20-Claim-Buchung. Live-SQL bestätigt 13 Apertum-Stammdaten: APTM/ANOUBIS/PUGLORD mit 18 technischen Dezimalstellen, zehn ERC20-/LP-Zeilen mit NULL. Ihre Werte werden in 8.07 dynamisch abgerufen, nicht geraten oder vorab als live ergänzt behauptet.

208 lokale DAO-/Reward-Tests inklusive PostgreSQL und vier Preis-/Dashboard-Regressionsskripte bestanden. Geprüft: NULL ergänzen, 0/6/18/36, Wiederverwendung ohne Netzwerk, ungültige Antworten, Contract-/Chain-Konflikte, RPC-Fallback, Authentifizierung, Batchlimit/Fortsetzung, Konfliktschutz, unveränderte Anzeige-/Summarywerte, korrekte Claim-Quelle, atomare kanonische ERC20-Speicherung und Wiederholung. 8.07-Live-Ausführung offen. DAO-Cron/LIVE_WORKER bleiben deaktiviert; Referral, neue Miner-Zuordnung, vollständiger Tagesabschluss, neue echte Claims und TLN/VOW-Job bleiben offen.

## Phase 8.06 – installiert, inkrementeller Leerlauf live bestätigt

- Allgemeine Admin-Route process-next-claim-test-wallet für dieselbe feste Testwallet, JWT/Admin-Gates/Test-Flag/Live-Worker-aus und ein Claim je Aufruf. Alte native Route bleibt kompatibel und wird nicht stillschweigend für ERC20 geöffnet.
- Whitelist aus bestehenden Projekt-Stammdaten: wAPTM 0x110ac02ba3384bc055c13a87766049a74517beda; wUSDT 0x1487db421f6b58e77bfefc905fdc1ede5fb85c7f; wUSDC 0xd979f41e12a69aa82f04866444ea91e8e8faefd9. Asset-Policy ist eine physische JS-Datei für Browser und Worker. Stablecoin-Parität unverändert, jetzt per Contract statt Symbol/Name; aktuelle/historische Apertum- und DAO-Bewertung nutzen dieselbe Regel, andere Chains bleiben unverändert.
- Technische Decimale 0–36 per eth_call decimals() am konkreten Claim-Block, RPC-Chain-ID gegen chains.evm_chain_id prüfen, Archive-RPC bevorzugen. Keine Nutzung von display_decimals und kein pauschaler 18-Fallback. Fehlendes/defektes RPC blockiert; kein Quote-/Preis-Fallback.
- Ein ERC20-Asset mit mehreren positiven Transfers zulässig, insgesamt maximal 100 belegte Flows. Gleiche TX/Block/Contract/Decimals, genaue Raw-Summe, eindeutige kanonische Log-Keys und Auszahlungs-Absender gleich Claim-Contract erforderlich. Gemischte Assets, interne/self-Flows, falsche Sender und unbekannte Token blockieren. Legacy-NFTs nur aus dem bekannten alten MineBot-Vertrag mit historischem Owner; bekannte DID-Verträge keine Bot-Claims.
- Gemeinsame kanonische Abschluss-RPC für native/ERC20, alter Native-Aufruf bleibt Wrapper mit ERC20 gesperrt. Stable-Quote wird aus gemeinsamer Policy geliefert und SQL-seitig auf registriertes Asset/1 USD geprüft. wAPTM übernimmt bestehende exakte Zielanker, keine neue Kursroute. 7.87-Preisreuse in gemeinsame optional TX-begrenzte Implementierung ausgelagert, alter Aufruf bleibt Wrapper. Keine anderen TX-Preisfelder verändern.
- Exakte SQL-Raw-Normalisierung für alle technischen Decimale; ERC20 reward_asset_* separat, reward_aptm NULL / net_aptm 0 und Gas als APTM separat. Originale Claim-Mengen/Preise/NFT-Zuordnung werden nicht überschrieben. Technische Asset-Evidenz am Kandidaten persistiert. Konfliktierende/partielle Preise blockieren. Vorhandene Transaktions-USD-Rewards ebenfalls vor doppelter Neuanlage geschützt.
- 198 lokale DAO-/Reward-Tests inkl. PostgreSQL und vier bestehende Preis-/Dashboard-Regressionsskripte bestanden. Migration 20261108213404_dao_erc20_single_claim_pipeline_806.sql vorbereitet; noch keine 8.06-Live-Abnahme. Neue Datei asset-policy.js beim späteren Edge-Deployment neben index.ts hinzufügen, bestehendes payout-coverage.ts behalten. Browser lädt genau dieselbe Repo-Datei.

## Phase 8.05 – Einzel-Claim-Pfad implementiert, Leerlauf live bestätigt

- Analyse: bisheriger manueller Rohimport endete vor Ownership/Payout/Preis/kanonischer Speicherung; allgemeine Worker-Prüflisten konnten alte Fälle erneut behandeln. Neue geschützte Admin-Route `process-next-native-claim-test-wallet` verbindet die vorhandenen Bausteine für genau einen neuen nativen Claim; feste Testwallet, Admin-JWT, Test-Import-Flag und deaktivierter Live-Worker bleiben Pflicht.
- Höchstens eine Rohdaten-Seite je Strom. Bei unvollständigem TX-/Flow-/Referral-Import Status import_partial, kein kanonischer Claim. Nach vollständigem Import SQL-Auswahl höchstens eines neuen Kandidaten: canonical_existing, Preis-Ausnahmen, no_payout_evidence, bereits gespeicherte NFT-Claims und vorhandene positive Transaktions-Rewards ausgeschlossen. Kein Kandidat ergibt legitim no_eligible_claim, nicht automatisch ein Fehler.
- Historischen Owner-Nachweis bei bekannten NFT-Kandidaten und bestehenden Payout-Verifier wiederverwenden. Neue Miner ohne ID bleiben unassigned_miner; Legacy ohne belegten Owner blockiert. Noch nicht unterstützte zugeordnete neue Miner und ERC20-Fälle blockieren ebenfalls, keine erfundene Zuordnung.
- Serverseitige service-only Abschluss-RPC sperrt Kandidaten und verwendet vorhandene Locks/Unique-Keys. Eindeutige erfolgreiche Claim-TX, passender Block, genau ein belegter nativer Flow mit Originalbetrag/18 Decimals und keine zusätzlichen eingehenden Assets erforderlich. Höchstens eine neue project_nft_claims-Zeile. Native Menge exakt per Raw×10^-18 normalisieren, bestehende Preise/Rewards/NFT-Daten nicht überschreiben.
- Bestehende exact-v13-Anker-RPC erhält eine gemeinsame scoped-Implementierung; unveränderter alter Aufruf delegiert an dieselbe Logik. Einzel-Claim-Pfad ergänzt nur fehlende Flow-Preisfelder genau dieser TX aus vorhandenem exaktem Zielanker. Keine neue Preisberechnung, keine Nachbarblock-/Predecessor-Route. Fehlender Anker, fehlende Ownership und uneindeutige Belege bleiben sichtbar blocked.
- Drei neue interne Kandidatenfelder claim_pipeline_status/reason/checked_at; pending, blocked oder completed. Blockierte Fälle nach 24h erneut auswählbar, optional manueller retryBlocked=true ohne Wartezeit; neue pending zuerst. Wiederholung vollständiger Claims erstellt nichts erneut. Abschlussfehler rollen Preisergänzung/Claim-Neuanlage/Abschlussstatus zurück; vorgelagerte Rohdaten-/Payout-Schritte sind absichtlich separat dauerhaft und wiederholbar.
- Migration `20261108132000_dao_single_native_claim_pipeline_805.sql`, danach index.ts aktualisieren, vorhandenes Hilfsmodul beibehalten. 173 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Leerlauf live bestätigt; neue native Claim-Neuanlage weiterhin nicht live geprüft. Der tägliche Job bleibt staged statt completed; neue Route verändert die Tagesqueue nicht. DAO-Cron und Live-Worker aus.

### 8.05-Live-Nachtrag · 08.11.2026 20:29:33 CET

8.05-Migration und index.ts-Deployment sind erfolgt. Der manuelle Einzel-Claim-Aufruf ergab no_eligible_claim / claimsCreated=0. TX-, Flow- und Referral-Import jeweils complete, incremental-delta, newBlocksObserved=false und upToDate=true bezogen auf die jeweilige Explorer-Ereignisliste. Gelesene Ereignisse: 36 TXs, 16 Flows, ein gezielter Referral-Flow und 36 beobachtete native Claim-Flows/Kandidaten; das sind Beobachtungszähler, keine bestätigten DB-Neuanlagen. Obere Ereignisblöcke unverändert 15'670'355 / 14'896'984 / 13'390'295. Kein Beweis einer unabhängigen Prüfung bis zum aktuellen Chain-Tip.

Separate Live-SQL-Kontrolle danach bestätigt exakt: 395 Kandidaten, 388 canonical_existing_verified, vier frühe payout-verifizierte Preis-Ausnahmen, drei no_payout_evidence, null offene zusätzliche Payouts und null pipeline-blocked. Damit sind inkrementeller Leerlauf und Schutz des Referenzbestands live belegt. Ein tatsächlich neuer Claim inklusive kanonischer Neuanlage ist durch diesen Lauf ausdrücklich noch nicht live geprüft.

## Phase 8.04 – begrenzte positive Payout-Prüfung live bestätigt

- Neuer Admin-Modus `check-pending-native-payouts-test-wallet`: echter Admin-JWT, `DAO_REWARD_ENABLE_TEST_IMPORT=true`, Live-Worker aus und genau eine serverseitig festgelegte registrierte Testwallet. Keine vom Request wählbaren User, Wallets, TXs oder Batchgrössen; maximal vier Kandidaten.
- Service-only RPC `wallettracking_dao_check_pending_native_payouts` prüft nur `payout_status=pending` und nicht kanonisch gekennzeichnete Kandidaten. Beide Claim-Selektoren unterstützt; bei New-Miner-Selector nur der bereits im bisherigen Abgleich verifizierte Miner-Vertrag. Eindeutige erfolgreiche TX, gleicher Block, genau ein positiver nativer `claim-native:<tx>`-Flow mit 18 Decimals und keine widersprüchlichen/zusätzlichen eingehenden Assets.
- Bestehende positive APTM-Menge mit Original-Wei vergleichen. Dieselbe fachliche Toleranz von 1e-15 APTM = 1'000 Wei, als exakte Ganzzahl-/Dezimaldifferenz ohne potenziell rundende Division. 1'000 Wei akzeptiert, 1'001 Wei abgelehnt. Historische Preise bleiben unabhängig; USD NULL blockiert keine Payout-Verifikation.
- Atomare Ausführung mit Kandidaten-Zeilensperren, Lese-Sperren der geprüften vorhandenen TX-/Flow-Zeilen und Wiederverwendung der 8.02-Persistenz-/History-RPC. Fehler im Batch rollen alle Payout-Schreibvorgänge dieses Aufrufs zurück. Wiederholungen prüfen nur verbleibende pending-Fälle; verified, no_payout_evidence und canonical_existing bleiben unangetastet. Review-Fälle werden von diesem speziellen Modus nicht automatisch wiederholt.
- Fehlende/ungültige/mehrdeutige Belege: needs_review mit Grund und Protokoll. Dieser Pass schreibt keine Flows/Claims/Preise/NFTs, keine canonical_existing-Kennzeichnung, keine Scan-Cursor oder Queue; nur Payout-Kandidaten-Metadaten. Positive Existenzprüfung ist nicht vollständige neue TX-Coverage; `payout_coverage.complete=false` bleibt dafür ehrlich.
- Migration `20261108125822_dao_pending_native_payout_checks_804.sql` und index.ts-Deployment abgeschlossen; Helper aus 8.03 beibehalten. 151 lokale Tests inkl. PostgreSQL bestanden. Live: checked=4, verifiedPayoutClaims=4, payoutsNeedingReview=0, pendingPayoutChecks=0. Anschliessende Wiederholung checked=0 / results leer; separate SQL-Persistenzprüfung erfolgreich, USD NULL / Preis-Ausnahme / canonical_existing=false erhalten. Keine vollständige Tagesjob-Freigabe; DAO-Cron bleibt aus.

## Phase 8.03 – Internal-TX-Erfolgsprüfung korrigiert

- 8.02-Migration durch User erfolgreich ausgeführt, Worker mit beiden Dateien deployt. Manueller Test `recheck-zero-payout-test-wallet`: 3 `needs_review`, 0 `verified`, 0 `no_payout_evidence`, 4 weitere pending-Payouts. Bei allen drei Prüfungen Abbruch am ersten internen Aufruf mit `internal-outcome-incomplete`.
- Ursache anhand der vom User gelieferten vollständigen Explorer-Antwort für TX `0x62864a66dd096ddd6941a1f9c600229e52b1f10a45f93b632bb9755a3b16cbd2` belegt: 17 Aufrufe, jeweils `success=true`, `error=null`, `value=0`, kein Feld `status`, `next_page_params=null`. Der 8.02-Parser verlangte fälschlich zusätzlich einen Erfolgsstatus.
- 8.03 akzeptiert boolesches `success=true` ohne zusätzlichen `status` oder alternativ einen expliziten Erfolgsstatus. Fehler, `success=false`, ungültige/unklare Erfolgswerte und widersprüchliche Statusfelder bleiben `needs_review`. Positiver nativer Eingang verhindert weiterhin negative Klassifikation.
- Sechs neue Regressionstests; insgesamt 137 lokale DAO-/Reward-Tests inkl. PostgreSQL bestanden. Echte Internal-TX-Antwort als Fixture erhalten; umgebende TX-/Token-Responses im Test kontrolliert, kein neuer unabhängiger Live-End-to-End-Nachweis.
- Änderung nur im Hilfsmodul `payout-coverage.ts`; keine Migration und kein geänderter `index.ts`. Deployment, Drei-TX-Live-Prüfung, SQL-Persistenz und erneute manuelle Prüfung sind inzwischen bestätigt; Details oben. DAO-Cron und Live-Worker bleiben aus.

## Phase 8.02 – Basis implementiert, vollständige Live-Abnahme offen

- Allgemeiner Auszahlungsstatus `no_payout_evidence` für beide Claim-Selektoren (DAO1/APTMDAO), strikt getrennt von NFT-Besitz, `canonical_existing_verified` und `audit_classification`. Kein Backfill der drei bekannten Fälle ohne Einzelprüfung.
- Vor negativer Einstufung: TX-Hash/Block/Selector/Erfolg/Absender/Empfänger gegen TX-Details prüfen; sämtliche transaktionsbezogenen Token- und Internal-Seiten lesen. Maximal zehn Seiten je Strom / 5'000 Einträge; API-Fehler, ungültige oder fehlende Pagination, unbekannte Token oder unklare Internals bleiben `needs_review`. Auch fremde/proxyseitige positive Eingänge und widersprechende persistierte Flows verhindern negative Klassifikation.
- Prüfabdeckung und zehn letzte Versuche dauerhaft am Kandidaten gespeichert. `needs_review` und `no_payout_evidence` nach mindestens 24 Stunden erneut prüfbar, neue `pending` zuerst; insgesamt maximal 20 pro Worker-Aufruf. Spätere belastbare persistierte Zahlungen können `verified` ergeben; unvollständige Nachprüfung führt zurück zu `needs_review`. Verifizierte/kanonisch markierte Kandidaten werden geschützt, Row-Lock und Zeitstempelvergleich verhindern veraltete Überschreibungen.
- Auszahlungsprüfung funktioniert unabhängig vom NFT-Prüfstatus. Noch offene `pending`-Payouts halten die inkrementelle Queue auf `partial`, damit der nächste Abschnitt am selben Tag bearbeitbar bleibt. `staged` ist weiterhin kein abgeschlossener Reward-Job.
- Kontrollierter Admin-Testmodus für maximal drei Null-Reward-TXs der fest hinterlegten Testwallet vorbereitet. Lokal synthetische Fixtures geprüft; die drei echten Fälle sind inzwischen live als no_payout_evidence geprüft und dauerhaft bestätigt (siehe oben). Vollständigkeit gilt für Explorer-Indexdaten, nicht als unabhängig verifizierter On-Chain-Negativnachweis.
- 8.02-Migration `20261108111030_dao_no_payout_evidence_802.sql` erfolgreich live ausgeführt; der erste manuelle Drei-TX-Test ist oben unter 8.03 dokumentiert. Die damaligen 131 lokalen Tests sind durch insgesamt 137 Tests in 8.03 ergänzt. DAO-Cron und `DAO_REWARD_ENABLE_LIVE_WORKER` bleiben deaktiviert.

## Unmittelbar nächster Schritt

Nur `supabase/migrations/20261108222813_cross_chain_token_metadata_808.sql` vollständig im Supabase SQL Editor ausführen. Mehrere DDL-/Funktionsanweisungen in einer atomaren Transaktion; keine separaten SELECT-Resultsets. Keine Provider-Abfrage und kein Cron beim Ausführen. Erst nach Rückmeldung Deployment anleiten.

## Danach weiter offen – DAO-Reward-Pipeline

- Vier frühe positive Payouts mit 8.04 live, dauerhaft und wiederholungssicher bestätigt. USD bleibt NULL, Preis-Ausnahme erhalten, keine canonical_existing-Kennzeichnung. Dieser Prüfschritt ist abgeschlossen.
- Drei Null-Reward-TXs einschliesslich dauerhaftem Status und manuell erzwungener Neuprüfung abgeschlossen. Automatische Wiederaufnahme nach echter 24h-Wartezeit sowie späterer positiver Evidenz noch nicht live getestet; lokale Tests decken diese Übergänge ab. Die vier frühen positiven Payouts sind inzwischen durch 8.04 bestätigt; weitere Zuordnungs-/Pipeline-Schritte bleiben separat zu prüfen.
- 8.06-Migration/Deployment und allgemeine Einzel-Claim-Route live prüfen; bei fehlendem echtem Kandidaten nur Leerlauf belegbar. Echte neue native und ERC20-Neuanlage live noch offen. Technische RPC-Metadaten müssen am Claim-Block abrufbar sein; andernfalls blockiert der Claim korrekt.
- Nativer Einzel-Claim-Pfad 8.05: Leerlauf live bestätigt, tatsächliche neue Claim-Neuanlage noch live prüfen; keine historischen Referenzfälle künstlich zurücksetzen. Fehlende zentrale Anker bleiben echte Blockierung. Anschliessend den manuellen Pfad in die vollständige inkrementelle Tagesqueue integrieren.
- Einen neuen DAO1/APTMDAO-Claim Ende-zu-Ende durch den serverseitigen inkrementellen Job prüfen: Wallet/Owner/NFT/Bot-Identität, native APTM und relevante Token (alte wAPTM, neue wUSDT/wUSDC), separate Referral-wUSDT-Evidenz, zentrale historische Preisermittlung, Dublettensicherheit, User-Isolation, Teilfehler und vollständige Queue-Abarbeitung.
- Fehlende zukünftige Flows aus gezieltem TX-Nachweis kontrolliert in den bestehenden kanonischen Import übernehmen; 8.02 protokolliert solche positiven Funde zunächst als Review, statt neue Beträge zu erfinden. Atomare kanonische Verarbeitung, feste bestätigte Blockfenster/unabhängige Coverage, faire Wiederholungssteuerung und verbleibende Preis-/Referral-Schritte fehlen weiterhin.
- Erst nach bestandenem manuellen/produktnahen Test DAO-Cron separat vom Wallet-Bestandsjob aktivieren. Geplante Fenster Schweizer Zeit: Bestände 01:00–04:00, DAO 04:05–05:30, TLN/VOW 05:35–07:00. Keine stillschweigende Aktivierung.

## Weitere offene WalletTracking-Aufgaben (nach Themen)

### Rewards / TLN / VOW
- Separaten **täglichen, inkrementellen TLN/VOW-Reward-Job** entwickeln; Staking-, Referral- und Bonus-Evidenz sowie historische Zuordnung und partieller Wiederanlauf. Rewards anhand TX-Zeit und bestehender Auswertung, **keine Reward-Snapshots**.
- Liste **letzte Stakings** über sämtliche Wallets (unabhängig vom Team), Token-Paare gemischt, Paar explizit anzeigen; Laufzeit und Ablaufdatum für diese Liste nicht erforderlich.
- Kompakte Staking-Übersicht mit Start/Ablauf/Unstake/Top-up/LP und zugeordneten Rewards sowie gesondert „abgelaufen, noch nicht unstaked“.
- VOW/v$-Handel (BSC/ETH, 24 h/7 d/30 d) und 30-Minuten-Job/Cache weiterhin End-to-End und Aktualisierungszeitpunkte überprüfen; ETH-v$-Preis darf abweichend sein, **kein Stablecoin-Ersatzpfad**.
- XRPL-Unterstützung über XRP-Bestand hinaus: Trustlines/issued currencies via `account_lines` offen.

### Wallet-Bestände / Betrieb
- **8.25 Bitcoin-Fallback lokal vorbereitet (Deployment/Live-Test offen):** täglicher BTC-Bestandsjob verwendet bei transienten Blockstream-Fehlern einmalig mempool.space; SQL-Archivierungsfehler `pg_catalog.coalesce` am 12.11. live behoben, am 13.11. vier von sechs Usern mit Abschluss. Ein User mit BTC HTTP 429 nach drei Versuchen, anderer User nach dem Job um drei Wallets erweitert. Historische Lücken / Retention weiterhin separat prüfen.
- Nächtlichen Wallet-Bestandsjob inklusive Fehlertransparenz, Retry, vollständigen Snapshots und Mehrbenutzer-/Cold-Start-Fällen produktiv nachtesten (früher 5 Wallets veraltet/fehlende Snapshots). `wallet_daily_balance_history` und Snapshot-Retention prüfen: letzte 7 Tage täglich, Tage 8–365 wöchentlich, ältere monatlich; manuelle Snapshots dauerhaft und unverändert.
- Fresh-User/Wallet: initiale TLN/VOW-Discovery serverseitig/kontrolliert statt grossem Browser-Scan; rein on-chain globale Caches wiederverwenden.
- Server-Jobs/Preis- und Cache-Synchronisation über Laufgrenzen, Fehlerfälle und Lösch-/RLS-Szenarien prüfen; Preisfindung muss applikationsweit dieselbe zentrale Logik verwenden.

### Sicherheit / Datenbank / Deployment
- Supabase-Schema/RLS/Functions/Trigger/Grants und historische Migrationen für reproduzierbaren Aufbau als verifizierte Baseline vervollständigen; ausgeführte Migrationen nie löschen. Browser-Tabellen nur bei nachgewiesenem Bedarf in API-exponiertem Schema, interne Jobs/Caches in nicht exponiertem Schema; RLS/User-Isolation und „Alle Daten löschen“ prüfen.
- Google-Login für bestehende Admin-Accounts später kontrolliert verknüpfen (gleiche `auth.users.id`), Admin-Rechte möglichst an UUID statt E-Mail binden; Auth-/Recovery-End-to-End mit weiteren Usern testen.
- **Offener UI-Fehler:** Apple-Passwortmanager findet den WalletTracking-Login in **Chrome auf macOS** nicht, trotz installierter und autorisierter iCloud-Passwörter-Erweiterung und Tests mit `letsgofree.me` sowie `www.letsgofree.me`; Safari funktioniert. Browser-/Formular-/Extension-Kombination später gezielt prüfen; nicht als behoben dokumentieren.
- Alle Wallets-/Nutzerfilter, Preisdezimalstellen, Dark Mode DAO-Tabellen, technische orange Admin-Chain-Spalten, Löschung auf „Meine Wallets“ belassen und Aufgaben-/Export-/Admin-Oberflächen beim nächsten Gesamtretest prüfen.

## Verbindliche Arbeitsregeln

- App-sichtbare Phase/Build **alleinige** Release-Version. ZIP nur geänderte/neue Dateien mit `wallet-tracking/`-Pfaden, Name `wt-update-<Phase>-<YYYYMMDD-HHMMSS>.zip` mit **echter Schweizer Zeit**. SQL-Migration `YYYYMMDDHHMMSS_beschreibung_versionsnummer.sql` mit tatsächlichem 14-stelligem Schweizer Zeitstempel.
- **Pro Antwort immer nur die nächste auszuführende SQL-Abfrage oder den nächsten Test zeigen.** Auf Rückmeldung warten, erst dann Folgeschritt; keine mehrteiligen SQL-Testlisten. Bei mehreren Resultsets ausdrücklich warnen, dass Supabase eventuell nur das letzte prominent zeigt.
- Bestehende, verifizierte Reward-Mengen, zentrale historische Preise, Bot-/NFT-Zuordnung und Bestandsdaten nicht ohne belastbaren Beleg überschreiben. Kein automatischer Cron ohne Abnahmetests. Jede Release-Dokumentation und diese Statusdatei nachführen.
- Ein ausgeteiltes Dokumentations-ZIP aktualisiert **nicht** automatisch GitHub oder Supabase; es muss eingespielt und committed werden.

## Bereits vorhandene lokale Testlücken

Erwartungen des historischen Docs-Cleanup-Tests und veralteter Snapshot-Testmock wie im 8.08-Release beschrieben korrigieren; beide Fehler bestehen bereits im 8.07-Baseline-Lauf. Keine Behauptung eines fehlerfreien kompletten tests/*.mjs-Laufs.
### Phase 8.52 – Abschlusskontrolle Reto, Schritte 53–70 (15.11.2026)
- **Schritt 53:** Globaler `exact-v13`-Audit nach dem letzten Batch bestätigt: **2'454/2'454** kanonische Claims konsistent, **0 Abweichungen** (NFT-ID, APTM, USD); die im vorherigen Nachtrag noch offene globale Abschlusskontrolle ist damit erledigt.
- **Schritte 54–56:** 16 weitere Kandidaten der Reto-Wallet mit `payout_status=pending`; alle besitzen eine gespeicherte Transaktion, **keiner einen gespeicherten Asset-Flow**. Keine automatische Negativklassifikation aus bloss fehlenden Flows.
- **Schritte 57–61:** Vorhandene SQL- und Edge-Prüfpfade untersucht. `wallettracking_dao_check_pending_native_payouts` verlangt positive kanonische Reward-Mengen; `wallettracking_dao_verify_single_native_payout_843` verlangt bereits gespeicherten positiven nativen Flow. Beide ungeeignet für diese 16 Null-Flow-Kandidaten. Der Edge-Import `nativeClaimPayout` liest Explorer-Internal-Transfers, schreibt nur positiv nachgewiesene Transfers; kein neuer Import implementiert.
- **Schritte 62–65:** Beispieltransaktion `0x567e84f9ed8b53f79f7b6f5e3b41c514ee999edc93668205fe4233143e80185a` (NFT #13760, Block 12071377): Explorer Internal und Token Transfers jeweils leer und ohne Folgeseiten; Haupttransaktion `status=error`, `execution reverted`, `NothingToClaim()`, `value=0`; lokal `project_transactions.status=error`, Reward-Felder NULL.
- **Schritte 66–70:** Alle **16** betroffenen Transaktionen haben gespeicherten `status=error`. Die Schutzbedingungen der 8.42-Klassifikation waren bereits erfüllt; die vermeintlich fehlende Klassifizierbarkeit resultierte ausschliesslich daraus, dass alle 16 schon am 14.11.2026 als **`audit_classification=failed_transaction`** markiert worden waren. Abschluss SQL: **393 Kandidaten = 377 kanonisch übernommen + 16 klassifizierte Fehler**, **0 weiterhin verarbeitbar**. Die 16 behalten `payout_status=pending` und `claim_pipeline_status=pending`; sie sind über `audit_classification` wirksam ausgeschlossen. **Keine weiteren Datenänderungen erforderlich.**
- **Weiter offen:** DAO-Gesamtjob samt zukünftiger/mehrbenutzerfähiger Staging-/Retry-/Preis-/ERC20-/Referral-Abnahme. Kein Cron- oder Live-Worker-Start; beide deaktiviert lassen. Der Abschluss der historischen Reto-Kandidaten ist keine allgemeine Job-Freigabe.

### Phase 8.53 – Read-only Mining-Event-Preview vorbereitet (15.11.2026)
- Schritte 71–93: 15 Wallets über sechs Benutzer; alle drei inkrementellen Scan-Streams pro Wallet gleichartig `complete` (7) oder `empty_verified` (8). 14.11.: 15 Wallets `staged` in 43 Schritten, null Fehler. `staged` ist kein Reward-Abschluss; tagesbezogener `cron-staged-one`-Wiederanlauf über Mitternacht bleibt offen.
- Bei Reto zusätzliche 149 unzugeordnete Kandidaten neben den abgeschlossenen 377 und 16 Fehl-TXs: 76 `unassigned_legacy` ohne gespeicherte Eingangsflows und 73 `unassigned_miner` mit erfolgreichen Miner-Claims, nativen APTM-Eingängen und historischen Preisen. Diese 73 sind noch keine kanonisch zu übernehmenden Claims.
- Pilot-TX `0xed667ac1…b71b32`, Block 14'099'107: NFT #37084 aus `RewardClaimed`-Event; vollständiger historischer Eigentumsnachweis und exakter interner APTM-Eingang. 8.43-Payout-Verifikation live erfolgreich und persistiert, keine anderen Writes.
- 8.53 liefert **nur** read-only Admin-Preview für genau ein Event mit strengen Payout-/NFT-/Ownership-Guards; Deployment und Live-Test offen. Nächster Schritt: Update einspielen und beide Edge-Dateien gemeinsam deployen; anschliessend genau einen Preview testen. Details `docs/releases/8.53-dao-miner-event-preview.md`.
- 377 kanonische Reto-Claims, 16 Fehltransaktionen, 125 NFT-Reparaturen und 2'454/2'454 `exact-v13`-Konsistenz unverändert schützen. DAO-Cron und Live-Worker AUS.

### Phase 8.54 – Bewachte NFT-Einzelzuordnung vorbereitet (15.11.2026)
- 8.53-Einzel-Preview live erfolgreich: `ready=true`, NFT #37084, Collection 32887, `72141524528301886` Wei, Block 14'099'107, Preisquelle `exact-v13`. Keine Claim- oder NFT-Änderung beim Preview.
- Neue SQL-Servicefunktion mit festen Pilot-Guards, erneuter Payout-/Eigentums-/Transfer-/Preisprüfung und atomarem Kandidaten-Update; neuer Admin-Commit-Modus verwendet vor jedem Write denselben frischen 8.53-Preview. Kein kanonischer Claim-Write.
- Installation **offen**. Nur die neue SQL-Migration installieren, Ergebnis abwarten; danach erst Edge-Deployment und genau ein Test. Allgemeine Queue, ERC20/Referrals und Wiederanlauf weiter offen. DAO-Cron/Live-Worker AUS.

### Phase 8.55 – SQL-Spaltenkorrektur nach erster 8.54-Liveprobe
- 8.54 SQL und Edge installiert; erster einzelner Aufruf wurde mit `Guarded NFT assignment refused: column "updated_at" of relation "dao_reward_claim_candidates" does not exist` abgelehnt. Das UPDATE wurde nicht ausgeführt, kein Erfolg behauptet.
- 8.55-Migration ersetzt dieselbe service-only RPC ohne `updated_at`-Zuweisung. Kein neuer Edge-Deploy, keine automatische Datenänderung. Als Nächstes **nur diese Migration** installieren und Ergebnis melden. DAO-Cron/Live-Worker AUS.

### Phase 8.56 – Drei-Miner-Read-only-Preview vorbereitet
- Ein zusätzlicher Reto-Claim (NFT #37084) ist nach 8.55-Fehlerkorrektur vollständig kanonisch übernommen und in beiden Tabellen konsistent; global 2'455/2'455 `exact-v13`-Claims, null Abweichungen. 72 `unassigned_miner` und 76 `unassigned_legacy` bleiben offen.
- Neue begrenzte, reine Admin-Preview für bis zu drei älteste Miner-Kandidaten mit on-chain Event, nativer Explorer-Auszahlung, unverändertem exaktem Preis und historischer Ownership-Coverage. Keine SQL-/Reward-/Queue-Writes. Deployment/Test offen; Details `docs/releases/8.56-dao-three-miner-preview.md`.
- Nächster Schritt: ZIP übernehmen, `index.ts`, `miner-event-853.js` und `miner-batch-preview-856.js` gemeinsam deployen; Ergebnis melden. DAO-Cron/Live-Worker AUS.

### Phase 8.57 – Mehrere RewardClaimed-Events eines NFT aggregieren
- Live-Preview 8.56 für drei älteste offene Miner: 0 bereit, 3 blockiert als `reward-event-missing-or-ambiguous`, ohne Datenänderung. Explorer zeigt bei erster TX viele RewardClaimed-Events zu NFT #37084 und derselben Staker-Adresse, jedoch mehreren Collection-IDs.
- Neue read-only 8.57-Aggregation fordert identisches NFT/Staker, eindeutige Log-Indizes, vollständige TX-Logs und exakte BigInt-Summe gleich nativer Explorer-Auszahlung und persistiertem `exact-v13`-Flow. Keine automatischen Writes; Deployment/Live-Test offen.
- Nächster Schritt: Update-ZIP übernehmen, vier Edge-Dateien gemeinsam deployen, Rückmeldung abwarten. DAO-Cron/Live-Worker AUS.

> **Aktuell 8.58 (15.11.2026):** 8.57 live erfolgreich: 3/3 Multi-Event-Kandidaten read-only bereit (499/500/500 RewardClaimed-Logs). Erster Kandidat TX `0xb4090cfa…` mit 54.477996600093324995 APTM einzeln Explorer-verifiziert und per SQL kontrolliert (1 unveränderter exact-v13-Flow, 0 kanonische Claims, NFT noch leer). 8.58 enthält eine **nur für diese TX** zugelassene, zweifach (Explorer + SQL) geschützte NFT-Kandidatenzuordnung; noch nicht installiert. **Nächster Schritt:** ausschliesslich SQL-Migration 8.58 installieren und Rückmeldung abwarten; erst danach Edge-Deployment und Einzeltest. DAO-Cron und Live-Worker bleiben AUS. Siehe `docs/releases/8.58-dao-multi-event-single-assignment.md`.

> **Aktuell 8.59:** 8.58 zweiter Reto-Multi-Event-Pilot (499 Events, 54.477996600093324995 APTM) vollständig kanonisch abgeschlossen; global **2'456/2'456 exact-v13 konsistent, 0 Abweichungen**. Früherer abweichender Flow-vs-Transaktions-Audit war ein falscher Vergleich, kein Datenfehler. Noch 71 `unassigned_miner`, alle Payout zunächst pending. 8.57 Read-only-Preview zeigte 3/3 nächstälteste bereit (500/500/237 Events). Für ersten Folgekandidaten TX `0xed7beb78…` 50.945303137912696144 APTM mit 8.43 erfolgreich verifiziert, SQL bestätigt `unassigned_miner`, `verified`, kein NFT, kein Claim. 8.59 liefert **ausschliesslich für diese zweite TX** eine eigene geschützte Kandidaten-NFT-Zuordnung (500 Events); keine allgemeine Batch-Schreibroute. **Nächster Schritt nur 8.59-SQL-Migration installieren**, Rückmeldung abwarten, Edge danach separat. DAO-Cron und Live-Worker AUS.

> **Aktuell 8.60:** 8.59 erfolgreich installiert und der dritte Multi-Event-Reto-Claim (500 Events, NFT #37084, 50.945303137912696144 APTM) einzeln finalisiert. SQL-Datenabgleich sowie global **2'457/2'457 `exact-v13`-Claims konsistent, 0 Abweichungen**. Reto jetzt **380 kanonische Claims**, **70 weitere unassigned Miner**; 76 unassigned Legacy weiter separat offen. 8.60 liefert erstmals paginierbaren Admin-Read-only-Preview (`admin-miner-page-preview-860`) für je maximal drei Kandidaten mit Block/Hash-Fortsetzungspunkt und umfassender 8.57-Event-/Preis-/Ownership-Evidenz. Keine Schreibroute für weitere Miner, kein Cursor-Write. **Nächster Schritt:** ZIP installieren und nur Edge Function aktualisieren; danach erste Read-only-Seite testen. DAO-Cron/Live-Worker AUS.

> **Aktuell 8.61:** Vorher 8.60 live erfolgreich: erste zwei Read-only-Seiten jeweils 3/3 `ready`, keine Überlappung oder Fehler, Cursor und `hasMore` korrekt, keine Writes. Insgesamt weiterhin 70 `unassigned_miner` bei Reto, globaler letzter Audit **2'457/2'457 exact-v13**, 0 Abweichungen. 8.61 löst die fest verdrahteten Einzel-Piloten durch **generischen Admin-Einzel-NFT-Preview und abgesicherte Kandidatenzuordnung** ab. **Nicht** Teil dieses Releases: automatische Payout-Verifikation, kanonischer Claim-Commit oder Batch-Writes. Für das erste Live-Beispiel zunächst 8.61-SQL installieren, dann Edge deployen, danach gezielt bereits bekannte Transaktion erst Payout-verifizieren und read-only prüfen; jede Stufe einzeln abnehmen. DAO-Cron und Live-Worker AUS.

> **Aktuell 8.62 – 8.61-SQL-Korrektur:** 8.61-Migration scheiterte in Supabase mit SQLSTATE 42601 bei Zeile 123 (nach COMMIT angehängte unzulässige duplizierte SQL-Zeilen). Die gesamte SQL-Transaktion wurde abgebrochen; **keine Installation und kein Daten-Write**. 8.62 liefert neue, vollständige Migration `20261115191059_dao_general_single_miner_assignment_fix_862.sql` für dieselbe function `wallettracking_dao_assign_multi_miner_nft_861`. Ursprüngliche noch nicht erfolgreich ausgeführte 8.61-Quelldatei im Projektarchiv ebenfalls syntaktisch korrigiert, damit künftige Migrations-Replays nicht scheitern. SQL-Test und Edge-Abnahme stehen aus. **Nächster Schritt ausschliesslich neue SQL-Migration 8.62 ausführen; danach Rückmeldung abwarten.** DAO-Cron/Live-Worker AUS. Letzter geprüfter Stand 2'457/2'457 exact-v13, 0 Abweichungen.

> **Aktuell 8.63 – manueller Dreierbatch (15.11.2026):** 8.62 SQL und Edge live. Einzelfälle aus 8.60 und die ersten beiden neuen NFTs #42474/#42475 sind einzeln verifiziert und finalisiert. Global letzter Audit **2'465/2'465 exact-v13 konsistent, 0 Abweichungen**. Der dritte Kandidat des jüngsten Previews (NFT #42475, TX `0x6423673e…b866c`, Block 14711369) hat bereits verifizierte native Auszahlung und zugeordnetes NFT; kanonischer Claim **noch offen**. 8.63 ergänzt `admin-miner-batch-plan-863` (nur lesen) und `admin-miner-batch-commit-863` (höchstens 3 TX, bindet ersten Hash, sequenziell, stop-on-error/time budget). Nutzt unveränderte 8.43-/8.61-/8.49-RPCs mit jeweils frischem Guard; nimmt bereits zugeordnete TX nach Unterbrechung wieder auf. **Nächster Schritt:** nur Update-ZIP und `dao-reward-refresh/index.ts` deployen, danach Read-only-Plan für Test-Wallet ausführen. Kein neues SQL. DAO-Cron und Live-Worker AUS. Batch noch nicht live erprobt; vor automatischem DAO-Job fehlen Tests anderer Wallets, Fehlerfälle, Langläufe und Wiederanlauf.

> **Aktuell 8.64 – UUID-Guard-Hotfix:** 8.63 wurde deployt; erster Read-only-Plan lieferte `Invalid guarded miner batch request`. Ursache: falsche UUID-RegEx (versehentlich sechs Gruppen statt fünf) im neuen Edge-Modus, **noch vor jeder DB-Operation**. 8.64 korrigiert die Eingabeprüfung, ergänzt expliziten Standard-UUID-Regressionstest und ändert sonst keine Batch-Logik. **Nächster Schritt:** ZIP installieren und nur `wallet-tracking/supabase/functions/dao-reward-refresh/index.ts` deployen, dann `admin-miner-batch-plan-863` erneut schreibgeschützt testen. Keine neue SQL; DAO-Cron/Live-Worker AUS. Weiterhin 2'465/2'465 exact-v13 konsistent aus letztem Audit.

> **Aktuell 8.65 – kontrollierter 10er-Batch:** Nach 8.64 zwei manuelle 3er-Batch-Commits live vollständig erfolgreich, 6/6 neue kanonische Claims; Wiederanlauf eines NFT-assigned Kandidaten und Abweisung des verbrauchten Start-Hash bestätigt. Global zuletzt **2'471/2'471 exact-v13 konsistent, 0 Abweichungen**. Noch **56 offene `unassigned_miner`**, alle Payout und Claim pending, NFT leer. Neue Admin-Modi `admin-miner-batch-plan-865`/`admin-miner-batch-commit-865` bis zehn TX, mit identischer 45s-Zeitgrenze und frischen Einzelguards; bisherige 8.63-Dreiermodi unverändert. **Nächster Schritt nur Update-ZIP installieren und Edge-Datei `wallet-tracking/supabase/functions/dao-reward-refresh/index.ts` deployen, danach Read-only-Zehnerplan testen.** Keine SQL. DAO-Cron/Live-Worker AUS; vor dessen Aktivierung fehlen mindestens Mehrwallet-, Fehler- und Neustarttests.

> **Aktuell 8.79 (16.11.2026, vorbereitet):** 8.78 live 5/5 preisfähige historische MineBot-Claims `verified_preview` mit exact-v13/USD und Native-Mint-Nachweis; kein Write. 8.79: **einmaliger, fester und manuell zweifach bestätigter atomarer 5er-Commit** mit frischer Live-Verifikation aller Hashes, Beträge, NFT-Eigentum und Archiv-Pool-State-Preise, Wallet- und DB-Guards, bestehendem Finalizer; bei Abweichung kompletter SQL-Rollback. Aus 75 Legacy offen sind 71 preisfähig, **vier frühe unbewertete** verbleiben ausdrücklich für gesonderten Pfad. Offen: ZIP installieren, SQL-Funktion installieren, Edge deployen, Preview erneut prüfen, nur dann explizit committen und SQL-DB-Abnahme; danach übrige Legacy-Claims planen. Keine Cron-/Worker-Freigabe. `docs/releases/8.79-dao-legacy-priced-five-atomic-commit.md`.

> **Aktuell 8.83 (17.11.2026, vorbereitet):** Entwicklungsumgebung wieder verfügbar. 8.82-Bounded-Commit strukturell und per Regressionstest geprüft. Benutzer meldet 36 verbleibende bewertbare Legacy-Claims; **Live-Zähler noch nicht unabhängig bestätigt**, historischer 8.82-Bericht nennt 56. 8.83 entfernt drei unsichtbare abgeschlossene Commit-Buttons (8.79–8.81) und zeigt `remainingBefore` im Admin an. 8.82-Service-Guard bleibt unverändert. **Keine Claims durch Paketbau geschrieben; kein SQL-Drop ohne DB-Abhängigkeitsprüfung.** Nächster Schritt: ZIP installieren, danach nur Read-only-Vorschau ausführen und Rückmeldung mit `remainingBefore`, `results` und `stopped` geben. Details `docs/releases/8.83-legacy-remaining-and-audit-cleanup.md`. DAO-Cron/Live-Worker AUS.

> **Aktuell 8.84 (17.11.2026, vorbereitet):** Acht 8.82-Commit-Stapel aus 8.83 live bestätigt, **36/36 bewertbare Legacy-Claims kanonisch und unabhängig geprüft; 0 priced offen**. Vier **weitere** früheste Legacy-Claims (Blöcke 40707/40709/62642/62644) separat nachgewiesen: 4/4 Native-Mint-Call/Event und historische NFT #818/#819-Ownership, 0 Claims/Flows, keine Preisanbindung vor Block 88356. 8.84 bereitet **installationsseitig schreibfreie** service-only Viererfunktion plus Edge-Live-Recheck und manuellen Admin-Doppel-Commit vor; USD bleibt NULL, zentraler Finalizer unverändert. **Nächster Schritt nur ZIP installieren, dann SQL-Migration installieren und Rückmeldung**, Edge-Deploy separat danach. Pair-Logbereichs-Providerfehler (max 2048 Blöcke) als gesonderter Punkt offen, alte Audit-RPC-Bereinigung nach Live-Abhängigkeitsprüfung. DAO-Cron/Live-Worker AUS. Siehe `docs/releases/8.84-dao-four-preanchor-unpriced-claims.md`.

> **Aktuell 8.85 (17.11.2026, vorbereitet):** Festgelegte Test-Wallet: historische Legacy-MineBot-Claims **76/76 kanonisch abgeschlossen**, davon vier sehr frühe Native-Auszahlungen korrekt ohne USD (`unpriced_before_exact_anchor`); unabhängige Live-SQL-Abnahme bestätigt 4/4 Claim+Flow, `legacy_noch_offen=0`. Die fünf erledigten Sonderkarten und alten Edge-Legacy-Routen sind in 8.85 entfernt. Sechs einmalige SQL-Commit-Funktionen laut Live-Abhängigkeitsabfrage 0 interne Verweise; gesicherte `DROP ... RESTRICT`-Migration `20261117100618_dao_retire_completed_legacy_helpers_885.sql` bereit. **Nächster Schritt: ZIP installieren, danach Edge `dao-reward-refresh/index.ts` deployen, erst danach SQL-Drop.** DAO-Cron/Live-Worker weiterhin AUS; multiwalletige Reward-Job-End-to-End-Prüfung und Apertum-2'048-Block-Chunks offen. Details `docs/releases/8.85-dao-completed-legacy-retirement.md`.

> **Aktuell 8.86 (17.11.2026, vorbereitet):** DAO-Dailyjob weiter AUS, 15 Wallets zuletzt `staged`. 1'870 offene Candidate-Markierungen bei bereits eindeutig kanonischen NFT-Claims. Davon 1'690 mit nativen Eingangsflows und mengen-/herkunftskonsistenten APTM-Belegen (1'600 bereits durch 7.99 markierbar, 89 winzige Binary64-Vergleichsfehler, 1 echter Prelaunch ohne USD); 164 historische positive Claims der Wallet `e8b5c835…` ohne irgendeinen Flow/Payout-Rohbeleg und 16 erfolgreiche Null-Wert-Kandidaten ohne Payout-Coverage. **8.86 liefert ausschliesslich eine Admin-Read-only-Live-Vorschau für die 164**, maximal drei pro Aufruf, strenge Mint-Trace/Event-/NFT-Guards, keine Writes. ZIP/Edge-Deploy/erster Live-Test offen. Nächster Schritt: ZIP installieren; dann genau `dao-reward-refresh/index.ts` und neues `legacy-flow-proof-886.js` deployen; danach erste drei prüfen. Details `docs/releases/8.86-dao-historical-native-flow-preview.md`.

> **Aktuell 8.87 (17.11.2026, vorbereitet):** 8.86 wurde installiert und deployed; erster read-only Preview der 164 Flow-losen Claims stoppte bei Block 1'794'927/NFT #89892 wegen nicht verifiziertem gespeicherten Ownership-Flag (0 Writes). SQL-Audit: 131/164 Claims durch acht vollständig gespeicherte NFT-Transferhistorien eindeutig gedeckt; weitere 33 Claims betreffen nur NFT #89892 (17) und #90054 (16), für beide 0 Cache-Transfers / kein Coverage. **8.87 korrigiert ausschliesslich den lesenden Prüfpfad:** Bei jeder Vorschau Live-ERC-721-Transferhistorie aus Explorer für historischen Besitzer, keine automatische Übernahme oder Änderung von Ownership/Claims/Flows. Nächster Schritt ZIP installieren, Edge `dao-reward-refresh/index.ts` mit vorhandenen Hilfsmodulen deployen, nur erste 3 erneut prüfen. SQL und Cron unverändert. `docs/releases/8.87-dao-live-historical-nft-proof.md`.

### Phase 8.99 – DAO1: manuell testbarer Rohdaten-/Reward-Tagesablauf (18.11.2026)

- Live-Abnahme 8.98: Drei Reward-Batches (5+5+1 Wallets) alle erfolgreich; anschliessend read-only `cron-staged-preview` mit exakt 15 `completed`, 0 `staged`, 0 `failed`. Keine neuen Claims. Live-Worker aus.
- Supabase-Cron-Audit 0 DAO-Jobs; v2-Claim erstellt Queue-Einträge bei erstem heutigen Aufruf und verwendet eigene Raw-Leases, v3 beansprucht nur `staged` und abgelaufene Reward-Leases. Transition-/Finish-Funktionen und Fehlerzähler unverändert.
- 8.99: neuer manueller, eng begrenzter Orchestrator `cron-daily-step-899` (ein Raw- **oder** Reward-Schritt pro Request), keine Cron-Aktivierung, keine SQL-Migration. Erst installieren und Edge deployen; anschliessend read-only Tagesstatus prüfen, erst dann ein bewusster Idle-Test. Die tatsächliche unbeaufsichtigte Tagesautomatik sowie unabhängige Completeness-/Monitoring-Guards bleiben offen. `docs/releases/8.99-dao-manual-daily-orchestration.md`.

### Phase 8.98 – DAO1: verbliebene elf Wallets kontrolliert in Reward-Phase abarbeiten (18.11.2026)

- 8.97 SQL installiert und Fehler behoben. Alle 15 Wallets für den 18.11. gestaged (0 unresolved); vier erfolgreiche `cron-staged-one`-Schritte, alle `completed`, 0 neue Claims. Elf weitere `staged`; genau ein älterer, inzwischen kontrolliert zurückgesetzter SQL-Fehlversuch bleibt als failure_count=1 sichtbar.
- 8.98 ergänzt ausschliesslich den manuellen `cron-staged-batch-898` mit demselben Single-Wallet-Guard, maximal fünf Schritten, Zeitbudget und Stop bei jeder Abweichung. SQL-Migration keine; ZIP/Edge-Deploy und Live-Abnahme noch offen. Historischen gezielten Queue-Reset nicht erneut ausführen.
- **Nächster Schritt:** ZIP installieren und Edge Function deployen, danach **zuerst nur** `cron-staged-preview` (read-only). DAO-Live-Worker/Cron AUS. `docs/releases/8.98-dao-reward-staged-batch.md`.

### Phase 9.01 – Dashboard-Rewards und VOW/v$-Handel Dunkelmodus (18.11.2026)

- Die Dashboard-Kacheln Rewards und Referral Rewards zeigen die Perioden in der Reihenfolge Gesamt/Monat oben und Jahr/Vorjahr unten. Auch die projektbezogenen Reward-Blöcke erhalten dieselbe Reihenfolge.
- Im TLN/VOW-Handel erhalten alle Chain-Zeilen im Dunkelmodus explizit dunkle Hintergründe und helle Schrift; Zebra- und Hover-Darstellung bleiben erhalten.
- Ausschliesslich Frontend, keine SQL-Migration und keine Edge-Funktion. Browser-/Live-Abnahme ausstehend. `docs/releases/9.01-dashboard-trade-darkmode.md`.

### Phase 9.02 – Wallet-Bestand: gemeinsame Spaltenbasis (18.11.2026)

- Korrektur des in 9.00 eingeführten synchronisierten Scrollens: Bisher hatten Header und Chain-Karten unterschiedliche nutzbare Breiten; die Spalten konnten deshalb versetzt erscheinen und beim weiteren Scrollen scheinbar nachrücken.
- Jede Wallet erhält einen einzigen horizontalen Scrollcontainer für Header und sämtliche Chains. Einheitliche Tabellenbreite, ohne horizontales Innenpadding der Chain-Tabellen. Summary-Tabellen behalten eigenständiges Scrollen.
- Keine Daten-/SQL-/Edge-Änderungen. Syntaxprüfung abgeschlossen, visuelle Browserabnahme ausstehend. `docs/releases/9.02-wallet-unified-scroll-grid.md`.

### Phase 9.03 – TLN/VOW Handel: serverseitig vorverdichteter Cache (18.11.2026)

- Einführung einer user-geschützten Tabelle `tln_vow_trade_rollup` mit 24-h-/7-d-/30-d-Volumen und Top-20-Händlern je Chain/Token, bereitgestellt durch service-only Funktion `wallettracking_refresh_tln_vow_trade_rollup_903`.
- Der bestehende 5-Minuten-Indexer aktualisiert die Zusammenfassung nach seinen Chain-Läufen; die verifizierten Einzel-Swaps bleiben unverändert. Frontend nutzt frischen Rollup und fällt bei fehlendem/veraltetem Rollup auf den bisherigen Rohdaten-Ladeweg zurück.
- Installation **noch offen**: zuerst SQL-Migration, dann Edge-Funktion `tln-vow-trade-sync` deployen, anschliessend Frontend 9.03 installieren. Keine Aktivierung neuer Cron-Jobs. Unabhängiger Produktivvergleich (Volumen, Händler, Zeitfenster) und Zeitmessung noch offen. `docs/releases/9.03-tln-vow-trade-rollups.md`.

### Phase 9.04 – Automatische Sicherheits-Nachprüfung offener Token (18.11.2026)

- Bestehende Discovery-Cache-Einträge ohne verwertbares Risikoergebnis werden bei Öffnung/Wechsel in den Discovery-Tab und danach alle fünf Minuten **nur solange dieser Tab aktiv ist** in begrenzten Stapeln von maximal zehn unterschiedlichen EVM-Contracts nachgeprüft; pro Contract mindestens 15 Minuten Abstand innerhalb der laufenden Sitzung.
- Kein neuer Blockchain-Scan und keine Aufhebung der 30-Tage-Sperre. Andere Chains ohne unterstützten Provider bleiben offen; Fehlschläge ergeben weiterhin kein Sicherheitsurteil. Bestehende manuelle Spam-Markierungen bleiben erhalten.
- Anzeige ergänzt die vom Anbieter gelieferte Fehler-/Limitbegründung, falls vorhanden. Keine SQL-Migration oder Edge-Änderung. JavaScript-Syntax erfolgreich, Live-Abnahme ausstehend. `docs/releases/9.04-token-risk-background-recheck.md`.

### Phase 9.05 – Discovery: manuelle Spam-Markierungen behalten (18.11.2026)

- Fehler behoben: Ein erneuter Discovery-Scan ersetzte alle `findings` und verlor die zuvor manuell gesetzten `userMarkedScam`-Felder. Vor dem Schreiben wird nun der aktuelle Wallet-Cache gelesen; manuelle Markierungen werden nach Chain+Contract-Adresse in die neuen Treffer übernommen. Vorübergehend nicht erneut entdeckte markierte Adressen bleiben als nicht angezeigte Marker im selben Wallet-Cache erhalten.
- Die GoPlus-Risikofunktion wird nicht mehr für Apertum oder andere nicht unterstützte Chains aufgerufen; stattdessen bleibt ein ehrliches `nicht unterstützt` ohne Sicherheitsurteil.
- Regressionstest `tests/discovery-preserve-spam-905.mjs` und JavaScript-Syntax erfolgreich; Live-Test ausstehend. Keine SQL-/Edge-Änderungen. Details: `docs/releases/9.05-discovery-spam-persistence.md`.


### Phase 9.06 – Discovery: manuelle Priorität und USDT-Adressprüfung (18.11.2026)
- Bereits manuell als Spam markierte Contracts werden vor der GoPlus-Abfrage aus dem neuen Discovery-Scan entfernt (aus dem zuletzt gespeicherten Wallet-Cache gelesen). Auch die automatische Nachprüfung überspringt markierte Contracts nach dem erneuten DB-Read.
- Spam-Verdachtszähler zählt ausschliesslich noch nicht manuell markierte Kandidaten. Manuell markierte erscheinen, falls eingeblendet, mit eigener Kennzeichnung statt einem erneuten GoPlus-Verdacht.
- Explizite Contract-Referenz für BSC-USDT `0x55d398326f99059ff775485246999027b3197955` und Ethereum-USDT `0xdac17f958d2ee523a2206206994597c13d831ec7`. Gleicher Ticker mit abweichendem Contract erzeugt einen Adress-/Identitätsverdacht, keine automatische Spam-Klassifizierung; andere Chains bleiben bei verifizierten Stammdaten. Bridged-Token können legitime Ausnahmen sein.
- Regressionstests 9.06, 9.05 und Mehrwallet-Bulk bestanden; Syntaxprüfung bestanden. Noch produktiv zu testen. Keine SQL-Migration oder Edge-Änderung.

### Phase 9.07 – Unicode-Nachahmung bekannter Token-Symbole (18.11.2026)
- 9.06 verglich bekannte Ticker zu streng: Auf BSC optisch als `USDT` angezeigte Einträge trugen tatsächlich `U឵S឵DΤ` und wurden trotz falscher Contract-Adresse nicht erkannt.
- Ticker-Normalisierung für den Vergleich mit bekannten Token-Referenzen eingeführt, inklusive Unicode-Markierungen, Fullwidth und ausgewählten Homoglyphen. Betrifft nur Nachahmungen bereits bekannter Symbole, kein pauschales Verbot anderer Schriftzeichen.
- Ein abweichender Contract löst unabhängig von GoPlus einen Nachahmungsverdacht aus, keine automatische Spam-Markierung. Manuell markierte Token bleiben von Verdacht/Nachprüfung ausgeschlossen.
- Tests 9.07 + 9.06 und JS-Syntax bestanden; produktive Browser-Abnahme offen. Nur Frontend, keine SQL- oder Edge-Änderung. Details: `docs/releases/9.07-discovery-unicode-token-impersonation.md`.


### Phase 9.12 – TLN/VOW Read-only Wallet-Transfer-Logscan (20261118-220758)

- Geschützter neuer `delta-scan-preview` liest BSC-ERC20-Transfer-Events walletbezogen über `eth_getLogs` für vier bereits verifizierte Token-Adressen und ein einziges 5'000-Block-Fenster. Nur aggregierte Ereigniszähler, kein Reward-Beweis. Providerfehler blockiert den Test ohne Cursorfortschritt.
- Produktive Rewards-Automatik **weiterhin offen**: alle Reward-Verträge/Events, genaue Klassifikation gegen bestehende Discovery, kryptografisch sichere Walletberechtigung, persistente Cursor, Daily-Cron, Backfill und Regression gegen verifizierte Snapshots.
- `docs/releases/9.12-tln-vow-wallet-scoped-log-inspection.md`; sichtbare Phase 9.12 / Build 20261118-220758.


### Phase 9.13 – TLN/VOW Delta-Scan-Diagnose (20261118-221933)

- `delta-scan-preview` akzeptiert `maxBlocks` von 1 bis 5'000 (Standard 5'000); Werte ausserhalb des Bereichs werden mit HTTP 400 abgewiesen. Chunkgrenzen, Restblöcke und Folgeabschnitt hängen vom tatsächlich gewählten Wert ab.
- RPC-Fehler werden ohne URL, Authentisierung oder Rohantwort diagnostiziert: `phase`, `category`, optional `httpStatus` und `rpcCode`. Keine sensiblen Providerdetails in Logs oder Antwort.
- Test bleibt vollständig read-only. Kein neuer Reward-Worker, kein Cron, kein Cursorfortschritt, keine neue Klassifikation.
- Edge Function neu deployen; Test zuerst mit `{"mode":"delta-scan-preview","maxBlocks":100}`.

### Phase 9.16 – TLN/VOW Delta-Scan mit manueller Alchemy-Transfer-API (20261119-063502)

- Der geschützte `delta-scan-preview` verwendet statt des auf BSC auf zehn Blöcke beschränkten `eth_getLogs` nun `alchemy_getAssetTransfers`, wie die bestehende manuelle Discovery.
- Walletbezogene ERC-20-Eingänge und -Ausgänge werden paginiert und auf vier bekannte Contracts ausgewertet. Acht Seiten je Richtung begrenzen den Test; bei unvollständiger Pagination ist `scanCompleted=false` und kein `nextFromBlock` freigegeben.
- Keine Reward-Klassifikation, Cache-/Cursor-Schreiboperationen oder Cron-Aktivierung. Der tägliche TLN/VOW-Rewards-Worker bleibt offen; Live-Test nach Deploy erforderlich.
- Details und Testaufruf: `docs/releases/9.16-tln-vow-alchemy-transfer-preview.md`.

### Phase 9.17 – Gemeinsame TLN/VOW-Verifikationsregeln (20261119-075000)

- Neue browser- und Edge-kompatible reine JS-Regeln `js/tln-reward-verification-core.js`: Reward-Coverage, Referral-Engine-Abschluss, vollständig geprüfter Blockbereich versus letzter Event-Block, bestehende Snapshot-Belege.
- Manuelle Discovery speichert explizite Verifikationsbelege; Step-5-Fehler werden nicht mehr als erfolgreicher Workflow-Abschluss gespeichert. Bestehende historische Snapshots bleiben unverändert und gelten ohne zusätzliche Proof-Felder als unbewiesen, nicht als falsch.
- Edge-Modus `snapshot-verification-audit` wertet alle bekannten Snapshot-Proof-Felder ausschliesslich aggregiert und read-only aus. Der Delta-Preview lässt alte Workflow-Flags nicht mehr als vollständige Reward-Verifikation erscheinen.
- Lokale Tests bestanden, Live-Abnahme offen. Die eigentliche Reward-/Referral-Klassifikation ist **noch nicht** serverseitig geteilt. Kein Cron. Dokumentation: `docs/releases/9.17-tln-vow-shared-verification-core.md`.

### Phase 9.18 – Supabase-Editor-Deploy repariert (20261119-080025)

- 9.17 konnte wegen relativem Import ausserhalb des Edge-Bundles nicht aus dem Supabase-Dashboard deployt werden (`Module not found`). 9.18 entfernt diese Laufzeitabhängigkeit.
- Kanonische Verifikationsregeln bleiben in `js/tln-reward-verification-core.js`; `tools/build-tln-reward-edge.mjs` bettet dieselbe Datei generiert in die eigenständig deploybare Edge Function ein. Test 9.18 prüft exakte Parität.
- Nur Deploy-Korrektur; keine Jobs/DB-/Reward-Schreibpfade aktiviert. Live-Deploy und `snapshot-verification-audit` stehen aus. Details: `docs/releases/9.18-tln-vow-edge-standalone-deploy.md`.

### Phase 9.19 – Historischer TLN/VOW-Reward-Belegaudit (20261119-080551)

- 9.18 wurde produktiv deployt; `snapshot-verification-audit` meldete 7/7 Legacy-Snapshots ohne neue Proof-Felder. Das ist kein Nachweis fehlender Rewards.
- Neuer read-only Modus `legacy-evidence-audit`: aggregiert bestehende belegte Reward-Zeilen, strukturierte Claim-Zuordnungen, Referral-Referenzengine-Ergebnisse und gesonderte `erc20-history-v1`-Scanstände.
- Bestehende Belege werden **nicht** zur vollen neuen Verifikation hochgestuft; kein Chain-RPC, kein Cron und keine Datenmutation. Live-Test nach Deploy offen. Details: `docs/releases/9.19-tln-vow-legacy-evidence-audit.md`.

### Phase 9.20 – Gezielte forensische Prüfung eines historischen Reward-Eintrags (20261119-085819)

- Produktiver 9.19-Audit: 7/7 historische ERC-20-Scan-Caches vorhanden, 3 belegte Reward-Zeilen, 2 strukturell zugeordnet, 1 offener Key. 7 Referral-Referenzresultate, 0 gespeicherte Fehler, 0 starke Referral-Zeilen.
- Neuer geschützt/read-only Edge-Modus `legacy-unmatched-detail` liefert höchstens zehn strukturell nicht zugeordnete Reward-Zeilen mit öffentlichem Tx-Hash, Token, Betrag, Selector und Beweis-Merkmalen, ohne Wallet-/User-Identität oder Rohpayload.
- Keine automatische fachliche Neu-Klassifikation, DB-Mutation oder Cron. Produktiver Detailtest offen. Dokumentation: `docs/releases/9.20-tln-vow-unmatched-reward-detail.md`.

### Phase 9.21 – Historische Staking-Position zur TLN+-Mint-Tx prüfen (20261119-100209)

- Produktiver 9.20-Test: 1 unzugeordnete Reward-Zeile, 5'500 TLN+-Zero-Mint an dieselbe Wallet; Hash `0xacf7cfc5…8509131`, Selector `0xa7d545db`, kein Lot-Stake-/Unstake-Hash-Match. BscScan-Screenshot bestätigt erfolgreiche `Stake`-Tx vom 14.12.2024 in Block 44871018 mit 11'000 USDT und LP-Transfers.
- Neuer fest auf diese historische Tx begrenzter Read-only-Modus `legacy-stake-lifecycle`: vergleicht bestehende Lot-Stake-Hashes/-Blöcke, Contract-Call-Aufzeichnungen und nächste gespeicherte Positionen; kein RPC, keine Schreiboperationen und kein Cron.
- Lokaler Test bestanden; produktiver Audit offen. Dokumentation: `docs/releases/9.21-tln-vow-historical-stake-lifecycle.md`.

### Phase 9.22 – Verifizierte Top-up-Mints positionsgenau als Reward berücksichtigen (20261119-114326)

- Produktiver SQL-Audit: `0xacf7cfc5…8509131` ist im Top-up der bestehenden offenen Position `0x2cedc90c…86687145` enthalten (Root 3, `storageProof.proven=true`), aber in `lot.rewardClaims` fehlend. Kein neuer Lot nötig.
- Bestehende Step-4-Zuordnung erweitert: positive, bereits receipt-belegte Zero-Mints in eindeutig einer Position zugeordneten Storage-verifizierten Top-up-Tx werden als `verified_topup_tx_reward` ergänzt; Bonus-/Mehrfachzuordnungsschutz bleibt aktiv.
- Neuer gemeinsamer reiner Selektor in `js/tln-reward-verification-core.js`; Edge nur als read-only `verified-topup-mint-preview`, kein eigener zweiter Berechnungsweg, kein automatischer Cache-Commit und kein Cron.
- Lokale Positiv-/Negativtests und Edge-Test bestanden; produktive Bestätigung am 19.11.2026 erfolgt (siehe 9.23). Details: `docs/releases/9.22-tln-vow-verified-topup-rewards.md`.

### Phase 9.23 – TLN/VOW Mehr-Wallet-Delta-Bereitschaft ohne Writes (20261119-204746)

- 9.22 produktiv bestätigt: die zusätzliche 5'500-TLN+-Mint der verifizierten Aufstockung wurde nach manuellem Step 4 als `verified_topup_tx_reward` gespeichert; Step 5 abgeschlossen. Testkonto war `chris.ua@icloud.com`, anschliessend Adminrechte entfernt.
- Neuer geschützter Edge-Modus `multi-wallet-readiness` prüft die jüngsten Discovery-Snapshots über alle vorhandenen Cache-Wallets auf gültigen Ursprung, vollständigen Workflow und **unabhängige** Reward-/Referral-/Block-Abdeckungsnachweise. Legacy-Flags allein reichen nicht.
- Bei tatsächlich verifizierten Quellen liefert er bis zu 25 anonymisierte, auf `maxBlocks` begrenzte hypothetische erste Delta-Blöcke. Keine Wallet-Adressen, User-IDs, DB-Writes, Claimerzeugung oder Cron-Aktivierung. Die Menge der verschlüsselten, tatsächlich berechtigten Wallets kann damit noch nicht nachgewiesen werden.
- Nächste Freigabeschranke: produktive Read-only-Antwort prüfen und danach einen sauber authorisierten Wallet-Katalog sowie einen wiederaufnehmbaren, vollständig verifizierenden Delta-Worker entwerfen. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.23-tln-vow-multi-wallet-readiness.md`.

### Phase 9.24 – Legacy-Proof-Lücken je anonymem Snapshot sichtbar machen (20261119-221236)

- 9.23 produktiv: 7 Snapshot-Wallets, nur 1 `readyForPlanning`, 6 `legacyWithoutCoverage`, 0 invalid/incomplete; der erste hypothetische 5'000-Block-Chunk benötigt danach noch 2'011 weitere Chunks. **Kein produktiver Scan-/Cursor-Fortschritt daraus.**
- Geschützter Read-only-Modus `legacy-proof-gaps`: für jeden nicht vollständig unabhängig verifizierten Snapshot aggregierte Gründe (Reward-, Referral-, Block-Coverage) und erhaltene strukturierte Evidence (ERC20-Range, belegte Mint/Reward-Zeilen, Claim-Key-Matches, Referenz-Ergebnis). Max. 25 anonyme Detailzeilen, keine User-/Wallet-Identität.
- Alte Proof-Lücken werden nicht durch reine Claim-Matches oder gespeicherte ERC20-Bereiche geschlossen. Kein RPC, keine DB-Mutation und kein Cron. Produktive Diagnose nach Deploy ausstehend.
- Nächste Freigabeschranke: Ergebnisse prüfen und pro fehlendem Beweistyp entscheiden, was sich aus vorhandenen Rohdaten unabhängig reproduzieren lässt und was tatsächlich nachgescannt werden muss. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.24-tln-vow-legacy-proof-gaps.md`.

### Phase 9.25 – Gespeicherte ERC20-Bereiche auf interne Konsistenz prüfen (20261119-223134)

- Produktiver 9.24-Audit: 6/6 Legacy-Wallets haben aufgezeichnete ERC20-Bereiche und Referral-Referenzresultate ohne gespeicherte Fehler. 1 Wallet besitzt eine belegte, strukturell zugeordnete Reward-Zeile; keine offenen bewiesenen Claim-Keys. Alle 6 ohne neue unabhängige Reward-/Referral-/Block-Coverage-Proofs. **Kein Beweis, dass sie vollständig sind.**
- Neue geschützte Edge-Diagnose `cached-range-integrity` analysiert nur diese sechs Rohcaches: aufgezeichnete From-/To-Blöcke, tatsächliche Transfer-Blöcke, ungültige Transferzeilen, Zeilen ausserhalb des notierten Intervalls, doppelte Identitäten und Snapshot-Cursor vor dem Rohcache.
- Max. 250'000 untersuchte rohe Transferzeilen und 25 anonymisierte Detailblöcke; bei Überschreitung Abbruch ohne Vollständigkeitsbehauptung. **Keine rückwirkende RPC-Paginierungsbestätigung** aus einer gespeicherten Range möglich.
- Lokale Negativtests bestanden; Live-Auswertung ausstehend. Nächster Schritt: Auffälligkeiten gezielt eingrenzen und gesonderten belegten Scan-/Reward-Fortschritt konzipieren. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.25-tln-vow-cached-range-integrity.md`.

### Phase 9.26 – Hypothetischer Delta-Bootstrap ab Legacy-Rohcache (20261119-224110)

- Produktiv 9.25: 6/6 Legacy-Rohcaches enthalten 947 intern valide Transfers; null ungültige Zeilen, Out-of-Range, Duplikate oder Cursor-Widersprüche. Scanstart jeweils `0`, aber keine originale Provider-Pagination beweisbar.
- Neuer geschützter Read-only-Modus `delta-bootstrap-preview`: liefert je Legacy-Cache mit gültigem Wallet und Rohscan-Endblock einen **hypothetischen** ersten Overlap-Chunk bis zum aktuellen BSC-Head. Max. 25 anonyme Wallet-Vorschläge und `maxBlocks` höchstens 5'000.
- Der Rohcache-Endblock ist ausdrücklich ein unbewiesener Startanker; Historie bleibt unverifiziert. `historicalCompletenessVerified=false`, `verifiedCursorCreated=false`, `persisted=false`, `executed=false`. Keine Reward-/Referral-Klassifikation oder User-/Wallet-Identitätsausgabe.
- Lokale Tests bestanden; Live-Abnahme offen. Danach: echte serverseitige, autorisierte Wallet-Eligibility, nachweisbare Vollständigkeit/Pagination, idempotente Fortschritts-Commits und Retry-Semantik separat entwickeln. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.26-tln-vow-delta-bootstrap-preview.md`.

### Phase 9.27 – Einen Legacy-Delta-Abschnitt read-only wirklich lesen (20261119-230000)

- Produktiver 9.26-Bootstrap: 7 Snapshot-Wallets, 6 Legacy-Kandidaten, 6 gültige hypothetische Startanker, kein ungültiger Cache/Wallet, 6 unbewiesene Historien. 356 hypothetische 5'000-Block-Chunks für diese sechs Wallets inkl. erster Chunks.
- Neuer geschützter Edge-Modus `legacy-first-chunk-scan-preview`: nimmt **eine** feste Legacy-Wallet mit ältestem Raw-Cache-Endblock, scannt einen begrenzten Chunk mit `alchemy_getAssetTransfers` in beide Richtungen und prüft die Paginierung; Wahl von Wallet/Contract/RPC/Startblock per Request ist ausdrücklich nicht erlaubt.
- Die vier bekannten VOW/v$/TLN+/TLNGOLD-Contracts begrenzen den Scope der Inspektion. Deshalb ist dies **keine** vollständige Reward-/Referral-/Staking-Klassifikation und kein belegter Gesamt-Scan-Fortschritt. Keine DB-Writes, kein Cursor, keine Cron-Aktivierung.
- Lokaler Test bestanden, produktive Preview ausstehend. Nächstes echtes Hindernis: bekannte Reward-/Staking-Contracts fachlich und vollständig aus bestehender manueller Discovery abdecken, dann verifizierbare, idempotente Commits/Retry entwickeln. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.27-tln-vow-first-legacy-chunk.md`.

### Phase 9.28 – Manuelle TLN/VOW-Discovery gegen Edge-Reward-Scope auditieren (20261119-231122)

- Produktiv 9.27: erster 5'000-Block-Chunk `133302312–133307311`, zwei Richtungen vollständig, null Treffer unter vier festen Token, keinerlei Persistierung. Kein Reward-Vollständigkeitsbeweis.
- Read-only `reward-source-parity-audit` vergleicht die derzeit aktiven BSC-Konfigurationen `defi_project_tokens` und `defi_staking_contracts` gegen die vier im Edge-Preview gezählten Contract-Adressen; nur anonyme Zählungen und Feature-Matrix, keinerlei Identitäts-/Adressausgabe.
- Manuelle Discovery verwendet zusätzlich Staking-/Entry-Registry, Contract-Calls/Receipts, Top-up-Lifecycle-Proofs, Claim-Klassifikation und Referral-Referenzmotor. All diese Prüfungen fehlen im Edge-Preview. Daher `parityVerified:false`, keine fiktive Reward-/Referral-Coverage.
- Lokaler Negativtest bestanden; produktiver Audit ausstehend. Nächster Schritt: Ergebnis auswerten, fehlende dynamische Vertrags- und Klassifikationsquellen ohne zweite widersprüchliche Reward-Engine in einen gemeinsamen verifizierbaren Ablauf überführen. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.28-tln-vow-reward-source-parity.md`.

### Phase 9.29 – Dynamische Registry-Verträge im begrenzten Transfer-Preview (20261119-232348)

- Produktiv 9.28: 14 aktive Staking-/Entry-Contracts (13 Transfer-Klassifikation, 1 Entry/Hilfe) sämtlich ausserhalb der festen vier Token-Contracts; ein aktiver Projekt-Token. Alle sechs weiterführenden Klassifikationsbereiche des manuellen Discovery fehlen im bisherigen Edge-Preview.
- Neuer geschützter Modus `registry-first-chunk-scan-preview`: eine deterministisch aus Legacy-Rohcache gewählte Wallet, derselbe begrenzte Alchemy-ERC20-Chunk; dazu aktivierte `defi_staking_contracts` und `defi_project_tokens`, validiert, dedupliziert, begrenzt auf 100 Contracts. Keine Adressausgabe, keine User-IDs, keine Request-Overrides oder Writes.
- Der Filter erkennt **ERC20-Transfers auf diesen Contract-Adressen**, nicht automatisch Interaktionen mit Staking-Contracts als `to` einer Transaktion. Deshalb bleibt die eigentliche Calls-/Receipts-/Top-up-/Reward-/Referral-Klassifikation vollständig offen.
- Neue lokale Regression und Vorgängertests bestanden; Live-Ergebnis ausstehend. Als Nächstes Schnittstellen für gemeinsame manuelle/automatische Evidenz-Klassifikation prüfen. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.29-tln-vow-registry-scan-preview.md`.

### Phase 9.30 – Staking-Contract-Calls, Selektoren und Receipts lesen (20261120-074335)

- Produktiv 9.29: 18 eindeutige Registry-/Token-Adressen im 5'000-Block-Chunk; beide ERC20-Richtungen vollständig, null Treffer. Das ist kein Beleg für fehlende Staking-/Reward-Interaktionen.
- Neuer geschützter Read-only-Modus `staking-call-receipt-preview`: ausgehende Alchemy-External-Transfers einer fest gewählten Legacy-Wallet werden nach Empfängeradresse gegen aktivierte Staking-Verträge geprüft. Max. 8 vollständig paginierte Seiten, max. 12 eindeutige Contract-Aufrufe zur Tx-/Receipt-Inspektion; anonyme Selector-/Receipt-/Transfer-Log-Aggregate.
- `evidenceComplete` begrenzt die technisch geprüften External-Transfers; keine Zusage über Vollständigkeit von Nullwert-Calls, historischen Rewards oder Referrals. Keine Zuordnung zu Staking-Lots, keine Klassifikation, keine DB-Writes.
- Lokaler Regressionstest bestanden; Live-Test ausstehend. Nächster Schritt: prüfen, ob in diesem Chunk echte Contract-Calls auftreten. Danach die manuelle Positions-/Reward-/Referral-Evidence als gemeinsamen überprüfbaren Kern nutzbar machen. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.30-tln-vow-staking-call-receipt-preview.md`.

### Phase 9.31 – Bekannten Top-up mit echter Blockchain-Receipt regressionstesten (20261120-081445)

- Produktiv 9.30: wieder derselbe Legacy-Chunk `133302312–133307311`; ein vollständig paginierter Alchemy-External-Abruf, null Transaktionen und damit null Tx-/Receipt-Kontrollen. Die Funktion arbeitet technisch, liefert dort aber keinen positiven Nachweis.
- Neuer geschützter `historical-topup-rpc-regression` prüft den fest bekannten Stake-/Top-up-Fall aus Block 44'871'018, Tx `0xacf7…8509131`, und den dazu gespeicherten 5'500-TLN+-Nulladress-Mint. Ein Cache-Kandidat ist nur nach eindeutigem Storage-Proof und der bestehenden geteilten Top-up-Mint-Regel zulässig.
- On-Chain per Alchemy: Transaktionshash, Block, Sender, Selector, Receipt-Erfolg, TLN+-Transferlog von Nulladresse zum Wallet und der exakte rohe Mint-Betrag mit auf-chain gelesenen Dezimalstellen. Die vorhandene Storage-Kontinuität wird **nicht** erneut aus Storage ermittelt, sondern als vorheriger Beleg verglichen.
- Lokale Positiv-/Negativtests bestanden; produktiver Test ausstehend. Keine Änderung bestehender Claims/Rewards/Positions, keine DB-Writes, kein Cron. Als nächstes: positive Live-Evidenz prüfen und die manuelle Klassen-/Positionszuordnung weiterverallgemeinern. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.31-tln-vow-historical-topup-rpc.md`.

### Phase 9.32 – Cache-belegte Top-up-Mints generisch auf-chain verifizieren (20261120-085818)

- Produktiv 9.31 bestätigt: bekannte Aufstockung und TLN+-Mint 5'500 aus Block 44'871'018: alle Tx-/Receipt-/Mint-/Decimals-Prüfungen erfolgreich, `verifiedAgreement:true`, keine neuen Claims oder Datenänderungen. Storage-Proof weiterhin aus zuvor gesicherter Evidenz, nicht erneut unabhängig geprüft.
- Neuer Modus `cached-topup-mint-rpc-preview`: verwendet die bestehende gemeinsame `verifiedTopUpMintCandidates`-Auswahl und allgemeine 9.31-RPC-Prüffunktion für höchstens drei deterministische Cache-Kandidaten (Hash/Token/Block/Menge aus DB, **nicht** Request). Exakter BigInt-Mintvergleich mit dynamischen Token-Dezimalstellen.
- Nicht eindeutige Reward-Keys, ungültige Blöcke/Mengen und Kandidaten ohne geprüften Top-up-Storage-Vermerk bleiben ausgeschlossen; keine Aufwertung alter unbewiesener Daten. Keine Identitäten in Antwort, keine Writes oder Cron.
- Lokale positive und negative 9.32-Tests bestanden, Live-Antwort ausstehend. Nächster fachlicher Schritt: verifizierte Eingangs-Discovery neuer Reward-Kandidaten und echte, gemeinsam genutzte Position-/Referral-Klassifikation – getrennt von dieser Cache-Beleg-Prüfung. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.32-tln-vow-cached-topup-mint-rpc.md`.

### Phase 9.33 – Neue historische Zuflusskandidaten von belegten Top-up-Mints trennen (20261120-090632)

- Produktiv 9.32: ein aus dem Cache automatisch gewählter Kandidat (5'500 TLN+ im Block 44'871'018) erfolgreich per generischem Tx-/Receipt-/Decimals-Prüfer bestätigt, keine fälschliche Gesamtabdeckung.
- Neuer geschützter Read-only-Modus `historical-inflow-candidate-preview`: durchsucht vorhandene, auf 250'000 Zeilen begrenzte ERC20-Rohcaches nach positiven eingehenden Transfers auf vier bekannten oder bereits mit Reward-/Flow-Proof belegten Token-Contracts (max. 100). Bereits belegte Hash/Token-Paare werden nicht als neu angeboten.
- Die maximal drei jüngsten neuen Kandidaten erhalten begrenzte On-Chain-Tx-/Receipt-Prüfung der Transfer-/Nulladress-Mint-Logs. Resultat nur anonyme Evidenzzählungen, **keine Reward-Klassifikation und keine unabhängige Bestätigung der vollständigen historischen Raw-Caches**.
- Lokaler Test bestanden, produktiver Kandidatenaudit ausstehend. Offene Kernarbeit: manuelle Positions-/Reward-/Referral-Klassifikation verallgemeinern und unabhängige Scan-Abdeckung, idempotente Commits und Retry entwickeln. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.33-tln-vow-historical-inflow-candidates.md`.

### Phase 9.34 – Vorprüfung für mögliche historische Reward-Zuflüsse (20261120-094355)

- Produktiv 9.33: 1'065 Rohzeilen, 3 bereits belegte Zuflüsse ausgeschlossen, 58 weitere mögliche Zuflüsse. Drei kontrollierte Receipts bestätigen Token-Transfers, aber keinen Reward. Zwei Router-ähnliche Selector `0x3593564c`.
- Neuer `historical-inflow-triage-preview` verwendet dieselben Cache-Kandidaten, prüft aber nur maximal acht pro Seite (`offset`, serverseitig begrenzt), ergänzt die aktiven Staking-Verträge und liefert anonyme Hinweise für Nulladress-Mint, direkte Staking-Contract-Beziehung, Router-ähnlichen Selector oder unbestimmten Zufluss.
- **Kein** Selector oder Mint ist allein ein Reward-Beweis: alle geprüften Zeilen bleiben `requiresRewardReview:true` und `rewardClassified:false`. Kategorien beziehen sich ausschliesslich auf die aktuell geprüfte Seite. Kein Cron, keine Claim-/Cursor-/Cache-Writes.
- Lokaler Test bestanden, produktive Abnahme offen. Weiter offen: vollständige gemeinsame manuelle Reward-/Referral-Klassifikation, unabhängig belegte Scan-Abdeckung und idempotente Persistierung. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.34-tln-vow-inflow-triage.md`.
### Phase 9.35 – Gemeinsame Reward-Flow-Klassifikation (20261120-100532)

- Die bisher im Browser duplizierte Step-4-Entscheidung über belegte Reward-Zuflüsse liegt jetzt in `js/tln-reward-verification-core.js`; der Browser ruft sie unmittelbar auf.
- Die Standalone-Edge-Function enthält dieselbe generierte Funktion und benutzt sie bei der vorhandenen historischen Receipt-Triage. Die Triage bleibt **read-only** und klassifiziert keine Zuflüsse endgültig.
- Die on-chain Beweiserfassung (vollständige historische Scans, Receipt/Trace/State-Delta, Lifecycle, Referrals) ist **noch nicht** vollständig im Serverjob; kein Produktions-Cron und keine persistierten Rewards. Der Befund wird nicht als fertige tägliche Automatik bezeichnet.
- Neue Tests decken Mint, Bridge-Ausschluss, Swap, Claim-Intent, State-Delta, Lifecycle und nicht kausale Transfers ab; alle TLN/VOW-Tests lokal bestanden. **TLN/VOW-Cron AUS.** Details: `docs/releases/9.35-tln-vow-shared-reward-flow.md`.

### Phase 9.36 – Persistente Delta-Transferbelege als Vorstufe der TLN/VOW-Rewards-Automatik (20261120-101543)

- `delta-transfer-stage` führt **einen** begrenzten, automatisch aus dem bestehenden Wallet-/Raw-Cache gewählten BSC-Abschnitt mit Alchemy durch; alle aktivierten Staking-/Token-Registeradressen plus feste Token sind umfasst.
- Neue separate Tabelle `tln_vow_reward_delta_stage`: atomar pro Abschnitt gespeichert, nachvollziehbare Transfer-IDs, idempotenter Primärschlüssel; der nächste Durchlauf setzt nur nach lückenlosen Staging-Abschnitten fort. Bei Fehler/Pagination-Limit kein Speichern.
- Technischer Stand **nicht** mit fertigen Rewards verwechseln: Auch bei vollständig abgelegten Transfers fehlen Receipt-, State-, Lifecycle- und Referral-Beweise. Historische Scan-Abdeckung vor dem Raw-Cache-Anker bleibt unbewiesen. Noch keine Rewards, Claims, Referral-Ergebnisse oder autoritativen Cursor schreiben; **TLN/VOW-Cron AUS.**
- SQL-Migration muss vor der neuen Edge Function eingerichtet werden. Testskripte 9.36 inkl. Laufzeit-Simulation erfolgreich. Details `docs/releases/9.36-tln-vow-delta-stage.md`.

### Phase 9.37 – On-Chain-Receipt-Abgleich der gespeicherten Delta-Belege (20261120-102429)

- `delta-receipt-verify` liest bereits in 9.36 abgelegte Transfer-Evidenz, vergleicht höchstens vier neue Transaktionen pro Aufruf mit `eth_getTransactionByHash` und `eth_getTransactionReceipt` und verlangt eine **1:1-Zuordnung** zu ERC20-Receipt-Logs inklusive Rohbetrag.
- Der Modus referenziert die bestehenden Staking-Lots/TopUps im Discovery-Snapshot, verwendet die in 9.35 gemeinsam geteilte Reward-Flow-Klassifikation und speichert vollständige verifizierte Receipt-Transfers in einer **zweiten, separaten** Service-Role-only-Tabelle (`tln_vow_reward_receipt_stage`). Die Zuordnung ist nur Hinweis, kein endgültiger Reward-Beweis.
- Die neue Tabelle wird durch `20261120103000_tln_vow_reward_receipt_stage_937.sql` angelegt. Ein Schreibvorgang erfolgt erst nach erfolgreicher Prüfung des ganzen Batches; der Primärschlüssel verhindert doppelte Transaktionsbelege.
- Unverändert offen: verifizierte Reward-/Referral-Klassifikation und vollständige historische Abdeckung, sichere kanonische Claim-Übernahme, Job-Orchestrierung und alle verschlüsselten Wallets. **TLN/VOW-Cron AUS.** Details `docs/releases/9.37-tln-vow-receipt-stage.md`.

### Phase 9.38 – Mehrere Server-Abschnitte pro Lauf, direkte Receipt-Weitergabe (20261120-103653)

- `delta-work-cycle`: bis zu drei lückenlose Alchemy-Transferabschnitte für ein vorhandenes Snapshot-Wallet in einem Aufruf; Standard 50'000, maximal 100'000 BSC-Blöcke je Abschnitt. Nur vollständige Abschnitte persistieren.
- Ein Transfer-Budget-Überlauf verkleinert den Abschnitt bis mindestens 1'000 Blöcke; sonst bleiben bei Abbruch die bereits persistierten Abschnitte erhalten, der nächste Aufruf setzt anhand der DB fort.
- Bis zu vier gefundene Transaktionen je Abschnitt werden im selben Durchlauf per Tx/Receipt- und ERC20-Rohbetrag-Beleg geprüft und in `tln_vow_reward_receipt_stage` gespeichert. Grösserer Backlog bleibt für den vorhandenen `delta-receipt-verify`-Weg erhalten; er wird **nicht** als erledigt gewertet.
- Es gibt weiterhin **keine** vollständige automatische Reward-/Referral-Klassifikation, keine Änderung kanonischer Claims, keine unabhängige Vollständigkeitsprüfung historischer Altbestände und **keinen TLN/VOW-Cron**. Details `docs/releases/9.38-tln-vow-work-cycle.md`.

### Phase 9.39 – Geplante automatische Belegsicherung, getrennt vom Rewards-Cron (20261120-113941)

- Neue Migration `20261120104700_tln_vow_reward_evidence_jobs_939.sql` registriert zwei **zunächst inaktive** pg_cron-Jobs: Transfer-Windows (`delta-work-cycle` zu Minuten 3,8,…,58) und Receipt-Backlog (`delta-receipt-verify` zu Minuten 4,9,…,59).
- Bestehende Vault-URL `tln_vow_trade_sync_url` wird wiederverwendet; für den neuen Header ist **ein** Vault-Secret `tln_vow_reward_refresh_auth` erforderlich, das dem bereits in der Edge Function gesetzten `TLN_REWARD_CRON_SECRET` entsprechen muss. Keine Geheimnisse im SQL-Klartext.
- Staging-only: kein automatischer Import kanonischer TLN/VOW-Rewards oder Referrals; diese Pipeline ist weiterhin unvollständig. Die zwei neuen Jobs dürfen erst nach Prüfung von Secret/URL und Einzellauf aktiviert werden. **TLN/VOW-Rewards-Cron AUS.**
- Kleinere technische Korrektur: Work-Cycle verkleinert zu grosse Fenster bei Bedarf bis auf einen Block, statt bei 1'000 Blöcken stehenzubleiben.
- Tests der TLN/VOW-Module bestanden. Details `docs/releases/9.39-tln-vow-evidence-cron.md`.

### Phase 9.40 – Automatischer Receipt-Abgleich mit vorhandenen manuellen Proofs (20261120-140941)

- Für neu geprüfte Receipts speichern sowohl Work-Cycle als auch Receipt-Backlog eine konservative, gemeinsame Browser-/Edge-Abgleichsentscheidung auf Basis eindeutiger, bereits manuell belegter Top-ups. Nur technisches Receipt-JSON; keine kanonischen Rewards/Claims.
- **Offen:** Der tägliche Job muss neue Proofs und Referral-Zuordnungen selbständig nach manueller Logik ermitteln. 9.40 erkennt nur bestehende manuelle Proofs und ersetzt keine vollständige Klassifizierung. Details `docs/releases/9.40-tln-vow-automatic-proof-reconciliation.md`.

### Phase 9.41 – Neue automatische, unbestätigte Staking-Mint-Kandidaten (20261120-144422)

- Server-Receipt-Worker erkennt nun auch ohne vorherige Browser-Discovery potentielle Mint-Rewards aus bestätigten On-chain-Logs mit registriertem Staking-/Lifecycle-Kontext und persistiert sie ausschliesslich im Evidence-Staging.
- **Offen:** Tatsächliche Staking-/Bonus-/Referral-Beweise und vollständige automatische Reward-Zuordnung fehlen weiterhin; weder 9.40 noch 9.41 darf kanonische Claims erzeugen. Details `docs/releases/9.41-tln-vow-new-mint-candidates.md`.

### Phase 9.42 – Explizite Claim-/Reward-/Referral-/Bonus-Methoden serverseitig (20261121-120308)

- Automatische neue Kandidaten auch aus **kausalen direkten Claim-Payouts** (ohne frühere Browser-Discovery) mit exakt denselben Methodensignaturen wie in der manuellen Step-4-Logik. Methode/Wallet-Absender/aktiver Staking-Vertrag/Receipt werden gemeinsam geprüft; Ergebnisse nur im Receipt-Staging.
- **Offen:** vollständige autonome State-Delta-/Trace-/Lifecycle-Erkennung, Referral-Referenz-Engine, Token-Mengenpräzision, vollständige Wallet-Erfassung und idempotenter kanonischer Reward-Finalizer. Die aktive Evidence-Cron-Phase ist kein vollständiger täglicher Rewards-Job. Details `docs/releases/9.42-tln-vow-explicit-claim-methods.md`.

### Phase 9.43 – Bounded Reward-/Referral-State-Probes im Evidence-Worker (20261121-121114)

- Für geeignete direkte Payouts werden nun drei historische Wallet-Reward-Getter vor/nach dem jeweiligen Block vom automatischen Edge-Worker geprüft und positive Änderungen lediglich als unbestätigte `stateChangeCandidates` in das Receipt-Staging übernommen. Fehlerhafte/unsupported Aufrufe liefern keine fingierten Null-/Proof-Werte.
- **Offen:** Transaktionsgenaue Attribution, weitere manuelle Getter, Trace-/Lifecycle-Nachweise, Referral-Referenz-Engine, vollständige Wallet-Coverage und kanonischer Finalizer. Reward-Cron weiterhin AUS. Details `docs/releases/9.43-tln-vow-historical-reward-state.md`.

### Phase 9.44 – Direkte Wallet-Aufrufe an Staking-Contracts im Cron (20261121-155917)
- **Erledigt:** Der automatische `delta-work-cycle` fragt neben ERC20-Transfers jetzt auch `alchemy_getAssetTransfers` für externe Aufrufe des ausgewählten Wallets ab und übernimmt Transaktionsidentitäten mit Ziel in der aktivierten Staking-/Entry-Contract-Registry. Auch Aufrufe ohne Token-Transfer werden als technische Evidence erfasst; bereits per ERC20 erkannte Tx werden nicht dupliziert. Der Receipt-Worker validiert Call-Hash, Sender und Ziel on-chain; vollständige Pagination ist Voraussetzung für den Staging-Fortschritt. Kein DB-Schemawechsel.
- **Prüfen nach Deployment:** Im nächsten `delta-work-cycle`-HTTP-Body `chunks[*].directContractCalls` und `chunks[*].callOnlyTransactions` vorhanden. `0` ist bei fehlender Aktivität erwartbar.
- **Weiter offen:** Vollständige Erkennung von indirekten Aggregator-Aufrufen, inhaltliche Lifecycle-/Reward-/Referral-Klassifizierung, historische Vollständigkeit, alle verschlüsselten Wallets, kanonische Übernahme. Keine kanonischen Rewards/Claims durch Cron; täglicher Reward-Job noch nicht fertig. Details `docs/releases/9.44-tln-vow-staking-call-capture.md`.

### Phase 9.45 – Eindeutige Reward-Kandidaten-Zuordnung zu Lots (20261121-161622)
- **Erledigt:** Die bestehende gemeinsame Verifikations-Core-Regel verknüpft on-chain bestätigte, aber noch nicht finale Reward-/Mint-/State-Kandidaten mit einer einzigen passenden Staking-Position anhand des direkten registrierten Contract-Bezugs. Mehrdeutige Lots, Lifecycle-Transaktionen, Principal-/Underlying-Tokens, Bridges und unbestätigte Receipts werden ausgeschlossen. Das Ergebnis wird im bestehenden Receipt-Evidence-JSON gespeichert. Kein SQL-/Schemawechsel.
- **Test:** `uniqueLotAssignmentCandidates` im Cron-HTTP-Result (numerischer Zähler, bei keiner Aktivität `0`) und `uniqueLotAssignmentCandidateCount` im gespeicherten Receipt. **Keine** automatische kanonische Übernahme.
- **Offen:** Position-ID-/historische Referral-Belege, indirekte Claim-Contracts, echte kanonische Reward-/Referral-Finalisierung, vollständige Wallet-Abdeckung und historische Coverage. Der tägliche Reward-Job bleibt noch deaktiviert. `docs/releases/9.45-tln-vow-unique-lot-reward-assignment.md`.

### Phase 9.46 – Strenger kanonischer Direkt-Claim-Finalizer, nicht im Cron (20261121-164544)
- **Umgesetzt:** Der neue explizite Edge-Modus `direct-claim-finalize` verarbeitet maximal 200 bestehende Receipt-Evidence-Einträge je Aufruf (weitere über `offset`). Er akzeptiert nur direkte, erfolgreiche, explizite Staking-Claim-Methoden mit einem einzigen Token-Payout vom aufgerufenen Staking-Contract an das Wallet, ohne Bridge, Swap, Lifecycle/Principal, doppelte manuelle Zuordnung oder mehrdeutige Position. Aufgenommene rohe Claim-Fakten liegen dedupliziert in der neuen Service-Role-Tabelle `tln_vow_reward_direct_claims`. Die bisherige manuelle Discovery und ihre Snapshot-Totals bleiben unangetastet.
- **Installation:** Migration `20261121164404_tln_vow_direct_claim_finalizer_946.sql`, danach Edge deployen. Modus nur nach explizitem Test aktivieren. Die beiden Evidence-Cronjobs bleiben weiterhin an; kein zusätzlicher schreibender Cron.
- **Weiter offen:** Weitere direkte-/indirekte Reward-Methoden, Positionsidentifikatoren und Referenz-Engine, Referral-/Bonus-Klassifikation, Integration der isolierten Ledger-Fakten in Dashboard-Summen, alle verschlüsselten Wallets, vollständige historische Coverage und Freigabe des täglichen Canonical-Cron. `docs/releases/9.46-tln-vow-direct-claim-finalizer.md`.

### Phase 9.47 – Bestehende Browser-Step-4-Stake-Rewards im gemeinsamen Core (20261121-221914)
- **Erledigt:** Die gesamte vorbestehende Browser-Schritt-4-Zuordnung für die `stakeTx` selbst (`stakeRewardEvidence` plus walletweite `provenRewardRows`, unveränderte Dedup-/Claim-Felder) wurde in `verifiedStakeTxRewardClaims` zentralisiert und von der manuellen Discovery weiterhin aufgerufen. Die Edge-Abstimmung `reconcileVerifiedStakeReceipt` vergleicht dieselben claims mit echten Zero-Mint-Logs (Token, Wallet, Lot, positiver exakter Rawbetrag, Dezimalstellen), verwirft Bridges/Dubletten und schreibt keinen bereits manuell verbuchten Reward erneut.
- **Getestet:** 250 / 45’000 / 5’500 TLN+ als repräsentative, bereits bekannte Stake-/Top-up-Mengen; Browser-Pfad und Edge-Abgleich mit demselben Core; alle TLN/VOW-Tests bestanden.
- **Offen:** Für eine echte tägliche autonome Neuentdeckung muss der Server auch neue Staking-Positionen mitsamt Schritt-2-/3-Lifecycle-Proofs und die Referral-Referenzengine ohne Browserlauf erhalten. Der geteilte Stake-Selector kann keine neuen Lots erzeugen. `docs/releases/9.47-tln-vow-manual-stake-reward-parity.md`.

### Phase 9.48 – Gemeinsamer Browser-Step-2-Selector-Gate im Receipt-Stage (20261122-102615)
- Stake/Unstake-Intent und der verifizierte TLN-Rebound-Ausschluss werden im Browser und Edge über dieselbe pure Funktion geprüft. Technische Receipt-Evidenz hält gegebenenfalls die Anzahl tatsächlicher Principal-Bewegungen zum registrierten Staking-Contract fest.
- **Nicht erledigt:** Neues Lot und exakte Lockdauer werden weiterhin nur durch die vorhandene manuelle Discovery samt Token/LP-Verifikation und On-chain-Lifecycle-/Storage-Proof ermittelt; Browser-Step-3 und Referral-Engine sind noch nicht autonom portiert. Keine automatische Reward-Commit-Freigabe.

### Phase 9.49 – Browser-Step-2-Unstake-Lot-Zuordnung gemeinsam mit Server (20261122-103126)
- Die manuelle sekundäre Regel für Unstake zu genau einer offenen Lot-Position auf demselben Staking-/Entry-Contract ist als geteilter Core extrahiert. Der Server speichert den Kandidatenindex ausschliesslich nach erfolgreicher Receipt-Prüfung im technischen Evidence-Stage. Mehrdeutige parallele Positionen bleiben bewusst ohne Zuordnung.
- **Offen:** Vollständige autonome Erstellung neuer Staking-Lots, ihre Asset-/LP-Beweise, Storage-Top-up-Kontinuität, Step-3-Lockduration und die Referral-Engine. Kein automatischer kanonischer Reward-Commit.

### Phase 9.50 – Geteilte strenge Top-up-Storage-Kontinuität (20261122-104159)
- Die bestehende Browser-Regel `compareSameWalletPositionState` nutzt jetzt den gemeinsamen `manualTopUpStorageContinuity`-Kern. Der Edge-Receipt-Pfad vergleicht nur bereits vorhandene Snapshot-Lots mit dazu gespeicherten Storage-Belegen. Keine Neuschätzung aus Tokenbewegungen und kein blindes Merging paralleler Stakes.
- **Weiter offen:** Der serverseitige Headless-Storage-RPC-Leser und die gesamte autonome Step-2-/3-Pipeline zur Neuentdeckung fehlen; ebenso Referral-Komplettprüfung und kanonische tägliche Reward-Finalisierung. Der technische 5-Minuten-Cron bedeutet nicht vollständige tägliche Reward-Updates.

### Phase 9.51 – Historischen Top-up-Storage serverseitig neu lesen (20261122-105602)
- Read-only Replay für **einen** bereits per Browser belegten historischen Top-up mit Root/Offsets aus bestehendem Snapshot; Wallet-Mapping-Storage-Slots und vier Blockzustände je Offset werden on-chain über separat konfigurierbaren Archive-RPC gelesen und vom gemeinsamen Strict-Verdict geprüft.
- **Produktivtest offen:** Archive-RPC-URL als Supabase Edge Secret `NODEREAL_BSC_RPC_URL` bereitstellen; dann `known-topup-storage-replay` explizit testen. Kein automatischer Aufruf durch die beiden bestehenden Jobs.
- **Weiter offen:** Unbekannte Mapping-Roots und neue Lots autonom erkennen (Browser `discoverStakeStructHeadless`), vollständige Step 3 Lockdauer und Referral-Referenzengine. Noch kein vollständig automatisierter täglicher Rewards-Job.

### Phase 9.52 – Gestufte Archive-Root-Suche im Server (20261122-111448)
- Im expliziten read-only Modus `known-stake-root-discovery` wird ein bereits im manuellen Discovery-Snapshot vorhandener Stake gewählt und der Wallet-Mapping-Root aus historischen Contract-Storage-Änderungen ermittelt. Vorgehen entspricht den Browser-Stufen A1/A2/B/C, mit konservativem Budget und ohne Schreiben.
- **Live-Abnahme offen:** Den neuen Modus gegen den bekannten historischen Stake testen und Root/Offset mit dem Browser-Nachweis vergleichen.
- **Weiter offen:** Neue Stake-Transaktionen autonom zu neuen geprüften Lots verbinden, aus unbekanntem Root den gesamten Struct-/Duration-Strict-Proof ausführen, volle Referral-Zuordnung und kanonische tägliche Reward-Automatik. Bestehende 5-Minuten-Cronjobs bleiben technische Evidence-Jobs.

### Phase 9.53 – Neue verifizierte Stake-Receipts zur Root-Suche verbinden (20261122-112331)
- Der Server kann jetzt technisch neue Stake-Kandidaten aus `tln_vow_reward_receipt_stage` auswählen, die noch keiner manuellen Position zugeordnet sind. Nur erfolgreiche eigenständige Stake-Receipts mit tatsächlichem Principal-Abfluss zum registrierten Contract qualifizieren; die Archive-Blockzeit und die A1/A2/B/C-Root-Erkennung werden für einen Kandidaten in einer lesenden Vorschau zusammengeführt.
- **Live-Test offen:** Aktuell wurden bisher 0 Receipts im Stage gemeldet; falls weiter keine neuen Stakings existieren, ist `no_new_verified_stake_receipts` korrekt und kein Fehler. Ein vollständiger neuer Stake kann erst bei entsprechender realer Transaktion durchgängig geprüft werden.
- **Offen:** Position/LP-Lot-Rekonstruktion nach dem Root-Proof, Top-up- und Unstake-Lifecycle, Duration-Strict-Proof, Referral-Engine, kanonischer Reward-Commit und vollständige verschlüsselte Wallet-Abdeckung.

### Phase 9.54 – Gemeinsame Step-2-Lot-Rekonstruktion (22.11.2026)

- Browser- und Edge-Code verwenden dieselbe reine `manualBuildDiagnosticLots`-Regel für bereits **klassifizierte** Staking-Ereignisse. Parallel-Stakes bleiben getrennt; ein Top-up benötigt eine identische Positions-ID; Unstake-Routing-Duplikate werden einmal gezählt.
- `cached-lot-reconstruction-preview` rekonstruiert gespeicherte Discovery-Rohereignisse anonym und vergleicht die initialen Stake-Transaktions-IDs mit den gespeicherten Lots. Nicht gleichzusetzen mit vollständiger, automatisch durchgeführter Discovery.
- Offen: echte automatische Beschaffung/Klassifikation neuer Positionsevidenz mit identischer Browser-Regellogik, Storage-Top-up-Reconciliation und vollständige Reward-/Referral-Abdeckung vor jeder kanonischen Buchung. Der bestehende Evidence-Cron läuft, **kein Reward-Commit-Cron**.
- Test nach Edge-Deployment: POST `{"mode":"cached-lot-reconstruction-preview","ordinal":1}` mit bestehender Cron-Secret-Authentifizierung; `stakeHashSetMatches` und Abweichungen prüfen. Bei älteren Snapshots ist Abweichung möglich, weil die finale manuelle Contract-/Storage-Reconciliation später erfolgt.

### Phase 9.55 – Verifizierte Top-up-Normalisierung gemeinsam (22.11.2026)

- Ergebnis von 9.54 live (`ordinal=2`): 4 Staking-Rohereignisse, 2 rekonstruierte Roh-Lots vs. 1 gespeichertes Discovery-Lot, 1 fehlender Stake-Hash in gespeicherten Ausgangslots sowie 2 rohe Unstake-Routing-Ereignisse. Diese Differenz ist nicht automatisch ein Fehler der manuellen Discovery: spätere Storage-Top-up- und Contract-Receipt-Reconciliation fehlen im Roh-FIFO.
- `manualMergeProvenTopUpPosition` ist nun eine gemeinsame reine Browser-/Edge-Funktion; Browser führt sie nur nach seinem bestehenden On-chain-Preflight aus. Der Edge-Vergleich normalisiert Raw-Lots mit den im Snapshot bereits gespeicherten **belegten** Top-up-Tx und stellt `recordedProofTopupsMerged` und `stakeHashSetMatches` dar.
- Live-Abnahme nach Deployment: SQL-gestützter autorisierter Aufruf `{"mode":"cached-lot-reconstruction-preview","ordinal":2}`. Erwartete Wirkung: nur zuvor gespeicherte eindeutige Proof-Top-ups zusammenführen. Ergebnis offen.
- Weiter offen: automatischer Import/Reklassifikation von **neuen** Staking-Ereignissen, volle Contract-/Receipt-Zuordnung von Unstakes, unabhängige historische und Referral-Coverage. Kein kanonischer Reward-Cron; vorhandene Evidence-Crons unverändert.

### Phase 9.56 – Gemeinsame manuelle Unstake-Zuordnung (22.11.2026)

- Live 9.55, Request 8665, `ordinal=2`: 4 Rohereignisse, 2 Raw-Lots, 1 gespeicherter verifizierter Top-up zur 1 finalen Position normalisiert, `stakeHashSetMatches=true`, keine Stake-Hash-Abweichungen; 2 rohe Unstake-Routing-Ereignisse noch diagnostisch. Die bestehende gespeicherte Proof-Evidenz wurde dabei **nicht** unabhängig erneut verifiziert.
- `manualReconcileUnstakeContractCalls` überträgt die vorhandenen manuellen Regeln zur LP-Rückgabe im Receipt und eindeutigen Unstake-Call-Zuordnung in den gemeinsamen Browser-/Edge-Core. Bei parallelen/mehrdeutigen Positionen kein erzwungener Abschluss.
- Edge `cached-lot-reconstruction-preview` zeigt dafür `recordedContractCalls`, `receiptBasedUnstakeClosures`, `uniqueCallUnstakeClosures`, `ambiguousUnstakeCalls`. Live-Test nach Deploy für `ordinal=2` mit bewährtem Vault-authentifiziertem SQL-Aufruf aus 9.55.
- Weiter offen: serverseitige **neue** unabhängige Positionsevidenz inklusive Contract-Aufruf/Receipt-Discovery, automatische verifizierte Claim-/Referral-Ermittlung und Vollständigkeitsnachweis. Der Evidence-Cron läuft; Reward-Commit-Cron bleibt gesperrt.

### Phase 9.57 – Begrenzter täglicher Direct-Claim-Worker (22.11.2026)

- Die bisherige gemeinsame manuelle Direkt-Claim-Regel ist erstmals als separat täglich planbarer Edge-Modus `daily-direct-claim-cycle` erreichbar. Ohne `commit:true` vollständig read-only; mit Commit werden nur unabhängige verifizierte direkte Staking-Claims idempotent in `tln_vow_reward_direct_claims` gespeichert. Schema und `direct-claim-finalize` existieren seit 9.46.
- Neue Migration `20261122115628_tln_vow_direct_claim_daily_disabled_957.sql` richtet `tln-vow-direct-claims-daily` (03:10 UTC) **inaktiv** ein. Nicht ohne kontrollierten Live-Preflight einschalten. Bei >200 Staging-Receipts bricht die neue Daily-Variante ab, statt still eine Teilmenge zu bearbeiten.
- Nächster Test nach Installation/Migration/Edge-Deploy: autorisiert `{"mode":"daily-direct-claim-cycle"}` ohne Commit aufrufen. `inspectedReceipts`, `eligibleDirectClaims` und `completeReceiptBatch` auswerten. Auf keinen Fall `commit:true` zum Test setzen.
- Offene Kernaufgabe: vollständige automatische Browser-Step-4-Rewards inklusive indirekten/mint-/top-up-/bonus- und Step-5-Referral-Nachweisen sowie Abdeckung aller verschlüsselten Wallets. Ein Direct-Claim-Cron ist **kein** vollständiger täglicher TLN/VOW-Rewards-Job. Kein Reward-Cron aktiv, keine automatische Buchung aktiviert.

### Phase 9.58 – Historischer Step-4-Regelabgleich (22.11.2026)

- Nach 9.57-Live-Abnahme Request 8675: Edge `daily-direct-claim-cycle` 200/dryRun, aber 0 gespeicherte Receipt-Transaktionen, daher kein Positivtest. Bei aktuell ausbleibender Wallet-Aktivität ist das noch kein Scanner-Fehler.
- Read-only-Modus `historical-manual-reward-parity` spielt die bestehende Browser-/Server-Prüflogik für **historisch vorhandene, belegte Stake- und Storage-Top-up-Rewards** direkt gegen gespeicherte Discovery-Lot-Claims ab. Liefert `summary` (inkl. `stakeCandidates`, `topUpCandidates`, `matchingSavedClaims`, `missingSavedClaims`) und anonymisierte Detailzahlen. Bei diesen bereits gespeicherten Belegen kann ein Vergleich auch ohne neue Transfers stattfinden.
- Live-Test nach Edge-Deployment: autorisierter Aufruf `{"mode":"historical-manual-reward-parity"}`. Kein Commitment, keine neuen Claims, kein RPC. Abweichungen zuerst am bestehenden manuellen Snapshot auflösen.
- Weiter offen: vollständige automatisierte Step-4-Flow-/Receipt-/Bonus-Rewards und Step-5-Referral-Klassifikation, historischer unabhängiger Vollständigkeitsbeleg sowie alle verschlüsselten Wallets. Tages-Direct-Claim-Cron 9.57 bleibt INAKTIV.

### Phase 9.65 – Historischer SmartNode-Parent-RPC-Vergleich (22.11.2026)

- Einmaliger read-only Edge-Modus `historical-smartnode-parent-rpc-check`: Wählt aus dem bereits verifizierten globalen SmartNode-Graph eine eindeutige Kante (wenn möglich mit Parent-Wallet aus gespeichertem TLN/VOW-Discovery-Snapshot) und vergleicht deren Parent-Adresse **live** mit derselben Getter-/`join(address)`-Fallback-Funktion aus 9.64. Antwort nur `parent_agreement`, `parent_disagreement`, `onchain_unresolved` oder `no_verified_graph_edge`, ohne Wallet-Adressen.
- Ein positiver Vergleich bestätigt genau **eine** Parent-Beziehung, nicht alle Level/Referral-Rewards oder historische Vollständigkeit. Keine RPC-/Graph-/Claim-Writes, kein Cron. Nach Deploy mit authentifiziertem `{"mode":"historical-smartnode-parent-rpc-check"}` prüfen. `docs/releases/9.65-tln-vow-smartnode-parent-rpc-check.md`.

### Phase 9.64 – SmartNode-Getter-/Join-Fallback für Referral-Kandidaten (22.11.2026)

- Der bestehende 5-Minuten-Receipt-Evidence-Pfad verwendet bei einem bereits belegten Referral-Mint und fehlendem Parent im globalen Graph jetzt die neun **identischen manuellen** `referrer/sponsor/upline/parent/inviter`-Getter, anschliessend den begrenzten historischen Alchemy-Index für `SmartNode.join(address)`. Fehlende TLN-IDs werden via `nodeIdOf(address)` gegen denselben verifizierten SmartNode-Contract gelesen. Kein neuer Klassifizierungsalgorithmus.
- Nur vollständig belegte, zyklenfreie Pfade innerhalb maximal 20 Levels werden als `referralMintPathVerified` ins vorhandene Receipt-Evidence-Staging übernommen. Fallback maximal 10 Join-Seiten, begrenztes RPC-/Zeitbudget; bei unvollständigem/fehlerhaftem Pfad kein Nachweis und kein Claim. On-chain-Fallback schreibt keine globalen Caches. Keine Cron-/SQL-Änderung, täglicher Reward-Cron inaktiv. Live-Tests bei künftigen tatsächlichen Referral-Mints ausstehend. `docs/releases/9.64-tln-vow-onchain-referral-fallback.md`.

### Phase 9.63 – SmartNode-Upline und Identitäten für Referral-Kandidaten (22.11.2026)

- Bereits starke Referral-Mint-Kandidaten aus dem bestehenden Receipt-Evidence-Staging erhalten jetzt automatisch eine **maximal 20-stufige**, gegen den verifizierten globalen SmartNode-Graph und den globalen TLN-Identity-Cache geprüfte Pfadzuordnung. Nur bei eindeutiger Parent-Kette zum untersuchten Wallet, verifiziertem Cache-Stand und eindeutig verifizierten TLN-IDs für sämtliche Pfad-Wallets wird `referralPathVerified=true` samt Level gespeichert. Fehlende/mehrdeutige/Cycle/Cachefehler bleiben `false`; keine Vermutung und keine Claim-Buchung.
- Die manuellen Getter-/`join(address)`-Fallbacks für **neue, noch nicht im globalen Graph erfasste** Beziehungen werden serverseitig noch nicht gestartet. Dies ist ein verifizierter Cache-Pfad, **kein** aktueller unabhängiger On-Chain-Neunachweis. Live-Test offen, `referralMintPathVerified` im bestehenden Job; Daily-Direct-Claim-Cron weiterhin inaktiv. `docs/releases/9.63-tln-vow-cached-referral-upline.md`.

### Phase 9.62 – Automatische Referral-Mint-Evidence in den 5-Minuten-Jobs (22.11.2026)

- Die bestehenden aktiven `delta-work-cycle`/`delta-receipt-verify`-Pfade erfassen jetzt zusätzlich die drei **manuell bereits festgelegten** Referral-Mint-Token TLN, TLN+ und TLNX. Bei Receipt-verifizierten fremden Transaktionen prüfen sie positive Zero-Mints an das Wallet, Principal-Transfers/Stake-Events und die gemeinsame Step-5-Strong-Entscheidung. Erforderliche Belege werden unter `referralMintCandidates` in den bisherigen Receipt-Staging-Zeilen persistiert, Zähler in der Jobantwort.
- **Begrenzt:** Erfasst neue Events im bestehenden vorwärts laufenden Index; ältere Cache-Lücken, vollständige Token-/Receipt-Pagination, SmartNode-Upline/Referral-Level und abschliessende Referral-Claims bleiben gesondert zu prüfen. Kein neuer Job, kein kanonischer Reward-/Claim-Write; Tagescron weiter inaktiv. Live-Test ausstehend. `docs/releases/9.62-tln-vow-automatic-referral-mint-evidence.md`.

### Phase 9.61 – Gemeinsame Step-5-Referral-Mint-Entscheidung (22.11.2026)

- Der letzte Strong-/Candidate-Entscheid der manuellen Step-5-Referral-Mint-Engine verwendet jetzt gemeinsam im Browser und in der Edge Function `manualReferralMintVerdict`. Grundlage bleiben die bekannten, bereits geprüften Stake-/Mint-Fakten; keine neue Heuristik.
- `historical-referral-step5-parity` vergleicht die gespeicherten Step-5-Referenzzeilen mit dieser Regel **read-only**. Der Modus prüft weder die eigenständige Mint-/Receipt-/SmartNode-Ermittlung noch alle verschlüsselten Wallets. Keine SQL-/Cron-Änderung; Direct-Claim-Tagescron inaktiv. Live-Test ausstehend. `docs/releases/9.61-tln-vow-shared-step5-referral-parity.md`.

### Phase 9.60 – Historischer Bonus-/Referral-Selector-Bestandsabgleich (22.11.2026)

- Neuer rein lesender Edge-Modus `historical-bonus-referral-evidence` prüft die bereits im Browser nachgewiesenen `provenRewardRows` der TLN/VOW-Snapshots mit denselben gemeinsamen expliziten Bonus-/Referral-Selector-Regeln wie der automatische Receipt-Pfad. Nur anonyme Zähler pro Wallet; sonstige Fälle bleiben **ungeklärt**, keine neue Reward-Heuristik.
- 9.58 bestätigte bereits 3/3 historische Stake-/Top-up-Claims. Die neue Prüfung ersetzt **nicht** die manuelle Step-5-Referenz-/Pfadzuordnung, keine neuen Claims, kein RPC und kein Cron. Tages-Direct-Claim-Cron bleibt **inaktiv**. Live-Test noch ausstehend. Details `docs/releases/9.60-tln-vow-historical-bonus-referral-evidence.md`.

### Phase 9.59 – Bonus-/Referral-Evidence getrennt im automatischen Receipt-Pfad (22.11.2026)

- Browser und Server verwenden dieselbe explizite Bonus-Selector-Regel; keine neue Heuristik. Die im Edge bereits vorhandenen strengen Receipt-Prüfungen unterscheiden und persistieren nun separate `bonusClaimCandidates` und `referralClaimCandidates` mit Counts auch für `delta-work-cycle` und `delta-receipt-verify`.
- Ab 9.59 sind entsprechende Kandidaten bei zukünftigen Blockchain-Ereignissen sichtbar. Das ist **noch keine** vollständige Bonus-/Referral-Zuordnung und keine kanonische Buchung. Die manuelle Step-5-Referral-Referenzengine (Identität, Referral-Pfade, Referenzbeweise) ist serverseitig noch nicht vollständig automatisiert.
- Nach Installation nur Edge `tln-vow-reward-refresh` deployen; bestehende 5-Minuten-Jobs rufen die aktualisierte Funktion automatisch auf. Bei derzeit fehlenden neuen Events dürfen Counts weiterhin 0 sein. Kein neuer Cron und keine SQL-Migration nötig.
- Weiter offen: indirekte Rewards/Bonus-/Referral-Candidate-Finalisierung nach manuellen Nachweisregeln, historischer Vollständigkeitsnachweis, alle verschlüsselten Wallets. `tln-vow-direct-claims-daily` unverändert INAKTIV.

### Phase 9.66 – Vollständige Pagination für täglichen Direct-Claim-Finalizer (22.11.2026)

- `daily-direct-claim-cycle` liest nun alle bestehenden `tln_vow_reward_receipt_stage`-Einträge in stabil sortierten 200er-Seiten, derzeit bis zu 4'000 pro Tagesaufruf. Überlauf oder Datenbankfehler beendet **vor** einem Ledger-Write mit Fehler. Die identische, im Browser geteilte `verifiedDirectStakingClaim`-Regel bleibt unverändert.
- `{"mode":"daily-direct-claim-cycle"}` ist weiterhin rein lesend. Der bereits installierte Cron bleibt **inaktiv**; keine Aktivierung durch dieses Release. Explizites `commit:true` würde ausschliesslich separat belegte direkte Staking-Claims idempotent speichern, keine Browser-Discovery-Ergebnisse verändern.
- Offen: indirekte, Bonus-, Mint- und Referral-Rewards vollständig kanonisch zuordnen sowie lückenlose historische Blockchain- und Wallet-Abdeckung beweisen. Diese Änderung allein vervollständigt den täglichen TLN/VOW-Reward-Job nicht. `docs/releases/9.66-tln-vow-daily-claim-pagination.md`.

### Phase 9.67 – Exakte Referral-Mint-Zahlungsbelege im aktiven Receipt-Staging (22.11.2026)

- Die schon aktive 5-Minuten-Receipt-Verarbeitung (`delta-work-cycle`/`delta-receipt-verify`) ergänzt bei **bereits stark belegten** Referral-Mints nach dem bestehenden geteilten manuellen Step-5-Entscheid `mintAmountRaw`, `mintLogIndexes`, `walletNetRaw` und `receiptVerified`. Mehrere Mints desselben Tokens werden aggregiert, doppelte Log-Indizes und unvollständige/negative Nettozuflüsse blockiert. Der zuvor eingebaute SmartNode-Referenzpfad wird unverändert verwendet.
- Noch keine kanonische Referral-Reward-Buchung oder unabhängiger historischer Vollständigkeitsnachweis. Bei momentan 0 echten neuen Referral-Mints kann der Live-Job die positive Zuweisung noch nicht demonstrieren. Kein SQL, keine neuen Jobs, täglicher Rewards-Cron bleibt inaktiv. `docs/releases/9.67-tln-vow-referral-mint-exact-amounts.md`.

### Phase 9.68 – Kontrollierte kanonische Referral-Mint-Zuordnung (22.11.2026)

- Neues owner-isoliertes, service-only schreibbares Ledger `tln_vow_reward_referral_claims` mit exakten Integer-Mengen und eindeutiger Tx-/Token-Identität. Die Edge-Funktion `referral-claim-finalize` verwendet die **bestehende** geteilte manuelle Step-5-Strong-Regel plus die verifizierten 9.67-Mint-Logs und den vorhandenen SmartNode-Parent-Pfad. Duplikate der bisherigen Browser-Discovery-`claimReferenceResult.strong` werden ausgeschlossen; mehr als 4'000 Receipt-Staging-Einträge brechen vor dem Schreiben ab.
- Nur explizites `commit:true` schreibt belegte Zeilen, ansonsten read-only. Weiterhin **keine automatische Aktivierung**, keine Änderung der manuellen Snapshots, keine doppelte Aggregation: der neue Ledger wird noch **nicht** in der Projekt-Reward-Übersicht angezeigt. Diese Anzeigeanbindung mit Deduplikation ist offen, ebenso historische Vollständigkeit und Bonus/indirekte Claims.
- Installation: 9.68-SQL ausführen und Edge neu deployen. Danach `{"mode":"referral-claim-finalize"}` per bekanntem Vault-authentifiziertem SQL aufrufen; Ergebnisse prüfen. `docs/releases/9.68-tln-vow-referral-ledger-finalizer.md`.

### Phase 9.69 – Referral-Ledger ohne Doppelzählung in Projektübersicht (22.11.2026)

- `projects/tln-vow/tln-vow-discovery.js` lädt nun per angemeldetem User/Wallet den owner-RLS-geschützten `tln_vow_reward_referral_claims`-Ledger. Pro Wallet/Tx/Token wird ein identischer manueller `claimReferenceResult.strong`-Claim bevorzugt; nur bislang fehlende Ledger-Claims kommen in die Referrals-Detail- und Periodenübersicht. Alter Aggregat-only-Cache ohne einzelne Tx-Identitäten wird bewusst nicht mit Ledger-Daten vermischt.
- `referral-claim-finalize` schreibt nur bei ausdrücklichem `commit:true` künftig zusätzlich den **historischen On-Chain-Blockzeitpunkt** via begrenztem Alchemy-Block-RPC, den **Nettozufluss** in Raw-Einheiten und den belegten Staking-Contract. Kein Commit bei fehlendem Zeitnachweis. Migrationsdatei `20261122215505_tln_vow_referral_block_timestamp_969.sql` erforderlich. Vorhandene 9.68-Ledger-Zeilen ohne Zeitstempel werden nicht mit heutigen Zeitpunkten gefüllt oder angezeigt.
- Der automatische 5-Minuten-Scanner schreibt weiterhin nur Belege; Tages-Reward-Cron **inaktiv**. Vollständige automatische Bonus-/indirekte Claims und historische/walletweite Abdeckung offen. `docs/releases/9.69-tln-vow-referral-ledger-overview.md`.

### Phase 9.70 – Staking-Zähler im Hellmodus lesbar (22.11.2026)

- Die Staking-Übersicht verwendet für «x Position(en) gefunden» die aktuelle Theme-Textfarbe statt hart codiertem hellen Blau; CSS-URL im `index.html` für eine sichere Cache-Aktualisierung geändert. Hell-/Dunkelmodus ohne Änderung der Staking-Daten. Nur Frontend-Update, kein SQL, kein Edge-Deployment. `docs/releases/9.70-tln-vow-staking-count-contrast.md`.
- Die TLN/VOW-Rewards-Automatik bleibt unabhängig davon offen; der tägliche Job ist weiterhin inaktiv.

### Phase 9.71 – Geschützter Bonus-Claim-Finalizer (22.11.2026)

- Neuer `daily-bonus-claim-cycle` nutzt den bestehenden gemeinsamen Browser-/Edge-Selektor für `claimBonus(address)` und `claimBonus()` plus receipt-verifizierte Auszahlung; isolierter Ledger mit Besitzer-RLS, historischer Zeit und Idempotenz. Default `commit:false` (read-only). Ohne SQL-Migration keine Commit-Nutzung.
- Weiter offen: positives Live-Beispiel, Bonus-Ledger in der UI anzeigen, übrige indirekte Bonus-/Reward-Pfade und nachgewiesene historische Vollständigkeit. **Täglicher Reward-Cron bleibt inaktiv.** Siehe `docs/releases/9.71-tln-vow-bonus-claim-finalizer.md`.

### Phase 9.72 – Bonus-Ledger in TLN/VOW-Projektansicht (22.11.2026)

- Der 9.71-Bonus-Ledger wird owner-only aus Supabase geladen und in Bonus-Tab, Summen und Dashboard-Zeiträumen ohne doppelte Tx/Token-Zählung ergänzt. Kein positiver Auto-Bonus-Claim bisher live nachgewiesen (`inspectedReceipts:0` in 9.71-Dry-Run).
- Indirekte Staking-Rewards: Browser nutzt auch interne Contract-Call-Verknüpfungen. Diese sind im 5-Minuten-Receipt-Staging noch nicht gleichwertig erfasst; bis zur identischen Beweiskette **keine** automatische Klassifikation/Buchung. Tages-Cron inaktiv. `docs/releases/9.72-tln-vow-bonus-ledger-ui.md`.

### Phase 9.73 – Interne Contract-Traces für indirekte Rewards (22.11.2026)

- Für verifizierte Claim-Receipts gegen bekannte Staking-Contracts ruft Edge bei indirekten Eingängen dieselben `debug_traceTransaction` / `trace_transaction`-Quellen wie der Browser ab. Nur verifizierte interne Quellen gehen in die gemeinsame Step-4-`classifyRewardTransferFlow`-Regel. `indirectRewardCandidateCount`, `indirectTraceVerified` werden im bestehenden Receipt-Staging/Job-Ergebnis erfasst. Keine Mutation der kanonischen Reward-Tabellen.
- Weiter offen: positives Live-Beispiel und unabhängige Belegprüfung, indirekte Reward-Zuordnung/Commit und historische Completeness, anschliessend täglicher Reward-Job. Cron bleibt aus. `docs/releases/9.73-tln-vow-indirect-call-traces.md`.

### Phase 9.74 – Startanker des 5-Minuten-Evidence-Jobs nach Cache-Refresh (22.11.2026)

- Live 22.11.: HTTP 409 `Noncontiguous staged range`, weil für eine Wallet der ursprüngliche Stage-Start Block `134734624` war, aber der inzwischen aktualisierte ERC20-Cache `135147078` als aktuellen Overlap-Start lieferte (Differenz −412454). Es gab laut SQL-Audit **keine gemeldeten inneren Lücken**.
- Korrigiert: Für bereits gespeicherte Abschnitte bleibt deren erster Block als historischer Stage-Anker erhalten, solange er nicht nach dem aktuellen Cache-Anker liegt; Folgeintervalle müssen weiterhin exakt aufeinanderfolgen. Keine SQL-Migration, keine Löschung, Edge-Deployment erforderlich. Live-Test nach Deployment ausstehend. Tages-Reward-Cron inaktiv. `docs/releases/9.74-tln-vow-immutable-stage-anchor.md`.

### Phase 9.75 – Inaktive tägliche TLN/VOW-Reward-Finalizer (22.11.2026)

- Vorhandene produktionsnahe Claim-Finalizer zeitlich verkettet: Direct (03:10 UTC, aus 9.57), Bonus (03:15 UTC, neu), Referral (03:20 UTC, neu). **Alle inaktiv**; Migration verweigert die Installation, wenn bereits ein entsprechender Job aktiv ist. Die bestehenden 5-Minuten-Evidence-Jobs laufen davon unabhängig weiter.
- Noch nicht freigabefähig als vollständige Automatik: direkte/Bonus-/Referral-Ledger separat idempotent, nicht als Transaktion atomar; indirekte Claims noch nicht finalisiert, Wallet-/Historienvollständigkeit unbewiesen. Vor Aktivierung echte positive Fälle, Fehler- und Wiederholungsverhalten prüfen. `docs/releases/9.75-tln-vow-daily-jobs-disabled.md`.

> **9.76 (22.11.2026 23:03 CET):** TLN/VOW: Strenger indirekter Staking-Claim-Finalizer mit derselben gemeinsamen Step-4-Flow-/Positionsregel, unabhängiger Trace-Wiederholung bei bewusstem `commit=true`, separatem nutzergebundenem Ledger und Dashboard-Anzeige ohne Doppelerfassung. Standardmässig read-only. Keine historischen Vollständigkeitsnachweise; drei tägliche Reward-Jobs bleiben **inaktiv**. Siehe `docs/releases/9.76-tln-indirect-claim-finalizer.md`.



### Phase 9.82 – Rohscan-Startblock/Head-Rückstand (23.11.2026, 20261123-144458)

- Manuelle ERC-20-Discovery: Initial-Start Block 0, bei Cache 24-Block-Overlap ab letztem Scanblock; keine allgemeine fachliche spätere Startblock-Regel.
- Neuer Auth-geschützter Read-only-Modus `encrypted-wallet-scan-start-audit-preview` zählt für die 10 relevanten Wallets Genesis-/spätere Starts, Rückstände zum BSC-Head, aktuell bis Head reichende Caches sowie maximalen Head-Lag. Keine personenbezogenen Details.
- Live 9.81: 3 fehlende Rohcaches, 7 gültige aber zum Head nicht bestätigte Bereiche; neuer Modus noch nicht live getestet.
- **TODO:** Live-Resultat bewerten, vorhandene manuelle inkrementelle ERC-20-Scanlogik serverseitig sicher anbinden, drei fehlende Caches und tatsächliche Range-Lücken gezielt behandeln; danach alle vier Reward-Pfade mit Vollständigkeitsbelegen abgleichen.
- Tages-Buchungsjobs bleiben deaktiviert; Evidence-Jobs bleiben unverändert. Siehe `docs/releases/9.82-tln-wallet-scan-start-and-head-audit.md`.


### Phase 9.83 – Serverseitiger Rohscan-Batch-Plan (23.11.2026, 20261123-145918)

- Live 9.82: 10 relevante Wallets; 7 gültige ERC20-Caches alle ab Block 0, aber alle mit Head-Rückstand (Maximum 10’768’561 Blöcke); 3 ohne Rohcache. 0 ungültige Caches.
- `encrypted-wallet-scan-batch-plan-preview` plant mit dem bereits bestehenden Wallet-Auswahl-Audit pro Wallet Start/Resume, 24-Block-Overlap und 250’000er Haupt-Chunks; Aggregat ohne Adressen/User-IDs. Er führt keine Kettenabfragen für Transfers, keine Writes und keine Cron-Änderungen aus.
- Die manuelle `alchemyErc20RangeChunked`-Funktion ist Browser-Code, nicht direkt serverseitig aufrufbar. Vor einem Schreib-Worker nötig: derselbe RPC/Pagination-Algorithmus, adaptive Split-Logik, Cursor-/Payload-Schutz, kollisionsfreie Fortschrittsreservierung, vollständiger Erfolgsnachweis und Idempotenz. Bloße Cache-Grenzen sind kein Vollständigkeitsbeleg.
- **TODO:** Batch-Plan live prüfen; danach gemeinsamen Extraktions-/Worker-Weg entwerfen und strikt begrenzt zuerst trocken testen. Tägliche Buchungsjobs bleiben deaktiviert.


### Phase 9.84 – Geschützter Einzelabschnitt-RPC-Dry-Run (23.11.2026 15:09:17 CET, Build 20261123-150917)

- Live 9.83: 10 relevante Wallets, 3 ohne Cache, 7 mit Scan-Rückstand; 1’694 geplante Haupt-Chunks, 421’806’935 aufsummierte Blockbereiche; keinerlei Schreibfreigabe.
- Neuer Read-only-Modus `encrypted-wallet-scan-chunk-dry-run`: bestehende Wallet-Auswahl + bestehende `inspectWalletTransfers()`-Pagination, maximal eine Wallet und 100 Blöcke (Fortsetzung mit 24-Block-Overlap). Er fasst Transfers für aktive Projekt-Token zusammen, gibt keine Identitäten aus und speichert keine Daten.
- Lokale Tests (9.80–9.84) erfolgreich. **Live-RPC-Test erfolgreich (Request 9731, HTTP 200): 100 Blöcke, 2 RPC-Seiten, 0 Transfers; beide Richtungen vollständig.** Dieser Test ist weder 250’000er Batch-Scan noch Beweis vollständiger Rewards.
- **TODO:** Live-Dry-Run prüfen; danach kollisionsfreien, wiederaufnehmbaren Scan-Worker mit gesicherter Pagination und atomarem Fortschritt entwickeln. Vor Tages-Reward-Jobs unabhängigen Vollständigkeitsnachweis für alle vier Reward-Arten.
- Cron 7/8 unverändert aktiv; tägliche Reward-Buchungsjobs bleiben deaktiviert. Siehe `docs/releases/9.84-tln-guarded-single-chunk-rpc-dry-run.md`.


### Phase 9.85 – Historischer Projekt-Token-Transfer, unabhängiger RPC-Gegencheck (23.11.2026 15:55:23 CET, Build 20261123-155523)

- **Referenz 9.84:** Live-Scan Request 9731 erfolgreich, aber leerer 100-Block-Ausschnitt. Diese Nullfund-Probe belegt nicht die Event-Validierung bei vorhandenen Transfers.
- Neuer geschützter Read-only-Modus `encrypted-wallet-scan-transfer-evidence-preview` nimmt **einen bereits im gültigen `erc20-history-v1`-Cache gespeicherten Transfer** eines aktuell aktiven TLN/VOW-Projekt-Tokens als Testanker. Nur relevante entschlüsselte Wallets; keine frei eingebbaren Wallets, Adressen oder Bereiche.
- Die bestehende `inspectWalletTransfers()`-Funktion fragt unabhängig einen auf maximal 100 Blöcke begrenzten historischen Ausschnitt in beiden Richtungen über `alchemy_getAssetTransfers` samt Pagination ab. Ein positiver Treffer erfordert identische Transaktion, Projekt-Token-Adresse, Blocknummer und Transferrichtung.
- **Kein geeigneter Cache-Beleg** wird mit `no-suitable-cached-project-token-transfer` gemeldet und darf weder als positiv noch als Negativnachweis für die Reward-Historie gewertet werden. Ein nicht bestätigter Cache-Anker wird ausdrücklich als `cached-transfer-not-confirmed` gemeldet. Provider- und Pagination-Fehler sind nicht erfolgreich.
- Nur aggregierte Zähler; keine Wallet-/User-/Token-/Transaktions-IDs in Antworten. **Keine Writes**, keine Cron-, Cursor- oder Reward-Veränderung. Kein Beweis für vollständige Staking-, Bonus-, Referral- oder indirekte Rewards.
- Lokale Tests 9.80–9.85 und 9.38: gültiger Match, fehlender Gegenfund, fehlender Cache-Anker, Providerfehler, Paging/Privacy und Null Writes. **Live-Test 9.85 ausstehend.**
- **TODO:** 9.85 deployen und Read-only-Live-Test; bei vorhandenen Transfers Gegenfund überprüfen. Erst danach einen begrenzten transaktionssicheren Scan-Worker mit atomaren Cursorn/Idempotenz ausarbeiten. Cron 7/8 bleiben aktiv, tägliche Reward-Buchungsjobs deaktiviert.


### Phase 9.95 – Read-only Rohscan-Probe nur bei Evidence-Leerlauf (24.11.2026 17:02:31 CET, Build 20261124-170231)

- 9.94 Live bestätigt: 10 ERC20-Caches, 3’419 Transfers; 5’000-Blöcke-Commit einmalig erfolgreich, ohne neue Transfers; keine historischen Reward-Vollständigkeitsnachweise.
- Im bestehenden `delta-work-cycle` optionale `rawCatchupOnIdle:true`-Vorschau: **nur wenn kein Evidence-Staging-Kandidat vorhanden ist**, interner Aufruf des bestehenden `encrypted-wallet-scan-guarded-stage-preview` mit `commit:false`; maximal 5’000 Blöcke. `commit:true` abgewiesen. Kein neuer Scanner/SQL/Cron, kein Rohdaten-Write.
- Beide bestehenden 5-Minuten-Cron-Kommandos **unverändert**, deshalb kein zusätzliches Scan-RPC im aktiven Dauerbetrieb.
- **TODO:** Opt-in-Live-Aufruf überprüfen, dann Last und Wiedereintritt/Concurrency testen, bevor unbeaufsichtigter Rohdaten-Commit im bestehenden 5-Minuten-Ablauf überhaupt freigegeben wird. Tages-Reward-Claims weiterhin deaktiviert. Siehe `docs/releases/9.95-tln-evidence-idle-raw-preview.md`.


### Phase 9.96 – Opt-in Leerlaufprobe strikt read-only (24.11.2026 17:08:07 CET, Build 20261124-170807)

- Live 9.95 Request 10692 führte wegen falschem Parameter `rawScanIdlePreview` einen normalen, schreibenden Evidence-Job aus. Der korrekte Parameter lautet `rawCatchupOnIdle`. `commit:false` schützt den regulären Work-Cycle **nicht** vor Staging-Writes.
- Bei `rawCatchupOnIdle:true` und vorhandenen Evidence-Kandidaten liefert 9.96 jetzt `evidence_busy_raw_scan_skipped`, ohne Evidence- oder Rohcache-Schreibung; bei Leerlauf wird der vorhandene, rein lesende Rohscan-Unteraufruf wiederverwendet. Falscher Parameter wird HTTP 400 statt unbemerkt ignoriert.
- Aktive Cron-Aufrufe ohne Flag, bestehende Reward-Erkennung und Datenbank bleiben unverändert.
- **TODO:** Read-only-Live-Aufruf prüfen; anschliessend erst Laufzeit, Abdeckung und Unbeaufsichtigt-Sicherheit nachweisen. Tägliche Reward-Buchungsjobs bleiben deaktiviert. Siehe `docs/releases/9.96-tln-evidence-idle-optin-write-guard.md`.
