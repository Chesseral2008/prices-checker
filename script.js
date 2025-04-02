
const products = [
  { name: "Gasoline", brand: "Petron", storeLocation: "Petron - SLEX", category: "fuel", price: 65 },
  { name: "Gasoline", brand: "Shell", storeLocation: "Shell - EDSA", category: "fuel", price: 60 },
  { name: "Gasoline", brand: "Caltex", storeLocation: "Caltex - Taguig", category: "fuel", price: 62.5 },
  { name: "Rice 5kg", brand: "Sinandomeng", storeLocation: "Puregold - Manila", category: "groceries", price: 320 },
  { name: "Rice 5kg", brand: "Angelica", storeLocation: "SM Supermarket - QC", category: "groceries", price: 310 },
  { name: "Rice 5kg", brand: "Golden Phoenix", storeLocation: "WalterMart - Cavite", category: "groceries", price: 335 },
  { name: "Smartphone", brand: "Apple", storeLocation: "Power Mac - BGC", category: "electronics", price: 75000 },
  { name: "Smartphone", brand: "Samsung", storeLocation: "Samsung Store - Makati", category: "electronics", price: 48000 },
];

const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const searchInput = document.getElementById("searchInput");
const productsContainer = document.getElementById("productsContainer");

function getUniqueOptions(items, key) {
  return [...new Set(items.map(item => item[key]))];
}

function populateFilters() {
  getUniqueOptions(products, "category").forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });

  getUniqueOptions(products, "storeLocation").forEach(loc => {
    const option = document.createElement("option");
    option.value = loc;
    option.textContent = loc;
    locationFilter.appendChild(option);
  });
}

function displayProducts() {
  const category = categoryFilter.value;
  const location = locationFilter.value;
  const searchText = searchInput.value.toLowerCase();
  
  productsContainer.innerHTML = "";

  const grouped = {};

  products.forEach(product => {
    if ((category === "all" || product.category === category) &&
        (location === "all" || product.storeLocation === location) &&
        (product.name.toLowerCase().includes(searchText) || product.brand.toLowerCase().includes(searchText))) {
      if (!grouped[product.name]) {
        grouped[product.name] = [];
      }
      grouped[product.name].push(product);
    }
  });

  for (const [productName, entries] of Object.entries(grouped)) {
    const card = document.createElement("div");
    card.className = "product-card";

    let rows = entries.map(entry => 
      `<tr>
        <td>${entry.brand}</td>
        <td>${entry.storeLocation}</td>
        <td${entry.price === Math.min(...entries.map(e => e.price)) ? ' class="price-highlight"' : ''}>â‚±${entry.price.toFixed(2)}</td>
      </tr>`).join("");

    card.innerHTML = `
      <h2>${productName}</h2>
      <table>
        <thead><tr><th>Brand</th><th>Store / Location</th><th>Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    productsContainer.appendChild(card);
  }
}

populateFilters();
displayProducts();

searchInput.addEventListener("input", displayProducts);
categoryFilter.addEventListener("change", displayProducts);
locationFilter.addEventListener("change", displayProducts);
