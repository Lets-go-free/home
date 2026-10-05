# WalletTracking · Phase 7.36

Stand: 05.10.2026 14:08:37 CEST · Build 20261005-140837

## Korrekturen

Die zentrale Aktualisierung lief bereits als runDataJob. DAO1/APTMDAO reihte danach Team-Unterjobs über dieselbe serielle Warteschlange ein und wartete auf sie. Die Unterjobs konnten erst nach dem wartenden Hauptjob starten: Deadlock.

Der zentrale Aufruf verwendet jetzt den expliziten Scope withinDataJob=true. runDailyDeltaRefresh führt beide Team-Core-Schritte dann unmittelbar im Hauptjob aus. Standalone-Tagesläufe und separate Admin-Team-Aktionen behalten die bisherigen seriellen Wrapper und In-Flight-Deduplizierung. Die globale Warteschlange wird nicht pauschal für parallele Jobs geöffnet.

Kritische Admin-Chain-Spalten behalten wieder dezente orange Zellhintergründe und orange Überschriften. Die am Ende definierten spezifischen Regeln greifen auch gegen spätere allgemeine Tabellen-, Sticky- und Hover-Regeln. Opaque Hintergründe für fixierte Zellen vermeiden durchscheinende Inhalte. Eigene Farben für Hell-/Dunkelmodus. Vorhandene critical-Klassifikation (Chain-Key, Wallet-Typ, EVM Chain-ID, Explorer, RPC-/Provider-/Discovery-Felder usw.) und Hinweistext bleiben erhalten.

Hilfe, DAO-Hilfe, Systemübersicht und Ideen/Umbau wurden mitgeprüft/aktualisiert. Keine Änderung an Auth oder produktiven RPC-Stammdaten. Polygon-dRPC wurde vom User separat in Admin → Chains eingetragen; Speicherung und kompletter Realtest stehen zur Bestätigung aus.

## Installation und Test

Nur die gelieferten Dateien im vorhandenen wallet-tracking-Verzeichnis ersetzen/veröffentlichen. Seite neu laden (beendet den alten festhängenden Lauf), gegebenenfalls erneut anmelden, dann „Daten aktualisieren“. Erwartung: zentraler Lauf beendet sich nach beiden Team-Schritten; kein vorzeitiger Abschluss. Danach Admin → Chains in Hell/Dunkel und bei Hover/horizontalem Scrollen prüfen. Keine SQL-Migration und kein Edge-Deployment erforderlich.

Lokale Tests: echter runDataJob zusammen mit echten DAO-Team-Wrappern und runDailyDeltaRefresh, simulierte DB-/Chain-Core-Antworten. Beide Trees schließen ab, unabhängiger Teamjob wartet hinter Hauptjob, Fehler gibt Queue frei und Folgelauf funktioniert. Bestehende RPC/Refresh/Snapshot-, Mining-Upgrade- und Alias-Regressionsprüfungen. JS-Syntax und ZIP-Struktur geprüft.

Eine visuelle Browserprüfung war hier mangels installiertem Chromium nicht möglich; CSS-Kaskade anhand der spezifischen Selektoren geprüft. Produktiver Supabase-/Walletlauf und Monica-Kontrollwallet weiterhin offen.

Separater Befund aus User-Konsole: Supabase auth/v1/token?grant_type=refresh_token HTTP 400. Die genaue Antwort fehlt; Ursache wird nicht als Tokenablauf geraten. Falls er erneut erscheint, Antworttext prüfen. Diese Korrektur behebt den verifizierten Queue-Deadlock, nicht einen unbestätigten Auth-Fehler.
