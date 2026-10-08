# WalletTracking 7.39 · 05.10.2026 17:43:04 CEST

## Installation
Nur mitgelieferte Dateien ersetzen/veröffentlichen, Seite neu laden. Keine SQL-Migration, kein Edge-Deployment erforderlich.

## Backup ausführen
1. OrbStack starten.
2. Admin → Dokumentation → Datenbank-Backup-Helper herunterladen. Die Datei `_wt-db-backup.command` im lokalen `wallet-tracking`-Ordner speichern (das Update enthält sie bereits).
3. Doppelklicken. Der vorhandene Supabase-CLI-Link wird verwendet; keine Zugangsdaten im Browser.
4. Ausgabe unter `~/Documents/WalletTracking-Backups/<Zeitstempel>/`. Erfolg erst mit BACKUP-COMPLETE.txt und SHA256SUMS.txt; bei Fehlern bleiben klar ungeprüfte Teildateien.
5. Den ursprünglichen WALLET_ENCRYPTION_MASTER_KEY_V1 separat im geschützten Passwortmanager sichern. Den gesamten Backup-Ordner auf ein zweites geschütztes Medium kopieren. Nicht öffentlich hochladen.

Der Dump umfasst Anwendungsdaten und Auth-Nutzer inklusive Login-Identities, aber keine Secrets, Auth-Provider-Konfiguration oder Storage-Datei-Inhalte. Verwaltete Schema-Referenz ist kein blind ausführbarer Restore. Restore-Test bleibt zurückgestellt. Der tatsächliche Export auf dem Mac und die Schlüsselverfügbarkeit sind noch offen.

## Miner
Ursprüngliches Kaufdatum ausdrücklich sichtbar, auch im NFT-Tab. Fallback nur auf vorhandene alte Kaufnachweise; Upgrade-Datum separat. Fehlende Daten bleiben als Datum nicht ermittelt gekennzeichnet. Keine erfundenen Kaufdaten oder zusätzlichen Vollscans.

## Prüfung
Lokale Syntax-/Regressionstests und Backup-Fehlerfalltests mit simuliertem CLI. Kein Live-DB-Export und kein Restore hier ausgeführt.
