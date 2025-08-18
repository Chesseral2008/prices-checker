// script.js — frontend only; NO secrets here

// --- DOM handles ---
const tableBody      = document.querySelector('#productsTable tbody');
const locationFilter = document.getElementById('locationFilter');
const searchInput    = document.getElementById('searchInput');

// Internal cache of products so filters are instant
let ALL_PRODUCTS = [];

// Small helper to escape text before inserting into HTML
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Debounce for search input
function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Fetch from our serverless route (no keys in the browser)
async function fetchProducts() {
  // Optional: show a quick loading row
  if (tableBody) {
    tableBody.innerHTML =
      `<tr><td colspan="12" style="text-align:center;opacity:.7">Loading…</td></tr>`;
  }

  try {
    const res = await fetch('/api/products', { method: 'GET' });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const json = await res.json();

    // Be defensive about the shape
    const data =
      Array.isArray(json) ? json :
      Array.isArray(json?.data) ? json.data :
      Array.isArray(json?.items) ? json.items : [];

    ALL_PRODUCTS = data;
    populateLocations(data);
    renderTable(data);
  } catch (err) {
    console.error('Failed to load products:', err);
    if (tableBody) {
      tableBody.innerHTML =
        `<tr><td colspan="12" style="color:#b00;text-align:center">Failed to load products.</td></tr>`;
    }
  }
}

function populateLocations(items) {
  if (!locationFilter) return;
  const set = new Set();
  items.forEach(p => {
    if (p?.location) set.add(p.location);
  });

  // Fill the dropdown
  locationFilter.innerHTML = `<option value="">All Locations</option>`;
  [...set].sort((a, b) => String(a).localeCompare(String(b))).forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
}

function applyFilters() {
  const q = (searchInput?.value || '').trim().toLowerCase();
  const loc = locationFilter?.value || '';

  return ALL_PRODUCTS.filter(p => {
    const matchesQ =
      !q ||
      String(p?.name ?? '').toLowerCase().includes(q) ||
      String(p?.brand ?? '').toLowerCase().includes(q);

    const matchesLoc = !loc || String(p?.location ?? '') === loc;

    return matchesQ && matchesLoc;
  });
}

function renderTable(items) {
  if (!tableBody) return;

  if (!items?.length) {
    tableBody.innerHTML =
      `<tr><td colspan="12" style="text-align:center;opacity:.7">No results.</td></tr>`;
    return;
  }

  // Build rows
  const rows = items.map(p => {
    const name      = esc(p?.name);
    const category  = esc(p?.category);
    const brand     = esc(p?.brand);
    const store     = esc(p?.store);
    const location  = esc(p?.location);
    const price     = p?.price ?? '';
    const currency  = esc(p?.currency);
    const unit      = esc(p?.unit);
    const specs     = esc(p?.specs);
    const linkHTML  = p?.product_link
      ? `<a href="${esc(p.product_link)}" target="_blank" rel="noopener">View</a>`
      : '';
    const imgHTML   = p?.image_url
      ? `<img src="${esc(p.image_url)}" alt="Image" style="max-width:60px;max-height:60px;object-fit:contain" />`
      : '';
    const verified  = p?.is_verified ? '✅' : '';

    return `
      <tr>
        <td>${name}</td>
        <td>${category}</td>
        <td>${brand}</td>
        <td>${store}</td>
        <td>${location}</td>
        <td>${price}</td>
        <td>${currency}</td>
        <td>${unit}</td>
        <td>${specs}</td>
        <td>${linkHTML}</td>
        <td>${imgHTML}</td>
        <td>${verified}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = rows.join('');
}

// Wire up UI events
function initFilters() {
  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce(() => renderTable(applyFilters()), 200)
    );
  }
  if (locationFilter) {
    locationFilter.addEventListener('change', () => {
      renderTable(applyFilters());
    });
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  fetchProducts();
});
