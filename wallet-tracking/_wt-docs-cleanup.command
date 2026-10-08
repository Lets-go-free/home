#!/bin/bash
# Archive only the exact historical release reports included with update 7.55.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
if [ ! -f index.html ] || [ ! -f js/app.js ] || [ ! -f README.md ]; then
  echo "Abbruch: Bitte im wallet-tracking-Verzeichnis ausführen."; exit 1
fi
mkdir -p docs/releases
failed=0
while read -r name expected; do
  [ -n "$name" ] || continue
  source_file="$SCRIPT_DIR/$name"
  target_file="$SCRIPT_DIR/docs/releases/$name"
  [ -f "$source_file" ] || continue
  actual="$(shasum -a 256 "$source_file" | awk '{print $1}')"
  if [ "$actual" != "$expected" ]; then
    echo "Unverändert belassen (abweichender Inhalt): $name"; failed=1; continue
  fi
  if [ -e "$target_file" ]; then
    if [ ! -f "$target_file" ] || ! cmp -s "$source_file" "$target_file"; then
      echo "Unverändert belassen (Archiv weicht ab): $name"; failed=1; continue
    fi
    rm "$source_file"
    echo "Archiv vorhanden; identische Root-Kopie entfernt: $name"
  else
    mv "$source_file" "$target_file"
    echo "Archiviert: $name"
  fi
done <<'RELEASE_REPORTS'
README-7.33.md ce089af5603676f8cc1a1bf95ac3b4a94ea69eb4ff5da26a927e49d82f53ec77
README-7.34.md b90b11d382d147b44b9d6f066920404b450d2fa66401946f42ba3674b4f454f6
README-7.35.md 01f3177f94d268b34ac1130414bcf1bca66951f6b84bd742bece1f26c5741858
README-7.36.md 4030324ab26ce460e48dde40824ae2d9ce00e1e3ee7b878a161e00354fe03884
README-7.37.md b7086a8890e1dccfef193beef2416eb919673030a6ea8c389d4916492a7d4eef
README-7.38.md 52c15fe249ee2596fe2e358eccb82df6339d34b83dd06f8fdea5b432f813fb63
README-7.39.md a10ff1eb5a93bb89e0c1ffd6790eafcea3de633b75670715dbc66918b835ab54
README-7.40.md cdc844a36d5e5f68cc9455c52cb7add6f8a6dcf1407aa47eaca8705b35674bf6
README-7.41.md 67ca1e0fbbd9bb83ddc074ba9f34c3bea8ef89fe5cccfdd5739a53aff85e0e0e
README-7.42.md 3f1fa70bab576ac9e13cf22e93d65ede5f974c637171be7489d8ac8fea96cc64
README-7.43.md 61f38d7900424c4a44744fc8267ac48652ef40907021f4e7421588167d823e34
README-7.44.md 056c68339cf522b45db39b4b9b7ae6e21257542cd899dbe29f2e7c20c3e8a8a0
RELEASE_REPORTS
if [ "$failed" = 0 ]; then echo "Dokumentationsablage bereinigt. README.md und SQL-Dateien bleiben erhalten."; fi
if [ -t 0 ]; then read -n 1 -s -r -p "Taste drücken zum Schliessen ..." || true; echo; fi
exit "$failed"
