# WalletTracking 7.74 – automatischer Bestandsverlauf

## Installation
1. Update-ZIP ins lokale Repository entpacken; vorhandene Dateien ersetzen.
2. **Vor dem Website-Deployment** im Supabase SQL Editor die gesamte Datei `supabase/migrations/20261101101907_wallet_daily_history_retention_774.sql` ausführen (DDL und einmaliges Backfill; keine mehreren separaten SELECT-Resultsets). Ergebnis normalerweise `Success. No rows returned`.
3. Website über GitHub veröffentlichen. Bestehende Edge Function `wallet-daily-refresh` und Cron-Job **nicht ändern**.
4. Wallet-Bestände -> `Automatischer Bestandsverlauf` öffnen. Der aktuelle abgeschlossene Tagesstand wird bei Installation einmalig übernommen; ältere, bereits überschriebene Tagesstände können nicht rückwirkend rekonstruiert werden.

## Aufbewahrung (Schweizer Kalendertage)
- 0–7 Tage: täglich.
- 8–365 Tage: neuester vorhandener Tagesstand je ISO-Woche.
- Älter als 365 Tage: neuester vorhandener Tagesstand je Kalendermonat.

Ein Stichtag enthält vollständige Tokenbestände inkl. zum Zeitpunkt der Aufnahme gespeicherter USD-Preise und Gesamtbewertung. Bei mehreren Aufnahmen im selben Kalendertag wird der Tagesdatensatz anhand von (user_id,sample_day) ersetzt. Die Retention wird bei einem erfolgreichen Tagesabschluss ausgelöst und verdichtet alle vorhandenen Daten. Benutzer ohne nachfolgende erfolgreiche Tagesläufe behalten ihre zuletzt vorhandenen Bestände bis zum nächsten Aufruf.

Der bestehende automatische Snapshot (`snapshots.is_automated=true`) bleibt ein einzelner aktueller Cache; die Historie wird in `wallet_daily_balance_history` gespeichert. Manuelle Snapshots (`is_automated=false`) bleiben unverändert.

## Kontrolle (zwei getrennte SELECT-Abfragen, separat ausführen)
```sql
SELECT user_id, sample_day, wallet_count, position_count, total_usd, unpriced_positions
FROM public.wallet_daily_balance_history ORDER BY user_id, sample_day DESC;
```
```sql
SELECT user_id, count(*) AS anzahl_manuelle_snapshots
FROM public.snapshots WHERE is_automated = false GROUP BY user_id;
```

## Hinweise
- Die Anzeige im Browser ist nur für den angemeldeten Benutzer lesbar (RLS).
- Für die Bewertung bleiben Snapshot-Preise fix; unbekannte Tokenpreise werden über `unpriced_positions` gezählt.
- Das vollständige Snapshot-Objekt wird für die aufbewahrten Tages-/Wochen-/Monatsstände gespeichert; es ist keine differenzielle Änderungsdatenbank.
- Datenbank-/Provider-Integration ist vor dem ersten echten Nachtlauf nicht live überprüfbar. Bei SQL-Fehlern keine weiteren Migrationen blind ausführen, sondern Fehlermeldung prüfen.
