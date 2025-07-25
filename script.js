const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

const tableBody = document.querySelector('#productsTable tbody');
const locationFilter = document.getElementById('locationFilter');
const searchInput = document.getElementById('searchInput');

async function fetchData() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/all_products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  const data = await response.json();
  return data;
}

function populateTable(data) {
  tableBody.innerHTML = '';

  const uniqueLocations = new Set();

  data.forEach(item => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${item.name || ''}</td>
      <td>${item.category || ''}</td>
      <td>${item.brand || ''}</td>
      <td>${item.store || ''}</td>
      <td>${item.location || ''}</td>
      <td>${item.price ?? ''}</td>
      <td>${item.currency || ''}</td>
      <td>${item.unit || ''}</td>
      <td>${item.specs || ''}</td>
      <td>${item.product_link ? `<a href="${item.product_link}" target="_blank">View</a>` : ''}</td>
      <td>${item.image_url ? `<img src="${item.image_url}" alt="Image" style="max-width: 60px;"/>` : ''}</td>
      <td>${item.is_verified ? '✅' : ''}</td>
    `;

    tableBody.appendChild(row);

    if (item.location) {
      uniqueLocations.add(item.location);
    }
  });

  updateLocationFilter(uniqueLocations);
}

function updateLocationFilter(locations) {
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  [...locations].sort().forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

function applyFilters(data) {
  const searchText = searchInput.value.toLowerCase();
  const selectedLocation = locationFilter.value;

  return data.filter(item => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchText) ||
      item.brand?.toLowerCase().includes(searchText);

    const matchesLocation =
      !selectedLocation || item.location === selectedLocation;

    return matchesSearch && matchesLocation;
  });
}

async function loadAndDisplayData() {
  const data = await fetchData();

  searchInput.addEventListener('input', () => {
    populateTable(applyFilters(data));
  });

  locationFilter.addEventListener('change', () => {
    populateTable(applyFilters(data));
  });

  populateTable(data);
}

loadAndDisplayData();
