# WalletTracking 6.09 – Wallet Daily: verlässlicher Portfolio-Abschluss

- Erfolgreiche Wallet-Bestände werden unabhängig von der Snapshot-Erstellung als `completed` gespeichert.
- Ein separater `wallettracking_daily_finalize` erzeugt erst dann einen Portfolio-Snapshot, wenn **alle** Wallets desselben Benutzers für denselben Schweizer Tag erfolgreich sind und aktuelle Cache-Daten haben.
- Ein fehlerhafter Snapshot-Abschluss wird in `wallet_daily_finalize_errors` mit verständlicher PostgREST-Fehlermeldung protokolliert und frühestens nach zehn Minuten erneut versucht.
- Nach Abschluss aller Wallets ruft der Worker die Finalisierung auf; bei leerer Wallet-Queue prüft er erneut auf ausstehende Portfolio-Abschlüsse.
- Die bestehende automatische Snapshot-Ansicht, der Historien-Trigger und die Aufbewahrung (7 Tage täglich, danach wöchentlich/monatlich) bleiben erhalten. Manuelle Snapshots werden nicht gelöscht.
- Erneute RPCs bleiben idempotent: Ein bereits für diesen Tag finalisierter Benutzer bekommt nicht noch einen Snapshot.
- Fehlgeschlagene Wallets (`failed` nach drei Versuchen) werden **nicht** als erfolgreich markiert. Ein neuer Versuch erfordert weiterhin eine kontrollierte Wiederholung; keine Daten werden als frisch ausgegeben, wenn sie es nicht sind.
- Historische Tage können aus dem aktuellen Wallet-Cache nicht zuverlässig nachgebildet werden; die Korrektur gilt ab Installation.

## Installation
1. ZIP in das Projekt einspielen.
2. SQL-Migration ausführen (eine Reihe DDL-Anweisungen, keine SELECT-Ergebnisse).
3. `wallet-daily-refresh` neu deployen.
4. Logs und `wallet_daily_finalize_errors` auf neue Fehler prüfen; Snapshot-/Historien-Stand ab der nächsten erfolgreichen Komplett-Aktualisierung überprüfen.

## Testgrenzen
Lokale strukturelle Tests sind kein Live-Test der Datenbank-Trigger und EVM-RPC-Anbieter. Der initiale Grund für die fünf Fehler vom 2. November bleibt unbekannt, da bisher nur `[object Object]` gespeichert wurde.
