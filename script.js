const products = [
  { name: "Petron XCS", brand: "Petron", store: "Petron - SLEX", category: "Gasoline", price: 65.0, location: "SLEX" },
  { name: "Shell FuelSave", brand: "Shell", store: "Shell - EDSA", category: "Gasoline", price: 60.0, location: "EDSA" },
  { name: "Caltex Silver", brand: "Caltex", store: "Caltex - Taguig", category: "Gasoline", price: 62.5, location: "Taguig" },
  { name: "Sinandomeng Rice", brand: "Sinandomeng", store: "Puregold - Manila", category: "Groceries", price: 320.0, location: "Manila" },
  { name: "Angelica Rice", brand: "Angelica", store: "SM Supermarket - QC", category: "Groceries", price: 310.0, location: "Quezon City" },
  { name: "Golden Phoenix Rice", brand: "Golden Phoenix", store: "WalterMart - Cavite", category: "Groceries", price: 335.0, location: "Cavite" },
  { name: "iPhone 14", brand: "Apple", store: "Power Mac - BGC", category: "Electronics", price: 68990.0, location: "BGC" },
  { name: "Galaxy S23", brand: "Samsung", store: "Samsung - SM Megamall", category: "Electronics", price: 53990.0, location: "Mandaluyong" },
  { name: "T-Shirt XL", brand: "Bench", store: "Bench - MOA", category: "Clothing", price: 299.0, location: "MOA" },
  { name: "Levi's 501 Jeans", brand: "Levi's", store: "Levi's - Glorietta", category: "Clothing", price: 2999.0, location: "Makati" },
  { name: "Big Mac Meal", brand: "McDonald's", store: "McDo - Ayala", category: "Food", price: 199.0, location: "Ayala" },
  { name: "Whopper Meal", brand: "Burger King", store: "BK - Trinoma", category: "Food", price: 209.0, location: "QC" },
  { name: "Haircut", brand: "GQ Barbers", store: "GQ - BGC", category: "Services", price: 350.0, location: "BGC" },
  { name: "Car Wash", brand: "Rapide", store: "Rapide - Pasig", category: "Services", price: 250.0, location: "Pasig" },
  { name: "Tooth Extraction", brand: "Dental Hub", store: "Dental Hub - Makati", category: "Health", price: 1000.0, location: "Makati" }
];

const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");

function getUniqueValues(field) {
  return [...new Set(products.map(p => p[field]))].sort();
}

function populateFilters() {
  getUniqueValues("category").forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  getUniqueValues("location").forEach(location => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

function renderProducts(productList) {
  productContainer.innerHTML = "";

  const grouped = {};
  productList.forEach(p => {
    if (!grouped[p.name]) grouped[p.name] = [];
    grouped[p.name].push(p);
  });

  for (const name in grouped) {
    const table = document.createElement("table");
    table.className = "product-table";

    const titleRow = document.createElement("tr");
    const title = document.createElement("th");
    title.colSpan = 3;
    title.textContent = name;
    title.className = "product-title";
    titleRow.appendChild(title);
    table.appendChild(titleRow);

    const headerRow = document.createElement("tr");
    ["Brand", "Store", "Price"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    const sorted = grouped[name].sort((a, b) => a.price - b.price);
    sorted.forEach((product, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.brand}</td>
        <td>${product.store}</td>
        <td class="${i === 0 ? 'cheapest' : ''}">₱${product.price.toFixed(2)}</td>
      `;
      table.appendChild(row);
    });

    productContainer.appendChild(table);
  }
}

function filterProducts() {
  const search = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedLocation = locationFilter.value;

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(search) ||
     p.brand.toLowerCase().includes(search) ||
     p.store.toLowerCase().includes(search)) &&
    (selectedCategory === "" || p.category === selectedCategory) &&
    (selectedLocation === "" || p.location === selectedLocation)
  );

  renderProducts(filtered);
}

searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);
locationFilter.addEventListener("change", filterProducts);

populateFilters();
renderProducts(products);
