// script.js
// Prices Checker - fetches data from Supabase and displays in the table

// Initialize Supabase client
const { createClient } = supabase;
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";  // move to Vercel env later!
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch and display products
async function loadProducts() {
  const tableBody = document.querySelector("#products-table tbody");
  tableBody.innerHTML = "<tr><td colspan='12'>Loading...</td></tr>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*");

  if (error) {
    console.error("Error fetching products:", error);
    tableBody.innerHTML = "<tr><td colspan='12'>Error loading data</td></tr>";
    return;
  }

  tableBody.innerHTML = "";
  data.forEach((product) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${product.product_name || ""}</td>
      <td>${product.category || ""}</td>
      <td>${product.brand || ""}</td>
      <td>${product.store || ""}</td>
      <td>${product.location || ""}</td>
      <td>${product.price || ""}</td>
      <td>${product.currency || ""}</td>
      <td>${product.unit || ""}</td>
      <td>${product.specs || ""}</td>
      <td><a href="${product.product_link}" target="_blank">View</a></td>
      <td>${product.image ? `<img src="${product.image}" width="50"/>` : ""}</td>
      <td>${product.verified ? "✅" : "❌"}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Run on page load
document.addEventListener("DOMContentLoaded", loadProducts);
