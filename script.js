const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

async function fetchProducts() {
  const response = await fetch(${SUPABASE_URL}/rest/v1/products?select=*, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: Bearer ${SUPABASE_KEY}
    }
  });
  const data = await response.json();
  return data;
}

function renderProducts(products) {
  const container = document.getElementById("productContainer");
  container.innerHTML = "";

  const grouped = {};
  products.forEach(product => {
    const key = product.name + product.unit + product.specs;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(product);
  });

  Object.values(grouped).forEach(group => {
    const sorted = group.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const lowestPrice = parseFloat(sorted[0].price);
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    sorted.forEach(item => {
      const entry = document.createElement("div");
      entry.className = "product-entry";
      if (parseFloat(item.price) === lowestPrice) {
        entry.classList.add("lowest");
      }
      entry.innerHTML = `
        <strong>${item.name}</strong> <br/>
        Brand: ${item.brand} <br/>
        Store: ${item.store}, ${item.location} <br/>
        Price: ${item.price} ${item.currency} per ${item.unit} <br/>
        Specs: ${item.specs}
      `;
      productCard.appendChild(entry);
    });

    container.appendChild(productCard);
  });
}

function populateLocationFilter(products) {
  const filter = document.getElementById("locationFilter");
  const locations = [...new Set(products.map(p => p.location))];
  locations.sort().forEach(loc => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    filter.appendChild(option);
  });
}

async function initialize() {
  let products = await fetchProducts();
  renderProducts(products);
  populateLocationFilter(products);

  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");

  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedLocation = locationFilter.value;

    const filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
      const matchesLocation = !selectedLocation || p.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });

    renderProducts(filtered);
  }

  searchInput.addEventListener("input", filterProducts);
  locationFilter.addEventListener("change", filterProducts);
}

initialize();
