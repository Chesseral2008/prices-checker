/***********************
 * CONFIG
 ***********************/
const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

// TEMP for quick test (we'll secure later with a proxy):
const GOOGLE_API_KEY = 'AIzaSyB7fZIM7o4coxsafDyfJdKim0VX-iBoLjs';
const GOOGLE_CSE_ID  = 'c6caff67ea27c44df'; // your CX

/***********************
 * DOM
 ***********************/
const tableBody      = document.querySelector('#productsTable tbody');
const locationFilter = document.getElementById('locationFilter');
const searchInput    = document.getElementById('searchInput');

/***********************
 * SUPABASE
 ***********************/
async function fetchSupabaseData() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/all_products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  if (!res.ok) return [];
  return res.json();
}

function populateTableFromSupabase(data) {
  tableBody.innerHTML = '';
  const uniqueLocations = new Set();

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name || ''}</td>
      <td>${item.category || ''}</td>
      <td>${item.brand || ''}</td>
      <td>${item.store || ''}</td>
      <td>${item.location || ''}</td>
      <td>${item.price ?? ''}</td>
      <td>${item.currency || ''}</td>
      <td>${item.unit || ''}</td>
      <td>${item.specs || ''}</td>
      <td>${item.product_link ? `<a href="${item.product_link}" target="_blank" rel="noopener">View</a>` : ''}</td>
      <td>${item.image_url ? `<img src="${item.image_url}" alt="" style="max-width:60px">` : ''}</td>
      <td>${item.is_verified ? '✅' : ''}</td>
    `;
    tableBody.appendChild(row);
    if (item.location) uniqueLocations.add(item.location);
  });

  updateLocationFilter(uniqueLocations);
}

function updateLocationFilter(locations) {
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  [...locations].sort().forEach(loc => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
}

function applySupabaseFilters(data) {
  const q = searchInput.value.trim().toLowerCase();
  const selLoc = locationFilter.value;
  return data.filter(item => {
    const matchesSearch =
      (!q) ||
      item.name?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q);
    const matchesLoc = !selLoc || item.location === selLoc;
    return matchesSearch && matchesLoc;
  });
}

/***********************
 * GOOGLE PROGRAMMABLE SEARCH
 ***********************/
async function fetchGoogleResults(query) {
  if (!query) return [];
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(GOOGLE_API_KEY)}&cx=${encodeURIComponent(GOOGLE_CSE_ID)}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.items || [];
}

function populateTableFromGoogle(items) {
  // For Google results, location filter doesn't apply (unknown).
  tableBody.innerHTML = '';

  items.forEach(it => {
    // Try to pull image if present
    const img =
      it.pagemap?.cse_image?.[0]?.src ||
      it.pagemap?.metatags?.[0]?.['og:image'] ||
      '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(it.title || '')}</td>
      <td></td>
      <td></td>
      <td>${escapeHtml(it.displayLink || '')}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td>${escapeHtml(it.snippet || '')}</td>
      <td>${it.link ? `<a href="${it.link}" target="_blank" rel="noopener">View</a>` : ''}</td>
      <td>${img ? `<img src="${img}" alt="" style="max-width:60px">` : ''}</td>
      <td></td>
    `;
    tableBody.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/***********************
 * BOOT
 ***********************/
let supabaseData = [];

async function init() {
  // Load Supabase data initially (empty search)
  supabaseData = await fetchSupabaseData();
  populateTableFromSupabase(supabaseData);

  // Filtering for Supabase data
  searchInput.addEventListener('input', async () => {
    const q = searchInput.value.trim();
    if (q.length >= 2) {
      // Live Google search when user types 2+ chars
      const items = await fetchGoogleResults(q);
      populateTableFromGoogle(items);
    } else {
      // Back to Supabase data when query is cleared/short
      populateTableFromSupabase(applySupabaseFilters(supabaseData));
    }
  });

  locationFilter.addEventListener('change', () => {
    const q = searchInput.value.trim();
    if (q.length >= 2) return; // ignore when showing Google results
    populateTableFromSupabase(applySupabaseFilters(supabaseData));
  });
}

init();
