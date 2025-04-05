import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://atyjvpsjlhvzpqmqyylv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA'
const supabase = createClient(supabaseUrl, supabaseKey)

const categoryFilter = document.getElementById("categoryFilter")
const locationFilter = document.getElementById("locationFilter")
const searchInput = document.getElementById("searchInput")
const productList = document.getElementById("productList")

let products = []

async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*')
  if (error) {
    console.error("Error loading data:", error)
    return
  }
  products = data
  populateFilters()
  renderProducts()
}

function populateFilters() {
  const categories = [...new Set(products.map(p => p.category))].sort()
  const locations = [...new Set(products.map(p => p.location))].sort()

  categories.forEach(cat => {
    const option = document.createElement("option")
    option.value = cat
    option.textContent = cat
    categoryFilter.appendChild(option)
  })

  locations.forEach(loc => {
    const option = document.createElement("option")
    option.value = loc
    option.textContent = loc
    locationFilter.appendChild(option)
  })
}

function renderProducts() {
  const searchQuery = searchInput.value.toLowerCase()
  const category = categoryFilter.value
  const location = locationFilter.value

  productList.innerHTML = ""

  const grouped = {}

  products.forEach(p => {
    if (
      (category === "all" || p.category === category) &&
      (location === "all" || p.location === location) &&
      (p.brand.toLowerCase().includes(searchQuery) || p.store.toLowerCase().includes(searchQuery))
    ) {
      if (!grouped[p.name]) grouped[p.name] = []
      grouped[p.name].push(p)
    }
  })

  Object.entries(grouped).forEach(([name, items]) => {
    const card = document.createElement("div")
    card.className = "product-card"

    const header = document.createElement("h2")
    header.textContent = name
    card.appendChild(header)

    const table = document.createElement("table")
    table.innerHTML = `
      <thead><tr><th>Brand</th><th>Store</th><th>Price</th></tr></thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.brand}</td>
            <td>${i.store}</td>
            <td class="${i.price === Math.min(...items.map(p => p.price)) ? 'lowest-price' : ''}">₱${i.price.toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    `
    card.appendChild(table)
    productList.appendChild(card)
  })
}

searchInput.addEventListener("input", renderProducts)
categoryFilter.addEventListener("change", renderProducts)
locationFilter.addEventListener("change", renderProducts)

fetchProducts()
