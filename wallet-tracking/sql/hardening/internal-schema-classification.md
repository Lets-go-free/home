# Cache-/Job-/Backend-Tabellen – Klassifizierung Phase 7.25

Stand: 04.10.2026. Grundlage: verifizierter Live-Snapshot, Produktions-JavaScript, Projektmodule und Supabase Edge Functions.

## Grundregel

Eine Tabelle wird **nicht** allein wegen ihres Namens `*_cache`, `*_state` oder `*_snapshot` in ein internes Schema verschoben. Vorher muss ausgeschlossen sein, dass Browsercode sie direkt ueber Supabase Data API benutzt. Ein nicht exponiertes Schema ist nur fuer Tabellen geeignet, die ueber Backend/RPC vollstaendig gekapselt sind.

## D1 – eindeutig backendvermittelt

Diese Tabellen werden im aktuellen Produktionscode nicht direkt vom Browser angesprochen:

- `security_crypto_tests` – ausschliesslich `wallet-private` mit Service-Role.
- `user_team_aliases_private` – ausschliesslich `wallet-private` mit Service-Role; Partnernamen bleiben serverseitig verschluesselt.
- `chat_notification_state` – bereits service_role-only seit Migration 086.
- `wallet_global_price_refresh_slots` – bereits service_role-only; Browser nutzt den geschuetzten RPC `wallettracking_claim_price_refresh_slot(...)`.

Migration 087 entfernt fuer die ersten beiden Tabellen die direkten Rechte von `anon` und `authenticated`. Ein Schema-Umzug erfolgt **noch nicht**, weil die Edge Function aktuell ueber Supabase/PostgREST auf `public` zugreift. Fuer ein nicht exponiertes Schema muss zuerst ein serverseitiger DB-/RPC-Pfad geschaffen werden.

## D2 – direkter Browserzugriff nachgewiesen, nicht verschieben

Trotz Cache-/Techniknamen werden diese Tabellen direkt aus Produktiv-/Projektcode verwendet und muessen vorerst exponiert bleiben:

- `tln_vow_staking_scan_cache`
- `tln_vow_technical_global_cache`
- `tln_wallet_identity_cache` (mindestens technische TLN-Test-/Nachweispfade; vor Umbau Produktionspfad separat pruefen)
- zahlreiche historische DEX-/Token-/LP-Caches, die der 31.12.-Workflow direkt liest/schreibt
- DAO1/APTMDAO-Cachetabellen, soweit Projektmodule sie dynamisch oder ueber gemeinsame Helfer verwenden

Fuer diese Tabellen gilt Least-Privilege + RLS statt blindem Schema-Umzug.

## D3 – keine aktuelle direkte Referenz gefunden: zuerst Retirement-/Abhaengigkeitsaudit

Unter anderem:

- `apertum_nft_history_coverage`
- `project_miner_ownership`
- `wallet_current_price_snapshots`

Keine direkte Referenz ist **kein** Loesch- oder Verschiebebeweis. Vor einer Aenderung muessen alte Module, Admin-/Testseiten, Trigger/RPCs und externe Jobs geprueft werden.

## Separat / nicht WalletTracking-Hauptapp

`tm_accounts`, `tm_trades`, `tm_wallet_transactions` werden nicht aufgrund dieser App-Suche gehaertet oder verschoben. Sie koennen von einem separaten Trading-/TagMarkets-Workflow verwendet werden und brauchen einen eigenen Audit.

## Naechster Architektur-Schritt

Fuer echte interne Tabellen wird ein nicht exponiertes Schema (z. B. `internal`) erst eingefuehrt, wenn alle Zugriffe ueber einen kontrollierten Backend-/RPC-Pfad laufen. Danach kann die Verschiebung tabellenweise mit Regressionstest erfolgen.
