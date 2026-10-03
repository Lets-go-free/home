# Härtungsplan

Phase 7.20 war Audit-only. Phase 7.21/7.23/7.24 liefern die getrennten Migrationen A/B/C; jede wird einzeln ausgeführt und regressionsgetestet.

## Testmatrix je Härtungsmigration

- Login: E-Mail/Passwort + Google
- Adminerkennung
- Walletliste / Wallet hinzufügen / löschen
- Dashboard + Preise
- Discovery + Safe/Spam
- 31.12.-Bestände
- DAO1/APTMDAO/TLN-VOW relevante Tabs
- Chat/Benachrichtigungsstatus, sofern aktiv

## Stop-Regel

Keine globale `REVOKE ALL`-Migration über alle Tabellen. Bei jedem Block zuerst Code-/Policy-Abhängigkeiten prüfen, dann minimalen Grant setzen, Regressionstest durchführen und erst danach den nächsten Block härten.


## Stand Phase 7.24

- Migration A / SQL 084: anonyme RPC-Ausführung härten.
- Migration B / SQL 085: globale Stammdaten auf Least Privilege.
- Migration C / SQL 086: private User-/Wallettabellen auf RLS-passende DML-Rechte begrenzen; `anon` vollständig entfernen.
- Migration D bleibt offen: Cache-/Jobtabellen und mögliche Verschiebung in ein nicht exponiertes Schema.

Migration C lässt `service_role` unverändert und fasst `tm_*` bewusst nicht an. `chat_notification_state` hat keine Browser-RLS-Policy und bleibt deshalb service_role-only.
