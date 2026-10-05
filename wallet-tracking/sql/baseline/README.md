# WalletTracking · Supabase DB-Baseline

Stand: Phase 7.18 · 04.10.2026

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


## Kontrollierter Stammdaten-Export

Ab Phase 7.18 liegt im Projektroot `_wt-db-seed-export.command`. Der Helper arbeitet read-only und dient nur dazu, die freigegebenen globalen Stammdaten für die anschließende Seed-Erstellung bereitzustellen.

Sicherheitsprinzip:

1. Zuerst wird das aktuelle Live-Schema read-only gelesen.
2. Aus allen aktuell vorhandenen `public`-Tabellen werden ausschließlich die Tabellen der festen Seed-Allowlist freigegeben.
3. Jede andere Live-Tabelle wird dem `supabase db dump --data-only` explizit als Ausschluss übergeben.
4. Der erzeugte Rohdump wird nochmals auf `INSERT INTO`/`COPY`-Ziele geprüft. Wird eine nicht freigegebene Tabelle gefunden, wird `raw-seed.sql` gelöscht und der Export gestoppt.
5. Der Rohdump wird **nicht** automatisch in Produktion eingespielt und noch nicht als finaler Repo-Seed betrachtet. Er wird zuerst in deterministische/idempotente Seeds umgewandelt und geprüft.

Ausgaben liegen unter `sql/baseline/seed-export/generated/<Zeitstempel>/`; zusätzlich wird eine ZIP-Datei zum Review erzeugt.

## Aktueller Export-/Restore-Ablauf (7.37)

Die führende aktuelle Anleitung steht unter Admin → Dokumentation → Export & Wiederherstellung und in der Systemübersicht. Stammdaten: RPC `wallettracking_export_master_data()` (Migration 089), UUID-Admin-Prüfung, neun feste Tabellen in einem read-only Snapshot. JSON zur Kontrolle; SQL zum Upsert in eine leere/kompatible Baseline-DB, ohne Löschung zusätzlicher Daten. Exportierte Provider-URLs können darin gespeicherte Schlüssel enthalten; vor Veröffentlichung prüfen.

Der verifizierte Dump vom 04.10.2026 enthält 074–083. Die danach ausgeführten Härtungen 084–088 und der neue Export 089 sind separat zu berücksichtigen. Ein neuer Dump kann sie bereits enthalten: Migrationsstand prüfen statt blind doppelt anwenden. Migrationen bleiben dauerhaft erhalten. Historische Dateien können ohne die nicht mitgelieferte Git-Historie nicht rekonstruiert werden. Ein Restore-Test auf einer frischen separaten Supabase-Umgebung ist noch offen. Auth-Nutzer, private Daten, Edge Functions, Secrets und Storage werden durch den Stammdatenexport nicht gesichert.

Der Admin-Bereich verlinkt die vorhandenen CLI-Helper für neue Live-Struktur-/Rohdaten-Dumps. Sie sind lokal im verknüpften Projekt auszuführen; Browser-Downloads führen keine lokalen Befehle aus. Der Helper ist kein automatischer Restore.

## Exportdateien ablegen

| Export | Ablage relativ zu wallet-tracking/ | Ins Repository? |
|---|---|---|
| Geprüftes Stammdaten-SQL | `sql/baseline/seeds/` | Ja, nach Prüfung |
| Ungeprüfte JSON-/SQL-Exporte | `_backups/stammdaten/<Zeitstempel>/` | Nein |
| Neue Struktur-/Rollen-Dumps | `_backups/db/<Zeitstempel>/` | Nein, zunächst prüfen |
| Verifizierte Struktur-Baseline | `sql/baseline/verified/` | Ja, nach Prüfung |
| Private Daten oder Auth-Sicherungen | `Separater geschützter Backup-Ordner außerhalb der Website` | Nein |

Beispiel: `_backups/stammdaten/20261005-153414/`. `_backups/` in der für diesen Ordner geltenden `.gitignore` ausschließen. Diese Anleitung ändert die Ignore-Regeln nicht automatisch. Provider-URLs können Schlüssel enthalten: vor Veröffentlichung prüfen. Rohsicherungen zusätzlich außerhalb der Website sichern; `.gitignore` verhindert keine anderen Upload-/Deployment-Wege. Die CLI-Helper schreiben weiterhin in ihre bisherigen `generated/`-Verzeichnisse: Rohdateien ebenfalls prüfen/aus Git und Veröffentlichung ausschließen oder in den Backup-Ordner verschieben. Erst geprüfte Seeds bzw. verifizierte Strukturdateien ins Repository übernehmen.

Im Hauptverzeichnis des Repositorys `home` die Zeile `/wallet-tracking/_backups/` in `.gitignore` eintragen. Bereits von Git erfasste Dateien werden dadurch nicht entfernt; dafür `git rm -r --cached --ignore-unmatch wallet-tracking/_backups/` im Repository-Root verwenden. Lokale Dateien bleiben erhalten.

## Datenbank-Backup mit Auth und privaten Daten (7.39)

Admin → Dokumentation verlinkt `_wt-db-backup.command`. Im lokalen verknüpften Projekt ausführen, OrbStack/Docker starten. Read-only: Schema/Rollen, ein Daten-Dump aus public,auth,storage,supabase_migrations und managed-schema-reference.sql. Das deckt die derzeitigen Anwendungstabellen einschließlich verschlüsselter Namen, Auth-Nutzer/UUIDs/Identities und Migrationseinträge ab. Werden später eigene interne Schemas angelegt, muss die Schema-Allowlist des Helpers erweitert werden.

Ziel: `~/Documents/WalletTracking-Backups/<Zeitstempel>/`; `WT_BACKUP_DIR` kann ein anderes privates Ziel außerhalb der Website/des Git-Repos vorgeben. COPY-Abschnitte und SHA256 werden geprüft; nur vollständige Exporte erhalten BACKUP-COMPLETE.txt. Diese Prüfung beweist noch keinen erfolgreichen Restore. Struktur und Daten werden getrennt erfasst: keine schemaübergreifende Zeitpunkt-Garantie für alle Dateien.

Der ORIGINAL-Wert `WALLET_ENCRYPTION_MASTER_KEY_V1` ist zusätzlich getrennt im geschützten Passwortmanager zu sichern. Er kommt aus der produktiven Edge-Secret-Konfiguration und kann durch den Helper nicht exportiert werden. Ein neuer Wert entschlüsselt alte Daten nicht. Ist der ursprüngliche Wert nicht verfügbar, Wiederherstellbarkeit nicht bestätigen. Google-OAuth/Redirects, Edge-Konfiguration/Secrets und verwendete Storage-Dateien benötigen ebenfalls separate Sicherung; storage-Daten sind nur Metadaten. Bei Supabase-Vault-/Spaltenverschlüsselung zusätzlich die Anforderungen an den Plattform-Root-Key beachten. managed-schema-reference.sql nicht blind über Plattform-Schemas importieren.

Quelle: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore und https://supabase.com/docs/reference/cli/supabase-db-dump (geprüft 05.10.2026). Restore-Test bleibt zurückgestellt. Neuer echter Export auf dem Mac noch offen.
