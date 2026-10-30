# WalletTracking 7.68 · Täglicher Wallet-Bestandsjob

Stand 29.10.2026. Dieses Update baut auf 7.67 auf. Vorhandene manuelle, historische und 31.12.-Snapshots werden nicht geändert.

## Funktionen und Grenzen

- Neue Supabase Edge Function `wallet-daily-refresh` scannt eine Wallet je Aufruf ab 03:00 Europe/Zurich. Das Cron-Schema startet den Job alle 5 Minuten; das ermöglicht Wiederaufnahme, ohne einen langen Browser-/Edge-Scan zu starten.
- Liest alle aktivierten Chains aus `public.chains`: sechs reguläre EVM RPC Chains (Ethereum, BSC, Polygon, Arbitrum, Base, Avalanche), Apertum/Blockscout, Bitcoin/Blockstream, XRP/XRPSCAN (nur natives XRP), Solana/Alchemy (zwei Token-Programme), Tron/TronGrid und Akash REST.
- EVM-Tokenliste aus `predefined_tokens` (aktiv, nicht historisch) plus benutzereigenen `safe_tokens`. Keine ungeprüfte Token-Discovery. Für Solana/Tron/Apertum ebenfalls ausschliesslich sichere Token.
- Liest und entschlüsselt Wallet-Adressen serverseitig mit unverändertem AES-256-GCM-/HKDF-Format und `WALLET_ENCRYPTION_MASTER_KEY_V1`. Keine Klartext-Walletadressen in Cache-Tabellen oder Logs.
- Preisstand stammt aus dem vorhandenen `wallet_global_current_price_snapshot` v6 (maximal 36 Stunden alt). Fehlt ein aktueller Kurs, wird `price_usd = NULL` und **nicht 0** gespeichert; der Tokenbestand bleibt korrekt.
- Backend-eigener, RLS-geschützter Zwischen-Cache dient nur der Wiederaufnahme einzelner Wallets. Erst wenn **alle Wallets eines Users** am gleichen Kalendertag erfolgreich gescannt wurden, schreibt die DB einen neuen vollständigen automatischen Portfolio-Snapshot in `snapshots` + `snapshot_items`. Das erfolgt innerhalb **einer** Datenbanktransaktion und mit demselben Advisory Lock wie der Browser.
- Fehlerhafte Provider-Abrufe überschreiben keinen bisherigen Snapshot. Drei Versuche je Wallet und Tag; Fehler bleiben in `wallet_daily_refresh_attempts` nachvollziehbar. Täglich neuer Versuch am nächsten Tag.
- Die vorhandenen **verifizierten LP-/Staking-Caches bleiben unverändert** und werden beim Browser-Start weiterhin in die sichtbaren Bestände eingeblendet. Der neue Tagesjob berechnet **nicht** die komplexe LP-/Staking-Discovery, keine NFT-Bestände, keinen TLN-Teamgraphen und keine Rewards neu; diese bleiben bei ihren bisherigen Aktualisierungswegen. Die staked Principal-Werte dürfen deshalb nicht als normale Wallet-ERC20-Balance doppelt gespeichert werden.
- Beim ersten Browser-Start pro Sitzung wird weiterhin der gespeicherte Bestand angezeigt und dann per Live-Prüfung überprüft (ab 7.66). Tabwechsel lösen keine erneute Gesamtabfrage aus.

## Installation (in dieser Reihenfolge)

1. Produktives Schema/Edge-Functions sichern (besonders `snapshots`, `snapshot_items`, `wallets`, `predefined_tokens`, `safe_tokens`; **niemals** `WALLET_ENCRYPTION_MASTER_KEY_V1` rotieren, solange alte Wallet-Daten damit verschlüsselt sind).
2. Die zwei SQL-Migrationen im Supabase SQL Editor **einzeln** vollständig ausführen:
   - `supabase/migrations/20261029_wallet_atomic_automated_snapshot.sql`: gemeinsame browserseitige, transaktionale Snapshot-Funktion.
   - `supabase/migrations/20261029_wallet_daily_refresh_server.sql`: Service-only Tabellen und DB-Funktionen für Claim/Retry/Finalize.
   Jede Datei enthält mehrere DDL-/Funktions-Statements, **aber keine mehreren eigenständigen SELECT-Resultsets**. Supabase meldet bei Erfolg üblicherweise `Success. No rows returned`.
3. Supabase Edge Function `wallet-daily-refresh` aus `supabase/functions/wallet-daily-refresh/index.ts` deployen. **JWT-Verifikation für diese Function ausschalten** (`--no-verify-jwt` beim CLI-Deployment), da ein separates langes Secret in `x-wallet-refresh-secret` die Cron-Aufrufe authentifiziert. Die Function antwortet ohne das korrekte Secret mit HTTP 401.
4. **Neuen** zufälligen 64-stelligen Hex-Wert in Supabase Edge Secrets als `WALLET_DAILY_REFRESH_SECRET` setzen. `WALLET_ENCRYPTION_MASTER_KEY_V1`, `SUPABASE_SERVICE_ROLE_KEY` und `ALCHEMY_API_KEY` müssen wie bisher serverseitig verfügbar sein. Secret **nicht** in GitHub/SQL-Dateien hinterlegen.
5. Im Supabase Vault **zwei eigene Secrets** anlegen:
   - `wallet_daily_refresh_url` = `https://<DEIN-SUPABASE-PROJEKT>.supabase.co` (ohne `/functions/v1`).
   - `wallet_daily_refresh_auth` = exakt derselbe neue Job-Secret-Wert wie `WALLET_DAILY_REFRESH_SECRET`.
6. Noch **keinen Cron aktivieren**. Manuellen Test mit einem einzelnen HTTP-Aufruf (siehe unten) ausführen, Antwort und Log prüfen. Wiederholen, bis alle Wallets vollständig sind und je User ein neuer automatischer Snapshot existiert. Bei einem Providerfehler **vorerst nicht** den Cron aktivieren; zuerst Ursache prüfen.
7. Erst nach erfolgreichem manuellen Test `supabase/migrations/20261029_wallet_daily_refresh_cron.sql` ausführen. Darin gibt es **genau eine eigenständige SELECT-Abfrage** (`cron.schedule`), die eine Job-ID zurückliefert; der übrige Teil ist ein DO-Block. Jobname `wallet-daily-refresh-5m`.
8. `index.html` und `js/app.js` veröffentlichen; im Browser frisch anmelden und prüfen, dass zuerst der Cache gezeigt und danach die Bestände einmal pro Sitzung live geprüft werden.

### Manueller Funktionsaufruf aus Supabase SQL Editor

**Eine Abfrage, ein Resultset** (die `request_id` ist noch keine Erfolgsmeldung der Function):

```sql
SELECT net.http_post(
 url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='wallet_daily_refresh_url') || '/functions/v1/wallet-daily-refresh',
 headers := jsonb_build_object('Content-Type','application/json','x-wallet-refresh-secret',
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='wallet_daily_refresh_auth')),
 body := '{"run_now":true}'::jsonb,
 timeout_milliseconds := 120000
) AS request_id;
```

**Eine Abfrage, ein Resultset** zum Nachsehen des wirklichen HTTP-Status:

```sql
SELECT id,status_code,content,error_msg,created
FROM net._http_response
ORDER BY created DESC LIMIT 5;
```

**Eine Abfrage, ein Resultset** für die Wallet-Verarbeitung:

```sql
SELECT scan_day,state,count(*) AS wallets,max(updated_at) AS letzte_aktualisierung
FROM public.wallet_daily_refresh_attempts
WHERE scan_day = (now() AT TIME ZONE 'Europe/Zurich')::date
GROUP BY scan_day,state ORDER BY state;
```

**Eine Abfrage, ein Resultset** zum Erkennen doppelter automatischer Snapshots:

```sql
SELECT user_id,count(*) AS anzahl
FROM public.snapshots WHERE is_automated=true
GROUP BY user_id HAVING count(*)>1;
```

Erwartung: HTTP 200 mit `ok:true`, `positions` und gegebenenfalls `finalized:true` erst beim letzten Wallet eines Users; keine doppelten automatischen Snapshots, keine `failed`-Einträge. Cron-Jobstatus `succeeded` bestätigt **nur die Planung/den HTTP-Auftrag**, nicht zwingend einen erfolgreichen Wallet-Scan.

## Sicherheitshinweis aus Archivprüfung

Die historische Migrationsdatei `20261028_tln_vow_trade_sync_cron.sql` enthielt einen Handelsjob-Secret im Klartext. Die Datei ist in diesem Update **redigiert**, nicht gelöscht. **Secret unbedingt rotieren** (`TRADE_SYNC_SECRET` in Edge Function und `tln_vow_trade_sync_auth` im Vault) und alte Git-Historie prüfen; nur das Entfernen aus der aktuellen Datei entwertet den früheren Schlüssel nicht.

## Lokale Prüfungen

Browser-JavaScript mit `node --check`; Edge-TypeScript mit Deno-/Supabase-Typ-Shims `tsc --noEmit`; Mock-Test für EVM-Balances, Preisübernahme, Providerfehler und Kryptografie-Interoperabilität bestanden. **Keine Live-Supabase-Ausführung/kein Provider-Livetest in dieser Umgebung:** deshalb erste Aktivierung über manuellen, beobachteten Test und Cron erst danach. Keine Aussage über alle Provider im Produktivnetz ohne diesen Retest.
