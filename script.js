// script.js

async function fetchProducts() {
  try {
    // Call your serverless function instead of Supabase directly
    const response = await fetch('/api/products');

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById("products").innerHTML = 
      `<p style="color:red;">Failed to load products. Check console for details.</p>`;
  }
}

function displayProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("product");

    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>Price: $${product.price}</p>
    `;

    container.appendChild(div);
  });
}

// Run fetch on page load
document.addEventListener("DOMContentLoaded", fetchProducts);
