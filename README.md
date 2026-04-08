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
- Optional fuer den Detail-Popup: cover_image,buy_link,goodreads_rating,publication_year,page_count

Bewertungsdatei:
- book_id,person,rating

## Detail-Popup

Ein Klick auf einen Buchtitel in der Tabelle oeffnet ein Popup mit Cover, Titel, Autor, Kauf-Link,
Goodreads-Wertung, VSKR-Durchschnitt sowie Erscheinungsjahr und Seitenzahl.

Wenn optionale Felder in der Buecher-CSV fehlen, werden sichere Fallbacks angezeigt:
- cover_image: stilisierte Cover-Kachel statt Bild
- buy_link: automatisch erzeugte Thalia-Suche aus Titel und Autor
- goodreads_rating, publication_year, page_count: Anzeige als k.A. bzw. nicht hinterlegt

