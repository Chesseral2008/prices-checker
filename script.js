const products = [
  {
    name: "Gasoline / Liter",
    category: "fuel",
    items: [
      { brand: "Petron", store: "Petron - SLEX", price: 65.00, location: "SLEX" },
      { brand: "Shell", store: "Shell - EDSA", price: 60.00, location: "EDSA" },
      { brand: "Caltex", store: "Caltex - Taguig", price: 62.50, location: "Taguig" }
    ]
  },
  {
    name: "Rice 5kg",
    category: "groceries",
    items: [
      { brand: "Sinandomeng", store: "Puregold - Manila", price: 320.00, location: "Manila" },
      { brand: "Angelica", store: "SM Supermarket - QC", price: 310.00, location: "Quezon City" },
      { brand: "Golden Phoenix", store: "WalterMart - Cavite", price: 335.00, location: "Cavite" }
    ]
  },
  {
    name: "Smartphone",
    category: "electronics",
    items: [
      { brand: "Samsung Galaxy S24", store: "Samsung Store - SM Aura", price: 58990.00, location: "Taguig" },
      { brand: "iPhone 15", store: "Power Mac Center - Glorietta", price: 69990.00, location: "Makati" },
      { brand: "Xiaomi Redmi Note 13", store: "Mi Store - Trinoma", price: 10990.00, location: "Quezon City" }
    ]
  },
  {
    name: "Water Delivery (5 Gallons)",
    category: "utilities",
    items: [
      { brand: "Wilkins", store: "Wilkins Station - QC", price: 130.00, location: "Quezon City" },
      { brand: "Nature Spring", store: "NS Dealer - Pasig", price: 110.00, location: "Pasig" },
      { brand: "Absolute", store: "Absolute Water - Mandaluyong", price: 120.00, location: "Mandaluyong" }
    ]
  },
  {
    name: "Electricity / kWh",
    category: "utilities",
    items: [
      { brand: "Meralco", store: "Metro Manila", price: 12.50, location: "Metro Manila" },
      { brand: "VECO", store: "Cebu", price: 10.80, location: "Cebu" },
      { brand: "DLPC", store: "Davao", price: 11.20, location: "Davao" }
    ]
  },
  {
    name: "Designer Bag",
    category: "luxury",
    items: [
      { brand: "Louis Vuitton", store: "LV Greenbelt", price: 185000.00, location: "Makati" },
      { brand: "Gucci", store: "Gucci Shangri-La", price: 165000.00, location: "Mandaluyong" },
      { brand: "Prada", store: "Prada City of Dreams", price: 170000.00, location: "Parañaque" }
    ]
  },
  {
    name: "Internet (Monthly)",
    category: "utilities",
    items: [
      { brand: "PLDT Fibr", store: "PLDT Online", price: 1699.00, location: "Nationwide" },
      { brand: "Converge", store: "Converge Online", price: 1500.00, location: "Nationwide" },
      { brand: "Globe at Home", store: "Globe Online", price: 1899.00, location: "Nationwide" }
    ]
  }
];

// Populate categories and locations
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const productList = document.getElementById("productList");

const allCategories = [...new Set(products.map(p => p.category))];
const allLocations = [...new Set(products.flatMap(p => p.items.map(i => i.location)))];

allCategories.forEach(cat => {
  const option = document.createElement("option");
  option.value = cat;
  option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  categoryFilter.appendChild(option);
});

allLocations.forEach(loc => {
  const option = document.createElement("option");
  option.value = loc;
  option.textContent = loc;
  locationFilter.appendChild(option);
});

function renderProducts() {
  const categoryValue = categoryFilter.value;
  const locationValue = locationFilter.value;
  const searchQuery = document.getElementById("searchInput").value.toLowerCase();

  productList.innerHTML = "";

  products.forEach(product => {
    if (categoryValue !== "all" && product.category !== categoryValue) return;

    const filteredItems = product.items.filter(i =>
      (locationValue === "all" || i.location === locationValue) &&
      (i.brand.toLowerCase().includes(searchQuery) || i.store.toLowerCase().includes(searchQuery))
    );

    if (filteredItems.length > 0) {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      const header = document.createElement("h2");
      header.textContent = product.name;
      productCard.appendChild(header);

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr><th>Brand</th><th>Store</th><th>Price</th></tr>
        </thead>
        <tbody>
          ${filteredItems.map(i => `
            <tr>
              <td>${i.brand}</td>
              <td>${i.store}</td>
              <td class="${i.price === Math.min(...filteredItems.map(p => p.price)) ? 'lowest-price' : ''}">₱${i.price.toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
      `;
      productCard.appendChild(table);
      productList.appendChild(productCard);
    }
  });
}

document.getElementById("searchInput").addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
locationFilter.addEventListener("change", renderProducts);

renderProducts();
