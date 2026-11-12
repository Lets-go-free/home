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
