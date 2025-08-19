// script.js — robust renderer for /api/products

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const tbody = () => $("#results-body");

function clearTable() { tbody().innerHTML = ""; }
function rowText(s) { return (s ?? "").toString().replace(/\s+/g, " ").trim(); }
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } }

const ALLOWED = new Set([
  "amazon.com","bestbuy.com","walmart.com","samsung.com","lenovo.com","hp.com",
  "dell.com","apple.com","store.google.com","microcenter.com","newegg.com",
  "bhphotovideo.com","target.com","costco.com","caudabe.com","frame.work","ebay.com"
]);
const BLOCKED = new Set([
  "wikipedia.org","reddit.com","medium.com","youtube.com","blogspot.com",
  "wordpress.com","x.com","twitter.com","news.ycombinator.com","pcmag.com",
  "cnet.com","theverge.com"
]);

function isProductLike(item) {
  const linkHost = hostOf(item.product_link || "");
  if (!linkHost) return false;
  if (BLOCKED.has(linkHost)) return false;
  if (ALLOWED.has(linkHost)) return true;

  const t = `${item.title || item.name || ""} ${item.site || ""}`.toLowerCase();
  return /\b(buy|price|shop|add to cart|cart|store|model|sku)\b/.test(t);
}

function messageRow(text) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 12;
  td.style.padding = "12px";
  td.textContent = text;
  tr.appendChild(td);
  return tr;
}

function render(rows) {
  clearTable();
  if (!rows || !rows.length) {
    tbody().appendChild(messageRow("No results. Try a broader or different keyword."));
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement("tr");

    const title = rowText(r.title || r.name || "");
    const category = rowText(r.category || "");
    const brand = rowText(r.brand || "");
    const store = hostOf(r.product_link || "") || rowText(r.site || "");
    const location = rowText(r.location || "");

    // price & currency might be split or combined; just print what we have
    const price = r.price ?? "";
    const currency = r.currency ?? "";
    const unit = rowText(r.unit || "");
    const specs = rowText(r.specs || "");

    [
      title, category, brand, store, location, price, currency, unit, specs
    ].forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });

    // product link
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

    // image
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

    // verified
    const tdV = document.createElement("td");
    tdV.textContent = r.is_verified ? "✓" : "";
    tr.appendChild(tdV);

    tbody().appendChild(tr);
  });
}

// ---------- fetch + wire ----------
async function fetchResults(q) {
  if (!q) {
    clearTable();
    return;
  }
  try {
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // API returns either an array or { results: [...] }
    const list = Array.isArray(data) ? data : (data.results || []);
    const filtered = list.filter(isProductLike);
    render(filtered);
  } catch (err) {
    console.error("Search error:", err);
    clearTable();
    tbody().appendChild(messageRow("Could not load results. Try again in a moment."));
  }
}

function init() {
  const input = $("#query");
  const form = $("#search-form");

  // Submit handler (button click)
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      fetchResults(input.value.trim());
    });
  }

  // Enter key handler (in case form is missing / not used)
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      fetchResults(input.value.trim());
    }
  });

  // Auto search on load if there is a preset value
  if (input.value.trim()) {
    fetchResults(input.value.trim());
  }
}

document.addEventListener("DOMContentLoaded", init);
