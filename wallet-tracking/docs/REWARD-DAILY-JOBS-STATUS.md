> **10.06 (25.11.2026 14:44:58 CET, Build 20261125-144458):** TLN 10.05 Live-Abnahme 14:43: 9/9 separate Rohscans, 0 Konflikte, Evidence-only bestätigt. Neue explizit bestätigte adaptive Rohscan-Grösse bis 100’000 (nur 10’000 im 30-Minuten-Pilot), bei geeigneten Fehlern kleinere zusammenhängende Präfixe, max. fünf Versuche, 25 s RPC-Scanbudget; bestehender CAS, keine Reward-Buchung. Nach Pilot automatisch 5’000. Korrektur 10.05: FOR UPDATE entfernt, bereits live ausgeführt. DAO 34/34 intern auditiert, 5 Ownership-Fälle, 190 wUSDT-Flows, Referral und Produktivbetrieb offen, Cron 13 aus. TLN historische Vollständigkeit, weitere Grössen und Reward-Abnahme offen. Details: `docs/releases/10.06-tln-vow-adaptive-raw-catchup.md`.

> **10.05 (25.11.2026 14:14:34 CET, Build 20261125-141434):** Dauerhafte TLN-Job-Trennung: Cron 7 Evidence-only alle 5 Minuten, bestehender Cron 14 Rohscan jede Minute, 5’000 Blöcke, HTTP-Timeout 45 s. Pilot 29/30 gespeicherte Rohscans, 145’000 Bruttoblöcke, 0 CAS-Konflikte, ein nicht eindeutig zugeordneter 25-s-Timeout; Rückfall 9/9 bestätigt. DAO 34/34 automatisch gebuchte Mining-Rewards intern auditiert (571.821131255075937907 APTM, 27.85786553551225423128210676676568089600 USD), Cron 13 deaktiviert. Offen: fünf mehrdeutige Ownership-Fälle, 190 ungeprüfte wUSDT-Flows, Referral und DAO-Produktivbetrieb; TLN Live-Abnahme, adaptive Blockgrösse, historische Vollständigkeit und Reward-Verarbeitung. Keine Edge-Änderung. Details: `docs/releases/10.05-tln-vow-separate-raw-catchup-permanent.md`.

> **10.04 (25.11.2026 12:53:23 CET, Build 20261125-125323):** TLN Rohscan-Trennung als 30-Minuten-Pilot. Cron 7 bleibt alle 5 Minuten für Evidence, separater Cron jede Minute nutzt vorhandenen geschützten 5’000-Block-Commit; danach automatischer Rückfall auf 10.01-Kombination. Keine Edge-Änderung, DAO unverändert. Live-Abnahme offen. Details: `docs/releases/10.04-tln-vow-separate-raw-catchup-pilot.md`.
> Offen: Installation, Live-HTTP-/RPC-/Cache-Audit, dauerhafte Trennung, adaptive Grössen. DAO 10.03 Batch-Abnahme weiterhin offen.

> **10.03 (25.11.2026 12:34:33 CET, Build 20261125-123433):** DAO-Test 25.11.: 15/16 completed, eine Wallet blocked nach 32 Schritten, 39/39 Auszahlungen verifiziert, 29 ohne exakten Preisanker, 10 Zuordnungsfälle, 190 ungeprüfte wUSDT-Flows; keine neuen Claims. Cron 13 deaktiviert. Automatische exakte Preisermittlung je verifiziertem, preisblockiertem Claim mit bestehender exact-v13-Logik, 24h Versuchssperre, erneuter geschützter Finalizer. TLN unverändert. Offen: Migration, Deployment, kontrollierte Queue-Wiederaufnahme, Live-Preis-/Claim-Abnahme, Zuordnung, Referral und produktiver Cron. Details: `docs/releases/10.03-dao-automatic-exact-price.md`.

> **10.02 (24.11.2026 21:56:42 CET, Build 20261124-215642):** DAO-Pilot 24.11.: 16/16 Raw Staging, 15/16 Wallets completed; Reto 581 Kandidaten, 39 offen (27 pending, 9 verifiziert blockiert, 3 NFT #21 mehrdeutig), 16 bekannte fehlgeschlagene TX. Cron 13 manuell deaktiviert. Automatischer Metadaten-Finalizer übernimmt strenge Mining-Eigentums- und atomare Claim/Transaktions-Guards; blockierte Queue mit Diagnose und 32-Schritt-Limit. **Offen:** Migration/Edge-Deployment, Live-Abnahme, Preis-/Eigentums-/wUSDT-Audit, negative Authentifizierungstests, produktiver Cron. TLN/VOW unverändert. Details: `docs/releases/10.02-dao-guarded-miner-reward-queue.md`.

> **10.01 (24.11.2026 20:58:07 CET, Build 20261124-205807):** TLN/VOW-Pilot 6/6 HTTP-200-Rohscans, 10 Caches/3’419 Transfers, 0 Duplikate/ungültige Grenzen/CAS-Konflikte; automatischer Rückfall bestätigt. Dauerbetrieb vorbereitet, nur Cron 7 nach Migration geändert; keine Reward-Buchungen. **Offen:** Installation, Live-Abnahme, Receipt-HTTP-Nachweis, historische Abdeckung und Reward-Klassifizierung. Details: `docs/releases/10.01-tln-vow-raw-catchup-permanent.md`. DAO-Stand 10.00 unverändert.

> **10.00 (24.11.2026 20:50:36 CET, Build 20261124-205036):** DAO-Tagespilot vom 24.11.2026 dokumentiert: 16/16 Raw Staging, 2/16 Rewards `completed`, 14 `staged`, 19 Schritte, 0 Fehler (letzter gemeldeter Stand). Temporärer Cron 13, Live-Worker aus, produktiver Cron nicht freigegeben. Gateway-JWT-Einstellung im Repo nachgeführt; keine Änderung der Worker-Logik. wUSDT-/Claim-/Coverage-Audit, negative Authentifizierungstests und Pilotbereinigung offen. Details: `docs/releases/10.00-dao-daily-pilot-status.md`.
> Frühere Einträge sind historische Entwicklungsstände; für DAO gilt der obige Zwischenstand. TLN/VOW bleibt unverändert.

### 8.82 – Dauerhafter manueller 1–5 Legacy-Claim-Stapel (Installation offen)
- 8.81 live 5/5 per DB abgenommen, 16/76 kanonisch; 56 priced und 4 pre-price offen. Nächster 5er-Satz live read-only verified. 8.82 ersetzt fixe Einmal-Hashlisten durch eine wiederverwendbare manuelle 1–5-Verarbeitung derselben Wallet mit frischem Live-Proof, SQL-oldest-five-Reihenfolge, zentralem Finalizer, Wallet-Advisory-Locks und atomarem Rollback. Keine neuen ZIPs pro Stapel. Admin-Preview → Bestätigung → SQL-Abnahme je Batch; kein Cron, Worker oder anderer Wallet-Scope. Details `docs/releases/8.82-dao-legacy-reusable-bounded-commit.md`.

### 8.81 – Dritter atomarer MineBot-5er-Commit vorbereitet (Installation offen)
- 8.80 live 5/5 kanonisch übernommen und DB-bestätigt, insgesamt 11/76; offen 61 priced + 4 pre-price. Nächste fünf Blöcke 2337881/2396232/2743281/2743285/2803236 live read-only 5/5 verifiziert. 8.81 eigene service-only SQL-Funktion, Edge-Live-Reproof und gesonderter bestätigter atomarer Commit. Installation/SQL/Edge/Live-Abnahme offen. DAO-Cron/Live-Worker AUS. `docs/releases/8.81-dao-legacy-third-five-atomic-commit.md`.

### 8.80 – Zweite atomare 5er-Übernahme vorbereitet (Installation offen)
- 8.79 live 5/5 übernommen und per SQL unabhängig geprüft; 6/76 Legacy insgesamt kanonisch. 70 Legacy offen (66 priced, 4 pre-price). 8.78 nächster 5er-Satz live exakt verifiziert, 0 Writes. 8.80 SQL-Funktion/Edge/Admin mit festen fünf Hashes, erneuter Live-Verifikation, doppelt bestätigtem atomarem Commit und Rollback. ZIP/SQL/Edge/Abnahme offen. DAO-Cron/Live-Worker AUS. `docs/releases/8.80-dao-legacy-second-five-atomic-commit.md`.

### 8.79 · Aktuell – Atomarer 5er-Commit (noch nicht installiert)
- 8.78 live 5/5 geprüft, 0 Writes. 8.79 feste fünf Claims, frische Live-Belege, doppelter Admin-Confirm, atomarer SQL-Finalizer; vier frühe ohne USD ausgenommen. SQL/Edge/ZIP-Installation und Abnahme offen, DAO-Cron/Live-Worker AUS.

### Phase 8.78 – Nächste fünf preisfähige Legacy-Claims lesend prüfen (Installation offen)
- 8.77 live: 5/5 Mint/Eigentum verifiziert, 0 Writes; 4 vor Marktstart 88356 ohne USD, späterer Block165133 exact-v13. 8.78 neue, strikt lesende Admin-Route mit DB-Filter `claim_block>=88356`, maximal fünf älteste offene Kandidaten, frischer Pool-State-/Sync-Preisbeleg für jeden, bei Abweichung Stopp. Kein SQL/Commit/Cron/Worker. Die vier frühen Claims verbleiben für einen späteren eigenen Null-USD-Kanonikpfad. `docs/releases/8.78-dao-legacy-priced-five-preview.md`.

### Phase 8.77 – Nächste fünf historische MineBot-Claims nur lesend prüfen (Installation offen)
- 8.76 Live-Erfolg: MineBot #818, Block 957942, 1 kanonischer Claim und Flow, 15.167495057030400213 APTM, exakt 19.85128241097073681207126347197496 USD, Pipeline completed; DB-Abnahme 75 weiterhin unassigned. 8.77 neuer Admin-Button/Edge-Read-only-Route für die nächsten fünf offenen Kandidaten; bei erster Abweichung Stop, externe Mint-Events/NFT-Eigentum/Preisbelege wie Einzel-Preview, keine Commits/Cron/Worker. `docs/releases/8.77-dao-legacy-five-preview.md`.

### Phase 8.76 – Exakte Raw-Decimal-Abschlussprüfung (Installation offen)
- 8.75 Single-Commit rollback bei `Canonical post-condition missing`, erneute Kontrolle 0 Claims/Flows/Anker. Lesende DB-Abfrage bewies Precision-Ursache: zentrale Raw-Decimal-Funktion = 15.167495057030400213, direkte SQL-Division = 15.1674950570304002, Gleichheit false. 8.76 verwendet denselben kanonischen Parser für Flow-Betrag und Postcondition. Sonstige Guards/Finalizer bleiben; kein automatischer Write oder Cron. `docs/releases/8.76-dao-legacy-raw-decimal-postcondition.md`.

### Phase 8.75 – Native-Flow-Constraint für einzelnen historischen Claim korrigiert (Installation offen)
- 8.74 Commit abgebrochen: NOT NULL `project_transaction_asset_flows.log_index`; 8.74 erzeugte NULL. Read-only SQL bestätigt **keine** Änderungen: Claim 0, Flows 0, Anker 0, Candidate unassigned_legacy/pending. 8.75 ersetzt nur die service-only Commit-Funktion mit `log_index=-1` (identisch zu regulärem DAO-Native-Staging) und verbessert Admin-HTTP-Fehleranzeige. Kein Commit bei Installation, keine Jobs. `docs/releases/8.75-dao-legacy-native-flow-log-index-fix.md`.

### Phase 8.74 – Einzige historische MineBot-Claim-Übernahme (vorbereitet, nicht ausgeführt)
- Live 8.73 Einzel-Preview bestätigt für #818/Block 957942: 15.167495057030400213 APTM, historischer exact-v13 Pool-State-Preis 1.3088042775902748 USD/APTM. 8.74: kein automatischer Write; dedizierte service-only SQL-Funktion und Admin-UI mit zwei Bestätigungen. Bei erneut verifizierten Trace/Event/NFT/Preisbelegen schreibt eine Transaktion nativen Flow, exakt belegten Preisanker und kanonischen Claim über den bestehenden Finalizer; Fehler rollen alles zurück. Restliche 75 und Jobs unberührt. SQL/Edge/UI installieren, kontrollierte Einzelübernahme, DB-Nachprüfung ausstehend. `docs/releases/8.74-dao-legacy-single-commit.md`.

### Phase 8.73 – Historischer exact-v13-Preisbeleg als Einzel-Preview (Installation offen)
- 8.72 live: Block 40707 (#819, 2.432568024883926698 APTM) und 957942 (#818, 15.167495057030400213 APTM) beide verified_preview, 0 Writes. 8.73 ruft unveränderten exactAnchor-Pool-State-/Sync-Vorgänger-Nachweis lesend auf; kein Preisanker-, Flow-, Reward- oder Claim-Write. Preisquelle und Block, USD-Reward nur indikativ. Vor Block 88356 bleibt unpriced; RPC-Fehler liefert Preisstatus unavailable. DAO-Cron/Worker AUS. Details docs/releases/8.73-dao-legacy-single-exact-price.md.

### Phase 8.72 – Historische MineBot-Einzel-Claim-Vorschau (Installation offen)
- 8.71 SQL erfolgreich: NFTs 818/819 historisch angelegt und geprüft. 76 Legacy-Claims = 42/34, 0 kanonische Claims, 0 Asset-Flows, 0 Rewards oder USD; 224.410053146163331226 APTM read-only native Mints. 8.72 neuer Admin-only Einzel-Modus und Audit-UI zur erneuten Trace/Event-, Eigentums- und Duplikatprüfung. 4 Claims vor Pool-Start 88356 als unpriced; 72 spätere benötigen separat belegte exact-v13-Preise. **Keine** Schreiboperation, Cron/Live-Worker bleiben AUS. `docs/releases/8.72-dao-legacy-single-preview.md`.

### Phase 8.71 – MineBot-Ownership-SQL-Korrektur (Installation offen)
- 8.70-SQL scheiterte in Supabase mit `42702` (`wallet_address` Variable/Spalte). Read-only Kontrollen: null Zeilen für #818/#819. 8.71-Migration benennt lokale Konstante eindeutig um; Guards/Inserts unverändert. Noch nicht installiert. DAO-Cron/Worker AUS; keine Claim-/Reward-/Preisänderung. `docs/releases/8.71-dao-legacy-minebot-sql-fix.md`.


### Phase 8.70 – Historische MineBot-NFTs #818/#819, strikte Eigentumsregistrierung (Installation offen)
- 76/76 Legacy-Minter-Auszahlungen live verifiziert: 224.410053146163331226 APTM. Vault-IDs 818 und 819 sind dieselben MineBot-NFT-IDs des ERC-721-Vertrags `0xa1b76189…`. Beide in Block 10904 an Wallet geprägt; vollständige Transferhistorie, Ausgänge Block 11448349/11448526; 42 bzw. 34 Claims liegen im Eigentumsintervall. 8.70 nur 2 Katalogeinträge und 2 nicht-aktuelle Ownership-Zeiträume, mit strengen Guards. SQL/Installation und Abnahme offen; keine kanonische Claim-Erstellung oder USD-Preisveränderung, DAO-Cron/Live-Worker AUS. Details `docs/releases/8.70-dao-legacy-minebot-ownership.md`.

### Phase 8.69 – Manuelle Browser-Serie für 46 Legacy-Prüfungen (installiert, 76/76 abgeschlossen)
- Erste 30/76 historische Native-Minter-Auszahlungen live exakt verifiziert, **90.576417951299766898 APTM**, 0 Fehler und 0 Writes. Neuer Admin-Audit-Button führt die restlichen 46 in bis zu zehn seriellen Read-only-Gruppen à maximal fünf aus. Browser-Tab geöffnet halten; Stop bei Fehler oder manuellem Stopp. Nur Frontend-Dateien geändert; **keine SQL / Edge-Neudeploy / Cron-Aktivierung**. Details `docs/releases/8.69-dao-legacy-mint-browser-drain.md`.

### Phase 8.68 – Legacy Native-Mint-Preview-Diagnose (installiert und live geprüft)
- Nach 8.67-Installation weiterhin fünf `invalid-mint-event`; der dokumentierte echte Log besteht lokal. Neu `proofBuild` und getrennte Gründe für Topics-Layout, Address-Topics, Amount-Daten und Absender/Empfänger/Betrag. Read-only, keine SQL oder Datenänderung; DAO-Cron/Live-Worker AUS. Details `docs/releases/8.68-dao-legacy-mint-diagnostics.md`.

### Phase 8.67 – Blockscout-Topic-Nullkompatibilität (installiert, Live-Test weiterhin auffällig)
- 8.66-Preview live mit fünf Legacy-Transaktionen: alle `invalid-mint-event`, ohne Schreibvorgang. Eine echte Blockscout-v2-Antwort enthält drei Topics plus ein abschliessendes `null`; die bisherige Länge-3-Prüfung lehnte sie ab. 8.67 erlaubt nur dieses konkrete Null-Padding, keine zusätzlichen Topics mit Inhalt. Erneuter Read-only-Test nach Deployment offen; DAO-Cron und Live-Worker bleiben deaktiviert. Details `docs/releases/8.67-dao-native-mint-log-null-topic.md`.

### Phase 8.66 – Historische DAO1 Native-Minter-Claims: Admin-Preview (installiert, Formatfehler im ersten Live-Test)
- 76 historische `unassigned_legacy`-Transaktionen der Test-Wallet ohne gewöhnlichen Transfer; 16 fehlgeschlagene Transaktionen ausdrücklich ausgeschlossen. Beispiel Block 11448516: Zwei Mint-Calls an Avalanche Native Minter mit passenden Events, zusammen 5.359811966623994539 APTM. `claimReward` und Vault-IDs beweisen allein weder NFT-Identität noch USD-Preis.
- Neuer einzelner Admin-Modus `admin-legacy-native-mint-preview-866` (fünf Kandidaten je Seite, streng gleichlautende Trace- und Log-Evidenz, read-only). Noch nicht deployt oder live getestet. **Kein Cron, kein Worker, kein kanonischer Write, keine SQL.** Details `docs/releases/8.66-dao-legacy-native-mint-preview.md`.

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

Phase 8.49 vorbereitet: Separater, streng geprüfter Admin-Preview/Single-Claim-Pfad für historisch belegte Mining-NFT-Claims; noch keine automatische Freischaltung. DAO-Cron und Live-Worker aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

## 8.49 – 14.11.2026 19:52:00 CET

Phase 8.49 vorbereitet: Separater, streng geprüfter Admin-Preview/Single-Claim-Pfad für historisch belegte Mining-NFT-Claims; noch keine automatische Freischaltung. DAO-Cron und Live-Worker aus. Details: `docs/releases/8.49-verified-historical-miner-claims.md`.

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

## Release 8.16 · 10.11.2026 06:41:13 CET · 20261110-064113
Gesonderte, manuell geschützte staged-Reward-Phase mit einmaliger kanonischer Claim-Verarbeitung, konservativem Queue-Abschluss und Referral-Prüfung. Keine automatischen Crons. Weitere APTMDAO- und mehrwalletige Referral-End-to-End-Abnahme offen. Siehe `docs/releases/8.16-dao-staged-reward-phase.md`.

## Release 8.15 · 09.11.2026 21:38:12 CET · 20261109-213812
Staging-Guard für validierte leere Blockchain-Historien; Null-Block-Scans werden zweifach bestätigt, explizit als `empty_verified` markiert und nur bei nachgewiesener Coverage als `staged` übernommen. Live-Worker und Cron bleiben deaktiviert. Siehe `docs/releases/8.15-dao-empty-history-proof.md`.

## Release 8.14 · 09.11.2026 21:18:27 CET · 20261109-211827
Geschützte DAO1-Multi-Wallet-Staging-Queue: Lease-Token, begrenzte Schritte und Fehlversuche, nur manueller Test. Keine automatische Reward-Verbuchung oder Cron-Aktivierung. Siehe `docs/releases/8.14-dao-multi-wallet-queue.md`.

## Release 8.13 · 09.11.2026 20:53:16 CET · 20261109-205316
Einzelwallet-Cron-Probelauf `cron-test-wallet-one` mit eigenem DAO-Secret, nur bei Testimport-Freigabe und deaktiviertem Live-Worker. Schreibt optional Rohdaten und höchstens einen belegten Claim; keine Reward-Doppelbuchung oder Queue-Abschluss. Kein Cron aktiviert. Siehe `docs/releases/8.13-dao-fixed-wallet-cron-rehearsal.md`.

## Release 8.12 · 09.11.2026 20:19:02 CET · 20261109-201902
Dedicated DAO cron secret `DAO_REWARD_CRON_SECRET` replaces the previous accidental reuse of the wallet-daily-refresh credential. New fixed modes `cron-auth-check` (read-only) and `cron-stage-one` (single bounded raw staging pass, only after explicit `DAO_REWARD_ENABLE_LIVE_WORKER=true`). All other cron modes denied. No SQL migration; no cron or secrets created automatically. DAO canonical claim/Referral finalization and end-to-end completion are **not** production-ready. See `docs/releases/8.12-dao-cron-auth-preparation.md`.

## Release 8.11 · 09.11.2026 17:12:22 CET · 20261109-171222
Historische DAO1-NFT-Zuordnung in gemeinsame SQL-RPC für Browser und Edge Function überführt; 125 Fälle als Prüfziel, Live-Backfill noch offen. Beträge, Preise und Rewards unverändert. DAO-Cron bleibt deaktiviert. Siehe `docs/releases/8.11-historical-nft-claims.md`.

> Phase 8.10 · 09.11.2026 16:17:26 CET: Referral-Audit-Lesepfad optimiert; zuvor 150s-HTTP-504, jetzt zwei paginierte Datenströme mit hartem 30s-Abbruchbudget pro Strom. Live-Retest offen; keine Reward-Schreiboperation, DAO-Live-Worker/Cron bleiben deaktiviert.

> Phase 8.09 · 09.11.2026 13:29:34 CET: verifizierte DAO-Referral-Flows sind im Server aus vorhandenen kanonischen TX/Flows klassifizierbar. Nur lesender Audit der Referral-Zuordnung und NFT-Kandidaten; keine doppelte Buchung, keine automatische Bot-ID. DAO-Live-Worker und Cron bleiben aus.

> Aktuell 8.08 · 08.11.2026 22:45:54 CET: gemeinsamer token-metadata-Dienst und interner technischer Cache für Browser/DAO/Bestandsjob; eigene Anzeige-/Summary-Dezimalstellen benutzerbezogen in safe_tokens. Kein 18-/TRC20-6-Fallback bei fehlender Token-Skala; Pool-Ausnahmen nur mit Interface-Nachweis. 241 relevante Tests bestanden, zwei ältere breite Testfehler dokumentiert. Live-Abnahme offen; neue Funktion vor abhängigen Workern/Web deployen. Kein neuer Cron, DAO aus. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.08-cross-chain-token-metadata.md.

> Live-Nachtrag 8.07 · 08.11.2026 22:23:00 CET: zwölf Apertum-ERC20-/LP-Token mit 18 technischen Dezimalstellen und unveränderten Anzeige-Einstellungen per Edge-Antwort und Live-SQL bestätigt. Zehn NULL-Werte ergänzt; natives APTM bleibt 18, ERC20-Prüfstatus dort nicht anwendbar. Andere Chains/eigene sichere Token neu als offener Umfang gemeldet; Bestandsdiagnose vor weiterer Umsetzung. Kein Cron. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Aktuell 8.07 (08.11.2026 22:13:03 CET): technische Apertum-Decimale zentral aus Explorer ergänzen und wiederverwenden; keine per-Claim-RPC-Pflicht bei vorhandenem gültigem Wert. Konflikte erhalten Originalwerte und blockieren. Anzeige-Einstellungen unverändert. 8.06 installiert, Leerlauf live bestätigt; zehn technische NULL-Felder live ermittelt. 208 lokale Tests plus vier Preis-/Dashboard-Skripte bestanden; 8.07-Live-Abruf noch offen. Kein Cron. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.07-apertum-central-token-decimals.md. Die folgenden Angaben dokumentieren frühere Entwicklungsstände.

> Zusatz 8.06 (08.11.2026 21:45:35 CET): bekannter ERC20-Einzel-Claim-Pfad, historische technische Decimale, gemeinsame Asset-/Quote-Regel für Browser/Worker und TX-begrenzte kanonische Preise implementiert. 198 lokale DAO-/Reward-Tests plus vier Preis-/Dashboard-Skripte bestanden, neue Live-Prüfung offen. Referral/Gesamtqueue nicht freigegeben, Cron aus. Aktuell: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.05 (08.11.2026 13:25:24 CET): kontrollierter nativer Einzel-Claim-Pfad mit einer Import-Seite pro Strom, höchstens einem Kandidaten, gemeinsamer TX-begrenzter Ankernutzung, atomarer kanonischer Speicherung und wiederaufnehmbaren Blockierungsgründen. 173 lokale Tests inkl. PostgreSQL, Live-Lauf offen. Tagesqueue/Gesamtpipeline/Cron nicht freigegeben. Aktueller Status: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.04 (08.11.2026 13:02:39 CET): begrenzter service-only Admin-Prüfpfad für vier positive native Payouts ohne USD-Voraussetzung implementiert, atomare Payout-/History-Persistenz und exakte 1000-Wei-Grenze. 151 lokale Tests bestanden; neue Live-Prüfung offen, kein Cron. Aktuell: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.03 (08.11.2026 12:41:04 CET): 8.02-Migration und Deployment erfolgreich, erster Drei-TX-Test blieb wegen fehlerhaft erwarteten status-Felds bei needs_review. Internal-Prüfer akzeptiert nun boolesches success=true; 137 lokale Tests bestanden. Erneute Live-Prüfung offen, kein Cron. Aktueller Status: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Aktueller Zusatz 8.02 (08.11.2026 11:16:25 CET): Payout-Prüfung unterstützt jetzt `no_payout_evidence` mit TX-lokaler vollständiger Explorer-Prüfung, dauerhaftem Prüfprotokoll und 24h-Revalidierung. Auszahlung unabhängig vom NFT-/Preisstatus. Pending-Payout-Reste setzen die Queue fort. Vollständige Reward-Pipeline und Live-Abnahme bleiben offen, DAO-Cron aus. Aktueller Status: `docs/PROJECT_STATUS_OPEN_ITEMS.md`; Details: `docs/releases/8.02-dao-no-payout-evidence.md`. Die nachstehenden früheren Angaben sind historischer Entwicklungsstand.

# Reward-Daily-Jobs – Entwicklungsstand 6.09

## Neue historische NFT-Evidenzprüfung
- Verwendet die Blockscout-v2-Transferhistorie des konkreten ERC-721-Vertrags und der Token-ID.
- Prüft die zuletzt belegte Übertragung vor dem Claim-Block. Empfänger muss die Claim-Wallet sein.
- Transfers im Claim-Block sind ungeklärt (keine zuverlässige Transaktionsreihenfolge).
- Nur eindeutig erkannte ERC-721-Transfers zählen; ERC-1155 und fehlende Angaben bleiben ungeprüft.
- Bei mehr als 100 Historienseiten oder unvollständigen API-Daten wird nichts als verifiziert markiert.
- Pro Job-Durchlauf maximal 20 Kandidaten geprüft, um API-Last zu begrenzen.
- Ergebnis bislang nur Rückgabe-Zähler `historicallyVerifiedCandidates`; keine DB-Änderung bestehender Claims.

## Noch NICHT produktionsbereit
Historische Besitzprüfung allein bestätigt nicht, ob die dekodierte NFT-ID im konkreten Claim-Call wirklich der richtige Methodenparameter ist. Die fachliche Abbildung muss gegen die kanonische DAO-Verarbeitung geprüft werden. Ausserdem fehlen vollständige Claim-/Referral-/Preisbewertung, TLN/VOW-Worker und End-to-End-Tests.

Edge Function `dao-reward-refresh` und beide Reward-Crons NICHT aktivieren.

## Tests
`node --experimental-strip-types tests/dao-reward-historical-ownership.test.mjs` (6 Fälle mit kontrollierten Mock-Antworten).

## Präzisierung historische Besitz-Evidenz (Folgeupdate 6.09)
- Bei mehreren ERC-721-Transfers derselben NFT-ID im letzten Block vor dem Claim wird keine Besitz-Evidenz bestätigt. Ohne Log-/Transaktionsreihenfolge wäre die Eigentümerschaft am Blockende unbestimmt.
- Die Prüfung berücksichtigt solche Kollisionen auch über Pagination-Grenzen hinweg und prüft die gesamte Gruppe dieses Blocks, bevor sie eine Bestätigung zulässt.
- Neun lokale Regressionstests, darunter Übertragungen innerhalb eines früheren Blocks und über Seitengrenzen, erfolgreich.
- **Weiterhin kein automatischer Datenbankeintrag der `claim_nft_id` und keine Reward-Job-Aktivierung.** Erst kanonische Claim-Argumente, Contract-Evidenz, native/Token-Auszahlung, Preisbewertung und End-to-End-Abgleich müssen abgeschlossen werden.
### Phase 8.79 – Fünf feste preisfähige Legacy-Claims atomar übernehmen (Installation offen)
- 8.78 installiert/deployed und live 5/5 geprüft (Blöcke 165133, 957944, 1235068, 1563318, 1571769): 0 Writes, frische Blockchain-Mint-Belege und exakte historische Preise. 8.79 ergänzt nur einen expliziten, nach erneuter Vorschau und doppelter Bestätigung auslösbaren Commit; SQL erzeugt service-only Funktion mit festen fünf Transaktionen, prüft jeden Datensatz unter Advisory-Lock und nutzt je Claim denselben zentralen Native-Claim-Finalizer, alles atomar in einer SQL-Transaktion. Vier vor Block88356 bleiben ohne USD und unberührt. **Weder Cron noch Live-Worker aktiviert.** `docs/releases/8.79-dao-legacy-priced-five-atomic-commit.md`.

