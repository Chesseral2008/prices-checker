// Updated script.js

// Fetch data from Supabase fetch('https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products', { headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA', Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA' } }) .then(res => res.json()) .then(data => { const categoryGroups = {};

// Group by category first
data.forEach(item => {
  const category = item.category || 'Others';
  if (!categoryGroups[category]) categoryGroups[category] = [];
  categoryGroups[category].push(item);
});

const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = '';

Object.entries(categoryGroups).forEach(([category, items]) => {
  const groupKeyMap = {};

  // Group items by composite key: name+unit+specs+location
  items.forEach(item => {
    const key = `${item.name}_${item.unit}_${item.specs}_${item.location}`;
    if (!groupKeyMap[key]) groupKeyMap[key] = [];
    groupKeyMap[key].push(item);
  });

  const categoryCard = document.createElement('div');
  categoryCard.className = 'category-card';

  const categoryTitle = document.createElement('h2');
  categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  categoryCard.appendChild(categoryTitle);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Name</th><th>Brand</th><th>Store</th><th>Location</th><th>Unit</th><th>Specs</th><th>Price</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  Object.values(groupKeyMap).forEach(groupItems => {
    const minPrice = Math.min(...groupItems.map(i => parseFloat(i.price)));
    groupItems.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.name}</td>
        <td>${i.brand}</td>
        <td>${i.store}</td>
        <td>${i.location}</td>
        <td>${i.unit || ''}</td>
        <td>${i.specs || ''}</td>
        <td class="${parseFloat(i.price) === minPrice ? 'highlight' : ''}">₱${parseFloat(i.price).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  table.appendChild(tbody);
  categoryCard.appendChild(table);
  resultsDiv.appendChild(categoryCard);
});

});

