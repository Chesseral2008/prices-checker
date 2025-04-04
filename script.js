const SUPABASE_URL = "https://atyjvpsjlhvzpqmqyylv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA";

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const productList = document.getElementById("productList");

let allProducts = [];

async function fetchProducts() {
  const { data, error } = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }).then(res => res.json()).then(data => ({ data }));

  if (!data) {
    productList.innerHTML = "<p>Error loading data.</p>";
    return;
  }

  allProducts = data;
  populateFilters();
  renderProducts();
}

function populateFilters() {
  const categories = [...new Set(allProducts.map(p => p.category))];
  const locations = [...new Set(allProducts.map(p => p.location))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  locations.forEach(loc => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    locationFilter.appendChild(option);
  });
}

function renderProducts() {
  const categoryValue = categoryFilter.value;
  const locationValue = locationFilter.value;
  const searchQuery = searchInput.value.toLowerCase();

  productList.innerHTML = "";

  const grouped = {};

  allProducts.forEach(p => {
    if (
      (categoryValue !== "all" && p.category !== categoryValue) ||
      (locationValue !== "all" && p.location !== locationValue) ||
      !(p.brand.toLowerCase().includes(searchQuery) || p.store.toLowerCase().includes(searchQuery))
    ) return;

    if (!grouped[p.name]) grouped[p.name] = [];
    grouped[p.name].push(p);
  });

  Object.keys(grouped).forEach(name => {
    const items = grouped[name];
    const lowest = Math.min(...items.map(i => i.price));

    const card = document.createElement("div");
    card.className = "product-card";

    const header = document.createElement("h2");
    header.textContent = name;
    card.appendChild(header);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr><th>Brand</th><th>Store</th><th>Location</th><th>Price</th></tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.brand}</td>
            <td>${i.store}</td>
            <td>${i.location}</td>
            <td class="${i.price === lowest ? 'lowest-price' : ''}">₱${i.price.toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    `;

    card.appendChild(table);
    productList.appendChild(card);
  });
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
locationFilter.addEventListener("change", renderProducts);

fetchProducts();
