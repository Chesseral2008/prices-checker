const products = [
  { name: "Rice 5kg", price: 320, category: "groceries", store: "SM Supermarket - Manila" },
  { name: "Canned Tuna", price: 45, category: "groceries", store: "Robinsons - Cebu" },
  { name: "Milk 1L", price: 70, category: "groceries", store: "Puregold - Davao" },
  { name: "Bread Loaf", price: 55, category: "groceries", store: "WalterMart - Laguna" },
  { name: "Eggs Dozen", price: 85, category: "groceries", store: "Mercury Fresh - QC" },
  { name: "Smartphone A15", price: 11999, category: "electronics", store: "Lazada - Online" },
  { name: "Smartwatch X3", price: 2799, category: "electronics", store: "Shopee - Online" },
  { name: "Laptop 14\"", price: 28999, category: "electronics", store: "SM Appliance - BGC" },
  { name: "Headphones BT", price: 899, category: "electronics", store: "Datablitz - SM North" },
  { name: "Powerbank 20,000mAh", price: 1299, category: "electronics", store: "Anker - Lazada" },
  { name: "Men's Shirt", price: 349, category: "clothing", store: "Uniqlo - MOA" },
  { name: "Jeans", price: 799, category: "clothing", store: "Levi's - Greenbelt" },
  { name: "Jacket", price: 1299, category: "clothing", store: "Penshoppe - Ayala Cebu" },
  { name: "Women's Dress", price: 999, category: "clothing", store: "Zalora - Online" },
  { name: "Sneakers", price: 2499, category: "clothing", store: "Nike - Glorietta" },
  { name: "Paracetamol", price: 6, category: "medicine", store: "Mercury Drug - BGC" },
  { name: "Vitamin C 500mg", price: 4, category: "medicine", store: "Watsons - QC" },
  { name: "Loperamide", price: 2.5, category: "medicine", store: "Generika - Makati" },
  { name: "Ibuprofen", price: 7, category: "medicine", store: "Southstar Drug - Bulacan" },
  { name: "Amoxicillin", price: 8, category: "medicine", store: "The Generics Pharmacy - Taguig" },
  { name: "Gasoline / Liter", price: 62.15, category: "fuel", store: "Petron - SLEX" },
  { name: "Diesel / Liter", price: 58.35, category: "fuel", store: "Shell - EDSA" },
  { name: "Tricycle Fare", price: 15, category: "transport", store: "Local - QC" },
  { name: "Jeepney Fare", price: 13, category: "transport", store: "Local - NCR" },
  { name: "Bus Fare (Metro)", price: 40, category: "transport", store: "EDSA Carousel" },
  { name: "Taxi Flagdown", price: 45, category: "transport", store: "Metro Manila" },
  { name: "Motorcycle Ride (5km)", price: 95, category: "transport", store: "Angkas" },
  { name: "Ballpen", price: 12, category: "school", store: "National Bookstore - Makati" },
  { name: "Notebook 100p", price: 28, category: "school", store: "Fully Booked - BGC" },
  { name: "Backpack", price: 899, category: "school", store: "JanSport - Online" },
  { name: "Uniform Set", price: 799, category: "school", store: "SM Store - Davao" },
  { name: "School Shoes", price: 1150, category: "school", store: "Payless - MOA" },
  // Add more anytime
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
    card.innerHTML = `
      <h2>${product.name}</h2>
      <p><strong>₱${product.price.toLocaleString()}</strong></p>
      <p>Category: ${product.category}</p>
      <p>Store: ${product.store}</p>
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

populateCategories();
renderProducts(products);
