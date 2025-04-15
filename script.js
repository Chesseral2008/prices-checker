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

function getLowestPrices(products) {
    const map = new Map();

    products.forEach(product => {
        const key = `${product.name}_${product.category}_${product.brand}_${product.unit}_${product.specs}_${product.location}`;
        if (!map.has(key) || product.price < map.get(key).price) {
            map.set(key, product);
        }
    });

    return map;
}

function renderProducts(products) {
    productContainer.innerHTML = '';

    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.classList.add('category-section');

        const heading = document.createElement('h2');
        heading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySection.appendChild(heading);

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

        const lowestPrices = getLowestPrices(products);

        products
            .filter(p => p.category === category)
            .forEach(product => {
                const tr = document.createElement('tr');

                const key = `${product.name}_${product.category}_${product.brand}_${product.unit}_${product.specs}_${product.location}`;
                const isLowest = lowestPrices.get(key)?.price === product.price;

                tr.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.brand}</td>
                    <td>${product.store}</td>
                    <td>${product.location}</td>
                    <td>${product.unit}</td>
                    <td>${product.specs}</td>
                    <td style="color: ${isLowest ? 'green' : 'inherit'}; font-weight: ${isLowest ? 'bold' : 'normal'};">
                        ₱${parseFloat(product.price).toLocaleString()}
                    </td>
                `;

                tbody.appendChild(tr);
            });

        table.appendChild(tbody);
        categorySection.appendChild(table);
        productContainer.appendChild(categorySection);
    });
}

function applyFilters(products) {
    const categoryValue = categoryFilter.value.toLowerCase();
    const locationValue = locationFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();

    return products.filter(product =>
        (categoryValue === '' || product.category.toLowerCase() === categoryValue) &&
        (locationValue === '' || product.location.toLowerCase() === locationValue) &&
        (
            product.name.toLowerCase().includes(searchValue) ||
            product.brand.toLowerCase().includes(searchValue) ||
            product.store.toLowerCase().includes(searchValue)
        )
    );
}

async function initialize() {
    let allProducts = await fetchProducts();

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
