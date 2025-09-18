const qs = (s, el=document) => el.querySelector(s);
const $q = qs('#query');
const $loc = qs('#location');
const $btn = qs('#searchBtn');
const $tbody = qs('#results-body');
qs('#year').textContent = new Date().getFullYear();

// Allow/Block lists
const ALLOWED = new Set([
  "amazon.com","bestbuy.com","walmart.com","apple.com","store.google.com",
  "lenovo.com","hp.com","dell.com","microsoft.com","microcenter.com",
  "newegg.com","bhphotovideo.com","target.com","costco.com","ebay.com",
  "lazada.com.ph","shopee.ph","smmarkets.ph","abenson.com","pcx.com.ph",
  "noon.com","jarir.com","extra.com","carrefourksa.com","luluhypermarket.com","xcite.com"
]);

const BLOCKED = new Set([
  "wikipedia.org","reddit.com","medium.com","youtube.com","blogspot.com",
  "wordpress.com","x.com","twitter.com","news.ycombinator.com","support","community","forum"
]);

const hostOf = (u="") => { try { return new URL(u).hostname.replace(/^www\./,""); } catch { return ""; } };

function looksProductLike(item){
  const host = hostOf(item.product_link || item.link || "");
  if (!host) return false;
  if ([...BLOCKED].some(b => host.includes(b))) return false;
  if (ALLOWED.has(host)) return true;
  const t = `${item.title||item.name||""}`.toLowerCase();
  return /\b(buy|price|shop|add to cart|cart|store|model|sku)\b/.test(t);
}

function renderRows(items){
  $tbody.innerHTML = '';
  if (!items?.length) {
    $tbody.innerHTML = `<tr><td colspan="12" style="color:#6b7280">No results yet. Try another keyword.</td></tr>`;
    return;
  }
  for (const it of items){
    const name = it.name || it.title || '';
    const link = it.product_link || it.link || '';
    const img  = it.image_url || it.image || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${it.category ?? ''}</td>
      <td>${it.brand ?? ''}</td>
      <td>${hostOf(link) || it.store || ''}</td>
      <td>${it.location ?? ''}</td>
      <td>${it.price ?? ''}</td>
      <td>${it.currency ?? ''}</td>
      <td>${it.unit ?? ''}</td>
      <td>${it.specs ? (''+it.specs).slice(0,160) : ''}</td>
      <td>${link ? `<a class="link" href="${link}" target="_blank" rel="noopener">View</a>` : ''}</td>
      <td>${img ? `<img class="thumb" src="${img}" alt="">` : ''}</td>
      <td>${it.is_verified ? `<span class="badge ok">✓ Verified</span>` : `<span class="badge">—</span>`}</td>
    `;
    $tbody.appendChild(tr);
  }
}

async function runSearch(q){
  $tbody.innerHTML = `<tr><td colspan="12" style="color:#6b7280">Searching…</td></tr>`;
  $btn.disabled = true;
  try{
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results || []);
    const filtered = list.filter(looksProductLike);
    renderRows(filtered);
  }catch(e){
    console.error(e);
    $tbody.innerHTML = `<tr><td colspan="12" style="color:#b91c1c">Error loading results. Try again.</td></tr>`;
  }finally{
    $btn.disabled = false;
  }
}

document.getElementById('search-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = $q.value.trim();
  if (!q){ $tbody.innerHTML = ''; return; }
  runSearch(q);
});

// Optional: initial search
if ($q.value.trim()) runSearch($q.value.trim());
