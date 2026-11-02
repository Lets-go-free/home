# DAO-Reward-Import 6.09 – fortsetzbarer Explorer-Scan

## Änderung

Der Rohdatenimport begrenzt jede Ausführung auf **acht Explorer-Seiten je Datenstrom** (Transaktionen und ERC-20-Flows). Bei längeren historischen Rückständen wird die Fortsetzungsposition als JSON in `project_scan_state.last_scan_message` des **eigenen serverseitigen Scan-Typs** gespeichert. Es ist keine neue Datenbanktabelle oder Migration nötig.

- `last_scanned_block` bleibt unverändert, solange noch weitere Seiten fehlen.
- Die nächste Explorer-Seitenposition und der höchste bisher beobachtete Block werden gesichert, **nachdem** alle Ereignisse dieser Seite und die DAO-Claim-Prüfkandidaten gespeichert sind.
- Beim nächsten Worker-Lauf beginnt der Import an dieser Position und schliesst den Cursor erst nach Abschluss aller Seiten ab.
- Bereits gespeicherte Rohdaten und Claim-Kandidaten werden durch `ignoreDuplicates` nicht überschrieben.
- Die kanonischen Browser-/Claim-Scan-Cursor werden weiterhin nicht angefasst.
- Historische NFT-Besitzprüfungen bleiben separat auf 20 offene Kandidaten pro Lauf begrenzt.

## Grenzen / Betrieb

Ein unvollständiger Rohdaten-Scan ist **kein** abgeschlossener Reward-Job. Die bereits bestehende Tages-Queue bleibt daher bei `staged`, während der Worker weiterhin bewusst nicht per Cron aktiviert wird. Die nächste planmässige Verarbeitung muss den gespeicherten Seiten-Checkpoint fortsetzen; die vollständige fachliche Claim-/Referral-/Preisbewertung bleibt separat zu implementieren.

**Vorsicht:** Explorer-Paginierung ist nicht dasselbe wie feste Blockfenster und kann sich bei neuen Transaktionen während eines historischen Scans verschieben. Die Einträge werden idempotent gespeichert, aber endgültige Vollständigkeit muss mit einem bestätigten Blockfenster beziehungsweise einem Chain-RPC-Abgleich verifiziert werden. Dies ist noch offen; der Worker bleibt deaktiviert.

## Test

`node --test tests/dao-reward-*.test.mjs tests/reward-*.test.mjs`

## Installation

Die geänderte Edge-Function-Datei und die Tests/Dokumentation ins Repository übernehmen. **Keine neue SQL-Migration.** `dao-reward-refresh` weiterhin **nicht deployen oder als Cron aktivieren**, da der vollständige Reward-Job noch fehlt.
