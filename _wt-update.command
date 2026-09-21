#!/bin/bash

# ============================================================
# WalletTracking Update
# ============================================================
#
# Ablauf:
# 1. Neuestes wt-update-*.zip in Downloads suchen
# 2. ZIP ins GitHub-home verschieben
# 3. ZIP prüfen
# 4. Struktur wallet-tracking/ prüfen
# 5. Dateien ersetzen bzw. ergänzen
# 6. Git-Status anzeigen
# 7. ZIP nach erfolgreichem Update in Papierkorb verschieben
# 8. Nach Tastendruck Terminal schließen
#
# Vorhandene Dateien, die NICHT im ZIP enthalten sind,
# werden NICHT gelöscht.
# ============================================================


# ------------------------------------------------------------
# Einstellungen
# ------------------------------------------------------------

DOWNLOADS="/Users/christophe/Downloads"

HOME_DIR="/Users/christophe/kDrive_letsgofree/Letsgofree website_coaching/Github/home"


# ------------------------------------------------------------
# Hilfsfunktion: Terminal schließen
# ------------------------------------------------------------

close_terminal() {
    echo
    read -n 1 -s -r -p "Taste drücken, um Terminal zu schließen..."
    echo

    osascript \
        -e 'tell application "Terminal" to close front window' \
        >/dev/null 2>&1 &

    exit 0
}


clear

echo "============================================================"
echo " WalletTracking Update"
echo "============================================================"
echo


# ------------------------------------------------------------
# GitHub-home prüfen
# ------------------------------------------------------------

if [ ! -d "$HOME_DIR" ]; then

    echo "FEHLER: GitHub-home wurde nicht gefunden."
    echo
    echo "$HOME_DIR"

    close_terminal

fi


if [ ! -d "$HOME_DIR/wallet-tracking" ]; then

    echo "FEHLER: wallet-tracking wurde im GitHub-home nicht gefunden."
    echo
    echo "$HOME_DIR/wallet-tracking"
    echo
    echo "Es wurden KEINE Dateien verändert."

    close_terminal

fi


# ------------------------------------------------------------
# Neuestes Update-ZIP in Downloads suchen
# ------------------------------------------------------------

echo "Suche WalletTracking-Update in Downloads..."
echo


DOWNLOAD_ZIP=$(find "$DOWNLOADS" \
    -maxdepth 1 \
    -type f \
    -name 'wt-update-*.zip' \
    -exec stat -f '%m %N' {} \; 2>/dev/null \
    | sort -nr \
    | head -n 1 \
    | cut -d' ' -f2-)


if [ -z "$DOWNLOAD_ZIP" ] || [ ! -f "$DOWNLOAD_ZIP" ]; then

    echo "FEHLER: Kein WalletTracking Update-ZIP gefunden."
    echo
    echo "Gesucht wurde in:"
    echo "$DOWNLOADS"
    echo
    echo "Erwarteter Dateiname, z.B.:"
    echo "wt-update-5.69-20260921-035112.zip"

    close_terminal

fi


ZIP=$(basename "$DOWNLOAD_ZIP")


echo "Update gefunden:"
echo "$ZIP"
echo


# ------------------------------------------------------------
# ZIP bereits VOR dem Verschieben technisch prüfen
# ------------------------------------------------------------

echo "ZIP-Datei wird geprüft..."
echo


if ! unzip -t "$DOWNLOAD_ZIP" >/dev/null 2>&1; then

    echo "FEHLER: ZIP-Datei ist beschädigt oder kann nicht gelesen werden."
    echo
    echo "Es wurden KEINE Dateien verändert."

    close_terminal

fi


echo "ZIP technisch OK."
echo


# ------------------------------------------------------------
# ZIP-Struktur prüfen
# ------------------------------------------------------------

if ! unzip -Z1 "$DOWNLOAD_ZIP" | grep -q '^wallet-tracking/'; then

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
# Prüfen, ob gleichnamiges ZIP bereits im home liegt
# ------------------------------------------------------------

if [ -e "$HOME_DIR/$ZIP" ]; then

    echo "FEHLER: Im GitHub-home existiert bereits ein ZIP mit"
    echo "dem gleichen Namen:"
    echo
    echo "$ZIP"
    echo
    echo "Es wurde nichts überschrieben."

    close_terminal

fi


# ------------------------------------------------------------
# ZIP ins GitHub-home verschieben
# ------------------------------------------------------------

echo "Update wird ins GitHub-Verzeichnis verschoben..."
echo


mv "$DOWNLOAD_ZIP" "$HOME_DIR/$ZIP"


if [ $? -ne 0 ]; then

    echo "FEHLER: ZIP konnte nicht ins GitHub-Verzeichnis"
    echo "verschoben werden."
    echo
    echo "Es wurden KEINE WalletTracking-Dateien verändert."

    close_terminal

fi


echo "✓ ZIP ins GitHub-Verzeichnis verschoben."
echo


# ------------------------------------------------------------
# Ins GitHub-home wechseln
# ------------------------------------------------------------

cd "$HOME_DIR" || {

    echo "FEHLER: GitHub-home konnte nicht geöffnet werden."

    close_terminal

}


echo "GitHub-Verzeichnis:"
echo "$(pwd)"
echo


# ------------------------------------------------------------
# Dateien anzeigen
# ------------------------------------------------------------

echo "Folgende Dateien werden eingespielt:"
echo "------------------------------------------------------------"

unzip -Z1 "$ZIP" \
    | grep '^wallet-tracking/' \
    | grep -v '/$'

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
    echo "Das Update-ZIP bleibt im GitHub-home erhalten."
    echo
    echo "Bitte die Ausgabe oben prüfen."

    close_terminal

fi


# ------------------------------------------------------------
# Update erfolgreich
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


# ------------------------------------------------------------
# Git Status
# ------------------------------------------------------------

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then

    echo "Git-Änderungen:"
    echo "------------------------------------------------------------"

    git status --short wallet-tracking/

    echo "------------------------------------------------------------"

else

    echo "Hinweis:"
    echo "Dieses Verzeichnis wurde nicht als Git-Repository erkannt."

fi


# ------------------------------------------------------------
# ZIP in macOS-Papierkorb verschieben
# ------------------------------------------------------------

echo
echo "Update-ZIP wird in den Papierkorb verschoben..."
echo


ZIP_ABS="$HOME_DIR/$ZIP"


osascript \
    -e "tell application \"Finder\" to delete POSIX file \"$ZIP_ABS\"" \
    >/dev/null 2>&1


if [ $? -eq 0 ]; then

    echo "✓ $ZIP wurde in den Papierkorb verschoben."

else

    echo "WARNUNG:"
    echo "Das ZIP konnte nicht in den Papierkorb verschoben werden."
    echo
    echo "Das WalletTracking-Update war trotzdem erfolgreich."

fi


# ------------------------------------------------------------
# Fertig
# ------------------------------------------------------------

echo
echo "============================================================"
echo " FERTIG"
echo "============================================================"
echo

close_terminal