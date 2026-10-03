# Härtungsplan

Phase 7.20 ist Audit-only. Für produktive Änderungen werden getrennte Migrationen erstellt und einzeln getestet.

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
