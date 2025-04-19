const { createClient } = supabase;

const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

const client = createClient(supabaseUrl, supabaseKey);

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const resultsContainer = document.getElementById("resultsContainer");

async function fetchData() {
  const { data, error } = await client.from("full_products_view").select("*");

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  return data || [];
}

function displayResults(data) {
  resultsContainer.innerHTML = "";

  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  for (const name in grouped) {
    const items = grouped[name];
    const section = document.createElement("div");
    section.className = "product-section";

    const title = document.createElement("h2");
    title.textContent = name;
    section.appendChild(title);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Brand</th><th>Store</th><th>Location</th><th>Specs</th><th>Unit</th><th>Price</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const prices = items.map(item => parseFloat(item.price)).filter(p => !isNaN(p));
    const minPrice = Math.min(...prices);

    items.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.brand || ""}</td>
        <td>${item.store || ""}</td>
        <td>${item.location || ""}</td>
        <td>${item.specs || ""}</td>
        <td>${item.unit || ""}</td>
        <td style="color: ${parseFloat(item.price) === minPrice ? 'green' : 'black'}">₱${item.price}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    resultsContainer.appendChild(section);
  }
}

function applyFilters(data) {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;

  return data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm) ||
                          item.brand?.toLowerCase().includes(searchTerm) ||
                          item.store?.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "All" || item.category === category;
    const matchesLocation = location === "All" || item.location === location;
    return matchesSearch && matchesCategory && matchesLocation;
  });
}

async function init() {
  const data = await fetchData();

  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  const locations = [...new Set(data.map(item => item.location).filter(Boolean))];

  categoryFilter.innerHTML = `<option value="All">All Categories</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join("");
  locationFilter.innerHTML = `<option value="All">All Locations</option>` + locations.map(l => `<option value="${l}">${l}</option>`).join("");

  const update = () => displayResults(applyFilters(data));
  searchInput.addEventListener("input", update);
  categoryFilter.addEventListener("change", update);
  locationFilter.addEventListener("change", update);

  update();
}

init();
