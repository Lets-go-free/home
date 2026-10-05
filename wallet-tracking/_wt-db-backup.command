#!/bin/bash
# Read-only database backup. No credentials are accepted in command arguments.
set -euo pipefail
umask 077
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
pause() { if [ -t 0 ]; then read -n 1 -s -r -p "Taste drücken zum Schliessen ..." || true; echo; fi; }
OUT=""
failed() {
  trap - ERR
  echo "Backup abgebrochen. Keine bestätigte vollständige Sicherung erstellt."
  if [ -n "$OUT" ]; then echo "Teildateien: $OUT (nicht für einen Restore freigegeben)."; fi
  echo "Projektverknüpfung, Supabase-Anmeldung und laufendes OrbStack/Docker prüfen."
  pause
  exit 1
}
trap failed ERR
for tool in supabase shasum awk; do
  if ! command -v "$tool" >/dev/null 2>&1; then echo "Erforderliches Programm fehlt: $tool"; pause; exit 1; fi
done
if [ ! -f supabase/config.toml ] || [ ! -s supabase/.temp/project-ref ]; then
  echo "Bitte diesen Helper im lokalen, bereits mit Supabase verknüpften wallet-tracking-Ordner ausführen."
  echo "Keine automatische Verknüpfung. Anleitung: Admin → Dokumentation → Datenbank-Backup."
  pause; exit 1
fi
# Default is intentionally outside the repository / published website.
BACKUP_BASE="${WT_BACKUP_DIR:-$HOME/Documents/WalletTracking-Backups}"
mkdir -p "$BACKUP_BASE"
BACKUP_BASE="$(cd "$BACKUP_BASE" && pwd -P)"
case "$BACKUP_BASE/" in "$SCRIPT_DIR/"*) echo "Backup-Ziel muss außerhalb des wallet-tracking-Ordners liegen."; pause; exit 1;; esac
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT="$(git rev-parse --show-toplevel)"
  case "$BACKUP_BASE/" in "$REPO_ROOT/"*) echo "Backup-Ziel muss außerhalb des Git-Repositorys liegen."; pause; exit 1;; esac
fi
STAMP="$(TZ=Europe/Zurich date '+%Y%m%d-%H%M%S')"
OUT="$BACKUP_BASE/$STAMP"
mkdir "$OUT"
echo "Datenbank-Backup wird read-only erstellt. Ausgabe: $OUT"
run_dump() {
  local label="$1"; shift
  echo "$label"
  if ! "$@" > "$OUT/export-log.txt" 2>&1; then
    echo "Export fehlgeschlagen. Geschütztes Fehlerprotokoll: $OUT/export-log.txt"
    return 1
  fi
}
run_dump "[1/5] Anwendungsstruktur" supabase db dump --linked --file "$OUT/schema.sql"
run_dump "[2/5] Rollen" supabase db dump --linked --role-only --file "$OUT/roles.sql"
run_dump "[3/5] Daten inkl. Auth in einem Dump" supabase db dump --linked --data-only --use-copy --schema public,auth,storage,supabase_migrations --file "$OUT/data.sql"
run_dump "[4/5] Auth-/Storage-/Migrationsstruktur als Referenz" supabase db dump --linked --schema auth,storage,supabase_migrations --file "$OUT/managed-schema-reference.sql"
run_dump "[5/5] Migrationsliste" supabase migration list --linked
mv "$OUT/export-log.txt" "$OUT/migration-list.txt"
# Never label an auth-less or private-data-less dump as a successful database backup.
for table in 'auth.users' 'auth.identities' 'public.wallets' 'public.user_team_aliases_private'; do
  if ! awk -v table="$table" '/^COPY / {line=$0; gsub(/"/,"",line); split(line,a," "); if(a[2]==table) found=1} END {exit !found}' "$OUT/data.sql"; then
    echo "Unvollständiger Dump: erwarteter COPY-Abschnitt fehlt ($table)."
    false
  fi
done
for file in schema.sql roles.sql data.sql managed-schema-reference.sql migration-list.txt; do test -s "$OUT/$file"; done
cat > "$OUT/manifest.txt" <<EOF
WalletTracking database backup
Timestamp Europe/Zurich: $(TZ=Europe/Zurich date '+%Y-%m-%d %H:%M:%S %Z')
Supabase CLI: $(supabase --version)
Project ref: $(cat supabase/.temp/project-ref)
Mode: READ ONLY; schema/roles/data dump + migration list
Data schemas: public,auth,storage,supabase_migrations (one data dump)
Validated COPY sections: auth.users, auth.identities, public.wallets, public.user_team_aliases_private
Separate structure/data commands: not a point-in-time snapshot across all files.
EXCLUDED: Storage file bytes; Edge deployments and secrets; Auth provider settings;
WALLET_ENCRYPTION_MASTER_KEY_V1; platform encryption root keys/configuration.
Restore test: deferred / NOT VERIFIED.
EOF
cat > "$OUT/RESTORE-NOTES.txt" <<'EOF'
Database backup only, not a complete Supabase project copy.
Preserve user UUIDs and auth.identities; recreate Google provider/redirect settings separately.
Encrypted WalletTracking fields require the ORIGINAL WALLET_ENCRYPTION_MASTER_KEY_V1.
Keep that secret in a secure password manager, separately from this backup.
Do not generate a replacement key: existing ciphertext would become unreadable.
Storage rows are metadata only; stored file bytes require a separate export if used.
Edge Function source is in the repository. Deployed versions/secrets need separate records.
Platform Vault/column encryption may require the original Supabase encryption root key.
managed-schema-reference.sql is reference material: do not blindly import it over managed schemas.
Use a compatible fresh test project for a reviewed restore; no production restore is performed here.
Keep the whole backup private, outside Git/web hosting. Protect the backup drive/account.
Checksums/COPY sections check packaging/coverage, not successful restoration or live row counts.
EOF
(
 cd "$OUT"
 shasum -a 256 schema.sql roles.sql data.sql managed-schema-reference.sql migration-list.txt manifest.txt RESTORE-NOTES.txt > SHA256SUMS.txt
 shasum -a 256 -c SHA256SUMS.txt >/dev/null
)
# Marker is written only after all exports, coverage checks and hashes succeed.
printf '%s\n' 'DATABASE_BACKUP_COMPLETE; RESTORE_NOT_TESTED; SECRETS_AND_STORAGE_FILES_EXCLUDED' > "$OUT/BACKUP-COMPLETE.txt"
echo "Datenbankexport abgeschlossen und Prüfsummen geprüft: $OUT"
echo "Auth-Nutzer und private Daten enthalten. Schlüssel/Secrets separat sichern; Restore noch ungeprüft."
pause
