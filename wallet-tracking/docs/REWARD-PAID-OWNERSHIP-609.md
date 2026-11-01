# WalletTracking 6.09 – DAO Reward-Evidenz, 2026-11-01

## Ergänzung
Der DAO-Staging-Worker verknüpft für neue Claim-Transaktionen eine eindeutige historische ERC-721-Besitzprüfung mit einem belegten positiven eingehenden Auszahlungs-Flow der **gleichen** Transaktion. Nur dann erhöht er den neuen Diagnosezähler `ownedAndPaidClaimsObserved`. Bei fehlender oder mehrdeutiger Evidenz erfolgt keine Zuordnung.

## Ausdrückliche Grenzen
- Nur Beobachtungs-/Diagnosewert, keine Speicherung in `claim_nft_id` und keine neue Reward-Summe.
- Ein indirekter ERC-20-Payout über andere Verträge wird in dieser konservativen Prüfung nicht bestätigt.
- Ein gezählter Claim ist noch nicht vollständig nach der kanonischen NFT-/Bot-/DID-Logik bewertet.
- Native und ERC-20-Ereignisse können auf verschiedenen Scan-Seiten liegen. Die Beobachtungszählung umfasst nur die aktuellen laufenden Verarbeitungspuffer und ist **keine** vollständige Summenrechnung.
- Unvollständig: historische Preisermittlung, separate Referral-Klassifizierung, TLN/VOW-Rewards, DB-End-to-End-Test.
- `dao-reward-refresh` **nicht** deployen / keinen Cron einschalten.

## Prüfung
`node tests/dao-reward-paid-ownership.test.mjs`
`node tests/dao-reward-historical-ownership.test.mjs`

19 lokale Assertion-Fälle bestanden; keine reale Supabase-Verifikation.
