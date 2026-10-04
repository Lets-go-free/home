# Supabase-Härtungsaudit – Phase 7.27

Stand: 04.10.2026, verifizierter Live-Snapshot `sql/baseline/verified/`.

## Ergebnis

Die Baseline ist strukturell reproduzierbar; die Rechte stammen jedoch historisch aus mehreren Entwicklungsphasen und sind breiter als nötig. **Dieser Audit ändert keine produktiven Rechte.**

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

Stand der vorbereiteten Härtungsmigrationen:

- `084-hardening-anon-rpc-execute.sql` – Migration A, RPC-EXECUTE
- `085-hardening-global-master-data-grants.sql` – Migration B, globale Stammdaten
- `086-hardening-user-wallet-grants.sql` – Migration C, private User-/Wallettabellen

Migration C umfasst bewusst keine `tm_*`-Tabellen und keine globalen Cache-/Jobtabellen. Diese bleiben getrennte Prüfblöcke, damit keine andere Anwendung oder ein Backend-Job versehentlich beeinträchtigt wird.


## Phase 7.25 – Migration D1

Die Cache-/Job-Klassifizierung wurde gegen den gesamten Browser-/Projektcode und die Edge Functions nachgezogen. Wichtigster Befund: Mehrere technisch benannte Cachetabellen werden direkt im Browser benutzt und duerfen nicht blind in ein internes Schema verschoben werden.

`087-hardening-backend-mediated-grants.sql` entfernt deshalb zunaechst nur direkte Browserrechte auf zwei eindeutig backendvermittelte Tabellen: `security_crypto_tests` und `user_team_aliases_private`. `chat_notification_state` und `wallet_global_price_refresh_slots` sind bereits service-role-only. Details: `sql/hardening/internal-schema-classification.md`.


## Phase 7.26 – Retirement-/Altbestand-Audit

Nicht referenzierte Alt-/Übergangstabellen werden nicht blind gelöscht. Die statische Klassifizierung liegt in `retirement-audit.md`; `retirement-audit-live.sql` liefert read-only Zeilenzahlen und DB-Abhängigkeiten für die verbleibenden Kandidaten.


## Phase 7.27 – Retirement Migration 088

Nach Live- und Source-Audit werden `project_miner_ownership` und `wallet_current_price_snapshots` kontrolliert retired. `wallet_current_price_snapshots` war der alte userbezogene Tages-Preiscache und ist durch `wallet_global_current_price_snapshot` plus globalen 15-Minuten-Refresh-Slot ersetzt. Die Migration aktualisiert die beiden Delete-RPCs und nutzt `DROP ... RESTRICT` sowie Daten-/Zeitstempel-Guards, damit unerwartete Wiederverwendung den Drop stoppt. `apertum_nft_history_coverage`, `user_settings` und `tln_wallet_identity_cache` bleiben bestehen.
