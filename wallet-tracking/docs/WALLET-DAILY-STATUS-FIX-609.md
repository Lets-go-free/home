# WalletTracking 6.09 – Daily-Bestandsstatus (2026-11-02)

## Ursache
Der Bestandsjob schreibt abgeschlossene Wallet-Durchläufe in `wallet_daily_refresh_attempts`; die Dashboard-Aufgabe „Wallet(s) mit veraltetem Bestandsstand“ prüfte bisher ausschliesslich `wallet_refresh_state`, das nur der Browser-Refresh pflegt.

## Korrektur
Ein neuer SECURITY DEFINER-Read-RPC gibt authentifizierten Nutzern nur ihre heutigen Wallet-Job-Zustände zurück. Beim Laden von `wallet_refresh_state` gelten ausschliesslich **completed** Tagesjobs als erfolgreich geprüfte Bestände für die betreffenden Wallets/Chains. Fehlversuche und laufende Jobs werden niemals als erfolgreich markiert. Keine Speicherung von Wallet-Adressen in der neuen RPC-Ausgabe und keine direkte Leseberechtigung auf internen Jobtabellen.

Der angezeigte Datenstand-Zeitpunkt der Portfolio-Bestände stammt weiterhin aus dem tatsächlich gespeicherten automatischen Snapshot. Ein vollständig abgeschlossener Tageslauf erzeugt diesen über `wallettracking_daily_complete`. Bei Teilfehlern bleibt der vorherige Snapshot absichtlich erhalten. Eine aktuelle Prüfung ist daher nicht immer gleichbedeutend mit einem neuen Portfolio-Snapshot.

## Installation / Test
1. SQL-Migration `20261102185124_wallet_daily_visible_status_609.sql` ausführen (CREATE FUNCTION, REVOKE, GRANT; keine SELECT-Resultsets).
2. Webdatei `js/app.js` veröffentlichen und Cache/Seite vollständig neu laden.
3. Nach erfolgreichem Nachtjob im Dashboard prüfen: keine fälschliche Altbestandswarnung für `completed` Wallets; Details pro Wallet zeigen Prüfzeit.
4. Prüfen: Bei `failed`/`pending` bleibt die Warnung bestehen; Snapshot-Datenstand ändert sich nur, wenn `wallet_daily_refresh_completed` und der neue Snapshot erfolgreich angelegt wurden.

## Offen
Live-Supabase-RLS-Test, tatsächliche Queue-Resultate und vollständiger Snapshot-Abschluss bei 5 Wallets prüfen. Die DAO-Reward-Edge-Function weiterhin nicht deployen.
