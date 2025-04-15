// Updated script.js

// Show loading message while fetching const resultsContainer = document.getElementById("results"); resultsContainer.innerHTML = "<p>Loading data, please wait...</p>";

const supabaseUrl = "https://atyjvpsjlhvzpqmqyylv.supabase.co"; const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWp2cHNqbGh2enBxbXF5eWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5NjEsImV4cCI6MjA1OTI4ODk2MX0.bVmzY9wQI32Xrnmy5HwXzy8tUIPPTkSf-lg6p1nQ_LA"; const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function fetchData() { const { data, error } = await supabase .from("products") .select("name, category, brand, store, price, location, unit, specs") .limit(10000); // Fetch 10,000 rows per call (adjustable)

if (error) { resultsContainer.innerHTML = <p style="color:red;">Error fetching data: ${error.message}</p>; return; }

if (data.length === 0) { resultsContainer.innerHTML = "<p>No data available.</p>"; return; }

renderData(data); }

function renderData(products) { const grouped = {};

for (const item of products) { const key = item.category || "Others"; if (!grouped[key]) grouped[key] = []; grouped[key].push(item); }

resultsContainer.innerHTML = "";

for (const category in grouped) { const section = document.createElement("div"); section.classList.add("category-block"); section.innerHTML = <h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2> <table> <thead> <tr><th>Brand</th><th>Store</th><th>Price</th><th>Unit</th><th>Specs</th></tr> </thead> <tbody> ${grouped[category].map(p => <tr> <td>${p.brand || "-"}</td> <td>${p.store || "-"}</td> <td>₱${Number(p.price).toLocaleString()}</td> <td>${p.unit || "-"}</td> <td>${p.specs || "-"}</td> </tr> ).join('')} </tbody> </table> ; resultsContainer.appendChild(section); } }

document.addEventListener("DOMContentLoaded", fetchData);

