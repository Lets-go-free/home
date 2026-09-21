#!/bin/bash

# ============================================================
# WalletTracking Update
# ============================================================
# Script und Update-ZIP liegen im GitHub-home-Ordner.
#
# Erwartete ZIP-Namen:
#   wt-update-5.69-20260921-035112.zip
#   wt-update-5.70-20260921-104530.zip
#
# Das neueste ZIP wird automatisch verwendet.
# Nach erfolgreichem Update wird es in den Papierkorb verschoben.
# ============================================================

cd "$(dirname "$0")" || exit 1

clear

# ------------------------------------------------------------
# Hilfsfunktion: Terminal nach Tastendruck schließen
# ------------------------------------------------------------

close_terminal() {
    echo
    read -n 1 -s -r -p "Taste drücken, um Terminal zu schließen..."
    echo

    # Terminal-Fenster schließen
    osascript -e 'tell application "Terminal" to close front window' >/dev/null 2>&1 &
    exit 0
}

echo "============================================================"
echo " WalletTracking Update"
echo "============================================================"
echo
echo "GitHub-Verzeichnis:"
echo "$(pwd)"
echo

# ------------------------------------------------------------
# Neuestes Update-ZIP suchen
# ------------------------------------------------------------

ZIP=$(ls -t wt-update-*.zip 2>/dev/null | head -n 1)

if [ -z "$ZIP" ] || [ ! -f "$ZIP" ]; then
    echo "FEHLER: Kein WalletTracking Update-ZIP gefunden."
    echo
    echo "Erwarteter Dateiname, z.B.:"
    echo "wt-update-5.69-20260921-035112.zip"
    close_terminal
fi

echo "Update gefunden:"
echo "$ZIP"
echo

# ------------------------------------------------------------
# ZIP testen
# ------------------------------------------------------------

echo "ZIP-Datei wird geprüft..."
echo

if ! unzip -t "$ZIP" >/dev/null 2>&1; then
    echo "FEHLER: ZIP-Datei ist beschädigt oder kann nicht gelesen werden."
    echo
    echo "Es wurden KEINE Dateien verändert."
    close_terminal
fi

echo "ZIP technisch OK."
echo

# ------------------------------------------------------------
# Ordnerstruktur prüfen
# ------------------------------------------------------------

if ! unzip -Z1 "$ZIP" | grep -q '^wallet-tracking/'; then
    echo "FEHLER: Falsche ZIP-Struktur."
    echo
    echo "Das ZIP muss Dateien innerhalb von"
    echo
    echo "wallet-tracking/"
    echo
    echo "enthalten."
    echo
    echo "Es wurden KEINE Dateien verändert."
    close_terminal
fi

echo "Ordnerstruktur OK."
echo

# ------------------------------------------------------------
# Dateien anzeigen
# ------------------------------------------------------------

echo "Folgende Dateien werden eingespielt:"
echo "------------------------------------------------------------"

unzip -Z1 "$ZIP" | grep '^wallet-tracking/' | grep -v '/$'

echo "------------------------------------------------------------"
echo

# ------------------------------------------------------------
# Update durchführen
# ------------------------------------------------------------

echo "Update wird installiert..."
echo

unzip -o "$ZIP"

RESULT=$?

echo

if [ $RESULT -ne 0 ]; then
    echo "FEHLER beim Entpacken."
    echo
    echo "Das Update-ZIP bleibt erhalten."
    close_terminal
fi

# ------------------------------------------------------------
# Git Status
# ------------------------------------------------------------

echo
echo "============================================================"
echo " UPDATE ERFOLGREICH"
echo "============================================================"
echo
echo "Installiertes Update:"
echo "$ZIP"
echo
echo "Vorhandene Dateien aus dem ZIP wurden ersetzt."
echo "Neue Dateien aus dem ZIP wurden ergänzt."
echo "Andere Dateien wurden NICHT gelöscht."
echo

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Git-Änderungen:"
    echo "------------------------------------------------------------"
    git status --short
    echo "------------------------------------------------------------"
else
    echo "Hinweis: Dieses Verzeichnis wurde nicht als Git-Repository erkannt."
fi

# ------------------------------------------------------------
# ZIP in macOS-Papierkorb verschieben
# ------------------------------------------------------------

echo
echo "Update-ZIP wird in den Papierkorb verschoben..."

ZIP_ABS="$(pwd)/$ZIP"

osascript -e "tell application \"Finder\" to delete POSIX file \"$ZIP_ABS\"" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ $ZIP wurde in den Papierkorb verschoben."
else
    echo "WARNUNG: ZIP konnte nicht in den Papierkorb verschoben werden."
    echo "Das eigentliche WalletTracking-Update war trotzdem erfolgreich."
fi

echo
echo "============================================================"
echo " FERTIG"
echo "============================================================"

close_terminal