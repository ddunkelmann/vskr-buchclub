# vskr-buchclub

Statische GitHub Page fuer den Buchclub VSKR (Versenker).

## Inhalt
- ANFORDERUNGEN.md: fachliche und gestalterische Anforderungen
- index.html, styles.css, script.js: erste umgesetzte Website
- data/books.example.csv und data/ratings.example.csv: Beispiel-Datensaetze

## Lokal testen
1. index.html im Browser oeffnen.
2. Auf "Standarddateien laden" klicken.

Die Dateien data/books.csv und data/ratings.csv sind bereits als Demo-Daten enthalten.

Alternativ koennen zwei eigene CSV-Dateien direkt ueber die Upload-Felder geladen werden.

## GitHub Pages
1. Repository nach GitHub pushen.
2. In den Repo-Settings unter Pages als Source "Deploy from a branch" waehlen.
3. Branch main und Ordner /(root) auswaehlen.
4. Nach dem Deploy ist die Seite oeffentlich erreichbar.

## Erwartete CSV-Spalten

Buecherdatei:
- book_id,title,author,genre,start_date,end_date,proposed_by,cycle

Bewertungsdatei:
- book_id,person,rating

