const KNOWN_MEMBERS = [
  "Gordon",
  "Benjamin",
  "Dennis",
  "Simon",
  "Tom",
  "Jonah",
  "Michi",
];

const els = {
  status: document.getElementById("status"),
  tableBody: document.getElementById("book-table-body"),
  top3: document.getElementById("top3"),
  flop3: document.getElementById("flop3"),
  genreAvg: document.getElementById("genre-avg"),
  proposerAvg: document.getElementById("proposer-avg"),
  personRanking: document.getElementById("person-ranking"),
  cycleAvg: document.getElementById("cycle-avg"),
  largestSpread: document.getElementById("largest-spread"),
  smallestSpread: document.getElementById("smallest-spread"),
};

setStatus("Lade Daten aus dem data-Ordner ...");
loadDefaultData();

async function loadDefaultData() {
  try {
    setStatus("Lade data/books.csv und data/ratings.csv ...");
    const [booksText, ratingsText] = await Promise.all([
      fetchText("data/books.csv"),
      fetchText("data/ratings.csv"),
    ]);
    processData(booksText, ratingsText);
  } catch (error) {
    setStatus("Dateien im data-Ordner nicht gefunden oder nicht lesbar.");
  }
}

function processData(booksCsv, ratingsCsv) {
  const books = parseCsv(booksCsv).map(normalizeBookRow);
  const ratings = parseCsv(ratingsCsv)
    .map(normalizeRatingRow)
    .filter((row) => Number.isFinite(row.rating) && row.rating >= 1 && row.rating <= 10);

  if (!books.length) {
    setStatus("Buecher CSV ist leer oder ungueltig.");
    return;
  }

  const model = buildModel(books, ratings);
  renderTable(model.bookRows);
  renderStats(model);
  setStatus(`Daten geladen: ${books.length} Buecher, ${ratings.length} Bewertungen.`);
}

function normalizeBookRow(row) {
  return {
    book_id: String(row.book_id || "").trim(),
    title: String(row.title || "").trim(),
    author: String(row.author || "").trim(),
    genre: String(row.genre || "").trim(),
    start_date: String(row.start_date || "").trim(),
    end_date: String(row.end_date || "").trim(),
    proposed_by: String(row.proposed_by || "").trim(),
    cycle: String(row.cycle || "").trim(),
  };
}

function normalizeRatingRow(row) {
  return {
    book_id: String(row.book_id || "").trim(),
    person: String(row.person || "").trim(),
    rating: Number(row.rating),
  };
}

function buildModel(books, ratings) {
  const ratingsByBook = groupBy(ratings, "book_id");

  const bookRows = books.map((book) => {
    const entries = ratingsByBook.get(book.book_id) || [];
    const values = entries.map((entry) => entry.rating);
    const memberRatings = new Map(entries.map((entry) => [entry.person, entry.rating]));

    return {
      ...book,
      values,
      avg: values.length ? average(values) : null,
      spread: values.length >= 2 ? Math.max(...values) - Math.min(...values) : null,
      cycle: book.cycle || toHalfYearLabel(book.start_date),
      memberRatings,
    };
  });

  const ratedBooks = bookRows.filter((book) => book.avg !== null);

  const top3 = [...ratedBooks].sort((a, b) => b.avg - a.avg).slice(0, 3);
  const flop3 = [...ratedBooks].sort((a, b) => a.avg - b.avg).slice(0, 3);

  const genreAvg = groupedAverage(bookRows, (book) => book.genre, (book) => book.values);
  const proposerAvg = groupedAverage(
    bookRows,
    (book) => book.proposed_by,
    (book) => book.values
  );

  const personScores = KNOWN_MEMBERS.map((member) => {
    const values = ratings.filter((r) => r.person === member).map((r) => r.rating);
    return {
      label: member,
      value: values.length ? average(values) : null,
    };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  const cycleAvg = groupedAverage(bookRows, (book) => book.cycle, (book) => book.values);

  const withSpread = ratedBooks.filter((book) => book.spread !== null);
  const largestSpread = [...withSpread].sort((a, b) => b.spread - a.spread).slice(0, 3);
  const smallestSpread = [...withSpread].sort((a, b) => a.spread - b.spread).slice(0, 3);

  return {
    bookRows,
    top3,
    flop3,
    genreAvg,
    proposerAvg,
    personScores,
    cycleAvg,
    largestSpread,
    smallestSpread,
  };
}

function renderTable(rows) {
  els.tableBody.innerHTML = rows
    .map((row) => {
      const ratingCells = KNOWN_MEMBERS.map((member) => {
        const value = row.memberRatings.get(member);
        return `<td>${renderRatingBadge(value)}</td>`;
      }).join("");

      return `
      <tr>
        <td>
          <button
            type="button"
            class="book-link"
            data-book-id="${escapeHtml(row.book_id)}"
            aria-label="Details fuer ${escapeHtml(row.title || "Buch")} anzeigen"
          >
            ${escapeHtml(row.title || "-")}
          </button>
        </td>
        <td>${renderRatingBadge(row.avg, true)}</td>
        ${ratingCells}
      </tr>
    `;
    })
    .join("");

  const bookButtons = els.tableBody.querySelectorAll(".book-link");
  bookButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const bookId = button.dataset.bookId;
      setStatus(`Detailsansicht fuer Buch-ID ${bookId} folgt im naechsten Schritt.`);
    });
  });
}

function renderRatingBadge(value, isTotal = false) {
  if (!Number.isFinite(value)) {
    return '<span class="rating-empty">-</span>';
  }

  const clamped = clamp(value, 0, 10);
  const rgb = colorByScore(clamped);
  const bgColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  const textColor = getReadableTextColor(rgb);
  const classes = isTotal ? "rating-badge rating-badge-total" : "rating-badge";

  return `<span class="${classes}" style="background:${bgColor};color:${textColor};">${clamped.toFixed(1)}</span>`;
}

function colorByScore(score) {
  const minColor = [220, 53, 69];
  const midColor = [255, 167, 38];
  const maxColor = [40, 167, 69];
  const clamped = clamp(score, 0, 10);

  if (clamped <= 5) {
    const ratioLow = Math.pow(clamped / 5, 1.15);
    return mixRgb(minColor, midColor, ratioLow);
  }

  const ratioHigh = Math.pow((clamped - 5) / 5, 0.8);
  return mixRgb(midColor, maxColor, ratioHigh);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mixRgb(from, to, ratio) {
  return from.map((fromValue, index) => {
    const toValue = to[index];
    return Math.round(fromValue + (toValue - fromValue) * ratio);
  });
}

function getReadableTextColor(rgb) {
  const [r, g, b] = rgb;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 150 ? "#05140f" : "#f4f8ff";
}

function renderStats(model) {
  renderList(
    els.top3,
    model.top3.map((book) => `${book.title} (${book.avg.toFixed(2)})`),
    true
  );
  renderList(
    els.flop3,
    model.flop3.map((book) => `${book.title} (${book.avg.toFixed(2)})`),
    true
  );
  renderList(
    els.genreAvg,
    model.genreAvg.map((item) => `${item.label}: ${item.value.toFixed(2)}`)
  );
  renderList(
    els.proposerAvg,
    model.proposerAvg.map((item) => `${item.label}: ${item.value.toFixed(2)}`)
  );
  renderList(
    els.personRanking,
    model.personScores.map((item) =>
      item.value === null ? `${item.label}: keine Bewertung` : `${item.label}: ${item.value.toFixed(2)}`
    ),
    true
  );
  renderList(
    els.cycleAvg,
    model.cycleAvg.map((item) => `${item.label}: ${item.value.toFixed(2)}`)
  );
  renderList(
    els.largestSpread,
    model.largestSpread.map((book) => `${book.title}: ${book.spread.toFixed(2)}`)
  );
  renderList(
    els.smallestSpread,
    model.smallestSpread.map((book) => `${book.title}: ${book.spread.toFixed(2)}`)
  );
}

function renderList(target, items, ordered = false) {
  if (!items.length) {
    target.innerHTML = `<li>Keine Daten</li>`;
    return;
  }

  target.innerHTML = items.map((text) => `<li>${escapeHtml(text)}</li>`).join("");

  if (ordered) {
    target.setAttribute("start", "1");
  }
}

function groupedAverage(rows, groupKeyFn, valuesFn) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = (groupKeyFn(row) || "Unbekannt").trim();
    const values = valuesFn(row);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(...values);
  });

  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      value: values.length ? average(values) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function parseCsv(text) {
  if (!window.Papa) {
    throw new Error("PapaParse nicht verfuegbar");
  }

  const result = window.Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  return result.data;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupBy(items, key) {
  const map = new Map();

  items.forEach((item) => {
    const value = item[key];
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value).push(item);
  });

  return map;
}

function toHalfYearLabel(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "Unbekannt";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const half = month <= 6 ? "H1" : "H2";
  return `${year}-${half}`;
}

function formatDateRange(start, end) {
  const s = start || "?";
  const e = end || "?";
  return `${s} bis ${e}`;
}

function setStatus(text) {
  els.status.textContent = text;
}

function fetchText(path) {
  return fetch(path).then((res) => {
    if (!res.ok) {
      throw new Error("Datei nicht gefunden");
    }
    return res.text();
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
