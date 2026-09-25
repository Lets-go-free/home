# neo.FX Tools

Dieses Verzeichnis enthält verschiedene Berechnungstools für neo.FX Trading.

## Struktur

```
neofx/
├── css/
│   └── neofx-style.css     (Gemeinsames Stylesheet für alle neo.FX Seiten)
├── neofx-risiko.html        (Risiko- und Nachzahlungsrechner)
└── README.md
```

## Verwendung

### Neue Seite hinzufügen

1. Erstelle eine neue HTML-Datei im `neofx/` Verzeichnis
2. Binde das gemeinsame CSS ein:
   ```html
   <link rel="stylesheet" href="css/neofx-style.css">
   ```
3. Nutze die bestehenden CSS-Klassen für einheitliches Design

### CSS-Klassen

- `.container` - Haupt-Container
- `.hero` - Header-Bereich
- `.section` - Inhalts-Abschnitt
- `.input-grid` - Grid-Layout für Input-Felder
- `.input-group` - Einzelne Input-Gruppe
- `.warning-box` - Gelbe Hinweis-Box
- `.liquidation-warning` - Rote Warn-Box

## Links

- Hauptseite: [letsgofree.me](https://letsgofree.me)
- neo.FX Risiko-Rechner: [letsgofree.me/neofx/neofx-risiko.html](https://letsgofree.me/neofx/neofx-risiko.html)
