# WalletTracking 7.42 · 06.10.2026 13:54:49 CEST

## Installation
1. `sql/090-account-delete-admin-guard.sql` im Supabase SQL Editor ausführen (bestehender Stand bis 089 vorausgesetzt).
2. Edge Function `wallet-private` mit der gelieferten `index.ts` neu deployen.
3. Gelieferte Frontend-Dateien ersetzen/veröffentlichen und Seite neu laden.
Keine Änderung am Verschlüsselungsschlüssel nötig.

## Verhalten
Unter Support & Info → Daten & Konto gibt es neben dem Datenreset jetzt „Konto endgültig löschen“. Bestätigung: KONTO LÖSCHEN plus Sicherheitsabfrage. Persönliche WalletTracking-Daten und Auth-Konto samt verknüpften Identitäten werden in einer gemeinsamen Datenbanktransaktion gelöscht. Ein Fehler rollt die DB-Änderungen zurück. Der Ziel-User kommt ausschließlich aus auth.uid(); ein fremder User kann nicht angegeben werden. Lokale Daten werden erst nach bestätigtem Abschluss entfernt.

Admin-Konten sind in der UI und serverseitig geschützt. SQL prüft Admin-UUID und ältere Admin-E-Mail-Zuordnungen vor jeder Änderung; eine gleichzeitige Admin-Zuweisung wird gesperrt. Der reine Datenreset bleibt für Admins verfügbar und erhält Adminrechte. Die Sperre gilt für die Anwendung und ihre Lösch-RPC, nicht für manuelle Eingriffe durch Datenbankbetreiber.

Globale öffentliche Blockchain-/Stammdaten bleiben bestehen. Bereits erstellte Backups werden nicht nachträglich verändert. Persönliche Storage-Dateien blockieren die Kontolöschung vor Änderungen und müssen zunächst entfernt werden; WalletTracking verwendet aktuell keinen persönlichen Datei-Upload.

Die Registrierung behauptet bei ausbleibender Sitzung weder „Konto erstellt“ noch eine versandte Mail. Bestehende Adressen können Anmelden oder Passwort vergessen verwenden.

## Test nach Installation
- Admin: Löschbutton verborgen, Hinweis sichtbar; Datenreset erhält Berechtigung. Ein direkter Aufruf der Kontolöschung muss ebenfalls abgewiesen werden.
- Normales Testkonto: zunächst abbrechen (Daten bleiben), dann endgültig löschen. Auth-User, Wallets und persönliche Daten müssen weg sein; Anmeldung mit dem alten Konto schlägt fehl. Danach lässt sich dieselbe E-Mail neu registrieren (Mailversand separat prüfen).
- Fehlende Migration/fehlgeschlagene Prüfung: Fehler sichtbar, kein erfolgreicher Abschluss behauptet.

Lokale Prüfungen: Edge- und UI-Regressionen einschließlich Admin-Sperre, fremder Ziel-ID, Abbruch, fehlgeschlagener Prüfung und bestätigtem Abschluss; bestehende Regressionen und Syntaxprüfung. SQL-Vertrag statisch geprüft; keine lokale PostgreSQL-Instanz und kein produktiver Löschtest verfügbar. Produktiver Test nach SQL/Edge-Installation erforderlich.

## Stand weiterer Punkte
Preise nach Aktualisierung ohne Seiten-Refresh vom User bestätigt. Referenzwallet gehört Michaela; 9 Miner im APTMDAO-Tree #7803 sichtbar, Trading-Bot-Zuordnung separat prüfen. Claim-Eintrag ohne Auszahlung bleibt niedrige Priorität. Backup/Schlüssel gesichert; Restore-Test weiterhin zurückgestellt.
