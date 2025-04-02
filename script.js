const products = [
  {
    name: "Gasoline / Liter",
    category: "fuel",
    items: [
      { brand: "Petron", store: "Petron - SLEX", price: 65 },
      { brand: "Shell", store: "Shell - EDSA", price: 60 },
      { brand: "Caltex", store: "Caltex - Taguig", price: 62.5 }
    ]
  },
  {
    name: "Rice 5kg",
    category: "groceries",
    items: [
      { brand: "Sinandomeng", store: "Puregold - Manila", price: 320 },
      { brand: "Angelica", store: "SM Supermarket - QC", price: 310 },
      { brand: "Golden Phoenix", store: "WalterMart - Cavite", price: 335 }
    ]
  },
  {
    name: "Smartphone A15",
    category: "electronics",
    items: [
      { brand: "Samsung", store: "SM Cyberzone - Makati", price: 12000 },
      { brand: "Realme", store: "Robinsons - Manila", price: 10999 },
      { brand: "Xiaomi", store: "Greenhills - San Juan", price: 11500 }
    ]
  }
];

const searchBar = document.getElementById("searchBar");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const productList = document.getElementById("productList");

function getAllCategories() {
  return [...new Set(products.map(p => p.category))];
}

function getAllLocations() {
  const allLocations = [];
  products.forEach(p => {
    p.items.forEach(i => {
      const location = i.store.split(" - ")[1];
      if (location && !allLocations.includes(location)) {
        allLocations.push(location);
      }
    });
  });
  return allLocations;
}

function renderFilters() {
  getAllCategories().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });

  getAllLocations().forEach(location => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

function renderProducts() {
  const query = searchBar.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedLocation = locationFilter.value;

  productList.innerHTML = "";

  products.forEach(product => {
    if (selectedCategory !== "all" && product.category !== selectedCategory) return;
    if (!product.name.toLowerCase().includes(query)) return;

    const productCard = document.createElement("div");
    productCard.className = "product-card";

    const title = document.createElement("h2");
    title.textContent = product.name;
    productCard.appendChild(title);

    const table = document.createElement("table");

    const header = document.createElement("tr");
    ["Brand", "Store", "Price"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });
    table.appendChild(header);

    const sortedItems = [...product.items].sort((a, b) => a.price - b.price);
    const lowestPrice = sortedItems[0].price;

    sortedItems.forEach(item => {
      const location = item.store.split(" - ")[1];
      if (selectedLocation !== "all" && location !== selectedLocation) return;

      const row = document.createElement("tr");

      const brandCell = document.createElement("td");
      brandCell.textContent = item.brand;
      row.appendChild(brandCell);

      const storeCell = document.createElement("td");
      storeCell.textContent = item.store;
      row.appendChild(storeCell);

      const priceCell = document.createElement("td");
      priceCell.textContent = `₱${item.price.toFixed(2)}`;
      if (item.price === lowestPrice) {
        priceCell.style.color = "green";
        priceCell.style.fontWeight = "bold";
      }
      row.appendChild(priceCell);

      table.appendChild(row);
    });

    productCard.appendChild(table);
    productList.appendChild(productCard);
  });
}

searchBar.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
locationFilter.addEventListener("change", renderProducts);

renderFilters();
renderProducts();
