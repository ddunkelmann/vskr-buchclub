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
  modal: document.getElementById("book-detail-modal"),
  modalClose: document.getElementById("modal-close"),
  modalCoverImage: document.getElementById("modal-cover-image"),
  modalCoverFallback: document.getElementById("modal-cover-fallback"),
  modalCoverFallbackTitle: document.getElementById("modal-cover-fallback-title"),
  modalGenre: document.getElementById("modal-genre"),
  modalBookTitle: document.getElementById("modal-book-title"),
  modalBookAuthor: document.getElementById("modal-book-author"),
  modalBuyLink: document.getElementById("modal-buy-link"),
  modalGoodreadsRating: document.getElementById("modal-goodreads-rating"),
  modalVskrRating: document.getElementById("modal-vskr-rating"),
  modalMemberRatings: document.getElementById("modal-member-ratings"),
  modalProposer: document.getElementById("modal-proposer"),
  modalCycle: document.getElementById("modal-cycle"),
  modalDateRange: document.getElementById("modal-date-range"),
  modalPublicationYear: document.getElementById("modal-publication-year"),
  modalPageCount: document.getElementById("modal-page-count"),
};

const appState = {
  model: null,
  activeBookId: null,
  lastFocusedElement: null,
};

initDetailModal();
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
  appState.model = model;
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
    cover_image: readFirstField(row, ["cover_image", "cover_url", "image_url"]),
    buy_link: readFirstField(row, ["buy_link", "buy_url", "purchase_url"]),
    goodreads_rating: toOptionalNumber(readFirstField(row, ["goodreads_rating", "goodreads", "goodreads_score"])),
    publication_year: readFirstField(row, ["publication_year", "published_year", "year"]),
    page_count: readFirstField(row, ["page_count", "pages", "pagecount"]),
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
      openBookDetail(bookId, button);
    });
  });
}

function initDetailModal() {
  if (!els.modal) {
    return;
  }

  els.modal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
      closeBookDetail();
    }
  });

  els.modalClose?.addEventListener("click", closeBookDetail);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.modal?.hidden) {
      closeBookDetail();
    }
  });
}

function openBookDetail(bookId, triggerElement) {
  const book = appState.model?.bookRows.find((entry) => entry.book_id === bookId);

  if (!book || !els.modal) {
    setStatus("Buchdetails konnten nicht geladen werden.");
    return;
  }

  appState.activeBookId = bookId;
  appState.lastFocusedElement = triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;

  populateBookDetail(book);

  els.modal.hidden = false;
  els.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  els.modalClose?.focus();
}

function closeBookDetail() {
  if (!els.modal || els.modal.hidden) {
    return;
  }

  els.modal.hidden = true;
  els.modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  appState.activeBookId = null;

  if (appState.lastFocusedElement instanceof HTMLElement) {
    appState.lastFocusedElement.focus();
  }
}

function populateBookDetail(book) {
  els.modalGenre.textContent = book.genre || "Genre offen";
  els.modalBookTitle.textContent = book.title || "Unbekanntes Buch";
  els.modalBookAuthor.textContent = book.author && book.author !== "Unbekannt"
    ? book.author
    : "Autor derzeit nicht hinterlegt";

  const buyLink = book.buy_link || createBuyLink(book.title, book.author);
  els.modalBuyLink.href = buyLink;
  els.modalBuyLink.setAttribute(
    "aria-label",
    `Kauf-Link fuer ${book.title || "dieses Buch"} in neuem Tab oeffnen`
  );

  els.modalGoodreadsRating.textContent = formatScaleValue(book.goodreads_rating, 5, "Noch nicht hinterlegt");
  els.modalVskrRating.textContent = formatScaleValue(book.avg, 10, "Noch keine VSKR-Wertung");
  renderModalMemberRatings(book);
  els.modalProposer.textContent = formatMetaValue(book.proposed_by);
  els.modalCycle.textContent = formatMetaValue(book.cycle);
  els.modalDateRange.textContent = formatDateRange(book.start_date, book.end_date);
  els.modalPublicationYear.textContent = formatMetaValue(book.publication_year);
  els.modalPageCount.textContent = book.page_count ? `${book.page_count} Seiten` : "k.A.";

  renderBookCover(book);
}

function renderBookCover(book) {
  const hasCover = Boolean(book.cover_image);

  els.modalCoverFallbackTitle.textContent = book.title || "VSKR";

  if (!hasCover) {
    els.modalCoverImage.hidden = true;
    els.modalCoverImage.removeAttribute("src");
    els.modalCoverImage.alt = "";
    els.modalCoverFallback.hidden = false;
    return;
  }

  els.modalCoverImage.src = book.cover_image;
  els.modalCoverImage.alt = `Cover von ${book.title || "dem Buch"}`;
  els.modalCoverImage.hidden = false;
  els.modalCoverFallback.hidden = true;

  els.modalCoverImage.onerror = () => {
    els.modalCoverImage.hidden = true;
    els.modalCoverImage.removeAttribute("src");
    els.modalCoverFallback.hidden = false;
  };
}

function renderModalMemberRatings(book) {
  if (!els.modalMemberRatings) {
    return;
  }

  const sorted = [...book.memberRatings.entries()]
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0], "de-DE");
    });

  if (!sorted.length) {
    els.modalMemberRatings.innerHTML = "<li>Keine Einzelwertungen vorhanden</li>";
    return;
  }

  els.modalMemberRatings.innerHTML = sorted
    .map(([member, value]) => `
      <li>
        <span>${escapeHtml(member)}</span>
        ${renderRatingBadge(value)}
      </li>
    `)
    .join("");
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
  const s = formatDate(start);
  const e = formatDate(end);
  return `${s} bis ${e}`;
}

function formatDate(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return dateText || "k.A.";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatScaleValue(value, scale, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return `${value.toFixed(2)} / ${scale}`;
}

function formatMetaValue(value) {
  return value && value !== "-/-" ? value : "k.A.";
}

function createBuyLink(title, author) {
  const parts = [title, author].filter((value) => value && value !== "Unbekannt");
  const query = encodeURIComponent(parts.join(" "));
  return `https://www.thalia.de/suche?sq=${query}`;
}

function readFirstField(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const value = String(row[key]).trim();
      if (value) {
        return value;
      }
    }
  }

  return "";
}

function toOptionalNumber(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
