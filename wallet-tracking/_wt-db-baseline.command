#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI wurde nicht gefunden."
  echo "Bitte zuerst die Supabase CLI installieren und dieses Script danach erneut starten."
  echo "Dokumentation: sql/baseline/README.md"
  read -n 1 -s -r -p "Taste drücken zum Schliessen ..."
  echo
  exit 1
fi

if [ ! -f "supabase/config.toml" ]; then
  echo "Dieses lokale Projekt ist noch nicht als Supabase-CLI-Projekt initialisiert/verknüpft."
  echo "Bitte im Ordner wallet-tracking zuerst 'supabase init' (falls nötig) und danach 'supabase link' ausführen."
  echo "Das Script nimmt bewusst keine automatische Verknüpfung vor."
  read -n 1 -s -r -p "Taste drücken zum Schliessen ..."
  echo
  exit 1
fi

STAMP="$(TZ=Europe/Zurich date '+%Y%m%d-%H%M%S')"
OUT="sql/baseline/generated/$STAMP"
mkdir -p "$OUT"

cat > "$OUT/manifest.txt" <<MANIFEST
WalletTracking Supabase baseline capture
Timestamp Europe/Zurich: $(TZ=Europe/Zurich date '+%Y-%m-%d %H:%M:%S %Z')
Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'kein Git-Commit ermittelbar')
Supabase CLI: $(supabase --version 2>/dev/null || echo 'unbekannt')
Mode: READ ONLY (db dump / migration list)
MANIFEST

echo "[1/3] Schema wird read-only aus der verknüpften Supabase-DB exportiert ..."
supabase db dump --linked --file "$OUT/schema.sql"

echo "[2/3] Rollen werden read-only exportiert ..."
supabase db dump --linked --role-only --file "$OUT/roles.sql"

echo "[3/3] Migrationshistorie wird gelesen ..."
supabase migration list > "$OUT/migration-list.txt"

(
  cd "$OUT"
  shasum -a 256 schema.sql roles.sql migration-list.txt manifest.txt > SHA256SUMS.txt
)

echo
echo "Fertig. Es wurde nichts an der Datenbank geändert."
echo "Ausgabe: $OUT"
echo
echo "Bitte schema.sql und migration-list.txt für den nächsten Verifikationsschritt bereitstellen."
read -n 1 -s -r -p "Taste drücken zum Schliessen ..."
echo
