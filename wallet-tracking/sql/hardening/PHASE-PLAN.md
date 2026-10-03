# Härtungsplan

Die produktiven Rechte werden in kleinen, getrennt testbaren Migrationen reduziert. Keine globale `REVOKE ALL`-Migration über sämtliche Tabellen.

## Stand

- **Migration A / SQL 084:** anonyme RPC-Ausführung härten. `PUBLIC`/`anon` verlieren direkten EXECUTE-Zugriff auf die geschützten Wallet-/Admin-RPCs; Browser-RPCs bleiben gezielt für `authenticated`, Backend-/Triggerpfade für `service_role`.
- **Migration B / SQL 085:** globale Stammdaten härten. `anon` verliert direkte Tabellen-/Sequenzrechte auf die neun reproduzierbaren globalen Stammdatentabellen. `authenticated` erhält nur SELECT plus die für Adminmasken tatsächlich benötigten DML-Rechte; RLS begrenzt diese Schreibrechte weiterhin auf Admins. `defi_staking_contracts` bleibt browserseitig read-only.
- **Migration C:** User-/Wallettabellen auf die exakt von ihren RLS-Policies benötigten Operationen begrenzen.
- **Migration D:** Cache-/Jobtabellen prüfen, Service-/RPC-Pfade schaffen und geeignete Tabellen erst danach in ein nicht exponiertes Schema verschieben.

## Testmatrix je Härtungsmigration

- Login: E-Mail/Passwort + Google
- Adminerkennung
- Walletliste / Wallet hinzufügen / löschen
- Dashboard + Preise
- Discovery + Safe/Spam
- 31.12.-Bestände
- Admin: Chains, DeFi-Projekte, DEX, vordefinierte Token, ESTV-Preise
- DAO1/APTMDAO/TLN-VOW relevante Tabs
- Chat/Benachrichtigungsstatus, sofern aktiv

## Stop-Regel

Bei jedem Block zuerst Code-/Policy-Abhängigkeiten prüfen, dann minimalen Grant setzen, Regressionstest durchführen und erst danach den nächsten Block härten. Interne Tabellen werden nicht allein aufgrund einer statischen Suche verschoben.
