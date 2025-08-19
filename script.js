// script.js
// Filters out non-product/service pages and renders a clean table

// --- Helpers ----------------------------------------------------
function getHostFromUrl(url = "") {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

// allow-list: real shopping domains (edit/add freely)
const ALLOWED_HOSTS = [
  "amazon.com", "bestbuy.com", "walmart.com", "samsung.com",
  "lenovo.com", "hp.com", "dell.com", "apple.com", "store.google.com",
  "microcenter.com", "newegg.com", "bhphotovideo.com", "target.com",
  "costco.com", "caudabe.com", "frame.work"
];

// block-list: content/aggregator/social/news
const BLOCKED_HOSTS = [
  "wikipedia.org", "reddit.com", "medium.com", "youtube.com",
  "blogspot.com", "wordpress.com", "theverge.com", "cnn.com",
  "engadget.com", "pcmag.com", "techradar.com"
];

// heuristics that signal a product/service page
const PRODUCT_PATH_HINTS = /(product|products|buy|cart|sku|dp|item|p\/|shop|store|checkout)/i;
const SERVICE_WORDS = /(subscription|plan|membership|service|support)/i;

function looksLikeProductOrService(row) {
  const link = row.product_link || "";
  const name = (row.name || row.product_name || "").toLowerCase();
  const category = (row.category || "").toLowerCase();

  const hasPrice = row.price !== null && row.price !== undefined && row.price !== "";
  const hasImage = !!row.image_url;
  const productyUrl = PRODUCT_PATH_HINTS.test(link);
  const servicey = SERVICE_WORDS.test(category) || SERVICE_WORDS.test(name);

  // keep if: (clearly a product page) OR (has price) OR (clearly a service)
  return productyUrl || hasPrice || servicey || hasImage;
}

function isAllowedHost(host) {
  if (!host) return false;
  if (BLOCKED_HOSTS.some(b => host.endsWith(b))) return false;
  return ALLOWED_HOSTS.some(a => host.endsWith(a));
}

function normalizeHost(row) {
  const fromStore = (row.store || "").replace(/^https?:\/\//, "");
  const storeHost = fromStore ? fromStore.split("/")[0].replace(/^www\./, "") : "";
  const linkHost = getHostFromUrl(row.product_link);
  return storeHost || linkHost || "";
}

// --- DOM refs ---------------------------------------------------
const tableBody = document.querySelector('#productsTable tbody');
const locationFilter = document.getElementById('locationFilter');
const searchInput = document.getElementById('searchInput');

// --- Fetch from your serverless API -----------------------------
async function fetchProducts(q = "") {
  const url = q ? `/api/products?q=${encodeURIComponent(q)}` : `/api/products`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
}

// --- Filtering pipeline -----------------------------------------
function filterResults(rows) {
  return rows
    .map(r => ({ ...r, __host: normalizeHost(r) }))
    .filter(r => isAllowedHost(r.__host))         // 1) host must be a shop
    .filter(looksLikeProductOrService);           // 2) must look like product/service
}

// --- UI: table + filters ----------------------------------------
function populateTable(data) {
  tableBody.innerHTML = '';

  const uniqueLocations = new Set();

  data.forEach(item => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${item.name || item.product_name || ''}</td>
      <td>${item.category || ''}</td>
      <td>${item.brand || ''}</td>
      <td>${item.store || item.__host || ''}</td>
      <td>${item.location || ''}</td>
      <td>${item.price ?? ''}</td>
      <td>${item.currency || ''}</td>
      <td>${item.unit || ''}</td>
      <td>${item.specs || ''}</td>
      <td>${item.product_link ? `<a href="${item.product_link}" target="_blank">View</a>` : ''}</td>
      <td>${item.image_url ? `<img src="${item.image_url}" alt="Image" style="max-width: 60px;"/>` : ''}</td>
      <td>${item.is_verified ? '✅' : ''}</td>
    `;

    tableBody.appendChild(row);
    if (item.location) uniqueLocations.add(item.location);
  });

  updateLocationFilter(uniqueLocations);
}

function updateLocationFilter(locations) {
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  [...locations].sort().forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

function applyClientFilters(data) {
  const searchText = searchInput.value.toLowerCase();
  const selectedLocation = locationFilter.value;

  return data.filter(item => {
    const matchesSearch =
      (item.name || item.product_name || '').toLowerCase().includes(searchText) ||
      (item.brand || '').toLowerCase().includes(searchText) ||
      (item.store || '').toLowerCase().includes(searchText);

    const matchesLocation = !selectedLocation || item.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });
}

// --- Load + wire events -----------------------------------------
async function loadAndDisplay() {
  const query = (searchInput.value || '').trim();
  const raw = await fetchProducts(query);
  const filtered = filterResults(raw);
  populateTable(applyClientFilters(filtered));
}

searchInput.addEventListener('input', () => loadAndDisplay());
locationFilter.addEventListener('change', () => loadAndDisplay());

// first load
loadAndDisplay();
