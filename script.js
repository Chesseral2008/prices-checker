const products = [
  {
    name: "Gasoline / Liter",
    category: "fuel",
    entries: [
      { brand: "Petron", store: "Petron - SLEX", price: 65 },
      { brand: "Shell", store: "Shell - EDSA", price: 60 },
      { brand: "Caltex", store: "Caltex - Taguig", price: 62.5 }
    ]
  },
  {
    name: "Rice 5kg",
    category: "groceries",
    entries: [
      { brand: "Sinandomeng", store: "Puregold - Manila", price: 320 },
      { brand: "Angelica", store: "SM Supermarket - QC", price: 310 },
      { brand: "Golden Phoenix", store: "WalterMart - Cavite", price: 335 }
    ]
  }
];

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const productsContainer = document.getElementById("productsContainer");

function getAllCategories() {
  return [...new Set(products.map(p => p.category))];
}

function getAllLocations() {
  const allStores = products.flatMap(p => p.entries.map(e => e.store));
  const locations = allStores.map(store => {
    const parts = store.split(" - ");
    return parts[1] ? parts[1].trim() : store.trim();
  });
  return [...new Set(locations)];
}

function displayProducts() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedLocation = locationFilter.value;

  productsContainer.innerHTML = "";

  products.forEach(product => {
    if (
      (selectedCategory === "all" || product.category === selectedCategory) &&
      product.entries.some(entry => {
        const location = entry.store.split(" - ")[1]?.trim().toLowerCase();
        const matchesLocation = selectedLocation === "all" || location === selectedLocation;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        return matchesLocation && matchesSearch;
      })
    ) {
      const productTable = document.createElement("div");
      productTable.className = "product-table";
      productTable.innerHTML = `
        <h2>${product.name}</h2>
        <table>
          <thead>
            <tr>
              <th>Brand</th>
              <th>Store</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${product.entries.map(entry => {
              const isLowest = entry.price === Math.min(...product.entries.map(e => e.price));
              const priceClass = isLowest ? "green" : "";
              return `
                <tr>
                  <td>${entry.brand}</td>
                  <td>${entry.store}</td>
                  <td class="price ${priceClass}">₱${entry.price.toFixed(2)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
      productsContainer.appendChild(productTable);
    }
  });
}

function populateFilters() {
  getAllCategories().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat[0].toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });

  getAllLocations().forEach(loc => {
    const option = document.createElement("option");
    option.value = loc.toLowerCase();
    option.textContent = loc;
    locationFilter.appendChild(option);
  });
}

searchInput.addEventListener("input", displayProducts);
categoryFilter.addEventListener("change", displayProducts);
locationFilter.addEventListener("change", displayProducts);

populateFilters();
displayProducts();
