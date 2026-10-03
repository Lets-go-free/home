# WalletTracking · Supabase DB-Baseline

Stand: Phase 7.16 · 03.10.2026

## Ziel

Die produktive WalletTracking-Datenbank muss aus dem Repository nachvollziehbar und auf einer frischen Supabase-Umgebung reproduzierbar werden. Historisch ausgeführte, später aus dem Repo entfernte Migrationen werden **nicht** aus Vermutungen nachgebaut.

## Festgestellter Stand

Im vollständigen Projektstand vom 01.10.2026 sind nur die Migrationen `074` bis `080` enthalten. In späteren Releases kamen `081`, `082` und `083` hinzu. Die Projektdokumentation referenziert jedoch frühere produktive Migrationen, unter anderem `057`, `058`, `059`, `063`, `065`, `068`, `072` und `073`. Damit ist die historische Migrationskette im Repository derzeit nachweislich unvollständig.

Die Anwendung referenziert zusätzlich zahlreiche Tabellen und RPCs, deren ursprüngliche CREATE-Migrationen im aktuellen Repo fehlen. Siehe `repo-object-inventory.md`.

## Sichere Vorgehensweise

1. Zuerst die **aktuelle produktive DB read-only exportieren**.
2. Export mit den vorhandenen Migrationen und den vom Code erwarteten Objekten vergleichen.
3. Erst danach eine verifizierte Baseline-Datei erzeugen.
4. Die historische Lücke separat dokumentieren; keine fiktiven Migrationen `001`–`073` erfinden.
5. Ab dann jede neu ausgeführte Migration dauerhaft im Repo behalten.

## Baseline erzeugen

Im Ordner `wallet-tracking` liegt `_wt-db-baseline.command`.

Der Helper verwendet ausschließlich lesende Supabase-CLI-Befehle:

- `supabase db dump --linked`
- `supabase db dump --linked --role-only`
- `supabase migration list`

Er führt **kein** `db reset`, **kein** `db push` und keine SQL-Änderung an der produktiven DB aus.

Voraussetzungen:

- Supabase CLI installiert
- lokales Projekt mit dem produktiven Supabase-Projekt verknüpft (`supabase link`)
- Zugriff auf die verknüpfte DB

Die Ausgabe landet unter `sql/baseline/generated/<Zeitstempel>/` und enthält Schema-Dump, Rollen-Dump, Migrationsliste, Manifest und SHA-256-Prüfsummen.

Diese erzeugten Dateien müssen anschließend gegen den Code und die Migrationen 074–083 geprüft werden. Erst nach dieser Prüfung wird daraus die **verifizierte Baseline**.

## Wichtig

`supabase db reset --linked` ist auf Produktion destruktiv und gehört **nicht** in diesen Workflow.

Produktive Userdaten werden nicht als Seed-Dump exportiert. Falls später reproduzierbare Stammdaten benötigt werden, werden ausschließlich dafür freigegebene Tabellen separat und datenschutzkonform exportiert.
