document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const locationFilter = document.getElementById("locationFilter");
  const productContainer = document.getElementById("productContainer");

  let products = [];

  async function fetchProducts() {
    const res = await fetch("https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products?select=*", {
      headers: {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA"
      }
    });
    products = await res.json();
    updateFilters();
    renderProducts();
  }

  function updateFilters() {
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    const locations = [...new Set(products.map(p => p.location))].filter(Boolean);

    categoryFilter.innerHTML = `<option value="">All Categories</option>` + categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
    locationFilter.innerHTML = `<option value="">All Locations</option>` + locations.map(loc => `<option value="${loc}">${loc}</option>`).join("");
  }

  function renderProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedLocation = locationFilter.value;

    const grouped = {};

    products.forEach(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm) || p.brand?.toLowerCase().includes(searchTerm) || p.store?.toLowerCase().includes(searchTerm);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesLocation = !selectedLocation || p.location === selectedLocation;

      if (matchesSearch && matchesCategory && matchesLocation) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      }
    });

    productContainer.innerHTML = "";

    for (const [category, items] of Object.entries(grouped)) {
      const section = document.createElement("div");
      section.className = "product-section";
      section.innerHTML = `<div class="category-title">${category}</div>`;
      const table = document.createElement("table");

      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Brand</th>
            <th>Store</th>
            <th>Price</th>
            <th>Unit</th>
            <th>Specs</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.brand || ""}</td>
              <td>${p.store || ""}</td>
              <td class="${p.price && parseFloat(p.price) === Math.min(...items.map(i => parseFloat(i.price))) ? 'price-green' : ''}">₱${parseFloat(p.price).toLocaleString()}</td>
              <td>${p.unit || ""}</td>
              <td>${p.specs || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      `;

      section.appendChild(table);
      productContainer.appendChild(section);
    }
  }

  searchInput.addEventListener("input", renderProducts);
  categoryFilter.addEventListener("change", renderProducts);
  locationFilter.addEventListener("change", renderProducts);

  fetchProducts();
});
