const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';
const tableName = 'products';

async function fetchData() {
  const response = await fetch(${supabaseUrl}/rest/v1/${tableName}?select=*, {
    headers: {
      apikey: supabaseKey,
      Authorization: Bearer ${supabaseKey},
    },
  });

  const data = await response.json();
  displayData(data);
  populateLocationFilter(data);
}

function displayData(data) {
  const tableBody = document.querySelector('#productTable tbody');
  tableBody.innerHTML = '';

  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const selectedLocation = document.getElementById('locationFilter').value;

  const filteredData = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery) || item.brand?.toLowerCase().includes(searchQuery);
    const matchesLocation = selectedLocation === 'All' || item.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  // Find lowest price entries by group (name + unit + specs)
  const groupMap = new Map();
  filteredData.forEach(item => {
    const key = ${item.name}-${item.unit}-${item.specs};
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(item);
  });

  const lowestMap = new Map();
  for (const [key, group] of groupMap.entries()) {
    const minPrice = Math.min(...group.map(i => i.price));
    lowestMap.set(key, minPrice);
  }

  filteredData.forEach(item => {
    const row = document.createElement('tr');
    const key = ${item.name}-${item.unit}-${item.specs};
    const isLowest = item.price === lowestMap.get(key);

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.brand}</td>
      <td>${item.store}</td>
      <td>${item.location}</td>
      <td class="${isLowest ? 'highlight' : ''}">${item.price}</td>
      <td>${item.currency}</td>
      <td>${item.unit}</td>
      <td>${item.specs}</td>
      <td><a href="${item["Lazada Link"]}" target="_blank">Link</a></td>
      <td><img src="${item["Image URL"]}" alt="Image" width="50"/></td>
      <td>${item.is_verified ? '✅' : ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

function populateLocationFilter(data) {
  const locationFilter = document.getElementById('locationFilter');
  const locations = [...new Set(data.map(item => item.location))];
  locationFilter.innerHTML = '<option value="All">All Locations</option>';
  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    locationFilter.appendChild(option);
  });
}

document.getElementById('searchInput').addEventListener('input', fetchData);
document.getElementById('locationFilter').addEventListener('change', fetchData);

fetchData();
