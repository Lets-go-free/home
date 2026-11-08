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
