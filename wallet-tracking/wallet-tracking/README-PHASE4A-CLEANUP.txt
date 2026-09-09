WalletTracking – Phase 4a Cleanup

1. Zuerst `sql/032-private-cache-wallet-id-final-audit.sql` im Supabase SQL Editor ausführen.
2. Nur wenn `phase4a_cleanup_gate = PASS` und jede Tabellenzeile `cleanup_ready = PASS` zeigt:
   `sql/033-private-cache-wallet-address-cleanup.sql` ausführen.
3. Danach DAO1/Apertum, Liquidity Pools und Wallet-Lösch-/Neuladefunktionen testen.

Absichtlich nicht enthalten:
- tln_wallet_identity_cache
- tln_vow_staking_scan_cache
- year_end_positions
- snapshot_items

Diese Bereiche werden in Phase 4b/4c separat behandelt.
