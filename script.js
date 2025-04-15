const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const productsContainer = document.getElementById('productsContainer');

async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    productsContainer.innerHTML = `<p>Error loading data: ${error.message}</p>`;
    return;
  }

  displayFilters(data);
  displayProducts(data);

  searchInput.addEventListener('input', () => filterAndDisplay(data));
  categoryFilter.addEventListener('change', () => filterAndDisplay(data));
  locationFilter.addEventListener('change', () => filterAndDisplay(data));
}

function displayFilters(data) {
  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  const locations = [...new Set(data.map(item => item.location).filter(Boolean))];

  categoryFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  locationFilter.innerHTML = '<option value="">All Locations</option>' + locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
}

function filterAndDisplay(data) {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;

  const filtered = data.filter(item =>
    (!search || (item.name + item.brand + item.store).toLowerCase().includes(search)) &&
    (!category || item.category === category) &&
    (!location || item.location === location)
  );

  displayProducts(filtered);
}

function displayProducts(products) {
  productsContainer.innerHTML = '';

  const grouped = products.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  for (const category in grouped) {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `<h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>`;

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Brand</th>
          <th>Store</th>
          <th>Location</th>
          <th>Unit</th>
          <th>Specs</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    grouped[category].forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.brand}</td>
        <td>${item.store}</td>
        <td>${item.location}</td>
        <td>${item.unit || ''}</td>
        <td>${item.specs || ''}</td>
        <td>₱${item.price}</td>
      `;
      tbody.appendChild(row);
    });

    section.appendChild(table);
    productsContainer.appendChild(section);
  }
}

fetchProducts();
