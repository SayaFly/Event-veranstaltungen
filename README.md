# 🎉 Event-Veranstaltungen

Eine einfache Webanwendung zur Verwaltung von Veranstaltungen (Events).  
Erstellt mit reinem HTML, CSS und JavaScript – keine Abhängigkeiten, keine Build-Tools.

## Features

- **Veranstaltungen anlegen** – Titel, Datum, Uhrzeit, Ort, Beschreibung und Kategorie
- **Bearbeiten & Löschen** – Direkt auf der Karte
- **Suche & Filterung** – Freitext-Suche und Kategorie-Filter
- **Persistenz** – Daten werden im `localStorage` des Browsers gespeichert
- **Responsive Design** – Funktioniert auf Desktop und Mobilgeräten

## Kategorien

Konzert · Konferenz · Sport · Messe · Festival · Workshop · Sonstiges

## Verwendung

Öffne `index.html` direkt im Browser – es wird kein Server benötigt.

```bash
# Optional: lokaler Entwicklungsserver
npx serve .
```

## Dateistruktur

```
├── index.html   # Markup & Struktur
├── style.css    # Styling (CSS-Variablen, Grid, Animationen)
├── app.js       # App-Logik (CRUD, Rendering, localStorage)
└── README.md
```

## Browser-Kompatibilität

Unterstützt alle modernen Browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+).
