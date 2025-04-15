async function fetchData() {
  const response = await fetch('https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products?select=*', {
    headers: {
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA'
    }
  });
  const data = await response.json();
  return data;
}

function groupData(data, groupBy) {
  const grouped = {};
  data.forEach(item => {
    const group = item[groupBy] || 'Others';
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(item);
  });
  return grouped;
}

function renderData(groupedData) {
  const container = document.getElementById('data-container');
  container.innerHTML = '';

  for (const group in groupedData) {
    const groupTitle = document.createElement('h2');
    groupTitle.textContent = group;
    groupTitle.classList.add('category-title');

    const table = document.createElement('table');
    table.classList.add('price-table');

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
    const groupItems = groupedData[group];

    const prices = groupItems.map(item => parseFloat(item.price)).filter(p => !isNaN(p));
    const minPrice = Math.min(...prices);

    groupItems.forEach(item => {
      const row = document.createElement('tr');
      const price = parseFloat(item.price);
      const isMinPrice = price === minPrice;

      row.innerHTML = `
        <td>${item.name || ''}</td>
        <td>${item.brand || ''}</td>
        <td>${item.store || ''}</td>
        <td>${item.location || ''}</td>
        <td>${item.unit || ''}</td>
        <td>${item.specs || ''}</td>
        <td class="${isMinPrice ? 'highlight' : ''}">₱${price.toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(groupTitle);
    container.appendChild(table);
  }
}

function setupFilters(data) {
  const categorySelect = document.getElementById('category');
  const locationSelect = document.getElementById('location');
  const searchInput = document.getElementById('search');

  const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
  const locations = [...new Set(data.map(item => item.location).filter(Boolean))];

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    locationSelect.appendChild(option);
  });

  function applyFilters() {
    const selectedCategory = categorySelect.value;
    const selectedLocation = locationSelect.value;
    const searchText = searchInput.value.toLowerCase();

    const filtered = data.filter(item => {
      const matchCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchLocation = selectedLocation ? item.location === selectedLocation : true;
      const matchSearch = item.name?.toLowerCase().includes(searchText) || item.brand?.toLowerCase().includes(searchText) || item.store?.toLowerCase().includes(searchText);
      return matchCategory && matchLocation && matchSearch;
    });

    const grouped = groupData(filtered, 'category');
    renderData(grouped);
  }

  categorySelect.addEventListener('change', applyFilters);
  locationSelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);

  applyFilters();
}

window.onload = async () => {
  const data = await fetchData();
  const grouped = groupData(data, 'category');
  renderData(grouped);
  setupFilters(data);
};
