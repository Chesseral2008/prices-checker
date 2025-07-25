document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const locationFilter = document.getElementById('locationFilter');
  const productTableBody = document.querySelector('#productTable tbody');

  async function fetchData() {
    const response = await fetch('https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products?select=*', {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA',
      }
    });
    return await response.json();
  }

  function renderTable(data) {
    productTableBody.innerHTML = "";
    const uniqueLocations = new Set();

    data.forEach(item => {
      uniqueLocations.add(item.location);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.brand}</td>
        <td>${item.store}</td>
        <td>${item.location}</td>
        <td>${item.price}</td>
        <td>${item.currency}</td>
        <td>${item.unit}</td>
        <td>${item.specs}</td>
        <td><a href="${item.lazada_link || '#'}" target="_blank">Link</a></td>
        <td>${item.image_url ? `<img src="${item.image_url}" class="product-image" />` : ''}</td>
        <td>${item.is_verified ? '✔️' : ''}</td>
      `;
      productTableBody.appendChild(row);
    });

    // Populate filter
    locationFilter.innerHTML = '<option value="All">All Locations</option>';
    [...uniqueLocations].sort().forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      locationFilter.appendChild(opt);
    });
  }

  function applyFilters(data) {
    const keyword = searchInput.value.toLowerCase();
    const selectedLocation = locationFilter.value;

    return data.filter(item =>
      (item.name.toLowerCase().includes(keyword) || item.brand.toLowerCase().includes(keyword)) &&
      (selectedLocation === "All" || item.location === selectedLocation)
    );
  }

  let allData = [];
  fetchData().then(data => {
    allData = data;
    renderTable(data);
  });

  searchInput.addEventListener('input', () => renderTable(applyFilters(allData)));
  locationFilter.addEventListener('change', () => renderTable(applyFilters(allData)));
});
