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
