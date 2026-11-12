## WalletTracking 8.21 · 12.11.2026 10:05:13 CET · 20261112-100513
DAO1 Legacy-MineBot-Nachzahlungen vom belegten wAPTM-Absender werden auch beim serverseitigen Staging-Scan pro Wallet als prüfbare ERC-20-Transaktion sichtbar. Bestehende Token-Flows werden ohne neue Blockchain-Abfrage beim folgenden Staging-Lauf nachgezogen (paginierter, insert-only Abgleich). Manuelle Aktualisierung hatte bereits den entsprechenden Transaktionsdatensatz erzeugt. Bestätigte Auszahlungen werden als „Miner-Nachzahlung (bestätigt) · Alte MineBots“ angezeigt; NFT-ID bleibt unbestimmt. Bestehende Bestätigungen, Beträge, Preise und Rewards werden nicht geändert. DAO-Cron weiterhin AUS. **Für den Serverpfad ist ein erneutes Deployment der geänderten Edge Function nötig.** Details: `docs/releases/8.21-dao-legacy-miner-payouts.md`.

## WalletTracking 8.20 · 12.11.2026 07:59:11 CET · 20261112-075911
DAO1-Browser speichert neue native Claim-Asset-Flows nur mit aus Explorer-Logs oder erfolgreichen internen Transfers belegtem originalem Wei-Betrag. Kein synthetischer `amount_raw` mehr; fehlende Rohbelege bleiben offen statt vorgetäuschter Auszahlung. Bestehende Claims/Preise/Buchungen und SQL unverändert; siehe `docs/releases/8.20-dao-native-wei-provenance.md`. DAO-Live-Worker/Cron aus.

## WalletTracking 8.19 · 11.11.2026 06:37:58 CET · 20261111-063758
Manuell autorisierter DAO1-Rohdaten-Batch `cron-multi-wallet-batch`: hoechstens zehn Schritte, 65-Sekunden-Startbudget, Einzelwallet-Leases und Fehlerisolierung. Kein Reward-Posting, kein Cron, keine SQL-Migration. Siehe `docs/releases/8.19-dao-manual-staging-batch.md`. DAO-Live-Worker bleibt deaktiviert.

## WalletTracking 8.18 · 10.11.2026 22:33:32 CET · 20261110-223332
Bei DAO1-Rohimporten werden Gegenparteien anderer eigener Wallets wie im Browser nicht erneut als Klartext gespeichert. Externe Contract-/Null-Adressen bleiben für Nachweise erhalten. Keine historischen Daten oder Rewards umgeschrieben; siehe `docs/releases/8.18-dao-internal-transfer-privacy.md`. DAO-Cron und Live-Worker bleiben aus.

## WalletTracking 8.17 · 10.11.2026 20:03:18 CET · 20261110-200318
Constraint-Hotfix für `reward_running` als eigene idempotente Migration, DAO-Edge-Fehlerformatierung und Korrektur des ungenutzten Browser-Zählers; siehe `docs/releases/8.17-dao-scan-hardening.md`. Cron und Live-Worker bleiben deaktiviert.

## WalletTracking 8.16 · 10.11.2026 06:41:13 CET · 20261110-064113
Geschützte DAO1-Staged-Reward-Phase ohne Cron-Aktivierung; siehe `docs/releases/8.16-dao-staged-reward-phase.md`.

> **8.15 · 09.11.2026 21:38:12 CET · Build 20261109-213812:** DAO-Multi-Wallet-Staging unterscheidet explizit bestätigte leere Historien von unvollständigen Scans; zweifache Explorer-Prüfung, `empty_verified`, Guard für `staged`. Keine kanonischen Reward-Änderungen, kein Cron. Details: `docs/releases/8.15-dao-empty-history-proof.md`.

## Release 8.14 · 09.11.2026 21:18:27 CET · 20261109-211827
Geschützte DAO1-Multi-Wallet-Staging-Queue: Lease-Token, begrenzte Schritte und Fehlversuche, nur manueller Test. Keine automatische Reward-Verbuchung oder Cron-Aktivierung. Siehe `docs/releases/8.14-dao-multi-wallet-queue.md`.

## Release 8.13 · 09.11.2026 20:53:16 CET · 20261109-205316
Einzelwallet-Cron-Probelauf `cron-test-wallet-one` mit eigenem DAO-Secret, nur bei Testimport-Freigabe und deaktiviertem Live-Worker. Schreibt optional Rohdaten und höchstens einen belegten Claim; keine Reward-Doppelbuchung oder Queue-Abschluss. Kein Cron aktiviert. Siehe `docs/releases/8.13-dao-fixed-wallet-cron-rehearsal.md`.

## Release 8.12 · 09.11.2026 20:19:02 CET · 20261109-201902
Dedicated DAO cron secret `DAO_REWARD_CRON_SECRET` replaces the previous accidental reuse of the wallet-daily-refresh credential. New fixed modes `cron-auth-check` (read-only) and `cron-stage-one` (single bounded raw staging pass, only after explicit `DAO_REWARD_ENABLE_LIVE_WORKER=true`). All other cron modes denied. No SQL migration; no cron or secrets created automatically. DAO canonical claim/Referral finalization and end-to-end completion are **not** production-ready. See `docs/releases/8.12-dao-cron-auth-preparation.md`.

## Release 8.11 · 09.11.2026 17:12:22 CET · 20261109-171222
Historische DAO1-NFT-Zuordnung in gemeinsame SQL-RPC für Browser und Edge Function überführt; 125 Fälle als Prüfziel, Live-Backfill noch offen. Beträge, Preise und Rewards unverändert. DAO-Cron bleibt deaktiviert. Siehe `docs/releases/8.11-historical-nft-claims.md`.

**WalletTracking Phase 8.10 · Build 20261109-161726 · 09.11.2026 16:17:26 CET**

8.10: Referral-Audit 504-Timeout: DB-Abfragen von N×40-TX-Reads auf zwei parallel paginierte Datenströme reduziert, gemeinsames 30s-Abbruchsignal pro Datenstrom, harte Seitenbegrenzung und explizite Fehler bei unvollständigen Daten. Geschäftsregeln, Rewards und NFT-Zuordnung unverändert. 27 DAO-/Reward-Regressionstests lokal bestanden. Kein SQL, kein Cron. Edge Function `dao-reward-refresh` neu deployen.

**WalletTracking Phase 8.09 · Build 20261109-132934 · 09.11.2026 13:29:34 CET**

8.09: DAO1-Referral-Rewards serverseitig aus bereits vorhandenen verifizierten Transaktionen und Asset-Flows auswerten; keine zweite Reward-Buchung. Admin-Read-only-Audits für Referral-Zuordnung und fehlende NFT-Claim-Zuordnung. 16 gezielte lokale Tests bestanden. Kein SQL, kein Cron, Live-Worker deaktiviert. Nach ZIP-Installation `dao-reward-refresh` neu deployen. Details: [8.09](docs/releases/8.09-dao-server-referrals-nft-audit.md).

**WalletTracking Phase 8.08 · Build 20261108-224554 · 08.11.2026 22:45:54 CET**

8.08 erweitert technische Metadaten auf alle zwölf aktuell unterstützten Chains und eigene sichere Token. Gemeinsame neue Edge Function token-metadata für Browser, DAO-Claim-Pfad und täglichen Bestandsjob. Globale öffentliche Contract-/Mint-Metadaten liegen in wallettracking_internal.token_metadata (nicht über die Data API exponiert, RLS aktiv, keine Client-Tabellenrechte). Keine User-ID, Wallet-Adresse oder private Safe-Token-Bezeichnung in diesem Cache. Bekannte Masterwerte in predefined_tokens werden gespiegelt; nichtleere technische Werte, Namen und Bezeichnungen bleiben geschützt. Persönliche Anzeige- und Summary-Dezimalstellen bleiben separat bei safe_tokens und werden nur für die eigene Liste geladen.

241 relevante lokale Tests bestanden; im breiten Lauf sind zwei unverändert reproduzierbare ältere Testfehler dokumentiert. 8.08 ist noch nicht live abgenommen; fehlende Werte anderer Chains werden erst nach Installation/Deployment ermittelt. Kein Metadaten-Cron, DAO-Cron und Live-Worker bleiben aus.

**Nächster Schritt:** Nur `supabase/migrations/20261108222813_cross_chain_token_metadata_808.sql` vollständig im Supabase SQL Editor ausführen. Mehrere DDL-/Funktionsanweisungen in einer atomaren Transaktion; keine separaten SELECT-Resultsets. Keine Provider-Abfrage und kein Cron beim Ausführen. Erst nach Rückmeldung Deployment anleiten.

Details und spätere Deployment-Abhängigkeiten: [8.08](docs/releases/8.08-cross-chain-token-metadata.md). Führender Status: [PROJECT_STATUS_OPEN_ITEMS.md](docs/PROJECT_STATUS_OPEN_ITEMS.md).

---

Die folgenden Abschnitte dokumentieren frühere Releases; für den aktuellen Stand gelten die obigen Angaben und die zentrale Statusdatei.

**Aktueller Projektstand / offene Punkte:** [`docs/PROJECT_STATUS_OPEN_ITEMS.md`](docs/PROJECT_STATUS_OPEN_ITEMS.md) (Stand 08.11.2026). DAO: 388 Claims live gekennzeichnet; 4 frühe Preis-Ausnahmen dauerhaft markiert; 3 Null-Reward-TXs dauerhaft und wiederholt als no_payout_evidence geprüft; vier frühe positive Payouts seit 8.04 separat verifiziert, USD NULL. Cron deaktiviert.

**Version 8.00 · Build 20261108-102027** – DAO: Native APTM-Claim-Kennzeichnung verwendet in beiden SQL-Funktionen denselben exakten Dezimalvergleich der Original-Wei-Beträge mit begrenzter Toleranz von 0.000000000000001 APTM für historisch gespeicherte JS-Werte. Erwartet 384 bereits markierte und genau 4 weitere belegte Claims; Abbruch/Rollback bei jeder Abweichung. Siehe `docs/releases/8.00-dao-bounded-decimal-match.md`. Apple-iCloud-Passwörter-Erweiterung in Chrome (macOS) erkennt WalletTracking trotz Zuordnungsversuchen nicht: offener Punkt.
**Version 7.99 · Build 20261108-095652** – DAO: Nativer Claim-Abgleich in SQL auf denselben binären Number-Vergleich wie im geprüften JavaScript-Audit vereinheitlicht; 284-Treffer-Guard und atomarer Rollback bleiben. Mac-Safari-Loginformular mit explizitem `autocomplete=on`, persistenten Feldnamen und nativer Formularvalidierung. Pro Rückfrage nur eine auszuführende SQL-Abfrage/Testanweisung. Siehe `docs/releases/7.99-dao-float-match-safari-autofill.md`.
**Version 7.94 · Build 20261107-190138** – DAO-Checkpoint-Fortsetzung: `updated_at` wird beim Speichern explizit aktualisiert, gespeicherter Seiten-Cursor direkt zurückgelesen, unveränderte Explorer-Cursor führen zum kontrollierten Abbruch; manueller Test zeigt Start-/End-Fortschritt. Keine SQL-Migration, keine Cron-Aktivierung. Siehe `docs/releases/7.94-dao-checkpoint-progress.md`.
**Version 7.93 · Build 20261107-184337** – Sichere manuelle Klassifikation bereits vorhandener, bewerteter nativer DAO-Miner-Claims in der Prüfliste (keine Änderung an Rewards/Preisen). Siehe `docs/releases/7.93-dao-existing-claims.md`.
**Version 7.92 · Build 20261107-172219** – Separat freigegebener, manuell gestarteter DAO-Einzel-Wallet-Rohdatenimport (eine Explorer-Seite pro Datenstrom; keine Reward-, Preis- oder Snapshot-Änderungen). Siehe `docs/releases/7.92-dao-single-wallet-import.md`.

**Version 7.91 · Build 20261103-152003** – DAO-Test mit authentifiziertem Admin-JWT statt Wallet-Daily-Secret; übriger Worker unverändert deaktiviert. Siehe `docs/releases/7.91-dao-admin-jwt-test.md`.

**Version 7.90 · Build 20261103-145850** – Manueller, rein lesender DAO-Referral-Wallet-Test ohne Cron und Datenbank-Schreibzugriff. Einzelheiten `docs/releases/7.90-dao-readonly-referral-test.md`.

## WalletTracking 7.89 – DAO-Live-Readiness-Audit

Nur lesender aggregierter SQL-Audit unter `sql/audits/dao-reward-live-readiness-789.sql`. Keine Datenbankmigration und keine Cron-Aktivierung. Der Worker bleibt deaktiviert bis zur Prüfung der echten Supabase-Ergebnisse.

## Version 7.88 — 03.11.2026

Build 20261103-141328. DAO: bestehende exakt zielblockgebundene `aptm_price_anchors` (canonical exact-v13) werden im Worker für native APTM bzw. den verifizierten wAPTM-Contract übernommen. Keine neue historische Preisermittlung, kein Predecessor-Fallback, keine Token-Symbol-Erkennung für ERC20, keine Überschreibung bestehender Preise. Fehlende Anker bleiben unbewertet. Migration `20261103141328_dao_exact_target_anchor_prices_788.sql` vor künftigem Worker-Deployment ausführen. Worker/Cron bleibt deaktiviert bis zum Live-Test und Abschluss der fachlichen Reward-Pipeline.

## Version 7.87 — 03.11.2026

Build 20261103-135703. DAO-Worker: Bewertungslücken werden ausschliesslich aus bereits kanonisch bewerteten Flows derselben Wallet, desselben Tokens/Contracts, derselben Decimals und exakt desselben Blocks ergänzt. Konfliktierende Preise/Quellen, fehlende Bewertung und manuelle Werte bleiben unangetastet. Keine neue Preisroute. Serverseitige RPC nur Service Role. Vollständiger Live-Test und Cron weiterhin offen.

## Version 7.86 — 03.11.2026

Build 20261103-135010. DAO-Referral-wUSDT erhält einen separaten, fortsetzbaren serverseitigen ERC-20-Transferscan, nur für die im vorhandenen DAO-Code verifizierte Referral-Wallet. Der neue Scan nutzt denselben eindeutigen Flow-Key wie der allgemeine Token-Scan, prüft eingehende Token/Wallet-Richtung nach und lädt Contract-Transaktionen bei Bedarf aus Blockchain-Details nach. Ein blosser wUSDT-Eingang ist keine Referral-Bestätigung. Unvollständige Seiten halten die Queue auf `partial`. Keine eigenen Reward-Summaries oder Snapshots. Kein neuer Cron und keine Datenbankmigration; Edge Function noch nicht deployen, vollständige Reward-Pipeline und Live-Test weiterhin offen.

## Version 7.85 — 03.11.2026

- DAO: Verifizierte neue Miner-Claims ohne belegte NFT-ID können als «Nicht zugeordnet» im bestehenden `project_nft_claims` gespeichert werden. Voraussetzung sind vollständige TX-/Flow-Evidenz, identischer Token/Rohbetrag und bereits vorhandene historische Bewertung. Keine Bot-ID-Erfindung, kein zweiter Preisweg.
- SQL: `20261103134421_dao_verified_unassigned_miner_claims_785.sql`. DAO-Worker noch NICHT deployen / Cron nicht aktivieren; Live-Test steht aus.

## Version 7.84 — 03.11.2026

- Neue, eindeutig historisch verifizierte Legacy-DAO-Claims können aus bestehenden, bewerteten Auszahlungs-Flows in `project_nft_claims` angelegt werden; neue Miner ohne NFT-ID bleiben unzugeordnet.
- Keine Preis-Fallbacks und keine Überschreibung vorhandener Claims. Reward-Cron bleibt deaktiviert bis Live-Abgleich.

## Version 7.83 · 03.11.2026

DAO: Verifizierte historische Auszahlungs-Flows können vorhandene, noch nicht bewertete NFT-Claim-Datensätze transaktional vervollständigen, sofern der applikationsweite Preisweg die Flows bereits bewertet hat. Kein eigenständiger Preisrechner und keine neuen Claim-Datensätze. Migration `20261103111756_dao_canonical_payout_reconcile_783.sql` vor einem zukünftigen Worker-Deployment ausführen. DAO-Worker bleibt deaktiviert bis zur vollständigen Claim-/Referral-Pipeline und Live-Tests.

# WalletTracking · Phase 7.83

## Update 7.82 – Unzugeordnete Legacy-Claims (Staging)

- Bisher nicht erfasste `claimReward`-Transaktionen ohne eindeutige NFT-ID werden als `unassigned_legacy` gespeichert.
- Sie gelangen zur gesonderten Auszahlungsprüfung, **ohne** eine Bot-ID, einen Reward-Betrag oder einen Preis zu behaupten.
- Neue `Miner Claim`-Fälle bleiben getrennt als `unassigned_miner`.
- Weiterhin kein produktiver DAO-Cron; die kanonische Claim-/Referral-Verarbeitung fehlt noch.
- Migration: `20261103111113_dao_unassigned_legacy_claims_782.sql`; DAO-Edge-Function **nicht** deployen.
- Build: `20261103-111113` (CET).


## Update 7.81 – Neue Miner-Claims ohne eindeutige NFT-ID (Staging)

Der serverseitige DAO-Rohdaten-Worker nimmt neue `Miner Claim`-Transaktionen auch dann in die dauerhaft gespeicherte Prüfliste auf, wenn noch keine eindeutige historische Bot-/NFT-Zuordnung erkennbar ist. Diese Fälle erhalten `status=unassigned_miner`, leere NFT-Vertrags-/ID-Felder und können ihre tatsächlich belegte Auszahlung separat nachweisen. Legacy-Claims ohne eindeutige NFT-ID werden **nicht** pauschal so behandelt. Staging-Status und Auszahlungsnachweis ersetzen **keine** bestätigte Bot-Zuordnung, historische Preisbewertung oder Reward-Summe.

**Installation:** SQL-Migration `supabase/migrations/20261103110156_dao_unassigned_miner_candidates_781.sql` ausführen; Webdateien veröffentlichen. `dao-reward-refresh` weiterhin **nicht deployen/aktivieren**. 42 lokale DAO-Tests erfolgreich; kein Live-End-to-End-Test.

## Update 7.80 – DAO-Auszahlungsnachweise erneut prüfen

DAO-Claim-Kandidaten mit `payout_status=needs_review` werden nach mindestens 24 Stunden erneut mit den mittlerweile importierten On-Chain-Flows verglichen. Neue `pending`-Kandidaten haben Vorrang. Insgesamt werden pro Lauf höchstens 20 Kandidaten geprüft. Bereits bestätigte (`verified`) Nachweise werden weder zurückgesetzt noch verändert. Damit bleiben zuvor fehlende Explorer-Transfers nicht dauerhaft ungeprüft.

**Installation:** Nur geänderte Dateien einspielen und veröffentlichen. Keine SQL-Migration; `dao-reward-refresh` weiterhin **nicht deployen oder per Cron aktivieren**, da die vollständige Claim-/Referral-/Preiszuordnung sowie TLN/VOW weiter offen sind. Tests: 43 lokale DAO-/Reward-Tests bestanden; kein Live-End-to-End-Test.

## Update 7.79 – DAO-Auszahlungsnachweis (Staging)

Der DAO-Worker speichert für historisch bestätigte Claim-Kandidaten einen nachgewiesenen Token-Vertrag, den exakten Rohbetrag, die Dezimalstellen und die Zahl der belegenden Blockchain-Flows. Mehrdeutige, gemischte oder nicht belegte Auszahlungen werden nicht automatisch bestätigt. Bereits als verifiziert markierte Fälle aus 7.78 ohne Betragsnachweis werden zur erneuten Prüfung vorgemerkt. Es werden **keine Reward-Summen, Preise, Bot-Zuordnungen oder Snapshots geändert**.

**Installation:** Migration `supabase/migrations/20261103084538_dao_payout_evidence_amount_779.sql` nach 7.77/7.78 in Supabase SQL Editor ausführen; dann Dateien veröffentlichen und Phase 7.79 prüfen. **`dao-reward-refresh` nicht deployen oder per Cron aktivieren.** Der vollständige serverseitige Claim-/Referral- und Preisabgleich sowie TLN/VOW fehlen noch. Einzelheiten: `docs/releases/7.79-dao-payout-amount.md`.


## Update 7.68

Täglicher serverseitiger Wallet-Bestandsjob für die 12 konfigurierten Chains. Neue Edge Function `wallet-daily-refresh`, Service-only Wiederaufnahme/Fehlerprotokoll, gemeinsame atomare Snapshot-Speicherung und beibehaltene Browser-Live-Prüfung beim ersten Öffnen. Bestehende LP-/Staking-Caches werden nach dem Laden weiter eingeblendet; die komplexe Projekt-Discovery bleibt separat.

**Installation:** Die verbindliche Installations- und Testanleitung steht unter [`docs/releases/README-7.68.md`](docs/releases/README-7.68.md). Zuerst beide SQL-Migrationen, dann Edge Function und Secrets, manueller Testlauf, erst danach Cron und Veröffentlichung der Hauptseite. Keine Dateien mit API- oder Cron-Secrets committen. Die historische Trade-Cron-Migration enthält nur noch Platzhalter; der frühere Trade-Secret muss trotzdem rotiert werden.

## Update 7.55
Admin → Vordefinierte Token: neue Option „In der Dashboard-Kursübersicht anzeigen“ je Projekt-Token, standardmäßig aktiviert. Globale Stammdateneinstellung für alle Nutzer. Projekt muss beim jeweiligen User aus Bestand oder bestätigtem Projekt-Summary vorhanden sein. Ausblenden hat Vorrang vor positivem Bestand und „Im Dashboard immer anzeigen“. Nichtprojekt-Token behalten ihre Regeln; Bestände, Vermögen, historische Bewertung und Kurse im Projekt bzw. in Projekt-Kacheln bleiben erhalten.

Zuerst SQL 093 (sql/093-project-token-dashboard-price-visible.sql) ausführen: 3 Statements in Reihenfolge, BEGIN/ALTER TABLE/COMMIT; keine SELECT-Resultsets. Webdateien übernehmen/veröffentlichen und neu laden. Kein Edge-Deployment. SQL 092 aus 7.54 bleibt Voraussetzung für belegte Claims ohne NFT-ID.

Im lokalen wallet-tracking-Ordner _wt-docs-cleanup.command einmal ausführen, bevor du commitest/veröffentlichst. Der Helfer archiviert ausschließlich die bekannten README-7.33.md bis README-7.44.md unter docs/releases/; identische Root-Duplikate werden entfernt. Abweichende Inhalte bleiben erhalten und werden gemeldet. README.md bleibt der aktuelle Einstieg; CHANGELOG.md bleibt die chronologische Kurzfassung, die archivierten Release-Berichte bleiben historische Detailstände. Ein ZIP entfernt bestehende Dateien nicht von selbst.

User bestätigt am 09.10.2026 APTM-24h und Entdecken als OK. TLN/VOW-24h, DID-/Wallet-Zuordnung, wAPTM-Nachzahlungen, Aufgaben-Namen, Kurslayout und Datenlöschung bereits bestätigt. Claims ohne NFT-ID nach SQL 092 noch nicht ausdrücklich produktiv bestätigt. LPT-Kursermittlung eingestellt, historische Bewertung erhalten. Restore zurückgestellt; Cross-User/RLS-/Admin-Negativtests offen.

Prüfung: 22 lokale Regressionsdateien bestanden, einschließlich Projekt-/Flag-Gates, erfolgreicher/fehlgeschlagener Speicherung und realem Cleanup-Helfer (abweichende Inhalte, Archivkonflikte, Wiederholung). JavaScript-/Shell-Syntax und ZIP geprüft. Produktive SQL-/UI-Prüfung nach Installation ausstehend.

### Zu testen · 7.55
Zu testen: 1. Admin → Vordefinierte Token → Apertum: wUSDT und wAPTM/wUSDT-LP abwählen. Dashboard-Kursübersicht ohne diese Zeilen, Vermögenszahlen und Projekt-Kurse unverändert. 2. „Im Dashboard immer anzeigen“ aktiviert lassen: ausgeblendete Tokens bleiben aus der Kursübersicht weg. 3. Wieder aktivieren: bisherige Regeln Bestand > 1 USD oder immer anzeigen gelten. 4. Neu laden: Einstellung bleibt erhalten. 5. User ohne DAO1-Projekt: diese Projekt-Token trotz aktivierter Flags nicht anzeigen; Nichtprojekt-Token unverändert. 6. Cleanup-Helfer zweimal ausführen: Root bleibt frei von alten Release-READMEs, Archive vollständig, README.md bleibt; GitHub Desktop zeigt nur diese Verschiebungen plus Updatedateien. Wallet hinzufügen, Wallet löschen, sämtliche Daten löschen bleiben im Regressionskatalog; gezielte Cross-User/RLS-/Admin-Negativtests offen, Restore zurückgestellt.

## Update 7.54
APTM/wAPTM: aufgelöste Bewertungsroute direkt übergeben, globalen Preissnapshot auf v6 erneuert. Belegte Claims ohne NFT-ID speichern und als Nicht zugeordnet anzeigen. Aktuelle LPT-Kursermittlung auf Userentscheid eingestellt; historische Bewertungen erhalten.

Installation: zuerst sql/092-claims-nullable-nft-id.sql ausführen (3 Statements: BEGIN, ALTER TABLE, COMMIT; keine SELECT-Resultsets). Danach Webdateien veröffentlichen, Seite neu laden, Daten aktualisieren und zentralen Preisrefresh ausführen. Kein neues Edge-Deployment. SQL 091 bleibt Voraussetzung für separate wAPTM-Entscheidungen.

User bestätigt am 08.10.2026: DID-/Wallet-Zuordnung, wAPTM-Nachzahlungen, Aufgaben-Namen, Kurslayout und Datenlöschung scheinen OK; TLN/VOW-24h OK. APTM/wAPTM-24h und Claims ohne NFT-ID nach 7.54 erneut testen. Entdecken Alle Wallets/Spam-Sammelaktion, Cross-User/RLS-/Admin-Negativtests weiter offen. Restore zurückgestellt.

Prüfung 7.54: 20 lokale Regressionsdateien bestanden, einschließlich beider Apertum-Preiswege mit label-only Stammdaten sowie gemischter Claims mit/ohne NFT-ID. Syntax und ZIP geprüft. SQL-Installation und produktive APTM/wAPTM-/Claim-Prüfung beim Anwender noch ausstehend.

## Update 7.53
Bestehende historische Preisermittlung wiederverwendet: taxEvmBlockByTime (ohne neue userbezogene Zeitcache-Schreibvorgänge), taxDirectV2Price (optionaler exakter Pool) und taxV2LpHistoricalPrice (optionaler Routenresolver). Apertum verwendet weiterhin seine bestehenden Sync-/Transfer-Event-Nachweise; V3-slot0 ergänzt nur die fehlende historische Poolabfrage. Bisherige Aufrufer und Bewertungsformeln bleiben unverändert.

24-Stunden-Vergleich für DEX-Kurse über dieselbe aktuelle Bewertungsroute; globaler Cache, ehrliche Lücken und Referenzkennzeichnung. CoinGecko-Änderungen unverändert. V2/V3-Routen und LP-Reserve-/Supply-Bewertung werden am Block vor 24h nachgerechnet; kein Anbieter-/Marktwechsel. Nur im zentralen Preisjob, nicht beim Dashboard-Öffnen. Temporärer globaler Vergleichscache im bestehenden Snapshot (v5), keine neue Tabelle oder langfristige Preisreihe. Fehlende Route/Archive-/frische Kursdaten bleiben – mit Tooltip; aktuelle Preise erhalten. Konstante USD-Referenz gesondert erklärt.

Installation: Webdateien übernehmen, veröffentlichen, neu laden. Kein neues SQL/Edge-Deployment.

Zu testen: Preis-Refresh, BSC-Voucher/VOW/TLNGOLD, ETH-V2/V3, APTM/wAPTM, LP, Reload und zweiter Nutzer, Archive-Fehler, CoinGecko unverändert. Lokale Regressionen bestanden; Live-RPC-Proben aus dieser Umgebung HTTP-abgewiesen, produktive Abdeckung offen. Wallet hinzufügen/löschen, sämtliche Daten löschen und Account-/Admin-Negativtest bleiben Teil des Audits; Restore zurückgestellt.

## Update 7.52
Kurse: zwei Tabellen bei ausreichender Bereichsbreite, sonst eine gemeinsame Tabelle; Contract-Adressen kleiner auf zweiter Zeile. Container-Query ab 1400 px Innenbreite; bei weniger Platz gleiche Spalten in einer gemeinsamen Tabelle. Adressen gekürzt und kopierbar. Chain-/Tokensortierung, Preisquellen, Filter und Ladezeitpunkte bleiben. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, breite/schmale Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel, Adresskopieren. Browser-Retest offen.

## Update 7.51
Aktuelle Kurse in einer gemeinsamen Tabelle mit einem Tabellenkopf und durchgehend ausgerichteten Spalten. Volle Breite und horizontaler Scroll bleiben. Sortierung nach zentraler Chain-Reihenfolge, innerhalb der Chain nach Tokenname. Filter, Kursquellen und Datenabrufe unverändert. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, breite/schmale Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel.

## Update 7.50
Aktuelle Kurse über volle Dashboard-Breite; Tabellenaufteilung nach verfügbarer Breite, horizontaler Scroll bei schmalen Ansichten. Preislogik und Datenabrufe unverändert. Kein neues SQL/Edge-Deployment. Zu testen: Safari/Brave, schmale/breite Fenster, Navigation ein-/ausgeklappt, Hell/Dunkel.

## Update 7.49
Namen in „Was muss ich tun?“ sind ausschließlich zusätzliche Angaben: TLN-IDs und andere Kennungen bleiben erhalten. Besitzer und gespeicherter Partneralias werden dedupliziert ergänzt, einschließlich Token-/Bestandschecks, Miner-Nachzahlungen und Partner-Stakings. Userbezogener Alias-RAM lazy beim ersten Dashboard mit Aufgaben, ein deduplizierter wallet-private-Read; nach Alias-Save erneuert. Keine RPC-/Team-Discovery für Namen; TLN/DAO/APTMDAO-Namensräume bleiben getrennt.

Legacy-LPT auf BSC: vorhandene deaktivierte historical_only-Stammdaten werden zur Klassifikation gelesen, nicht für neue Balance-/Discovery-Scans aktiviert. Die vorhandene Cross-Chain-Formel ist historisch. Aktueller verifizierter Projektpreis wird weitergegeben; ohne diesen bleibt der Preis offen mit Erklärung. Historische Bewertung und BSC-Dust-DEX-Kurs werden nicht als aktueller Wert übernommen. Aktueller Rücktausch-/Bewertungsnachweis bleibt offen.

Installation: geänderte Webdateien übernehmen, veröffentlichen und neu laden. Kein zusätzliches SQL/Edge-Deployment. SQL 091 aus 7.48 bleibt Voraussetzung für die Bot-Claim-Entscheidungen.

Zu testen: zusätzliche Namen bei erhaltenen TLN-IDs 17265/11674/11283; Besitzer+Partner zugleich; fehlende Namen/Sonderzeichen; gleiche TLN-/DAO-ID; Walletfilter, Aliasänderung und Userwechsel. LPT-Hinweis nach Preisrefresh, keine historische/Dust-Preisübernahme. Wallet hinzufügen/löschen, sämtliche Daten löschen und Account-/Admin-Negativtest; Restore zurückgestellt. Lokale Regressionen bestanden, produktiver Retest offen.


Separate wAPTM-Nachzahlungen: positiver Eingang nur vom Sender `0x6d0539de11b95e18cb202a55098e3854b0313022` und Tokencontract `0x110ac02ba3384bc055c13a87766049a74517beda`. Je Wallet bestätigen/ignorieren, nur aktuell angezeigte TXs. Offen unter „Was muss ich tun?“ und Bot-Claims mit Datum/Betrag/TX. Bestätigt unter NFT „Nicht zugeordnet“ und in Claim-/Dashboard-Summen; ignorierte und offene Zahlungen zählen nicht. Keine vermutete Einzelbot-ID.

**Installation 7.48:** Zuerst `sql/091-dao-bot-claim-reviews.sql` im Supabase SQL Editor komplett ausführen (**13 Statements in Reihenfolge**, BEGIN/COMMIT, keine SELECT-Resultsets). Danach geänderte Webdateien veröffentlichen, Seite neu laden und Daten aktualisieren. Kein neues Edge-Deployment. `apertum-rpc-proxy` aus 7.46 bleibt Voraussetzung für die DID-Korrektur.

Entscheidungen gespeichert in `dao_bot_claim_reviews`, je User/Wallet/TX, FK auf vorhandene Transaktion, RLS auth.uid(), kein anon-Zugriff, keine Klartext-Walletadresse/-namen. Löschung via bestehende Transaktions-/Auth-Cascades; Blockchain-Daten bleiben unverändert. Erstread je User-/Wallet-Scope, erneuter cache-only Read beim Claims-/Referral-Öffnen und Dashboard-Summary. Kein zusätzlicher Explorer-/RPC-Scan; neue Zahlungen über vorhandenen Tages-/manuellen Delta-Sync.

**Zu testen 7.48:** Bestätigen/ignorieren je Wallet, Abbrechen, neue TX nach Bestätigung, Reload, Nicht zugeordnet, Claim-/Dashboard-Summen und Personenfilter; Wallet hinzufügen/löschen, sämtliche Daten löschen, Kontolöschung und Admin-Sperre. Lokale Regressionen bestanden; produktiver Supabase-/RLS-/Cascade-Test offen. Restore-Test zurückgestellt.

Entdecken startet mit Alle Wallets. Scans und Sperren bleiben walletbezogen. Die Sammelaktion markiert alle offenen entdeckten Tokens als Spam, auch ohne Verdacht; bereits sichere Tokens bleiben ausgeschlossen. Anzahl dedupliziert je Chain/Adresse, Speicherung je Wallet. Einzelaktion Als sicher hinzufügen bleibt erhalten. 7.47 ersetzt die sichere Sammelaktion aus 7.46.

DAO1/APTMDAO: aktuelle DID-Partnerbesitzer getrennt über ownerOf(latest), maximal vier parallele Aufrufe pro System und fünf Minuten RAM-Cache. Mint-Wallet und Parent bleiben unverändert im historischen Graph-Cache. Aktuelle Details, Bots und Partnerzahlen verwenden den aktuellen Owner; bei Fehlern bleibt dieser offen.

Installation 7.47: geänderte Dateien übernehmen und veröffentlichen, Seite neu laden. Kein zusätzliches Edge-Deployment. Voraussetzung aus 7.46: **supabase/functions/apertum-rpc-proxy/index.ts deployen**, falls noch nicht erledigt. Keine SQL-Migration, keine Wallet löschen/neu hinzufügen, keine historischen Graph-Caches leeren. Danach Seite neu laden und Daten aktualisieren. Ohne neuen Proxy kann die Legacy-Besitzerprüfung nicht laufen.

Zu testen: Entdecken Alle/Einzelwallet, gemischte Scan-Sperren, Chainfilter, Spam-Sammelaktionen und einzelne sichere Freigabe; Monica DAO1 #21044 → Carmen #18438 auf 0x568281…fe4940, APTMDAO #7803 → Chris #7315; 9 Mining-Bots und 1 Trading-Bot getrennt zugeordnet; Besitzerwechsel/RPC-Fehler. Wallet hinzufügen/löschen, sämtliche Daten löschen, normale Kontolöschung und Admin-Negativtest bleiben Teil des End-to-End-Audits. Restore-Test zurückgestellt.

7.48: Separate wAPTM-Auszahlungen werden manuell bestätigt. Company-Absender und einzelne Bot-Zuordnung bleiben extern unbestätigt; gewöhnliche Token-Transfers werden nicht ungeprüft gezählt.

Dokumentation: Admin → Systemübersicht, Audit, Dokumentation, Ideen/Umbau; allgemeine und DAO1-Hilfe; docs/releases/CHANGELOG.md. Historische SQL-Migrationen erhalten.

## Erwerb ohne Zahlung
„Mint ohne Zahlung in dieser TX“ bedeutet: erfolgreicher ERC-721-Mint dieses Bots an die Erwerbswallet, vollständige Token-/Internal-Transferlisten und TX-Details, kein positiver ERC-20- oder nativer Zahlungsfluss in dieser TX. Gas ist kein Kaufpreis. Frühere oder externe Zahlungen bleiben möglich; Kaufpreis bleibt nicht ermittelt, niemals automatisch 0. Bei Abruffehlern oder unvollständigen Daten bleibt die Prüfung offen.

NFT zeigt den Hinweis beim Erwerb, DAO-Baum/Bot-Tabelle in Erwerbsart. Kaufpreis bleibt „nicht ermittelt“. Gefundene historische Zahlungen und Upgrade-Kaufpreise haben Vorrang. Same-TX-Abschluss wird separat als sameTxPaymentCheckComplete / mintWithoutPayment gespeichert; checked bleibt der Kaufpreisnachweis. Keine NFTs/Tx-IDs werden hardcodiert. Positive Zahlungen von Dritten verhindern ebenfalls die Negativklassifizierung. Strikte Transferpagination bricht bei Limit oder fehlendem items-Array ab; Fehlerantworten aus toleranten Claim-Caches werden nicht für den Abschlussnachweis benutzt. Fehlende/ungültige Beträge und fehlende TX-Erfolgsdaten bleiben unvollständig.

Resolver-Versionen: reguläre NFTs 4, Upgrade-NFTs 6. Bestehende zentrale Nachweise werden einmal neu geprüft; kein permanenter Scan beim NFT-Öffnen. Speicherung weiter im privaten NFT-Cache, keine neue Tabelle. Keine globale Schema-/Grant-Änderung.

## Verifikation
Lokale Regression mit screenshot-abgeleiteten synthetischen Daten für #15541/#15542 und #120469/#120470; Zahlungen, unbekannte Werte, fehlerhafte/abgebrochene Pagination, fehlende Internals/TX-Details, NFT-/DAO-Darstellung und Trennung vom Kaufpreis. Bestehende Regressionen und JS-Syntax geprüft. Produktive API-Roundtrips hier nicht geprüft.

Produktiver Test: nach Veröffentlichung neu laden, Daten aktualisieren, die vier Bots unter NFT und im DAO-Detail prüfen. Erwartet: „Mint ohne Zahlung in dieser TX“ bei vollständigem Abruf, Kaufpreis nicht ermittelt, Erwerbs-TX weiterhin verlinkt. Vorhandene Kaufpreise müssen erhalten bleiben. Fehler bleiben offen, niemals als gratis klassifiziert.

## Noch offen
- Übrige ungeklärte Bot-Kaufpreise anhand eigener Erwerbs-TX prüfen; separate Zahlung nicht heuristisch zuordnen.
- Externe Metadaten #120469 fehlen (404 produktiv bestätigt, technische Behandlung funktioniert).
- Vollständiger Konto-Löschtest samt Admin-Negativtest und Neu-/Alt-Wallet-Importvergleich noch nicht abschließend belegt.
- Monica: Trading-Bot im alten DAO1-Zweig separat kontrollieren.
- Legacy-Claim #10294 ohne Auszahlung: niedrige Priorität.
- Restore-Test weiter zurückgestellt; Backup und Master-Key gesichert.

## Dokumentation
Diese README.md wird künftig aktualisiert. Ältere README-7.xx.md sind Release-Historie und für die App nicht erforderlich. SQL-/Baseline-Dokumentation in sql/ und technische Dokumentation in docs/ bleiben separat erhalten. Nutzerhilfe und Systemübersicht stehen in der App.


### 7.95 · DAO-Delta-Scan transparenter
- Abgeschlossene Referral-/Flow-Scans werden als `incremental-delta` ausgewiesen. Ohne neuere Blocks (`upToDate: true`) wird der verifizierte Cursor nicht erneut geschrieben. Der erste Explorer-Seitenaufruf bleibt für den Sicherheits-Overlap notwendig.
- Historisch unvollständige Transaktionen bleiben im Modus `resume-history`; ein manueller Import verarbeitet weiterhin maximal eine Seite je Datenstrom.
- Kein Cron und keine automatische Reward-Freigabe.

### 7.96 · DAO-Reward-Bestandsaudit (nur lesend)
- Neuer manuell geschützter Edge-Function-Modus `audit-test-wallet` für die feste DAO1-Testwallet. Nur Benutzer mit Admin-UUID und `DAO_REWARD_ENABLE_TEST_INSPECT=true`.
- 395 Claim-Kandidaten (bzw. aktuelle tatsächliche Anzahl) nach tatsächlichem DB-Stand in getrennte Klassen: bereits kanonisch markiert, bewertet ohne separate Kennzeichnung, Null-/fehlende Rewards, fehlende historische Bewertung unter/über der exact-v13-Untergrenze. Ergebnis enthält Methodenverteilung und einzelne Ausnahmen.
- Wichtig: `canonical_existing_verified` ist eine **separate boolesche Spalte**, nicht `status='canonical_existing'`. Positive `claim_reward_aptm` und vorhandene USD-Bewertung sind noch kein gesonderter Auszahlungsnachweis.
- Die bestehende zentral verwendete `wallettracking_dao_apply_exact_target_anchors`-Funktion verlangt `block_number >= 88356`. Vier positiv bezifferte historische Claims (Blöcke 60731, 72665, 81698, 81700) liegen darunter. Keine neue/fiktive Preisquelle, kein Predecessor-Fallback, kein Umbewerten.
- Keine Datenmigration, keine automatischen Änderungen. DAO-Live-Worker und Cron bleiben aus.

### 7.97 · DAO-Claim-Abgleich vor Kennzeichnung
- Neuer nur lesender Admin-Testmodus `reconcile-test-wallet` trennt bestehende Markierungen, exakte Native-Payout-Nachweise, Token-Auszahlungen und fehlende Blockchain-Auszahlungsbelege. Kein automatisches Markieren der 288 USD-bewerteten Claims.
- Migration erweitert bestehende Klassifizierungs-RPC kontrolliert auf ältere Claim-Selektoren, **nur** bei exakter nativer Zahlung mit identischem Betrag und eindeutiger Transaktion. ERC20 und unvollständige Belege bleiben offen.
- `DAO_REWARD_ENABLE_LIVE_WORKER=false`, Cron aus. Keine Änderung der kanonischen Rewards, USD-Preise, NFT-Zuordnung und Wallet-Snapshots.

### 7.98 · Guarded DAO-Kennzeichnung (nur feste Testwallet)
- `mark-matched-existing-test-wallet` verlangt einen echten Admin-JWT, `DAO_REWARD_ENABLE_TEST_IMPORT=true`, deaktivierten Live-Worker und die erwarteten Zähler `expectedAlreadyMarked` / `expectedStrictMatches`.
- Neue DB-RPC zählt die tatsächlich streng belegten nativen Zahlungen innerhalb einer Transaktion, verlangt exakt die erwartete Anzahl und markiert nur bislang unmarkierte Kandidaten. Zählabweichungen verursachen kompletten Rollback; wiederholter Aufruf mit neuen Sollzahlen ist idempotent.
- Bei Ergebnis 284/100: `markedAfter=384`; die vier abweichenden sowie vier frühen unbewerteten und drei Null-Rewards bleiben unverändert. Kein Freigeben neuer Rewards.
- Automatischer DAO-Cron und Live-Worker bleiben deaktiviert.

### 8.01 · Dauerhafte Einordnung sehr früher DAO-Rewards
- Vier bekannte positive DAO1/APTM-Claims vor der verifizierten Preisgrenze (Apertum-Block 88'356) werden in einer separaten Kandidaten-Spalte als `unpriced_before_exact_anchor` erfasst. Ihre APTM-Mengen bleiben erhalten, USD bleibt unbekannt. Die Markierung bestätigt **keine** on-chain-Auszahlung und ist nicht `canonical_existing_verified`.
- Guarded, wiederholbare Migration: nur vier fest benannte Transaktionen, Abbruch bei unerwartetem Datenzustand. Keine Reward-Neuberechnung.
- Drei Null-Reward-Calls ohne erfasste Asset-Flows bleiben ungeklärt; erst Belegabgleich, keine vorschnelle Aussage „keine Auszahlung“.
- DAO-Live-Worker und Cron bleiben deaktiviert. Chrome/Apple-Passwörter-Autofill bleibt offen.
