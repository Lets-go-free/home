# Reward Daily Jobs – verifizierter Entwicklungsstand

## Bereits implementiert
- Getrennte Reward-Queue und DAO-Rohdatenimport (aus dem vorherigen Update).
- Eigenständige Server-Rohdaten-Cursor für DAO; keine Bewegung der Browser-/Claim-Cursor.
- Insert-only-Verhalten bei bereits gespeicherten Transaktionen und Flows.
- Beobachtende Verifizierung neu eingelesener DAO-Referral-Ereignisse nur anhand Wallet, Vertrag, wUSDT-Token und eingehendem Contract-Flow. Diese Zahl ist **keine** historische oder vollständige Reward-Summe; keine Claim-/Preis-Berechnung und keine Datenbank-Klassifizierung.

## Noch nicht implementiert – daher nicht produktiv aktivieren
- Vollständige Bot-Claim-Zuordnung samt NFT-Ownership, wAPTM-Nachzahlungen und historischen Preisen.
- Der vollständige DAO-Referral-Lifecycle inklusive bestehender/zeitlich entkoppelter Flows.
- Inkrementeller TLN/VOW Reward-Worker und zugehöriger Staking-/Referral-Lifecycle.
- End-to-End-Abgleich gegen die aktuelle Datenbank und die Blockchain.
- Erfolgreiche Produktionstests und Aktivierung der beiden Reward-Crons.

## Betrieb
**Die Funktion `dao-reward-refresh` noch nicht deployen und keinen Reward-Cron aktivieren.** Bestehende Browser-Reward-Verarbeitung unverändert lassen. Keine Reward-Snapshots erstellen. Zeitfenster (Europe/Zurich): Wallet 01:00–04:00, DAO 04:05–05:30, TLN/VOW 05:35–07:00.
