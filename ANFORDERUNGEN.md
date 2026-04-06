# Anforderungen: VSKR Buchclub GitHub Page

## 1. Ziel der Website
Die Website stellt die Historie des Buchclubs VSKR (Versenker) öffentlich dar und zeigt nachvollziehbare Statistiken zu gelesenen Buechern und abgegebenen Bewertungen.

## 2. Kontext
- Der Buchclub besteht seit Februar 2024.
- Es gibt 7 Teilnehmende:
  - Gordon
  - Benjamin
  - Dennis
  - Simon
  - Tom
  - Jonah
  - Michi
- Es wird monatlich ein Buch gelesen.
- Das Vorschlagen/Auswaehlen der Buecher rotiert zwischen den Teilnehmenden.
- Nach jedem Lesemonat wird ein Buch mit 1 bis 10 Punkten bewertet.
- Nicht immer geben alle Teilnehmenden eine Bewertung ab.

## 3. Zielgruppe
- Primaere Nutzer: Mitglieder des Buchclubs.
- Sekundaere Nutzer: oeffentliche Besucher, die sich fuer die Historie und Statistiken interessieren.

## 4. Funktionale Anforderungen

### 4.1 Buch-Historie
Die Seite muss je Buch folgende Informationen anzeigen:
- Titel des Buchs
- Autor (falls vorhanden)
- Zeitraum von wann bis wann gelesen wurde
- Genre
- Von wem das Buch vorgeschlagen wurde

### 4.2 Einzelbewertungen und Gesamtwertung
Die Seite muss je Buch anzeigen:
- Welche Person welche Bewertung abgegeben hat
- Die daraus resultierende Gesamtwertung des Buchs

Regeln:
- Bewertungen sind numerisch von 1 bis 10.
- Gesamtwertung ist der arithmetische Mittelwert nur aus vorhandenen Bewertungen.
- Fehlende Bewertungen duerfen den Mittelwert nicht als 0 beeinflussen.

### 4.3 Statistiken
Die Seite muss folgende Statistiken bereitstellen:
1. Top 3 und Flop 3 Buecher (nach Gesamtwertung)
2. Durchschnittswertung nach Genre
3. Durchschnittswertung nach vorschlagender Person
4. Ranking der bewertenden Personen (wer gibt im Durchschnitt die hoechsten bzw. niedrigsten Punkte)
5. Durchschnittswerte pro Durchgang (ein Durchgang entspricht einem Halbjahr)
6. Buecher mit groesster Wertungsdifferenz und Buecher mit groesster Einigkeit

Definition fuer Einigkeit/Differenz:
- Wertungsdifferenz pro Buch = hoechste Einzelwertung minus niedrigste Einzelwertung.
- Groesste Einigkeit = kleinste Wertungsdifferenz bei mindestens 2 Bewertungen.

## 5. Datenanforderungen
Die Daten werden als CSV-Dateien bereitgestellt. Die Website muss fuer diesen Datenweg ausgelegt sein.

### 5.1 Minimale Datenstruktur
Es sollen mindestens zwei CSV-Dateien genutzt werden:

1. Buecher-Datei (z. B. books.csv)
- book_id (eindeutig)
- title
- author (optional)
- genre
- start_date
- end_date
- proposed_by
- cycle (optional; falls leer, wird Halbjahr aus start_date berechnet)

2. Bewertungen-Datei (z. B. ratings.csv)
- book_id
- person
- rating

### 5.2 Datenvalidierung
- rating muss numerisch im Bereich 1 bis 10 liegen.
- book_id in Bewertungen muss in der Buecher-Datei existieren.
- person sollte einer der 7 bekannten Teilnehmenden sein (oder als zusaetzliche Person kenntlich gemacht werden).
- Datumsfelder muessen auswertbar sein.

## 6. UI- und Designanforderungen
- Die UI muss einfach, klar und verstaendlich sein.
- Die Seite muss auf Desktop und Mobilgeraeten nutzbar sein.
- Branding:
  - Name/Marke: VSKR (Versenker)
  - Typografie: BOLD/markant
  - Hauptakzentfarbe: Blau
- Tabellen und Statistiken muessen gut lesbar und schnell erfassbar sein.

## 7. Nicht-funktionale Anforderungen
- Die Seite muss oeffentlich zugaenglich sein.
- Die Seite muss als GitHub Page statisch auslieferbar sein.
- Das Aktualisieren der Daten ueber neue CSV-Dateien soll ohne komplexe Deploy-Schritte moeglich sein.

## 8. Abgrenzung
Nicht Teil des initialen Scopes:
- Login oder Rollen-/Rechtesystem
- Private Mitgliederbereiche
- Manuelle Datenerfassung in der Website (statt CSV)

## 9. Akzeptanzkriterien
Die Anforderungen gelten als erfuellt, wenn:
1. Die Historie aller Buecher mit Zeitraum, Genre und vorschlagender Person angezeigt wird.
2. Einzelbewertungen je Person und Gesamtwertung je Buch sichtbar sind.
3. Alle 6 Statistikbereiche korrekt berechnet und sichtbar sind.
4. Fehlende Bewertungen korrekt als nicht vorhanden behandelt werden.
5. Das Erscheinungsbild die VSKR-Vorgaben (BOLD, Blau, klar) erkennbar umsetzt.
6. Die Seite auf GitHub Pages oeffentlich aufrufbar ist.
