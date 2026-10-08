# WalletTracking 7.38 · 05.10.2026 16:38:37 CEST

Prelaunch-Auszahlungen werden als „Prelaunch – kein historischer USD-Kurs“ separat ausgewiesen und nicht als offene USD-Preisfälle gezählt. Tokenmengen bleiben enthalten; vorhandene USD-Werte einschließlich 0 bleiben sichtbar. Kein zusätzlicher Blockchain-Abruf.

Legacy-Claim ohne Auszahlung als Prüfpunkt mit niedriger Priorität aufgenommen. Claim-Klassifizierung unverändert. Safari-/Brave-Spaltenanzeige bestätigt. Backup-Ablage mit Repository-Root-.gitignore ergänzt.

## Installation

Nur mitgelieferte Dateien ersetzen und veröffentlichen, danach Seite neu laden. Keine SQL-Migration, kein Edge-Deployment. Die Markdown-Datei im ZIP enthält diese Installationshinweise; die dauerhaften Angaben stehen in Systemdokumentation, DAO1-Hilfe und Admin-Dokumentation.

## Prüfung

Lokale Regressionstests: Prelaunch/Marktstartgrenze, APTM/wAPTM, Postlaunch-Missing, Nullwert, Filter-Summen und echte Renderer. Produktive Anzeige noch prüfen: die fünf alten Auszahlungen müssen als Prelaunch erscheinen und dürfen nicht mehr im Fehlpreis-Zähler stehen. Restore-Test zurückgestellt; persönliche Daten/Auth-Nutzer sind weiterhin nicht in der vorhandenen Sicherung enthalten.
