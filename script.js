const products = [
  {
    name: "Gasoline / Liter",
    category: "fuel",
    prices: [
      { brand: "Petron", store: "Petron - SLEX", price: 65 },
      { brand: "Shell", store: "Shell - EDSA", price: 60 },
      { brand: "Caltex", store: "Caltex - Taguig", price: 62.5 }
    ]
  },
  {
    name: "Rice 5kg",
    category: "groceries",
    prices: [
      { brand: "Sinandomeng", store: "Puregold - Manila", price: 320 },
      { brand: "Angelica", store: "SM Supermarket - QC", price: 310 },
      { brand: "Golden Phoenix", store: "WalterMart - Cavite", price: 335 }
    ]
  },
  {
    name: "Paracetamol",
    category: "medicine",
    prices: [
      { brand: "Biogesic", store: "Mercury Drug - Taguig", price: 6.5 },
      { brand: "Rexidol", store: "Generika - Manila", price: 5.75 },
      { brand: "Medicol", store: "Watsons - BGC", price: 7.00 }
    ]
  },
  {
    name: "Tricycle Fare (short ride)",
    category: "transport",
    prices: [
      { brand: "Local - QC", store: "Tricycle Terminal A", price: 15 },
      { brand: "Local - Laguna", store: "Tricycle Terminal B", price: 12 }
    ]
  },
  {
    name: "Jeepney Fare (Metro Manila)",
    category: "transport",
    prices: [
      { brand: "Standard Jeepney", store: "NCR Route", price: 13 },
      { brand: "Modern PUV", store: "BGC Route", price: 14 }
    ]
  }
];

const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

function renderProducts(items) {
  productList.innerHTML = "";
  if (items.length === 0) {
    productList.innerHTML = "<p>No products found.</p>";
    return;
  }

  items.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    // Get lowest price
    const lowestPrice = Math.min(...product.prices.map(p => p.price));

    // Build table rows
    const rows = product.prices.map(p => {
      const isBest = p.price === lowestPrice ? 'best-price' : '';
      return `
        <tr>
          <td>${p.brand}</td>
          <td>${p.store}</td>
          <td class="${isBest}">₱${p.price.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    card.innerHTML = `
      <h2>${product.name}</h2>
      <table class="price-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Store</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    productList.appendChild(card);
  });
}

function updateFilters() {
  const search = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) &&
    (selectedCategory === "all" || p.category === selectedCategory)
  );

  renderProducts(filtered);
}

function populateCategories() {
  const categories = ["all", ...new Set(products.map(p => p.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(opt);
  });
}

searchInput.addEventListener("input", updateFilters);
categoryFilter.addEventListener("change", updateFilters);

// Init
populateCategories();
renderProducts(products);
