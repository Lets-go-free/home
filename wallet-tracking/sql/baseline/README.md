# WalletTracking · Supabase DB-Baseline

Stand: Phase 7.17 · 04.10.2026

## Ziel

Die produktive WalletTracking-Datenbank soll aus dem Repository nachvollziehbar und auf einer frischen Supabase-Umgebung reproduzierbar werden. Historisch ausgeführte, später aus dem Repo entfernte Migrationen werden **nicht** aus Vermutungen nachgebaut.

## Verifizierter produktiver Ist-Stand

Am 04.10.2026 wurde die produktive, mit der Supabase CLI verknüpfte Datenbank read-only exportiert und gegen den Repo-Stand geprüft. Die verifizierten Dateien liegen unter:

- `sql/baseline/verified/schema.sql`
- `sql/baseline/verified/roles.sql`
- `sql/baseline/verified/migration-list.txt`
- `sql/baseline/verified/SHA256SUMS.txt`

Der verifizierte Schema-Dump enthält aktuell:

- 69 Tabellen im Schema `public`
- RLS auf allen 69 Tabellen
- 218 Policies
- 17 Functions im Schema `public`
- 4 Trigger

Die zuvor fehlende Tabelle `historical_dex_pair_state_cache` aus Migration 080 ist im verifizierten Live-Stand vorhanden.

## Historische Migrationslücke

Im aktuellen Repository sind die Migrationen `074` bis `083` vorhanden. Die Projektdokumentation referenziert jedoch frühere produktive Migrationen, unter anderem `057`, `058`, `059`, `063`, `065`, `068`, `072` und `073`. Diese historische Kette ist im Repo daher nachweislich unvollständig.

Die Supabase-Migrationshistorie der produktiven DB ist leer. Viele Migrationen wurden historisch manuell über den SQL Editor ausgeführt und nicht als Supabase-CLI-Migration registriert. Deshalb gilt:

1. Die verifizierte Baseline ist der autoritative technische Ist-Snapshot.
2. Frühere Migrationen werden nicht nachträglich erfunden oder blind als "applied" markiert.
3. Ab jetzt bleibt jede neu ausgeführte Migration dauerhaft im Repo.
4. Künftige DB-Änderungen müssen gegen die Baseline und die fortlaufende Migrationskette nachvollziehbar sein.

## Stammdaten

`schema.sql` enthält bewusst keine produktiven Userdaten. Für eine wirklich funktionsfähige frische WalletTracking-DB werden zusätzlich freigegebene globale Stammdaten benötigt. Die Strategie und Allowlist stehen in `stammdaten-strategie.md`.

Wichtig: Userbezogene Tabellen, Walletdaten, Caches mit `user_id`, Chatdaten, Snapshots und andere personenbezogene Daten gehören **nicht** in einen Repository-Seed.

## Security-/Architektur-Härtung

Der Baseline-Audit dokumentiert den Ist-Stand, ohne ihn stillschweigend umzubauen. Zwei Punkte bleiben separat offen:

- mehrere ältere `public`-Tabellen besitzen breite Grants, u. a. `GRANT ALL ... TO anon`; RLS ist zwar aktiviert, die Grants sollen aber separat minimiert werden;
- interne Job-/Cache-/Backend-Tabellen liegen historisch teilweise im exponierten Schema `public`; bei künftigen Umbauten sollen nicht browserbenötigte Tabellen in ein nicht exponiertes internes Schema verschoben werden.

Diese Härtung wird nicht mit der Baseline vermischt, damit ein reproduzierbarer Ist-Stand erhalten bleibt.

## Baseline neu erzeugen

Im Ordner `wallet-tracking` liegt `_wt-db-baseline.command`. Der Helper arbeitet read-only und verwendet:

- `supabase db dump --linked`
- `supabase db dump --linked --role-only`
- `supabase migration list`

Er führt **kein** `db reset`, **kein** `db push` und keine SQL-Änderung an der produktiven DB aus.

Voraussetzungen auf macOS:

- Supabase CLI
- eine Docker-kompatible Container-Runtime (z. B. OrbStack oder Docker Desktop), da `supabase db dump` intern PostgreSQL-Tools im Container ausführt
- lokales Projekt mit `supabase link` an das produktive Supabase-Projekt gekoppelt

Die Ausgabe landet unter `sql/baseline/generated/<Zeitstempel>/`.

## Sicherheitsregel

`supabase db reset --linked` ist auf Produktion destruktiv und gehört **nicht** in diesen Workflow.
