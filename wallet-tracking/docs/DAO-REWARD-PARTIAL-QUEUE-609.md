# DAO reward import: fortsetzbare Job-Queue (6.09)

## Änderung
- Erfolgreich verarbeitete Seiten mit weiter offenem Explorer-Checkpoint oder ausstehender historischer NFT-Prüfliste wechseln auf `partial`.
- `partial` kann vom bestehenden 5-Minuten-Claim erneut gewählt werden. Nach erfolgreich verarbeitetem Abschnitt wird das Fehlversuchsbudget zurückgesetzt; fehlgeschlagene Abschnitte bleiben auf drei Versuche beschränkt.
- Erst wenn beide Rohdatenströme vollständig sind und keine historischen Prüfungen mehr ausstehen, wechselt der Import auf `staged`.
- `staged` bedeutet **nicht** fertig klassifizierte Rewards. Der Worker bleibt ohne Cron und ohne Deploy.

## Installation
1. Update-Dateien ins Repository einspielen.
2. SQL-Migration `20261102184148_reward_partial_continuation_609.sql` im SQL Editor ausführen. Die Migration hat kein SELECT-Resultset.
3. `dao-reward-refresh` weiterhin nicht deployen. Keinen Reward-Cron einrichten.

## Einschränkungen
- Noch keine festen, quellseitig eingeschränkten Blockintervalle, historische Preisbewertung oder vollständige Claim-/Referral-Zuordnung.
- Keine Live-/End-to-End-Prüfung. Lokale Struktur- und Regressionstests sind kein Nachweis der korrekten Blockchain-Vollständigkeit.
