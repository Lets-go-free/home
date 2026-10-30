# WalletTracking 7.69 – VOW/v$ Handelscache aufholen

Nur geänderte Dateien enthalten. Kein Eingriff in den Wallet-Tagesjob.

## Installation – Reihenfolge zwingend

1. ZIP ins lokale Repository entpacken. Noch nicht die neue Edge Function aufrufen.
2. `supabase/migrations/20261030_tln_vow_trade_catchup_769.sql` vollständig **einmal** im Supabase SQL Editor ausführen. Sie enthält mehrere DDL/DO-Anweisungen und **einen SELECT**, der die neue Cron-Job-ID ausgibt. Der alte 30-Minuten-Job wird entfernt. Secrets bleiben unverändert.
3. `supabase/functions/tln-vow-trade-sync/index.ts` vollständig in Supabase Edge Functions unter **tln-vow-trade-sync** deployen. Verify JWT with legacy secret bleibt OFF; das bestehende `TRADE_SYNC_SECRET` wird weiterhin geprüft.
4. Website veröffentlichen (index.html und projects/tln-vow/tln-vow.js). Version 7.69 prüfen.
5. Den neuen Job kontrollieren: `SELECT jobid,jobname,schedule,active FROM cron.job WHERE jobname LIKE 'tln-vow-trade-sync%';` Erwartet: genau eine Zeile, `tln-vow-trade-sync-5m`, `1-59/5 * * * *`, `true`.
6. Den nächsten HTTP-Job-Lauf über `net._http_response` kontrollieren; echte Verarbeitung erfordert `ok:true` und pro Chain `lagBlocks` fallend.
7. Query für echte Rückstände: `SELECT chain_key,last_scanned_block,latest_observed_block,latest_observed_block-last_scanned_block AS rueckstand_bloecke,latest_observed_at FROM public.tln_vow_trade_scan_state WHERE group_key='alchemy:transfers-v1' ORDER BY chain_key;`

## Technische Grenzen

BSC: maximal 3 Fenster à 1'200 Blöcke pro Aufruf, mit Zeitbudget zwischen Fenstern. ETH: maximal 2 Fenster à 180 Blöcke. Nach **jedem** vollständig gespeicherten Fenster wird der Checkpoint fortgeschrieben. Ein fehlerhaftes Fenster verändert seinen Checkpoint nicht. Ein HTTP 200/aktuelles `updated_at` allein bedeutet nicht vollständige Chain-Abdeckung. Bei vielen Transfers oder Alchemy-Limits können Aufholfenster scheitern; in diesem Fall Fehlermeldung prüfen, nicht den Checkpoint manuell vorstellen.

Der Handelsscanner entdeckt bestätigte V2/V3-Swap-Logs in Transaktionen, die Transfers der definierten VOW/v$-Contracts enthalten. Er ist **kein** universeller Index sämtlicher möglicher DEX-Wege. Auch nach vollständiger Checkpoint-Aufholung sollten beobachtete Trades stichprobenweise gegen Explorer geprüft werden.
