# Verifizierte Live-Baseline

Quelle: produktive WalletTracking-Supabase-DB, read-only Export am 04.10.2026.

Verifikation:

- `historical_dex_pair_state_cache` aus Migration 080 vorhanden
- 69 `public`-Tabellen
- RLS auf allen 69 Tabellen aktiviert
- 218 Policies
- 17 `public` Functions
- 4 Trigger
- Supabase-Migrationshistorie leer

Die Dateien in diesem Ordner bilden den verifizierten technischen Ist-Stand ab. Sie sind **keine** Behauptung einer lückenlosen historischen Migrationskette.

Bei einer späteren Wiederherstellung muss zusätzlich die freigegebene Stammdaten-Baseline eingespielt werden. Produktive Userdaten gehören nicht in dieses Verzeichnis.
