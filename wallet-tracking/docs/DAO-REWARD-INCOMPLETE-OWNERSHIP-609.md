# DAO Reward 6.09 – unvollständige historische NFT-Prüfung

## Fehler und Korrektur

Der bisherige Worker speicherte auch bei `pagination-incomplete`, `missing-history` oder `history-out-of-order` den Kandidaten endgültig als `unverified`. Das war keine belastbare Negativprüfung: Die Explorer-Historie kann vorübergehend unvollständig sein.

Neu schlägt der Prüflauf in diesen Fällen fehl, **bevor** der Kandidatenstatus geändert wird. Der Datensatz bleibt `pending`. Die bestehende Queue erfasst den Fehler und kann einen späteren Versuch ausführen; nach drei fehlgeschlagenen Versuchen ist an diesem Tag kein weiterer automatischer Versuch vorgesehen. Folgetage starten einen neuen Queue-Lauf. Andere eindeutige negative Nachweise bleiben `unverified`.

Keine neue Migration, keine Änderungen an Reward-Summen oder Wallet-Snapshots. Die Edge Function `dao-reward-refresh` weiterhin **nicht** deployen: vollständige Claim-Zuordnung, Referral-Verarbeitung, historische Preisbewertung und TLN/VOW fehlen nach wie vor.

## Lokale Tests

`node --test tests/dao-reward*.test.mjs tests/reward*.test.mjs`

## Weiter offen

- Explizite Wiederholungssteuerung und Fehlerdiagnose pro Kandidat, damit ein problematischer Kandidat nicht den kompletten Batch blockiert.
- Verifizierbare Blockfenster statt Explorer-Seiten als alleiniger Vollständigkeitsnachweis.
- Finale Claim-/Bot-/Referral-/Preis-Zuordnung, End-to-End-Test und separate TLN/VOW-Engine.
