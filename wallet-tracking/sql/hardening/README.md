# Supabase-Härtung – Stand Phase 7.23

Stand: 04.10.2026, verifizierter Live-Snapshot `sql/baseline/verified/`.

## Ergebnis

Die Baseline ist strukturell reproduzierbar. Der Audit aus Phase 7.20 hat historisch zu breite Rechte sichtbar gemacht; seit Phase 7.21 werden diese Rechte in kleinen, getrennt testbaren Migrationen reduziert.

Verifiziert:

- 69 Tabellen im exponierten Schema `public`
- RLS ist auf allen 69 Tabellen aktiviert
- 218 Policies
- 17 Functions im Schema `public`
- 4 Trigger
- 60 Tabellen besitzen noch `GRANT ALL ... TO anon`
- 15 Sequenzen besitzen noch `GRANT ALL ... TO anon`
- 9 Functions besitzen noch `GRANT ALL ... TO anon`

RLS ist eine wichtige Schutzschicht, ersetzt aber keine minimalen SQL-GRANTs. Ein Client sollte nur die Operationen erhalten, die er tatsächlich benötigt.

## Höchste Priorität

### H1 – anonyme RPC-Ausführung reduzieren

Im Live-Snapshot sind folgende Functions für `anon` ausführbar:

- `current_user_is_admin()`
- `is_admin(uuid)`
- `mark_chat_read(uuid)`
- `tm_ist_admin()`
- `tm_ist_admin_email(text)`
- `wallettracking_claim_price_refresh_slot(text,text)`
- `wallettracking_delete_all_user_data()`
- `wallettracking_delete_wallet_complete(uuid,text)`
- `wt_tln_smartnode_graph_slice(text[],text,integer)`

Besonders Delete-/Mutation-RPCs sollen nach Funktionsprüfung nicht anonym ausführbar bleiben. Vor einem `REVOKE` wird geprüft, ob irgendein Pre-Login-Flow diese RPCs absichtlich verwendet.

### H2 – pauschale anonyme Tabellen-/Sequenzrechte entfernen

60 Tabellen und 15 Sequenzen besitzen noch `ALL` für `anon`. Die Anwendung ist inzwischen authentifizierungszentriert. Trotzdem werden diese Rechte nicht global in einer einzigen Migration entfernt: Wir reduzieren sie in Gruppen und testen Login, Walletimport, Discovery, Preise, DAO1/APTMDAO und Jahresenddaten nach jeder Gruppe.

### H3 – `authenticated` auf tatsächlich benötigte Operationen begrenzen

Viele Tabellen besitzen `ALL` für `authenticated`, obwohl ihre Policies nur `SELECT` oder einzelne Schreiboperationen erlauben. Zielzustand ist z. B. `SELECT` für globale Stammdaten, explizites `SELECT/INSERT/UPDATE/DELETE` nur bei userbezogenen Tabellen und `service_role` für echte Backend-/Jobtabellen.

## `public` vs. internes Schema

Eine statische Suche über die Browser-/Projekt-JavaScript-Dateien findet direkte Supabase-`.from(...)`-Zugriffe auf einen großen Teil der Tabellen. Solche Tabellen dürfen **nicht** einfach verschoben werden.

Nicht direkt per statischem `.from(...)` gefunden wurden unter anderem:

- `apertum_nft_history_coverage`
- `aptmdao_tree_graph_cache`, `aptmdao_tree_graph_state`
- `chat_notification_state`
- `dao1_old_tree_graph_cache`, `dao1_old_tree_graph_state`
- `defi_current_price_snapshots`
- `security_crypto_tests`
- `tln_vow_identity_global_cache`
- `tln_vow_smartnode_graph_state`
- `tln_vow_staking_scan_cache`
- `tln_vow_technical_global_cache`
- `wallet_current_price_snapshots`
- `wallet_global_current_price_snapshot`
- `wallet_global_price_refresh_slots`

Diese Liste ist **nur eine Kandidatenliste**. Dynamische Tabellennamen, RPC-Abhängigkeiten, Trigger und ältere Module müssen vor einer Verschiebung geprüft werden. Tabellen wie `wallets` oder Trading-Tabellen können ebenfalls indirekt/dynamisch verwendet werden und werden deshalb nicht allein aufgrund der statischen Suche klassifiziert.

## Empfohlene Umsetzung

1. **Migration A – sichere anonyme RPC-Härtung:** unnötiges `EXECUTE` für `anon` gezielt widerrufen.
2. **Migration B – globale Stammdaten:** `anon` entfernen; `authenticated` auf `SELECT` reduzieren; Admin-Schreibwege separat erhalten.
3. **Migration C – User-/Wallettabellen:** Grants exakt auf die bestehenden RLS-Operationen begrenzen.
4. **Migration D – Cache-/Jobtabellen:** Service-/RPC-Pfade schaffen und erst danach geeignete Tabellen in ein nicht exponiertes Schema verschieben.
5. Nach jeder Migration Regressionstest mit Admin + normalem User.

Keine dieser Migrationen ist in Phase 7.20 produktiv ausgeführt.


## Umgesetzte Härtungsmigrationen

### SQL 084 – anonyme RPC-Ausführung

Entfernt direkten `EXECUTE`-Zugriff von `PUBLIC`/`anon` auf die geschützten Wallet-/Admin-RPCs und vergibt nur die fachlich benötigten Rollenrechte neu.

### SQL 085 – globale Stammdaten

Betrifft exakt die neun globalen Stammdatentabellen des reproduzierbaren Seeds: `chains`, `defi_projects`, `defi_project_tokens`, `defi_staking_contracts`, `dex_configs`, `predefined_tokens`, `project_nfts`, `tax_asset_prices`, `tax_fx_rates`.

- `anon`: keine direkten Tabellen- oder zugehörigen Sequenzrechte.
- `authenticated`: `SELECT` auf allen neun Tabellen.
- Admin-Pflegewege erhalten nur die konkret benötigten `INSERT`/`UPDATE`/`DELETE`-Rechte; die bestehenden Admin-RLS-Policies bleiben entscheidend.
- `defi_staking_contracts` bleibt im Browser read-only.
- `service_role` bleibt unverändert.
- Keine Datenänderung, kein Schema-Move, keine RLS-Änderung.

Vor SQL 085 wurde der aktuelle Browsercode geprüft: Chain-Konfiguration und globale Stammdaten werden erst nach vorhandener Auth-Session geladen; ein Pre-Login-`anon`-Read dieser Tabellen ist nicht erforderlich.
