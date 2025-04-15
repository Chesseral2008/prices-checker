// Fetch data from Supabase
const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

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
  allData = data;
  populateFilters();
  renderResults();
}

function populateFilters() {
  const categories = Array.from(new Set(allData.map(item => item.category))).sort();
  const locations = Array.from(new Set(allData.map(item => item.location))).sort();

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

  const grouped = {};

  allData.forEach(item => {
    const key = item.name;
    if (
      (categoryValue === "All" || item.category === categoryValue) &&
      (locationValue === "All" || item.location === locationValue) &&
      (item.name.toLowerCase().includes(searchValue) ||
       item.brand.toLowerCase().includes(searchValue) ||
       item.store.toLowerCase().includes(searchValue))
    ) {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
  });

  resultsContainer.innerHTML = "";

  Object.keys(grouped).forEach(name => {
    const productItems = grouped[name];
    const minPrice = Math.min(...productItems.map(p => p.price));

    const table = document.createElement("table");
    const header = `
      <thead>
        <tr>
          <th colspan="4" style="text-align:left; font-size:18px;">${name}</th>
        </tr>
        <tr>
          <th>Brand</th>
          <th>Store</th>
          <th>Location</th>
          <th>Price</th>
        </tr>
      </thead>
    `;

    const rows = productItems.map(item => {
      const isLowest = item.price === minPrice ? "lowest-price" : "";
      return `
        <tr>
          <td>${item.brand}</td>
          <td>${item.store}</td>
          <td>${item.location}</td>
          <td class="${isLowest}">₱${item.price.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    table.innerHTML = header + "<tbody>" + rows + "</tbody>";
    resultsContainer.appendChild(table);
  });
}

searchInput.addEventListener("input", renderResults);
categoryFilter.addEventListener("change", renderResults);
locationFilter.addEventListener("change", renderResults);

fetchData();
