const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const productList = document.getElementById('productList');

let allProducts = [];

async function fetchProducts() {
  try {
    const response = await fetch('https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products?select=*', {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA'
      }
    });
    const data = await response.json();
    allProducts = data;
    renderProducts(allProducts);
    populateFilters(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function renderProducts(products) {
  productList.innerHTML = '';
  const grouped = {};

  products.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });

  for (const [category, items] of Object.entries(grouped)) {
    const section = document.createElement('div');
    section.className = 'category-section';

    const heading = document.createElement('h2');
    heading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    section.appendChild(heading);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Brand</th>
        <th>Store</th>
        <th>Location</th>
        <th>Unit</th>
        <th>Specs</th>
        <th>Price</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.brand}</td>
        <td>${item.store}</td>
        <td>${item.location}</td>
        <td>${item.unit}</td>
        <td>${item.specs || ''}</td>
        <td>₱${parseFloat(item.price).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    productList.appendChild(section);
  }
}

function populateFilters(products) {
  const categories = [...new Set(products.map(p => p.category))];
  const locations = [...new Set(products.map(p => p.location))];

  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  locationFilter.innerHTML = '<option value="">All Locations</option>';

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    locationFilter.appendChild(option);
  });
}

function filterProducts() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;

  const filtered = allProducts.filter(p =>
    (p.name.toLowerCase().includes(search) ||
     p.brand.toLowerCase().includes(search) ||
     p.store.toLowerCase().includes(search)) &&
    (category ? p.category === category : true) &&
    (location ? p.location === location : true)
  );

  renderProducts(filtered);
}

searchInput.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);
locationFilter.addEventListener('change', filterProducts);

fetchProducts();
