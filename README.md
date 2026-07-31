# Strickhelfer 1.2.0

Eine kleine deutschsprachige Offline-PWA für Strickprojekte. Die App speichert alle Projekte und Einstellungen lokal im Browser.

## Funktionen

- Mehrere unabhängige Reihenzähler mit eigener Bezeichnung, Notiz, Ziel und Verlauf
- Beliebig zwischen pausierten und aktiven Zählern wechseln
- Optionales Reihenziel mit Fortschrittsbalken
- Anzeige als `Reihe X von Y` und in Prozent
- Verlauf der letzten 50 Änderungen mit Datum, Uhrzeit und Sekunden
- Projektverwaltung mit Zielreihen und Fortschritt
- Maschenrechner
- Reihenrechner
- Garnrechner mit Sicherheitsreserve
- Garnetikett-Scanner als Testfunktion
- Lokale Datensicherung und Wiederherstellung
- Installierbare PWA
- Offline-Nutzung der Kernfunktionen

## Garnetikett-Scanner

Der Scanner verwendet Tesseract.js für lokale Texterkennung im Browser. Das Foto wird nicht an einen eigenen Server der App übertragen.

Beim ersten Einsatz benötigt der Scanner Internet, um Tesseract.js und die Sprachdaten zu laden. Die erkannten Werte sind Vorschläge und sollten vor der Berechnung kontrolliert werden.

## Speicherung

Die App verwendet `localStorage`. Beim Löschen der Browserdaten können gespeicherte Projekte verloren gehen. Unter **Einstellungen → Daten sichern** kann eine JSON-Sicherung exportiert werden.

## Auf GitHub Pages veröffentlichen

1. Alle Dateien dieses Ordners in ein GitHub-Repository hochladen.
2. Im Repository **Settings → Pages** öffnen.
3. Unter **Build and deployment** die Quelle **Deploy from a branch** wählen.
4. Branch `main` und Ordner `/ (root)` auswählen.
5. Speichern. GitHub zeigt anschließend die veröffentlichte Adresse an.

Wichtig: Nicht nur `index.html`, sondern auch `app.js`, `styles.css`, `manifest.webmanifest`, `service-worker.js` und den Ordner `icons` hochladen.

## Lokal testen

PWA-Funktionen benötigen `http://` oder `https://`. Im Projektordner kann beispielsweise ein kleiner lokaler Server gestartet werden:

```bash
python -m http.server 8080
```

Danach im Browser öffnen:

```text
http://localhost:8080
```

## Versionshinweise 1.2.0

- Mehrere unabhängige Reihenzähler ergänzt
- Jeder Zähler besitzt eigenen Stand, Ziel, Notiz und Verlauf
- Schneller Wechsel zwischen gespeicherten Zählern
- Einzelne Zähler können gelöscht werden
- Bestehender Zähler aus Version 1.1.1 wird automatisch übernommen
- Verlauf bleibt je Zähler auf die letzten 50 Änderungen begrenzt
