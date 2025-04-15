const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const searchInput = document.getElementById('searchInput');
const productContainer = document.getElementById('productContainer');

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(200000);

  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }

  return data;
}

function getCheapestProducts(products) {
  const grouped = {};

  products.forEach(p => {
    const key = `${p.name}-${p.category}-${p.location}`;
    if (!grouped[key] || p.price < grouped[key].price) {
      grouped[key] = p;
    }
  });

  return grouped;
}

function renderProducts(products) {
  productContainer.innerHTML = '';

  const categories = [...new Set(products.map(p => p.category))];
  const cheapestMap = getCheapestProducts(products);

  categories.forEach(category => {
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
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    products
      .filter(p => p.category === category)
      .forEach(p => {
        const key = `${p.name}-${p.category}-${p.location}`;
        const isCheapest = cheapestMap[key]?.price === p.price;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${p.name}</td>
          <td>${p.brand}</td>
          <td>${p.store}</td>
          <td>${p.location}</td>
          <td>${p.unit}</td>
          <td>${p.specs}</td>
          <td style="color: ${isCheapest ? 'green' : 'inherit'}; font-weight: ${isCheapest ? 'bold' : 'normal'};">
            ₱${parseFloat(p.price).toLocaleString()}
          </td>
        `;

        tbody.appendChild(row);
      });

    table.appendChild(tbody);
    section.appendChild(table);
    productContainer.appendChild(section);
  });
}

function applyFilters(products) {
  const categoryValue = categoryFilter.value.toLowerCase();
  const locationValue = locationFilter.value.toLowerCase();
  const searchValue = searchInput.value.toLowerCase();

  return products.filter(p =>
    (categoryValue === '' || p.category.toLowerCase() === categoryValue) &&
    (locationValue === '' || p.location.toLowerCase() === locationValue) &&
    (
      p.name.toLowerCase().includes(searchValue) ||
      p.brand.toLowerCase().includes(searchValue) ||
      p.store.toLowerCase().includes(searchValue)
    )
  );
}

async function initialize() {
  const allProducts = await fetchProducts();

  const categories = [...new Set(allProducts.map(p => p.category))].sort();
  const locations = [...new Set(allProducts.map(p => p.location))].sort();

  categoryFilter.innerHTML = `<option value="">All Categories</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join('');
  locationFilter.innerHTML = `<option value="">All Locations</option>` + locations.map(l => `<option value="${l}">${l}</option>`).join('');

  function updateUI() {
    const filtered = applyFilters(allProducts);
    renderProducts(filtered);
  }

  searchInput.addEventListener('input', updateUI);
  categoryFilter.addEventListener('change', updateUI);
  locationFilter.addEventListener('change', updateUI);

  updateUI();
}

initialize();
