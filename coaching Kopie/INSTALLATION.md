# Installation der angepassten Coaching-Files

## ✅ Was wurde gemacht?

1. **Zentrales CSS erstellt:** `coaching-styles.css`
2. **Alle HTML-Files angepasst:**
   - Style-Blöcke entfernt
   - CSS-Link eingefügt
   - Bildpfade für Unterverzeichnis angepasst
3. **coaching.html → index.html** umbenannt
4. **Tagline überall auf 1.1em** gesetzt

## 📁 Struktur auf deinem Server

```
deine-website/
├── bilder/
│   └── coaching/
│       └── [alle deine Bilder bleiben hier]
│
└── coaching/          ← NEUES Unterverzeichnis
    ├── index.html               (vorher: coaching.html)
    ├── coaching-sessions.html
    ├── coaching_session1.html
    ├── coaching_session2.html
    ├── coaching_session3.html
    ├── coaching_session4.html
    ├── coaching_session5.html
    └── coaching-styles.css
```

## 🚀 Installation - Schritt für Schritt

### Schritt 1: Unterverzeichnis erstellen
Erstelle auf deinem Server im Hauptverzeichnis einen neuen Ordner namens **"coaching"**

### Schritt 2: Alle Files hochladen
Lade alle 8 Dateien in den Ordner **"coaching/"** hoch:
- index.html
- coaching-sessions.html
- coaching_session1.html
- coaching_session2.html
- coaching_session3.html
- coaching_session4.html
- coaching_session5.html
- coaching-styles.css

### Schritt 3: Bilder-Ordner prüfen
Stelle sicher, dass dein Bilder-Ordner so liegt:
```
deine-website/bilder/coaching/
```

Die HTML-Files im Ordner "coaching/" greifen jetzt über `../bilder/coaching/` auf die Bilder zu.

### Schritt 4: Testen
Öffne im Browser:
- `https://letsgofree.me/coaching/` → sollte die Startseite zeigen
- `https://letsgofree.me/coaching/coaching-sessions.html` → sollte alle Sessions zeigen

## 🔗 URLs für deine Besucher

**Hauptseite Coaching:**
`https://letsgofree.me/coaching/`

**Direkte Session-Links:**
- Session 1: `https://letsgofree.me/coaching/coaching-sessions.html#session1`
- Session 2: `https://letsgofree.me/coaching/coaching-sessions.html#session2`
- usw.

## ✏️ Anpassungen in Zukunft

### Farben ändern:
Öffne `coaching-styles.css` und ändere die Variablen:
```css
:root {
    --color-primary: #8B7355;     /* Deine neue Farbe */
    --color-secondary: #5a4636;   /* Deine neue Farbe */
}
```

### Schriftgrössen ändern:
```css
:root {
    --font-size-h1: 3.5em;              /* Hauptüberschriften */
    --font-size-header-tagline: 1.1em;  /* Tagline */
}
```

### Tagline-Text ändern:
Öffne jedes HTML-File und ändere:
```html
<p class="tagline">Dein neuer Text hier</p>
```

## 🎯 Vorteile der neuen Struktur

✅ **Ordnung:** Alle Coaching-Files in einem Unterverzeichnis
✅ **Zentrale Pflege:** Farben/Styles nur in 1 File ändern
✅ **Schneller:** Keine riesigen Style-Blöcke in HTML
✅ **Einheitlich:** Alle Seiten sehen gleich aus
✅ **Erweiterbar:** Neue Sessions brauchen nur CSS-Link

## ⚠️ Wichtig

- **Alte Files löschen:** Wenn alles funktioniert, kannst du die alten Files (coaching.html, coaching_session*.html ohne CSS-Link) vom Server löschen
- **Cache leeren:** Nach dem Upload eventuell Browser-Cache leeren (Strg+F5 / Cmd+Shift+R)
- **Links aktualisieren:** Falls du irgendwo auf die Coaching-Seiten verlinkst, passe die URLs an auf `/coaching/`

## ❓ Fragen?

Falls etwas nicht funktioniert:
1. Prüfe die Ordnerstruktur
2. Prüfe ob alle Files hochgeladen sind
3. Prüfe die Bildpfade (müssen in `bilder/coaching/` liegen)
4. Schau in die Browser-Konsole (F12) für Fehlermeldungen

Viel Erfolg! 🚀
