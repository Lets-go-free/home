# Anleitung: Coaching-Styles.css verwenden

## 1. CSS-File einbinden

Füge in jedem HTML-File im `<head>`-Bereich diese Zeile ein:

```html
<link rel="stylesheet" href="coaching-styles.css">
```

**Beispiel:**
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session 1 - Das Fundament verstehen | Let's go free</title>
    <link rel="stylesheet" href="coaching-styles.css">
</head>
```

## 2. Vorhandenen `<style>`-Block entfernen

In jedem HTML-File kannst du jetzt den kompletten `<style>`-Block zwischen `<style>` und `</style>` löschen, **bis auf:**

### Was du BEHALTEN musst (wenn vorhanden):

1. **Spezielle inline-styles** für einzelne Slides (z.B. Hintergrundbilder)
2. **Spezifische Anpassungen** die nur in diesem File vorkommen

### Beispiel was du LÖSCHEN kannst:
```html
<style>
    * { margin: 0; padding: 0; ... }
    body { font-family: ... }
    .header-banner { ... }
    .slide { ... }
    /* usw. - alles was im coaching-styles.css drin ist */
</style>
```

### Beispiel was du BEHALTEN musst:
```html
<style>
    /* Nur wenn du spezielle Anpassungen brauchst */
    .special-slide-background {
        background: url('special-image.jpg');
    }
</style>
```

## 3. Farben, Schriften & Abstände anpassen

**Alle wichtigen Werte sind zentral als CSS-Variablen definiert!**

### Im File `coaching-styles.css` findest du ganz oben:

```css
:root {
    /* Hauptfarben */
    --color-primary: #8B7355;        /* Hauptfarbe - Braun */
    --color-secondary: #5a4636;      /* Dunkles Braun für Texte */
    --color-light: #F5E6D3;          /* Heller Hintergrund */
    
    /* Schriftgrössen */
    --font-size-h1: 3.5em;           /* Hauptüberschriften */
    --font-size-h2: 2.6em;           /* Unterüberschriften */
    
    /* Header */
    --font-size-header-tagline: 1.1em;  /* Tagline im Header */
}
```

### Um etwas zu ändern:
- **Farbe ändern:** Ändere den Wert bei `--color-primary`
- **Schriftgrösse ändern:** Ändere den Wert bei `--font-size-h1` etc.
- **Tagline-Grösse:** Ändere `--font-size-header-tagline`

**Wichtig:** Du änderst nur die Variablen oben im File, nicht die einzelnen CSS-Regeln!

## 4. Übersicht: Was ist wo?

### Im ZENTRALEN CSS (coaching-styles.css):
✅ Alle gemeinsamen Styles
✅ Farben, Schriftgrössen, Abstände als Variablen
✅ Header-Banner
✅ Slides, Content-Boxen, Listen
✅ Buttons, Grid-Systeme
✅ Mobile-Anpassungen

### In den EINZELNEN HTML-Files:
❌ Kein CSS mehr nötig (ausser Spezialfälle)
✅ Nur noch HTML-Struktur
✅ JavaScript für Navigation

## 5. Tagline-Schriftgrössen

**Aktuell überall auf 1.1em gesetzt:**
- Desktop: 1.1em
- Mobile: 0.75em

Falls du für eine einzelne Seite eine andere Grösse willst, kannst du im HTML-File ein kleines `<style>`-Tag einfügen:

```html
<style>
    .header-banner .tagline {
        font-size: 1.25em; /* Nur für diese Seite */
    }
</style>
```

## 6. Checkliste für jedes HTML-File

- [ ] `<link rel="stylesheet" href="coaching-styles.css">` im `<head>` eingefügt
- [ ] Kompletten `<style>`-Block entfernt
- [ ] Seite im Browser testen
- [ ] Mobile-Ansicht prüfen

## 7. Vorteile dieser Lösung

✅ **Zentrale Pflege:** Farben/Schriften nur an 1 Stelle ändern
✅ **Konsistenz:** Alle Seiten sehen gleich aus
✅ **Übersichtlich:** Weniger Code in HTML-Files
✅ **Einfach:** CSS-Variablen machen Anpassungen simpel
✅ **Wartbar:** Neue Seiten brauchen nur 1 Zeile CSS-Einbindung

## 8. Fragen?

Falls etwas nicht funktioniert oder du Anpassungen brauchst, sag Bescheid!
