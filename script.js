const API_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co/rest/v1/products';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Truncated for safety. Use full anon key.

async function fetchProducts() {
  const res = await fetch(${API_URL}?select=*, {
    headers: {
      apikey: API_KEY,
      Authorization: Bearer ${API_KEY}
    }
  });
  return res.json();
}

function getLowestPrices(products) {
  const grouped = {};
  for (const product of products) {
    if (!grouped[product.name]) grouped[product.name] = [];
    grouped[product.name].push(product);
  }

  const lowestPrices = {};
  for (const name in grouped) {
    const items = grouped[name];
    const min = Math.min(...items.map(p => p.price));
    lowestPrices[name] = items.filter(p => p.price === min);
  }

  return lowestPrices;
}

function displayProducts(products) {
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';

  const lowestPrices = getLowestPrices(products);

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = p.name;

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = ${p.price} ${p.currency};

    if (lowestPrices[p.name].some(lp => lp.store === p.store && lp.location === p.location)) {
      price.classList.add('lowest');
    }

    const store = document.createElement('div');
    store.textContent = ${p.store} - ${p.location};

    const specs = document.createElement('div');
    specs.textContent = p.specs;

    card.append(name, price, store, specs);
    container.appendChild(card);
  });
}

function filterAndSearch(products) {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const location = document.getElementById('locationFilter').value;

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)) &&
    (!location || p.location === location)
  );

  displayProducts(filtered);
}

function populateLocationFilter(products) {
  const dropdown = document.getElementById('locationFilter');
  const locations = [...new Set(products.map(p => p.location))].sort();
  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    dropdown.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchProducts();
  populateLocationFilter(products);
  displayProducts(products);

  document.getElementById('searchInput').addEventListener('input', () => filterAndSearch(products));
  document.getElementById('locationFilter').addEventListener('change', () => filterAndSearch(products));
});
