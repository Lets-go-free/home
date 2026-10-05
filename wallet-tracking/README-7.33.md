# WalletTracking · Phase 7.33

Stand: 05.10.2026 02:00:33 CEST · Build 20261005-020033

Partnernamen werden für DAO1/APTMDAO und TLN/VOW wieder über den Backend-Service-Zugriff gelesen und gespeichert. Verschlüsselung, User-ID-Bindung und getrennte Referenzen bleiben erhalten. TLN liest auch bei identischen ID-Zahlen keine DAO-Namen als TLN-Namen. Die TLN-Sammelspeicherung bewahrt DAO-Aliase und startet nur nach erfolgreichem Laden. Der DB-Verschlüsselungstest und dessen Cleanup sind ebenfalls auf den verifizierten User begrenzt.

## Installation

1. Zuerst `supabase/functions/wallet-private/index.ts` übernehmen und die Supabase Edge Function `wallet-private` neu deployen (z. B. `supabase functions deploy wallet-private` im verknüpften Projekt). Bestehende Secrets beibehalten.
2. Die enthaltenen Website-Dateien in ihren jeweiligen Verzeichnissen ersetzen.
3. Seite neu laden; in DAO1, APTMDAO und TLN/VOW einen Namen speichern, ändern, neu laden und löschen. Ein TLN-Update muss DAO-Namen erhalten.

Nur Website-Dateien hochzuladen reicht für diesen Backend-Fix nicht aus. Keine SQL-Migration erforderlich; Migration 087 bleibt bestehen.

## Prüfung

Lokaler Regressionstest mit echter AES-GCM-/HMAC-Verarbeitung und simulierten Datenbankrechten: Alias-CRUD für alle drei Namespaces, Trennung zweier Nutzer, manipulierte User-ID im Request, TLN-Sammelspeicherung einschließlich alter Clients, ungültige Referenzen, DB-Test und nutzerbegrenztes Cleanup. Tests enthalten keine echten Nutzerdaten. Ein produktiver Supabase-/Browsertest ist hier nicht möglich.

Regressionstest (Node 24): `node tests/private-aliases-regression.mjs` im wallet-tracking-Verzeichnis.
