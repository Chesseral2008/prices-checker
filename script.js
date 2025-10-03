// ---------- tiny helpers ----------
const qs = (s, el = document) => el.querySelector(s);
const hostOf = (u = "") => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

const $q = qs('#query');
const $loc = qs('#location');
const $btn = qs('#searchBtn');
const $tbody = qs('#results-body');
qs('#year').textContent = new Date().getFullYear();

// ---------- allow/block heuristics ----------
const ALLOWED = new Set([
  "amazon.com","bestbuy.com","walmart.com","apple.com","store.google.com",
  "lenovo.com","hp.com","dell.com","microsoft.com","microcenter.com",
  "newegg.com","bhphotovideo.com","target.com","costco.com","ebay.com",
  "lazada.com.ph","shopee.ph","smmarkets.ph","abenson.com","pcx.com.ph",
  "noon.com","jarir.com","extra.com","carrefourksa.com","luluhypermarket.com","xcite.com"
]);

const BLOCKED = new Set([
  "wikipedia.org","reddit.com","medium.com","youtube.com","blogspot.com",
  "wordpress.com","x.com","twitter.com","news.ycombinator.com",
  // these are substrings; we will check against host includes()
  "support","community","forum"
]);

function looksProductLike(item) {
  const link = item.link || "";
  const host = hostOf(link);
  if (!host) return false;

  // block obvious non-product sites
  for (const b of BLOCKED) { if (host.includes(b)) return false; }
  if (ALLOWED.has(host)) return true;

  const t = (item.title || item.name || "").toLowerCase();
  return /\b(buy|price|shop|add to cart|cart|store|model|sku)\b/.test(t);
}

// ---------- normalize API rows to a single shape ----------
function normalize(row) {
  return {
    title:      row.title || row.name || row.productTitle || "",
    category:   row.category || row.cat || "",
    brand:      row.brand || row.maker || "",
    store:      row.store || hostOf(row.product_link || row.link || row.url || ""),
    location:   row.location || row.country || "",
    price:      row.price ?? row.amount ?? row.currentPrice ?? "",
    currency:   row.currency || row.ccy || "",
    unit:       row.unit || "",
    specs:      row.specs || row.description || "",
    link:       row.product_link || row.link || row.url || "",
    image:      row.image_url || row.image || row.thumbnail || "",
    verified:   row.is_verified ?? row.verified ?? false
  };
}

// ---------- rendering ----------
function renderRows(items) {
  $tbody.innerHTML = '';
  if (!items?.length) {
    $tbody.innerHTML =
      `<tr><td colspan="12" style="color:#6b7280">No results yet. Try another keyword.</td></tr>`;
    return;
  }
  for (const it of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.title}</td>
      <td>${it.category}</td>
      <td>${it.brand}</td>
      <td>${it.store}</td>
      <td>${it.location}</td>
      <td>${it.price}</td>
      <td>${it.currency}</td>
      <td>${it.unit}</td>
      <td>${it.specs ? String(it.specs).slice(0,160) : ''}</td>
      <td>${it.link ? `<a class="link" href="${it.link}" target="_blank" rel="noopener">View</a>` : ''}</td>
      <td>${it.image ? `<img class="thumb" src="${it.image}" alt="">` : ''}</td>
      <td>${it.verified ? `<span class="badge ok">✓ Verified</span>` : `<span class="badge">—</span>`}</td>
    `;
    $tbody.appendChild(tr);
  }
}

// ---------- search flow ----------
async function runSearch(q, loc) {
  $tbody.innerHTML = `<tr><td colspan="12" style="color:#6b7280">Searching…</td></tr>`;
  $btn.disabled = true;
  try {
    const url = new URL('/api/products', location.origin);
    url.searchParams.set('q', q);
    if (loc && loc !== 'all') url.searchParams.set('loc', loc);

    const res = await fetch(url.toString(), { cache: "no-store" });
    // In case of non-2xx, throw to the catch block
    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = await res.json();
    // one-time debug so we can see exact shape if needed
    console.debug('[products] raw payload:', data);

    // Support different root keys: results | items | data | array
    const raw = Array.isArray(data)
      ? data
      : data.results || data.items || data.data || [];

    const normalized = raw.map(normalize);
    const filtered   = normalized.filter(looksProductLike);
    renderRows(filtered);
  } catch (e) {
    console.error(e);
    $tbody.innerHTML =
      `<tr><td colspan="12" style="color:#b91c1c">Error loading results. Try again.</td></tr>`;
  } finally {
    $btn.disabled = false;
  }
}

// ---------- events ----------
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $q.value.trim();
  const loc = $loc ? $loc.value : 'all';
  if (!q) { $tbody.innerHTML = ''; return; }
  runSearch(q, loc);
});

// Optional: initial search if there is a prefilled query
if ($q.value.trim()) runSearch($q.value.trim(), $loc ? $loc.value : 'all');
