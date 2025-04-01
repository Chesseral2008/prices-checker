const products = [
  { name: 'Rice 5kg', price: 320, category: 'groceries' },
  { name: 'Canned Tuna', price: 45, category: 'groceries' },
  { name: 'Smartphone A15', price: 12000, category: 'electronics' },
  { name: 'T-Shirt XL', price: 299, category: 'clothing' },
  { name: 'Jeans', price: 750, category: 'clothing' },
  // Add more products as needed
];

const productList = document.getElementById('productList');
const searchBar = document.getElementById('searchBar');
const categoryFilter = document.getElementById('categoryFilter');

function displayProducts(data) {
  productList.innerHTML = '';
  if (data.length === 0) {
    productList.innerHTML = '<p>No matching products found.</p>';
    return;
  }

  data.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h2>${product.name}</h2>
      <p>₱${product.price}</p>
      <p>Category: ${product.category}</p>
    `;
    productList.appendChild(card);
  });
}

function filterProducts() {
  const searchText = searchBar.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = products.filter(product => {
    const matchText = product.name.toLowerCase().includes(searchText);
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchText && matchCategory;
  });

  displayProducts(filtered);
}

searchBar.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);

// Initial display
displayProducts(products);
