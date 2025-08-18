// script.js — fetches from our /api/products and renders the table

const tableBody = document.querySelector('#productsTable tbody');
const locationFilter = document.getElementById('locationFilter');
const searchInput = document.getElementById('searchInput');

function rowHTML(item) {
  const img = item.image_url ? `<img src="${item.image_url}" alt="" style="max-width:60px">` : "";
  const link = item.product_link ? `<a href="${item.product_link}" target="_blank">View</a>` : "";
  return `
    <tr>
      <td>${item.name || ""}</td>
      <td>${item.category || ""}</td>
      <td>${item.brand || ""}</td>
      <td>${item.store || ""}</td>
      <td>${item.location || ""}</td>
      <td>${item.price ?? ""}</td>
      <td>${item.currency || ""}</td>
      <td>${item.unit || ""}</td>
      <td>${item.specs || ""}</td>
      <td>${link}</td>
      <td>${img}</td>
      <td>${item.is_verified ? "✅" : ""}</td>
    </tr>
  `;
}

function populateTable(data) {
  tableBody.innerHTML = data.map(rowHTML).join("");
  const locs = [...new Set(data.map(d => d.location).filter(Boolean))].sort();
  locationFilter.innerHTML = `<option value="">All Locations</option>` +
    locs.map(l => `<option value="${l}">${l}</option>`).join("");
}

function applyFilters(data) {
  const q = (searchInput.value || "").toLowerCase();
  const loc = locationFilter.value || "";
  return data.filter(d => {
    const matchQ = (d.name || "").toLowerCase().includes(q) ||
                   (d.brand || "").toLowerCase().includes(q) ||
                   (d.store || "").toLowerCase().includes(q);
    const matchLoc = !loc || d.location === loc;
    return matchQ && matchLoc;
  });
}

async function searchAndRender() {
  const q = searchInput.value.trim();
  if (!q) { tableBody.innerHTML = ""; return; }

  try {
    const r = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    populateTable(applyFilters(data));
  } catch (e) {
    console.error(e);
    tableBody.innerHTML = `<tr><td colspan="12">Error loading results</td></tr>`;
  }
}

searchInput.addEventListener('input', () => {
  // debounce a little
  clearTimeout(window.__pcTimer);
  window.__pcTimer = setTimeout(searchAndRender, 300);
});
locationFilter.addEventListener('change', searchAndRender);

// Initial (no query) — leave empty
