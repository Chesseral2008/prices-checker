// Supabase connection
const SUPABASE_URL = 'https://atyjvpsjlhvzpqmqyylv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA';

const tableBody = document.getElementById("productTableBody");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");

async function fetchData() {
    const response = await fetch(${SUPABASE_URL}/rest/v1/products?select=*, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: Bearer ${SUPABASE_KEY}
        }
    });
    const data = await response.json();
    return data;
}

function renderTable(data) {
    tableBody.innerHTML = "";

    const searchValue = searchInput.value.toLowerCase();
    const selectedLocation = locationFilter.value;

    const groupedByName = {};

    data.forEach(item => {
        const name = item["Product Name"];
        if (!groupedByName[name]) {
            groupedByName[name] = [];
        }
        groupedByName[name].push(item);
    });

    for (const name in groupedByName) {
        const group = groupedByName[name];
        const minPrice = Math.min(...group.map(item => parseFloat(item.Price)));

        group.forEach(item => {
            const matchesSearch = name.toLowerCase().includes(searchValue) || item.Brand.toLowerCase().includes(searchValue);
            const matchesLocation = selectedLocation === "" || item.Location === selectedLocation;

            if (matchesSearch && matchesLocation) {
                const row = document.createElement("tr");

                const columns = [
                    "Product Name", "Category", "Brand", "Store Name", "Location", "Price", "Currency",
                    "Unit", "Specs", "Lazada Link", "Image URL", "is_verified"
                ];

                columns.forEach(key => {
                    const cell = document.createElement("td");

                    if (key === "Lazada Link" && item[key]) {
                        const link = document.createElement("a");
                        link.href = item[key];
                        link.target = "_blank";
                        link.textContent = "Link";
                        cell.appendChild(link);
                    } else if (key === "Image URL" && item[key]) {
                        const img = document.createElement("img");
                        img.src = item[key];
                        img.alt = "Product Image";
                        img.style.width = "50px";
                        cell.appendChild(img);
                    } else {
                        cell.textContent = item[key] !== null ? item[key] : "";
                    }

                    if (key === "Price" && parseFloat(item[key]) === minPrice) {
                        cell.style.color = "green";
                        cell.style.fontWeight = "bold";
                    }

                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            }
        });
    }
}

searchInput.addEventListener("input", () => {
    fetchData().then(renderTable);
});

locationFilter.addEventListener("change", () => {
    fetchData().then(renderTable);
});

fetchData().then(renderTable);
