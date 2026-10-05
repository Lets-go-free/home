# WalletTracking 7.37
Stand: 05.10.2026 15:21:10 CEST · Build 20261005-152110

1. `sql/089-admin-master-data-export.sql` im Supabase SQL Editor vollständig ausführen. Die Datei enthält eine Transaktion und keine separaten Analyse-SELECTs.
2. Geänderte Webdateien veröffentlichen, Seite neu laden. Kein Edge-Deployment erforderlich.
3. Admin → Dokumentation → Export & Wiederherstellung: JSON/SQL-Stammdatenexport testen. Alle neun Tabellen müssen angezeigt werden.
4. Chains bei horizontalem Scrollen, Hell/Dunkel, Safari/Brave prüfen.

Release-Berichte 7.33–7.36 sind nach docs/releases kopiert. Nach Veröffentlichung können die alten README-7.33.md bis README-7.36.md im Root entfernt werden. polygon-rpc-test.html und README-polygon-rpc-test.md können entfernt werden. Das Update-ZIP löscht keine Dateien automatisch. TLN-Testdateien und tests/ bleiben erhalten.

Eine vollständige Restore-Automatik wird nicht behauptet: Struktur-Dump über lokalen CLI-Helper; frische DB/Edge/Auth/Storage und private Daten separat. Migration 089 und produktiver Export wurden hier nicht live ausgeführt. Verlorene Migrationen können ohne Git-Historie nicht rekonstruiert werden; vorhandene Baseline und alle SQL-Dateien bleiben erhalten.
