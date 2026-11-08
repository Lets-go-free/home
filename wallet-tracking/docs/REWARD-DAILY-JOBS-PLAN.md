> Live-Nachtrag 8.07 · 08.11.2026 22:23:00 CET: zwölf Apertum-ERC20-/LP-Token mit 18 technischen Dezimalstellen und unveränderten Anzeige-Einstellungen per Edge-Antwort und Live-SQL bestätigt. Zehn NULL-Werte ergänzt; natives APTM bleibt 18, ERC20-Prüfstatus dort nicht anwendbar. Andere Chains/eigene sichere Token neu als offener Umfang gemeldet; Bestandsdiagnose vor weiterer Umsetzung. Kein Cron. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Aktuell 8.07 (08.11.2026 22:13:03 CET): technische Apertum-Decimale zentral aus Explorer ergänzen und wiederverwenden; keine per-Claim-RPC-Pflicht bei vorhandenem gültigem Wert. Konflikte erhalten Originalwerte und blockieren. Anzeige-Einstellungen unverändert. 8.06 installiert, Leerlauf live bestätigt; zehn technische NULL-Felder live ermittelt. 208 lokale Tests plus vier Preis-/Dashboard-Skripte bestanden; 8.07-Live-Abruf noch offen. Kein Cron. Führend: docs/PROJECT_STATUS_OPEN_ITEMS.md und docs/releases/8.07-apertum-central-token-decimals.md. Die folgenden Angaben dokumentieren frühere Entwicklungsstände.

> Zusatz 8.06 (08.11.2026 21:45:35 CET): bekannter ERC20-Einzel-Claim-Pfad, historische technische Decimale, gemeinsame Asset-/Quote-Regel für Browser/Worker und TX-begrenzte kanonische Preise implementiert. 198 lokale DAO-/Reward-Tests plus vier Preis-/Dashboard-Skripte bestanden, neue Live-Prüfung offen. Referral/Gesamtqueue nicht freigegeben, Cron aus. Aktuell: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.05 (08.11.2026 13:25:24 CET): kontrollierter nativer Einzel-Claim-Pfad mit einer Import-Seite pro Strom, höchstens einem Kandidaten, gemeinsamer TX-begrenzter Ankernutzung, atomarer kanonischer Speicherung und wiederaufnehmbaren Blockierungsgründen. 173 lokale Tests inkl. PostgreSQL, Live-Lauf offen. Tagesqueue/Gesamtpipeline/Cron nicht freigegeben. Aktueller Status: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.04 (08.11.2026 13:02:39 CET): begrenzter service-only Admin-Prüfpfad für vier positive native Payouts ohne USD-Voraussetzung implementiert, atomare Payout-/History-Persistenz und exakte 1000-Wei-Grenze. 151 lokale Tests bestanden; neue Live-Prüfung offen, kein Cron. Aktuell: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Zusatz 8.03 (08.11.2026 12:41:04 CET): 8.02-Migration und Deployment erfolgreich, erster Drei-TX-Test blieb wegen fehlerhaft erwarteten status-Felds bei needs_review. Internal-Prüfer akzeptiert nun boolesches success=true; 137 lokale Tests bestanden. Erneute Live-Prüfung offen, kein Cron. Aktueller Status: docs/PROJECT_STATUS_OPEN_ITEMS.md.

> Aktueller Zusatz 8.02 (08.11.2026 11:16:25 CET): Payout-Prüfung unterstützt jetzt `no_payout_evidence` mit TX-lokaler vollständiger Explorer-Prüfung, dauerhaftem Prüfprotokoll und 24h-Revalidierung. Auszahlung unabhängig vom NFT-/Preisstatus. Pending-Payout-Reste setzen die Queue fort. Vollständige Reward-Pipeline und Live-Abnahme bleiben offen, DAO-Cron aus. Aktueller Status: `docs/PROJECT_STATUS_OPEN_ITEMS.md`; Details: `docs/releases/8.02-dao-no-payout-evidence.md`. Die nachstehenden früheren Angaben sind historischer Entwicklungsstand.

# Reward-Jobs – Sicherheitsstatus 2026-11-01

## Produktionsstatus
- Wallet-Bestandsjob: eigenes Zeitfenster 01:00–04:00 Europe/Zurich (Update 1).
- DAO1/APTMDAO Rewards: Zeitfenster 04:05–05:30, **nicht produktiv aktiviert**.
- TLN/VOW Rewards: Zeitfenster 05:35–07:00, **noch kein vollständiger Worker**.
- Keine Reward-Snapshots. Transaktionshistorie sowie Jahres- und Totalsummen sind weiterhin kanonisch.

## Technische Korrektur im vorliegenden Paket
Der erste DAO-Staging-Worker nutzte die gleichen `project_scan_state.scan_type`-Werte wie die produktive Browser-Discovery (`transactions_wallet_v1`, `token_flows_wallet_v2`). Dies ist gefährlich, weil er nur rohe Ereignisse importiert und **keine** vollständige Claim-/Bot-/Referral-Auswertung durchführt. Der Staging-Worker verwendet jetzt **eigene** Cursor:

- `reward_server_raw_transactions_v1`
- `reward_server_raw_flows_v1`

Damit kann ein späterer Testimport nicht die Browser-Discovery-Cursor nach vorne verschieben. Zusätzlich werden native APTM-Werte bei bereits dezimal gelieferten Explorer-Daten nicht nochmals um 10^18 geteilt. Keine weitere SQL-Migration notwendig für diese reine Worker-Korrektur.

## Verbindliche noch offene Implementierung vor Produktionsfreigabe
1. DAO: Native APTM-Claims sowie ERC-20-Claim-Payouts korrekt klassifizieren, Bot/NFT-Zuordnung einschließlich alte/neue DID-Regel und manueller Review-Status, Referral-Rewards sauber getrennt auswerten und historical-USD-Bewertung nur für neue Ereignisse nachziehen.
2. Auf kanonische DAO-Cursor erst umstellen, wenn **alle** Verarbeitungsschritte atomar oder wiederholbar und erfolgreich beendet wurden. Regression gegen vorhandene 9 Mining-/1 Trading-Testkonstellation.
3. TLN/VOW: Contract-/Staking-/Referral-Erkennung als serverfähiges Modul aus der bestehenden Discovery ausgliedern, Delta-Scan mit Overlap, geänderte Positionen gezielt neu berechnen, Legacy-Proofs erhalten.
4. Idempotenz, Rate-Limits, Overlap/Reorgs, Queue-Leases, Encryption, fehlende Preisquellen und Fehler-Wiederanlauf real testen.
5. Erst dann die beiden unabhängigen Edge Functions deployen und die jeweiligen Cron-Jobs aktivieren.

**Ausdrücklich:** Vorliegendes Paket ist ein Sicherheitsfix des Staging-Workers, **kein fertiger Reward-Job**. `dao-reward-refresh` weiterhin nicht deployen/aktivieren; TLN-Cron ebenfalls nicht einrichten.

## Update 6.09 – Schutz vorhandener Reward-Anreicherungen
Der DAO-Staging-Import liest vor jedem Upsert vorhandene Zeilen anhand des kanonischen TX-/Flow-Schlüssels und behält bereits persistierte Klassifikation, NFT-/Bot-Zuordnung, Claim-/Referral-Information und historische Preise bei. Nur fehlende Rohdatenfelder werden ergänzt. Dies verhindert, dass ein später Test des Rohimporters die bereits ausgewerteten Rewards des bestehenden Browsers auf Nullwerte zurücksetzt.

**Nicht produktionsfreigegeben:** Der Read-then-Upsert-Schutz ist keine transaktionale Garantie gegen parallel laufende Browser-Jobs. Dafür benötigt die finale Version eine atomare SQL-Merge-Operation bzw. eigene Roh-Tabellen. Die DAO-Claim-/Referral-Anreicherung und der TLN/VOW-Worker fehlen weiterhin. Der Worker darf deshalb noch nicht deployt oder per Cron aktiviert werden.

## Sicherheitskorrektur – Insert-only Import
Der bisherige Read-then-Upsert-Ansatz wurde durch `onConflict` mit `ignoreDuplicates:true` ersetzt. Bei paralleler Browser-Anreicherung werden vorhandene Reward-Klassifikationen, USD-Preise und Bot-IDs nicht mehr vom Staging-Worker geschrieben. Neue Rohdatensätze werden weiterhin angelegt. Nachteil: Bereits vorhandene unvollständige Rohdaten werden vom Staging-Worker nicht nachgebessert; das bleibt Aufgabe der kanonischen DAO-Discovery. Self-Transfers nutzen dieselbe Richtung `intern` wie der Browser und dadurch denselben `flow_key`. Die bestehende eindeutige Constraint `(user_id,project_key,chain_key,wallet_id,flow_key)` wurde im Schema-Baseline geprüft.

**Keine Produktionsfreigabe:** Worker führt weiterhin nur Rohdatenimport durch. Ein kanonischer inkrementeller Reward-Job mit vollständiger Claim-/NFT-/Referral-Erkennung ist nicht fertig.
