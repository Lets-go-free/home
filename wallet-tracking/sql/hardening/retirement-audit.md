# Retirement-/Altbestand-Audit · Phase 7.27

Ziel dieses Audits ist **nicht** das sofortige Löschen alter Tabellen. Zuerst wird unterschieden zwischen aktivem Produktionspfad, backendvermitteltem Pfad, separatem Fremd-/Nebenprodukt und echtem Retirement-Kandidaten.

## Ergebnis der statischen Codeprüfung

### Behalten · produktiv nachgewiesen
Der überwiegende Teil der 69 `public`-Tabellen wird im aktuellen WalletTracking-Browsercode, in Projektmodulen oder Edge Functions direkt verwendet. Diese Tabellen sind **keine** Retirement-Kandidaten.

Zusätzlich ausdrücklich behalten:

- `wallet_global_price_refresh_slots` – wird indirekt über den geschützten RPC `wallettracking_claim_price_refresh_slot(...)` verwendet.
- `security_crypto_tests` und `user_team_aliases_private` – produktiver Zugriff über Edge Function `wallet-private`/Service-Role.
- `chat_notification_state` – backend/service-role-only.
- `tm_accounts`, `tm_trades`, `tm_wallet_transactions` – gehören erkennbar zu einem separaten TagMarkets-/Trading-Modul. Sie werden **nicht** aus WalletTracking heraus gelöscht oder gehärtet, bevor dieses Modul separat auditiert ist.

### Ergebnis nach Live-Audit

**Behalten:**
- `apertum_nft_history_coverage` – aktive NFT-Historien-Coverage; zuletzt am 01.10.2026 aktualisiert.
- `user_settings` – enthält noch Scam-/Auto-Load-Zustand; keine Löschung ohne separaten Funktionsaudit.
- `tln_wallet_identity_cache` – derzeit leer, aber weiterhin Test-/Nachweispfad und Wallet-Purge-Kompatibilität.

**Retired mit Migration 088:**
- `project_miner_ownership` – Live-Audit: 0 Zeilen; keine produktive Laufzeitreferenz, nur alte Purge-Kompatibilität.
- `wallet_current_price_snapshots` – alter userbezogener Tagescache für aktuelle Preise; nur zwei Altzeilen (14./19.09.2026), keine Trigger/RPCs/aktuellen Codezugriffe. Ersetzt durch `wallet_global_current_price_snapshot` plus 15-Minuten-Refresh-Slot.

Migration 088 besitzt Sicherheitsbremsen: Sie bricht ab, falls `project_miner_ownership` nicht mehr leer ist oder `wallet_current_price_snapshots` seit dem geprüften Altstand wieder beschrieben wurde.

### Test-/Diagnosepfad · separat prüfen
- `tln_wallet_identity_cache` wird derzeit in TLN-Test-/Nachweisseiten referenziert, nicht im normalen App-Pfad. Nicht löschen, solange die technische Teststrecke benötigt wird oder bis ein bestätigter Ersatz dokumentiert ist.

## Löschregel
Eine Tabelle darf erst entfernt werden, wenn alle vier Punkte erfüllt sind:

1. keine produktive Browser-/Edge-/RPC-Referenz,
2. keine DB-Abhängigkeit, die noch benötigt wird,
3. Live-Daten wurden geprüft und bei Bedarf migriert/archiviert,
4. Löschung erfolgt als eigene Migration mit nachvollziehbarem Rollback-/Archivhinweis.

Der read-only SQL-Check `retirement-audit-live.sql` liefert die dafür noch fehlenden Live-Fakten, ohne Daten zu verändern.
