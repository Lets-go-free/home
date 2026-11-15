> **Aktuell 8.57:** 8.56 Read-only-Drei-Miner-Preview live 0/3 ready, 3/3 `reward-event-missing-or-ambiguous`; Explorer zeigte mehrere RewardClaimed-Events zu gleicher NFT #37084/Staker, unterschiedlichen Collections. 8.57 korrigiert aggregierte exakte Wei-Auszahlung bei strenger Einzigkeit, nur read-only. **Nächster Schritt nur Edge-Deployment** mit `index.ts`, `miner-multi-event-857.js`, `miner-batch-preview-856.js`, `miner-event-853.js`, dann Rückmeldung. Details `docs/releases/8.57-dao-multi-reward-event-aggregation.md`. DAO-Cron/Live-Worker AUS.

### Phase 8.52 – Reto-Abnahme abgeschlossen (14.11.2026 21:39:51 CET)
- Live-Migration 8.52 installiert, ursprünglichen unvollständigen Claim #21 repariert; zweiter Claim erfolgreich atomar angelegt, `exact-v13` bestätigt.
- Historische NFT-ID-Lücken (125 Claims einer anderen Wallet) sicher behoben: erst 1, dann 124; keine Rewardwerte verändert; 2'078/2'078 konsistent.
- Reto: **377/377 verifizierte Auszahlungen kanonisch übernommen**, 16 Kandidaten ohne verifizierte Auszahlung unangetastet. Schritt-52-Audit: 393 gesamt, 377 abgeschlossen, 16 unverified, 0 verifiziert ohne Claim, 0 Abweichungen.
- **Aktualisierung nach Schritten 53–70:** Globaler Check 2'454/2'454 konsistent, alle 16 übrigen Kandidaten bereits `failed_transaction`, 0 weiter verarbeitbar. Nächster Schwerpunkt allgemeine DAO-Reward-Pipeline. DAO-Cron/Live-Worker AUS. Details in `docs/releases/8.52-dao-canonical-reward-consistency.md`.
- Dokumentationsnachtrag zur weiterhin angezeigten **Phase 8.52**, kein weiterer SQL-/Code-Deploy.


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

Phase 8.49 vorbereitet: 377 verified exact-v13 APTM-Flows, fünf historisch verifizierte NFTs. Bestehende kanonische Claim-Funktion für verifizierte Mining-Bots erweitert. SQL, Edge Deploy, 1-Claim-Preview und 1-Claim-Test stehen aus; nur einen nächsten Schritt pro Antwort. DAO-Cron und Live-Worker bleiben aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

## 8.49 – 14.11.2026 19:52:00 CET

Phase 8.49 vorbereitet: 377 verified exact-v13 APTM-Flows, fünf historisch verifizierte NFTs. Bestehende kanonische Claim-Funktion für verifizierte Mining-Bots erweitert. SQL, Edge Deploy, 1-Claim-Preview und 1-Claim-Test stehen aus; nur einen nächsten Schritt pro Antwort. DAO-Cron und Live-Worker bleiben aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

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

# WalletTracking – Übergabe für neuen Chat (DAO-Reward-Job)

**Stand:** 12.11.2026 13:17:11 CET · **installierte App:** Phase 8.21, Build `20261112-100513` · **DAO-Live-Worker / automatischer DAO-Cron: deaktiviert**.

Im neuen Chat zuerst diese Datei und `docs/PROJECT_STATUS_OPEN_ITEMS.md` lesen. Die neuesten Erkenntnisse sind die Live-Nachträge zu 8.21. Die folgenden älteren Abschnitte gelten als historische Projektinformationen und dürfen nicht als aktueller DAO-Teststand missverstanden werden.

## Was zuletzt geschehen ist

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


## Empfohlener nächster einzelner Schritt

Am **nächsten Schweizer Kalendertag** zunächst **eine rein lesende SQL-Abfrage** zur Tagesqueue und zum Checkpoint-Status der zwei `partial`-Wallets ausgeben; danach einen begrenzten `cron-multi-wallet-one` oder `cron-multi-wallet-batch` nur mit bewusster Freigabe durch den Nutzer ausführen. Kein `cron-staged-one` unkontrolliert ausführen, da die kanonische Claim-Daten ändern kann. Bei einer Fortsetzung am selben Tag werden Schritt 8/8 nicht erneut ausgewählt.

## Weitere Projekt-TODOs ausserhalb DAO (nicht erledigt)

- VOW: zukünftiger Burn-Tab (vUSD/v$; 24h / 7 Tage / 30 Tage / gesamt; ETH→BSC-Bridging darf nicht als Burn gezählt werden). Erst nach DAO.
- VOW: Liste letzter Stakings aller Wallets und Tokenpaare, ohne Laufzeit/Ablaufdatum.
- Login: iCloud-Passwörter-Erweiterung in Chrome auf macOS bietet WalletTracking-Login nicht an; zurückgestellt.
- XRPL: issued currencies / Trustlines via `account_lines` später; aktuell nur native XRP.
- Weitere ältere offene Aufgaben im zentralen Statusdokument, insbesondere Preis- und Datenqualitätsprüfungen.

---

## Historische Übergabe (älterer Stand, zur Orientierung)

# Übergabe WalletTracking

Phase 8.08 · Build 20261108-224554 · 08.11.2026 22:45:54 CET

Zuerst README.md, docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.08-cross-chain-token-metadata.md vollständig lesen.

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


## Nächster Schritt

Nur `supabase/migrations/20261108222813_cross_chain_token_metadata_808.sql` vollständig im Supabase SQL Editor ausführen. Mehrere DDL-/Funktionsanweisungen in einer atomaren Transaktion; keine separaten SELECT-Resultsets. Keine Provider-Abfrage und kein Cron beim Ausführen. Erst nach Rückmeldung Deployment anleiten.

## Spätere Deployment-Reihenfolge (noch kein auszuführender Test)

Zuerst die neue Edge Function token-metadata mit index.ts UND metadata.ts (beide Dateien derselben Funktion) bereitstellen. Danach bestehende dao-reward-refresh/index.ts aktualisieren, asset-policy.js und payout-coverage.ts beibehalten. Anschliessend wallet-daily-refresh/index.ts aktualisieren. Erst danach die Webdateien austauschen. Die beiden neuen TS-Dateien nicht in asset-policy.js einfügen und keine separate Funktion metadata anlegen. Bestehende Supabase-/Alchemy-Konfiguration wird verwendet; kein neues Cron-Secret.

Die Browser-/Worker-Integration braucht die neue Funktion; Web-/Workerdateien deshalb nicht vor deren Deployment aktivieren. Laufenden DAO-Worker/Cron ausgeschaltet lassen. Nach Deployment jeweils nur den nächsten einzelnen manuellen Metadaten-Batch/SQL-/UI-Test anleiten; keine vollständige Testserie auf einmal.

DAO-Referenz zuletzt unverändert 395/388/4/3/0/0. Echte native/ERC20-Neuanlage, Referral, neue Miner-Zuordnung und vollständige inkrementelle Tagesqueue offen. Historische Referenzfälle nicht zurücksetzen. Separater TLN/VOW-Reward-Job, späterer VOW-Burn-Tab (Bridge-Transfers unterscheiden) und Apple-Passwortmanager Chrome offen. Pro Antwort nur nächste SQL-Abfrage oder nächsten Test; kleine ZIPs und echte Schweizer Zeitstempel.
### Abschluss Reto – Nachtrag Schritte 53–70 (15.11.2026)
- Globaler `exact-v13`-Abschlussaudit: **2454/2454 konsistent, 0 abweichend**.
- Reto Wallet `8a3c5dc6-0610-482d-a327-3f3ba03db158`: 393 Kandidaten, davon **377 kanonisch übernommen**, **16 bereits unter 8.42 als `failed_transaction` klassifiziert**, **0 weitere verarbeitbar**. Alle 16 behalten technische Payout-/Pipeline-Status `pending`, sind jedoch durch die Audit-Klassifikation ausgeschlossen. Keine Bereinigung dieser Statusfelder ohne neue Begründung.
- Ein Fall wurde über Explorer geprüft: Internal- und ERC20-Listen leer, Haupttransaktion `execution reverted / NothingToClaim()`; gespeicherter Status `error` stimmt. Alle 16 haben gespeicherten TX-Status `error` und keine gespeicherten Flows.
- Keinen ungeeigneten Legacy-Payout-Prüfer auf diese Fälle anwenden. **Nächste Entwicklung:** allgemeine DAO-Reward-Pipeline gesondert planen und kontrolliert testen, insbesondere inkrementellen Import, ERC20/Referral, Retry und Mehrbenutzer-Betrieb.
- **DAO-Cron und Live-Worker AUS.** Phase bleibt 8.52; dieses ZIP enthält nur Dokumentation.

### Phase 8.53 – Einzelfall-Miner-Event-Preview vorbereitet (15.11.2026)
- Schritte 71–93: sechs Benutzer / 15 EVM-Wallets im Import; sieben `complete`, acht `empty_verified` je Stream; 15 `staged` am 14.11., keine Reward-Completion daraus ableiten.
- Reto-Zusatzbestand 73 `unassigned_miner` mit nativen APTM-Reward-Flows, 76 `unassigned_legacy` ohne Eingangsflow. Pilot-TX `0xed667ac1962cbc234629b0d1258378192087f0c2445c26a6f22a99a6a2b71b32`: NFT #37084 / Collection 32887 aus RewardClaimed; 0.072141524528301886 APTM live intern bestätigt und via bestehender 8.43-Route `verified`; Owner-Zeitraum, drei vollständige Transfers, Empfänger-Gleichheit und kein Same-Block-Transfer bestätigt. Weiter kein kanonischer Claim/NFT-Feld-Write.
- 8.53 Edge-Preview **nur read-only**, kein SQL; gemeinsame Deployment-Dateien `index.ts` und `miner-event-853.js`; Admin-Einzeltest nach Installation. Release-Dokument `docs/releases/8.53-dao-miner-event-preview.md` führt den genau nächsten Test auf. DAO-Cron/Live-Worker AUS; allgemeine Pipeline weiterhin offen.

### Phase 8.54 – Pilot-NFT-Einzelzuordnung vorbereitet (15.11.2026)
- 8.53-Live-Preview abgeschlossen: `ready=true` für TX `0xed667ac1…b71b32` / NFT #37084, keine Writes.
- 8.54 SQL-RPC und Admin-Commit-Modus unter unverändertem `dao-reward-refresh` vorbereitet, ausschließlich NFT-Kandidatenfelder/status einer fest vorgegebenen TX. Kein Claim/Preis/Reward-Write. Migration, Edge-Deployment und Live-Test noch offen.
- **Nächster Schritt:** Nur `20261115162034_dao_single_miner_nft_assignment_854.sql` vollständig im Supabase SQL Editor ausführen; Rückmeldung abwarten. DAO-Cron/Live-Worker AUS. Details `docs/releases/8.54-dao-single-miner-nft-assignment.md`.

### Phase 8.55 – 8.54-SQL-Fehlerbehebung
- Nach installierter 8.54 SQL + Edge lieferte Einzelversuch `ok:false` wegen nicht existierender `dao_reward_claim_candidates.updated_at`; kein Write bestätigt.
- Neue Migration `20261115162700_dao_single_miner_nft_assignment_fix_855.sql` ersetzt dieselbe RPC ohne `updated_at`; alle Guards unverändert. **Nächster Schritt: nur SQL 8.55 installieren**, Rückmeldung abwarten. Details `docs/releases/8.55-dao-single-miner-nft-column-fix.md`.

### Phase 8.56 – Drei-Miner-Preview, noch nicht deployt
- 8.55 installiert: NFT #37084, Payout und kanonischer Reward vollständig konsistent übernommen; nun 378 Reto-Miner-Claims abgeschlossen, global 2'455/2'455 `exact-v13` mit null Abweichungen.
- 72 `unassigned_miner` und 76 `unassigned_legacy` verbleiben. 8.56 liefert nur einen Admin-Read-only-Preview für die nächsten maximal drei Miner, mit unabhängiger on-chain Auszahlung, Event, exaktem Preis und historischer NFT-Ownership-Coverage; kein Write/Cron.
- **Nächster Schritt:** Update-ZIP einspielen, `dao-reward-refresh` mit `index.ts`, `miner-event-853.js`, `miner-batch-preview-856.js` gemeinsam deployen. Rückmeldung abwarten. Details `docs/releases/8.56-dao-three-miner-preview.md`.

### Phase 8.57 – Mehrfach-Event-Aggregation vorbereitet
- 8.56 Drei-Kandidaten-Preview live: 3/3 wegen mehrerer RewardClaimed-Events blockiert, keine Writes. Explorer-Screenshots belegen mehrere Collection-IDs für NFT #37084 und identischen Staker.
- 8.57 nur read-only: identische NFT-/Staker-Identität über vollständige paginierte Logs, eindeutige Indizes, BigInt-Summe exakt zur Explorer-Auszahlung und gespeichertem bewerteten Flow. Verschiedene NFT-/Wallets/fehlende Nachweise werden blockiert.
- Nächster Schritt: ZIP einspielen, `index.ts`, `miner-multi-event-857.js`, `miner-batch-preview-856.js`, `miner-event-853.js` gemeinsam deployen; Rückmeldung abwarten. Kein SQL, Cron/Live-Worker AUS.

> **Aktuell 8.58 (15.11.2026):** Live-Preview 8.57: 3/3 Multi-Event-Claims bereit (499/500/500 Events), keine Writes. Erster TX `0xb4090cfa…` native Auszahlung 54.477996600093324995 APTM erfolgreich mit 8.43 verifiziert; SQL bestätigt 0 kanonische Claims, 1 unveränderten exact-v13-Flow, NFT leer. 8.58 **einzige feste Pilot-TX** mit 499 gleich-NFT-Events und SQL-Eigentumsprüfungen; Update-ZIP vorbereitet. **Nur nächster Schritt:** SQL-Migration 8.58 installieren, Rückmeldung abwarten. Edge danach separat. Kein DAO-Cron/Live-Worker. Detail `docs/releases/8.58-dao-multi-event-single-assignment.md`.

> **Aktuell 8.59 (15.11.2026):** Reto hat jetzt 379 kanonische Claims, global 2'456/2'456 `exact-v13` konsistent. 71 unassigned Miner verbleiben. Nächste 3 via 8.57 Preview bereit (500/500/237 Events). TX `0xed7beb78eae4965a64a2dd929edb7cf3c39ef5731b8093d445ec848d05ec93be` (Block 14331534, NFT 37084) mit 50.945303137912696144 APTM per Explorer verified und SQL bestätigt; NFT noch null, Pipeline pending. 8.59 stellt gesonderte, exakt auf diese TX beschränkte NFT-Zuordnung bereit. **Nur nächster Schritt: SQL-Migration 8.59 aus ZIP ausführen**, Rückmeldung abwarten. Edge danach separat. Keine Cron-/Worker-Aktivierung. Release-Notiz `docs/releases/8.59-dao-second-multi-event-assignment.md`.

> **Aktuell 8.60 (15.11.2026):** 8.59 dritter Multi-Event-Reto-Claim vollständig kanonisch übernommen, global **2'457/2'457 `exact-v13` ohne Abweichung**. Reto: 380 kanonische Claims, 70 unassigned Miner und 76 separate Legacy offen. 8.60 ergänzt paginierbaren, rein lesenden Admin-Preview für maximal drei weitere Miner pro Seite (`admin-miner-page-preview-860`), Cursor `afterBlock` + `afterTxHash` aus der Response `continuation`. Prüft vollständige paginierte RewardClaimed-Logs, exakte Wei-Summe, native Auszahlung/Flow, Ownership/History; enthält keinerlei neue Batch-Schreibroute. **Nächster Schritt: Update-ZIP einspielen und Edge Function deployen**, danach Rückmeldung abwarten. DAO-Cron und Live-Worker bleiben aus.

> **Aktuell 8.61 (15.11.2026):** Reto 380 kanonische Claims und 70 offene unassigned Miner, global 2'457/2'457 exact-v13 konsistent. 8.60 paginierter Read-only-Preview live zweimal mit je 3/3 `ready`; keine Writes, keine Auslassung. 8.61 ergänzt allgemeine Admin-Routen `admin-miner-nft-preview-861` (read-only) und `admin-miner-nft-assign-861` (genau ein Kandidaten-NFT-Write) plus service_role-SQL mit vollständigem historischen Ownership-/Payout-/Preis-Guard; **nur bereits verifizierte Auszahlungen** können zugeordnet werden. Der kanonische 8.49-Finalizer bleibt separat und unverändert. **Nur nächster Schritt: SQL 8.61 aus Update-ZIP installieren**, danach Rückmeldung abwarten; Edge erst danach. DAO-Cron/Live-Worker aus. Detail `docs/releases/8.61-dao-general-guarded-single-miner.md`.

> **Aktuell 8.62 (15.11.2026):** 8.61 generische NFT-Einzelzuordnung vorbereitet, **SQL-Installation fehlgeschlagen** (Syntaxfehler Zeile 123, versehentlich nach COMMIT duplizierter SQL-Rest). Keine DB-Änderung. 8.62 ist die korrigierte neue SQL-Migration, die dieselbe `wallettracking_dao_assign_multi_miner_nft_861` installiert. Projektarchiv enthält zusätzlich die korrigierte ursprüngliche 8.61-Migration zum sauberen späteren Replay. **Nächster Schritt:** nur `20261115191059_dao_general_single_miner_assignment_fix_862.sql` in Supabase SQL Editor ausführen, Rückmeldung abwarten. Kein Edge-Deploy bis SQL bestätigt; DAO-Cron/Live-Worker AUS. 380 Reto kanonisch, 70 unassigned Miner, letzter globaler Audit 2'457/2'457 exact-v13 konsistent.

