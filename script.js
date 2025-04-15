// Replace with your own Supabase credentials
const SUPABASE_URL = "https://atyjvpsjlhvzpqmqyylv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const productContainer = document.getElementById("productContainer");

async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("Supabase fetch error:", error.message);
    return [];
  }
  return data;
}

function getUniqueValues(data, key) {
  return [...new Set(data.map(item => item[key]).filter(Boolean))];
}

function renderFilters(products) {
  const categories = getUniqueValues(products, "category");
  const locations = getUniqueValues(products, "location");

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  locationFilter.innerHTML = `<option value="all">All Locations</option>`;
  locations.forEach(loc => {
    locationFilter.innerHTML += `<option value="${loc}">${loc}</option>`;
  });
}

function renderProducts(products) {
  const searchQuery = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedLocation = locationFilter.value;

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery) ||
      p.brand?.toLowerCase().includes(searchQuery) ||
      p.store?.toLowerCase().includes(searchQuery);

    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;

    const matchesLocation =
      selectedLocation === "all" || p.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  productContainer.innerHTML = "";

  if (filtered.length === 0) {
    productContainer.innerHTML = `<p>No results found.</p>`;
    return;
  }

  const grouped = {};

  filtered.forEach(item => {
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  Object.entries(grouped).forEach(([name, items]) => {
    const lowest = Math.min(...items.map(i => i.price || 0));

    const tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Brand</th>
            <th>Store</th>
            <th>Price</th>
            <th>Unit</th>
            <th>Specs</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.brand || ""}</td>
              <td>${item.store || ""}</td>
              <td class="${item.price === lowest ? "lowest-price" : ""}">₱${item.price?.toFixed(2) || ""}</td>
              <td>${item.unit || ""}</td>
              <td>${item.specs || ""}</td>
              <td>${item.location || ""}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;

    const section = document.createElement("section");
    section.innerHTML = `<h2>${name}</h2>` + tableHTML;
    productContainer.appendChild(section);
  });
}

async function initialize() {
  const products = await fetchProducts();
  renderFilters(products);

  searchInput.addEventListener("input", () => renderProducts(products));
  categoryFilter.addEventListener("change", () => renderProducts(products));
  locationFilter.addEventListener("change", () => renderProducts(products));

  renderProducts(products);
}

initialize();
