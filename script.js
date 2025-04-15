// Initialize Supabase client
const { createClient } = supabase;
const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch and display products
async function fetchProducts() {
    const { data, error } = await supabase.from('full_products_view').select('*');
    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    const grouped = groupByCategory(data);
    displayProducts(grouped);
    populateFilters(data);
}

// Group products by category
function groupByCategory(products) {
    return products.reduce((groups, product) => {
        const category = product.category || 'Uncategorized';
        if (!groups[category]) groups[category] = [];
        groups[category].push(product);
        return groups;
    }, {});
}

// Display products on the page
function displayProducts(groupedProducts) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    const selectedCategory = document.getElementById('categoryFilter').value;
    const selectedLocation = document.getElementById('locationFilter').value.toLowerCase();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    for (const category in groupedProducts) {
        let products = groupedProducts[category];

        if (selectedCategory && selectedCategory !== category) continue;

        products = products.filter(p => {
            const matchLocation = selectedLocation === '' || (p.location || '').toLowerCase().includes(selectedLocation);
            const matchSearch = !searchTerm || 
                (p.brand && p.brand.toLowerCase().includes(searchTerm)) || 
                (p.store && p.store.toLowerCase().includes(searchTerm)) ||
                (p.name && p.name.toLowerCase().includes(searchTerm));
            return matchLocation && matchSearch;
        });

        if (products.length === 0) continue;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        const header = document.createElement('h2');
        header.textContent = category;
        categoryDiv.appendChild(header);

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
        const minPrice = Math.min(...products.map(p => parseFloat(p.price)).filter(p => !isNaN(p)));

        products.forEach(product => {
            const row = document.createElement('tr');
            const price = parseFloat(product.price);
            const isLowest = price === minPrice;
            row.innerHTML = `
                <td>${product.name || ''}</td>
                <td>${product.brand || ''}</td>
                <td>${product.store || ''}</td>
                <td>${product.location || ''}</td>
                <td>${product.unit || ''}</td>
                <td>${product.specs || ''}</td>
                <td class="${isLowest ? 'highlight' : ''}">₱${price.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        categoryDiv.appendChild(table);
        container.appendChild(categoryDiv);
    }
}

// Populate filter dropdowns
function populateFilters(products) {
    const categorySet = new Set();
    const locationSet = new Set();

    products.forEach(p => {
        if (p.category) categorySet.add(p.category);
        if (p.location) locationSet.add(p.location);
    });

    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');

    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    locationFilter.innerHTML = '<option value="">All Locations</option>';

    Array.from(categorySet).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    Array.from(locationSet).sort().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Event listeners for filters
document.getElementById('searchInput').addEventListener('input', fetchProducts);
document.getElementById('categoryFilter').addEventListener('change', fetchProducts);
document.getElementById('locationFilter').addEventListener('change', fetchProducts);

// Initial fetch
fetchProducts();
