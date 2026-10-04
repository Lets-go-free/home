# Retirement-/Altbestand-Audit · Phase 7.26

Ziel dieses Audits ist **nicht** das sofortige Löschen alter Tabellen. Zuerst wird unterschieden zwischen aktivem Produktionspfad, backendvermitteltem Pfad, separatem Fremd-/Nebenprodukt und echtem Retirement-Kandidaten.

## Ergebnis der statischen Codeprüfung

### Behalten · produktiv nachgewiesen
Der überwiegende Teil der 69 `public`-Tabellen wird im aktuellen WalletTracking-Browsercode, in Projektmodulen oder Edge Functions direkt verwendet. Diese Tabellen sind **keine** Retirement-Kandidaten.

Zusätzlich ausdrücklich behalten:

- `wallet_global_price_refresh_slots` – wird indirekt über den geschützten RPC `wallettracking_claim_price_refresh_slot(...)` verwendet.
- `security_crypto_tests` und `user_team_aliases_private` – produktiver Zugriff über Edge Function `wallet-private`/Service-Role.
- `chat_notification_state` – backend/service-role-only.
- `tm_accounts`, `tm_trades`, `tm_wallet_transactions` – gehören erkennbar zu einem separaten TagMarkets-/Trading-Modul. Sie werden **nicht** aus WalletTracking heraus gelöscht oder gehärtet, bevor dieses Modul separat auditiert ist.

### Retirement-Kandidaten · noch NICHT löschen
Im aktuellen produktiven WalletTracking-Code wurde keine direkte Laufzeitreferenz gefunden für:

- `apertum_nft_history_coverage`
- `project_miner_ownership`
- `user_settings`
- `wallet_current_price_snapshots`

Mögliche Nachfolger sind fachlich erkennbar (`project_nft_ownership`, `user_ui_preferences`/`wallet_refresh_state`, globale Preis-Snapshots), aber daraus folgt **noch keine Löschfreigabe**. Vor einer Entfernung müssen Live-Zeilenanzahl, letzte Nutzung, DB-Abhängigkeiten und ggf. historische Datenmigration geprüft werden.

### Test-/Diagnosepfad · separat prüfen
- `tln_wallet_identity_cache` wird derzeit in TLN-Test-/Nachweisseiten referenziert, nicht im normalen App-Pfad. Nicht löschen, solange die technische Teststrecke benötigt wird oder bis ein bestätigter Ersatz dokumentiert ist.

## Löschregel
Eine Tabelle darf erst entfernt werden, wenn alle vier Punkte erfüllt sind:

1. keine produktive Browser-/Edge-/RPC-Referenz,
2. keine DB-Abhängigkeit, die noch benötigt wird,
3. Live-Daten wurden geprüft und bei Bedarf migriert/archiviert,
4. Löschung erfolgt als eigene Migration mit nachvollziehbarem Rollback-/Archivhinweis.

Der read-only SQL-Check `retirement-audit-live.sql` liefert die dafür noch fehlenden Live-Fakten, ohne Daten zu verändern.
