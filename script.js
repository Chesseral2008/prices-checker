async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .range(0, 999999);  // Adjusts for large datasets

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  if (data && Array.isArray(data)) {
    renderProducts(data);
  }
}

function renderProducts(products) {
  const productList = document.getElementById("productList");
  const categoryFilter = document.getElementById("categoryFilter");
  const locationFilter = document.getElementById("locationFilter");
  const searchInput = document.getElementById("searchInput").value.toLowerCase();

  productList.innerHTML = "";

  const grouped = {};

  products.forEach(item => {
    if (!item.name || !item.brand || !item.store || !item.price) return;

    if (
      (categoryFilter.value !== "all" && item.category !== categoryFilter.value) ||
      (locationFilter.value !== "all" && item.location !== locationFilter.value)
    ) {
      return;
    }

    if (
      !item.brand.toLowerCase().includes(searchInput) &&
      !item.store.toLowerCase().includes(searchInput)
    ) {
      return;
    }

    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  for (const [name, items] of Object.entries(grouped)) {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    const header = document.createElement("h2");
    header.textContent = name;
    productCard.appendChild(header);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Brand</th>
          <th>Store</th>
          <th>Location</th>
          <th>Unit</th>
          <th>Specs</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.brand}</td>
            <td>${i.store}</td>
            <td>${i.location}</td>
            <td>${i.unit || ""}</td>
            <td>${i.specs || ""}</td>
            <td class="${i.price === Math.min(...items.map(p => p.price)) ? 'lowest-price' : ''}">
              ₱${parseFloat(i.price).toFixed(2)}
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;
    productCard.appendChild(table);
    productList.appendChild(productCard);
  }
}

document.getElementById("searchInput").addEventListener("input", fetchProducts);
document.getElementById("categoryFilter").addEventListener("change", fetchProducts);
document.getElementById("locationFilter").addEventListener("change", fetchProducts);

fetchProducts();
