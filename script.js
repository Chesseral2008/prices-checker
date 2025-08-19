// script.js
// Filters out non-product/service pages and renders the table

// --- Helpers -------------------------------------------------------------
function getHostFromUrl(url = "") {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function clean(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function money(text = "") {
  // Extract a currency symbol and numeric portion if present
  const m = clean(text).match(/^([^\d\-+]*)(.*)$/);
  if (!m) return { price: null, currency: null };
  const currency = clean(m[1]) || null;
  const priceText = clean(m[2]).replace(/[^\d.,\-]/g, "");
  const price = priceText || null;
  return { price, currency };
}

// --- Allow/Block host lists (edit freely) --------------------------------
const ALLOWED_HOSTS = new Set([
  "amazon.com", "bestbuy.com", "walmart.com", "samsung.com",
  "lenovo.com", "hp.com", "dell.com", "apple.com", "store.google.com",
  "microcenter.com", "newegg.com", "bhphotovideo.com", "target.com",
  "costco.com", "caudabe.com", "frame.work", "ebay.com"
]);

const BLOCKED_HOSTS = new Set([
  "wikipedia.org", "reddit.com", "medium.com", "youtube.com",
  "blogspot.com", "wordpress.com", "x.com", "twitter.com",
  "news.ycombinator.com", "pcmag.com", "cnet.com", "theverge.com"
]);

function isLikelyProduct(row) {
  const host = getHostFromUrl(row.product_link || "");
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host)) return false;

  // If we explicitly allow a real store, keep it
  if (ALLOWED_HOSTS.has(host)) return true;

  // Very light heuristic: keep pages that look like product pages
  const t = `${row.title || row.name || ""} ${row.site || ""}`.toLowerCase();
  if (/\b(buy|price|shop|add to cart|cart|store|model|sku)\b/.test(t)) return true;

  // otherwise drop it
  return false;
}

// --- DOM helpers ---------------------------------------------------------
const $q = (sel) => document.querySelector(sel);
const $tbody = () => $q("#results-body");

function clearTable() { $tbody().innerHTML = ""; }

function renderRows(rows) {
  clearTable();
  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 11;
    td.textContent = "No results. Try a more specific query.";
    tr.appendChild(td);
    $tbody().appendChild(tr);
    return;
  }

  for (const r of rows) {
    const tr = document.createElement("tr");

    const host = getHostFromUrl(r.product_link || "");
    const title = clean(r.title || r.name || "");
    const spec = clean(r.specs || "");

    // Coerce price/currency if the row packed them together
    let price = r.price ?? null;
    let currency = r.currency ?? null;
    if (!price && typeof r.price === "string" && r.price) {
      const m = money(r.price);
      price = m.price;
      currency = currency || m.currency;
    }

    const cells = [
      title || "(Untitled)",
      clean(r.category || ""),
      clean(r.brand || ""),
      host || clean(r.site || ""),
      clean(r.location || ""),
      price || "",
      currency || "",
      clean(r.unit || ""),
      spec || "",
    ];

    for (const c of cells) {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    }

    // Product Link
    const tdLink = document.createElement("td");
    if (r.product_link) {
      const a = document.createElement("a");
      a.href = r.product_link;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "View";
      tdLink.appendChild(a);
    }
    tr.appendChild(tdLink);

    // Image
    const tdImg = document.createElement("td");
    if (r.image_url) {
      const img = document.createElement("img");
      img.src = r.image_url;
      img.alt = title.slice(0, 60);
      img.style.maxWidth = "64px";
      img.style.maxHeight = "64px";
      tdImg.appendChild(img);
    }
    tr.appendChild(tdImg);

    // Verified
    const tdVer = document.createElement("td");
    tdVer.textContent = r.is_verified ? "✓" : "";
    tr.appendChild(tdVer);

    $tbody().appendChild(tr);
  }
}

// --- Search flow ---------------------------------------------------------
async function search(q) {
  const url = `/api/products?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // data can be an array or { results: [...] }
  const list = Array.isArray(data) ? data : (data.results || []);

  // Filter to product-like rows
  const filtered = list.filter(isLikelyProduct);

  renderRows(filtered);
}

function init() {
  const input = $q("#query");
  const locationSelect = $q("#location"); // not used yet; kept for UI compatibility
  const form = $q("#search-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { clearTable(); return; }
    search(q);
  });

  // initial auto-search if there’s a value
  if (input.value.trim()) {
    search(input.value.trim());
  }
}

document.addEventListener("DOMContentLoaded", init);
