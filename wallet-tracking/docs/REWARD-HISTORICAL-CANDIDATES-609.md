# DAO Reward-Worker 6.09 – historische NFT-Kandidaten

- `knownWalletNfts` liest zusätzlich zu aktuellen `nft_cache`-Einträgen die bestehenden `project_nft_ownership`-Zeilen für User, Wallet und DAO-Projekt.
- Historische NFTs dienen ausschliesslich als Kandidaten für die nachgelagerte on-chain-Besitzprüfung. Sie werden nicht automatisch als Claim-NFT gespeichert.
- Identische numerische NFT-IDs aus unterschiedlichen Contracts bleiben mehrdeutig und werden ausgeschlossen.
- Die bestehende Claim-/Preis-Anreicherung, Reward-Summaries und Browser-Scan-Cursor bleiben unverändert.
- Der Server-Worker bleibt ein Staging-Worker ohne produktive Cron-Freigabe.
- Lokale Tests: `node tests/dao-reward-historical-candidates.test.mjs`, `node tests/dao-reward-historical-ownership.test.mjs`, `node tests/dao-reward-paid-ownership.test.mjs`.
- Noch offen: vollständig verifizierte Claim-Parameter, transaktionale Persistenz, einheitliche historische Preisbewertung, vollständige Referral-Bewertung, TLN/VOW-Worker, Datenbank-/Blockchain-End-to-End-Test.

## Sicherheitskorrektur 02.11.2026 – Verifikationsbudget und Cursor

- Bei mehr als 20 historischen NFT-Claim-Kandidaten stoppt der Rohdaten-Scan mit einem expliziten Fehler, **bevor** `reward_server_raw_transactions_v1` fortgeschrieben wird. Die bisherigen, insert-only importierten Rohdaten bleiben erhalten und sind bei Wiederholung dedupliziert.
- Wichtig: Das schützt vor stillem Überspringen, löst aber die Verarbeitung grosser historischer Rückstände noch **nicht**. Bei dauerhafter Budgetüberschreitung ist vor Aktivierung ein blockbereichsbasiertes Backlog-Verfahren erforderlich.
- Es gibt weiterhin keine automatisch gespeicherten Bot-/Claim-Zuordnungen oder Reward-Bewertungen, keine Cron-Freigabe und keine Änderung am Wallet-Bestandsjob.
- Regressionstest: `node tests/dao-reward-historical-budget.test.mjs`.
