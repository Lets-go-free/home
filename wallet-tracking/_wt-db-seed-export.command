#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

ALLOWLIST=(
  chains
  defi_projects
  dex_configs
  predefined_tokens
  defi_project_tokens
  defi_staking_contracts
  project_nfts
  tax_fx_rates
  tax_asset_prices
)

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI wurde nicht gefunden."
  echo "Bitte zuerst die bereits eingerichtete Supabase CLI verwenden."
  echo "Taste drücken zum Schliessen ..."
  read -k 1
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker-kompatible Container-Runtime wurde nicht gefunden."
  echo "Bitte OrbStack/Docker starten und danach dieses Script erneut ausführen."
  echo "Taste drücken zum Schliessen ..."
  read -k 1
  exit 1
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "Dieses Projekt ist noch nicht mit Supabase verknüpft."
  echo "Bitte im Ordner wallet-tracking zuerst 'supabase link --project-ref ...' ausführen."
  echo "Taste drücken zum Schliessen ..."
  read -k 1
  exit 1
fi

STAMP=$(TZ=Europe/Zurich date '+%Y%m%d-%H%M%S')
OUT="sql/baseline/seed-export/generated/$STAMP"
mkdir -p "$OUT"
TMP_SCHEMA=$(mktemp -t wt-seed-schema.XXXXXX.sql)
trap 'rm -f "$TMP_SCHEMA"' EXIT

echo "[1/4] Live-Schema wird read-only gelesen, damit wirklich alle NICHT freigegebenen Tabellen ausgeschlossen werden ..."
supabase db dump --linked --file "$TMP_SCHEMA"

grep '^CREATE TABLE IF NOT EXISTS "public"\."' "$TMP_SCHEMA" \
  | sed -E 's/^CREATE TABLE IF NOT EXISTS "public"\."([^"]+)".*/\1/' \
  | LC_ALL=C sort -u > "$OUT/live-public-tables.txt"

printf '%s\n' "${ALLOWLIST[@]}" > "$OUT/allowlist.txt"

: > "$OUT/included-tables.txt"
: > "$OUT/missing-allowlist.txt"
for table in "${ALLOWLIST[@]}"; do
  if grep -Fxq "$table" "$OUT/live-public-tables.txt"; then
    echo "$table" >> "$OUT/included-tables.txt"
  else
    echo "$table" >> "$OUT/missing-allowlist.txt"
  fi
done

EXCLUDES=()
while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  if ! grep -Fxq "$table" "$OUT/allowlist.txt"; then
    EXCLUDES+=( -x "public.$table" )
  fi
done < "$OUT/live-public-tables.txt"

echo "[2/4] Ausschließlich freigegebene globale Stammdaten werden read-only exportiert ..."
supabase db dump --linked --data-only --schema public --file "$OUT/raw-seed.sql" "${EXCLUDES[@]}"

echo "[3/4] Datenschutz-Sicherheitsprüfung des Dumps ..."
{
  grep -E '^(INSERT INTO|COPY) "?public"?\.' "$OUT/raw-seed.sql" 2>/dev/null || true
} | sed -E 's/^(INSERT INTO|COPY) "?public"?\."?([^" (]+)"?.*/\2/' \
  | LC_ALL=C sort -u > "$OUT/dumped-tables.txt"

BAD=0
while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  if ! grep -Fxq "$table" "$OUT/allowlist.txt"; then
    echo "SICHERHEITSSTOPP: Nicht freigegebene Tabelle im Dump gefunden: $table"
    BAD=1
  fi
done < "$OUT/dumped-tables.txt"

if [[ "$BAD" -ne 0 ]]; then
  rm -f "$OUT/raw-seed.sql"
  echo "Der Datendump wurde aus Sicherheitsgründen gelöscht."
  echo "Taste drücken zum Schliessen ..."
  read -k 1
  exit 1
fi

{
  echo "WalletTracking Stammdaten-Export"
  echo "Zeitpunkt (Europe/Zurich): $(TZ=Europe/Zurich date '+%d.%m.%Y %H:%M:%S %Z')"
  echo "Modus: read-only"
  echo "Quelle: verknüpftes Supabase-Projekt"
  echo ""
  echo "Freigegebene Allowlist:"
  sed 's/^/- /' "$OUT/allowlist.txt"
  echo ""
  echo "Im Live-Schema vorhandene freigegebene Tabellen:"
  sed 's/^/- /' "$OUT/included-tables.txt"
  echo ""
  echo "Freigegebene Tabellen, die im Live-Schema fehlen:"
  if [[ -s "$OUT/missing-allowlist.txt" ]]; then sed 's/^/- /' "$OUT/missing-allowlist.txt"; else echo "- keine"; fi
  echo ""
  echo "Tatsächlich im Datendump erkannte Tabellen:"
  if [[ -s "$OUT/dumped-tables.txt" ]]; then sed 's/^/- /' "$OUT/dumped-tables.txt"; else echo "- keine INSERT/COPY-Zeilen erkannt"; fi
  echo ""
  echo "WICHTIG: raw-seed.sql ist ein Prüf-/Rohdump. Er wird NICHT automatisch produktiv eingespielt."
  echo "Er wird vor Aufnahme ins Repo in deterministische, idempotente Seeds umgewandelt und geprüft."
} > "$OUT/MANIFEST.txt"

(
  cd "$OUT"
  shasum -a 256 raw-seed.sql allowlist.txt included-tables.txt missing-allowlist.txt dumped-tables.txt MANIFEST.txt > SHA256SUMS.txt
)

ZIP="sql/baseline/seed-export/wt-seed-export-$STAMP.zip"
mkdir -p "$(dirname "$ZIP")"
/usr/bin/zip -q -j "$ZIP" "$OUT"/*

echo "[4/4] Fertig. Es wurde nichts an der Datenbank geändert."
echo ""
echo "Ausgabe: $OUT"
echo "ZIP für die Prüfung: $ZIP"
echo ""
echo "Bitte die ZIP-Datei im Chat bereitstellen."
echo "Taste drücken zum Schliessen ..."
read -k 1
