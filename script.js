const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJI...<your_full_key_here>';

const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

let allData = [];

async function fetchData() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  allData = removeDuplicates(data);
  populateFilters();
  renderResults();
}

function removeDuplicates(data) {
  const seen = new Set();
  return data.filter(item => {
    const key = `${item.name}|${item.brand}|${item.store}|${item.location}|${item.specs}|${item.unit}|${item.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function populateFilters() {
  const categories = Array.from(new Set(allData.map(item => item.category))).sort();
  const locations = Array.from(new Set(allData.map(item => item.location))).sort();

  categoryFilter.innerHTML = '<option value="All">All Categories</option>';
  locationFilter.innerHTML = '<option value="All">All Locations</option>';

  categories.forEach(category => {
    const opt = document.createElement("option");
    opt.value = category;
    opt.textContent = category;
    categoryFilter.appendChild(opt);
  });

  locations.forEach(location => {
    const opt = document.createElement("option");
    opt.value = location;
    opt.textContent = location;
    locationFilter.appendChild(opt);
  });
}

function renderResults() {
  const categoryValue = categoryFilter.value;
  const locationValue = locationFilter.value;
  const searchValue = searchInput.value.toLowerCase();

  const filtered = allData.filter(item =>
    (categoryValue === "All" || item.category === categoryValue) &&
    (locationValue === "All" || item.location === locationValue) &&
    (
      item.name?.toLowerCase().includes(searchValue) ||
      item.brand?.toLowerCase().includes(searchValue) ||
      item.store?.toLowerCase().includes(searchValue)
    )
  );

  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  resultsContainer.innerHTML = "";

  Object.entries(grouped).forEach(([name, items]) => {
    const minPrice = Math.min(...items.map(i => i.price));

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Brand</th>
          <th>Store</th>
          <th>Location</th>
          <th>Specs</th>
          <th>Unit</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.brand}</td>
            <td>${item.store}</td>
            <td>${item.location}</td>
            <td>${item.specs}</td>
            <td>${item.unit}</td>
            <td class="${item.price === minPrice ? 'lowest-price' : ''}">
              ₱${item.price.toFixed(2)}
            </td>
          </tr>`).join("")}
      </tbody>
    `;
    resultsContainer.appendChild(table);
  });
}

searchInput.addEventListener("input", renderResults);
categoryFilter.addEventListener("change", renderResults);
locationFilter.addEventListener("change", renderResults);

fetchData();
