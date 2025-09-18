// /api/products.js
// ESM (Node 18+). Uses global fetch.
// Finds shopping links (DuckDuckGo lite), filters to real stores,
// extracts price/currency/title/image via JSON-LD/meta, optional Supabase cache.

import * as cheerio from "cheerio";

/* ---------------------------- Config ---------------------------- */

const ALLOWED_HOSTS = new Set([
  // Global
  "amazon.com","bestbuy.com","walmart.com","apple.com","store.google.com",
  "lenovo.com","hp.com","dell.com","microsoft.com","microcenter.com",
  "newegg.com","bhphotovideo.com","target.com","costco.com","ebay.com",
  // PH
  "lazada.com.ph","shopee.ph","smmarkets.ph","abenson.com","pcx.com.ph",
  // KSA
  "noon.com","jarir.com","extra.com","carrefourksa.com","luluhypermarket.com","xcite.com"
]);

const BLOCKED_HOSTS = new Set([
  "wikipedia.org","reddit.com","medium.com","youtube.com","blogspot.com",
  "wordpress.com","x.com","twitter.com","news.ycombinator.com",
  "support","community","forum"
]);

const PER_FETCH_TIMEOUT = 3500;   // ms per page
const OVERALL_BUDGET    = 9000;   // ms per request
const CONCURRENCY       = 3;      // parallel enrich
const MAX_RESULTS       = 10;     // max links to enrich
const UA = "Mozilla/5.0 (PricesCheckerBot/1.0; +https://www.priceschecker.com)";

/* -------------------------- Utilities -------------------------- */

const hostOf = (url="") => { try { return new URL(url).hostname.replace(/^www\./,""); } catch { return ""; } };

const allowedUrl = (url="") => {
  const h = hostOf(url).toLowerCase();
  if (!h) return false;
  if ([...BLOCKED_HOSTS].some(b => h.includes(b))) return false;
  return ALLOWED_HOSTS.size ? ALLOWED_HOSTS.has(h) : true;
};

function withAbortTimeout(ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(t) };
}

const hasSupa = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const supa = async (path, init={}) => {
  if (!hasSupa()) throw new Error("NO_SUPABASE");
  const base = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, ...init.headers };
  return fetch(`${base}${path}`, { ...init, headers });
};

/* ------------------------ Optional Cache ------------------------ */

async function getCache(url) {
  if (!hasSupa()) return null;
  const r = await supa(`/rest/v1/price_cache?url=eq.${encodeURIComponent(url)}&select=*`).catch(()=>null);
  if (!r || !r.ok) return null;
  const rows = await r.json();
  return rows?.[0] || null;
}

async function upsertCache(url, data) {
  if (!hasSupa()) return;
  await supa("/rest/v1/price_cache", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ url, ...data }])
  }).catch(()=>{});
}

/* -------------------------- Search (DDG) ----------------------- */

async function searchLinks(query) {
  const searchURL = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}+buy`;
  const { signal, cancel } = withAbortTimeout(3000);
  try {
    const r = await fetch(searchURL, { signal, headers: { "user-agent": UA } });
    const html = await r.text();
    const $ = cheerio.load(html);
    const links = [];
    $("a.result__a[href]").each((_, a) => {
      const href = $(a).attr("href");
      if (!href) return;
      if (/^https?:\/\//i.test(href) && allowedUrl(href)) links.push(href);
    });
    return Array.from(new Set(links)).slice(0, MAX_RESULTS);
  } catch {
    return [];
  } finally {
    cancel();
  }
}

/* ------------------------- Extraction -------------------------- */

const jsonParse = (t) => { try { return JSON.parse(t); } catch { return null; } };
const first = (...xs) => xs.find(v => {
  if (Array.isArray(v)) return v.length;
  return v !== undefined && v !== null && String(v).trim() !== "";
}) ?? null;

function isType(obj, t){
  const at = obj?.["@type"]; if (!at) return false;
  if (typeof at === "string") return at.toLowerCase() === t;
  if (Array.isArray(at)) return at.map(x=>String(x).toLowerCase()).includes(t);
  return false;
}

function extractJsonLd(blocks){
  const product = blocks.find(b => isType(b,"product")) || null;
  let offer = product?.offers || blocks.find(b => isType(b,"offer")) || null;
  if (Array.isArray(offer)) offer = offer[0];

  const title = product?.name || null;
  const price = first(offer?.price, offer?.lowPrice, offer?.highPrice);
  const currency = offer?.priceCurrency || null;
  const brand = product?.brand?.name || product?.brand || null;
  const category = product?.category || null;
  const image = first(product?.image);

  return { title, price: price?.toString() || null, currency, brand, category, image_url: image || null };
}

function extractMeta($, baseUrl){
  const ogTitle = $('meta[property="og:title"]').attr("content") || $('meta[name="title"]').attr("content");
  const ogImg   = $('meta[property="og:image"]').attr("content");
  const ogDesc  = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content");
  const ogPrice = $('meta[property="product:price:amount"]').attr("content") || $('meta[itemprop="price"]').attr("content");
  const ogCurr  = $('meta[property="product:price:currency"]').attr("content") || $('meta[itemprop="priceCurrency"]').attr("content");

  const text = [ogDesc, $("body").text()].filter(Boolean).join(" ").replace(/\s+/g, " ");
  const money = text.match(/(?:₱|PHP|SAR|AED|\$|€|£)\s?\d[\d,]*(?:\.\d{1,2})?/i)?.[0] || null;
  let currency = ogCurr || (money?.match(/₱|PHP|SAR|AED|\$|€|£/i)?.[0] ?? null);
  if (currency) currency = currency.toUpperCase().replace("₱","PHP").replace("$","USD");

  const img = ogImg ? new URL(ogImg, baseUrl).toString() : null;

  return {
    title: ogTitle || null,
    price: ogPrice || (money ? money.replace(/[^\d.,]/g,"") : null),
    currency: currency || null,
    brand: null,
    category: null,
    image_url: img
  };
}

async function enrichOne(url){
  // 1) cache
  const cached = await getCache(url);
  if (cached) {
    const fresh = Date.now() - new Date(cached.scraped_at).getTime() < 12*60*60*1000;
    if (fresh) return { ...cached, from: "cache" };
  }

  // 2) fetch html (time-boxed)
  const { signal, cancel } = withAbortTimeout(PER_FETCH_TIMEOUT);
  let html = "";
  try{
    const r = await fetch(url, { signal, headers: { "user-agent": UA } });
    if (!r.ok) throw new Error(`status ${r.status}`);
    html = await r.text();
  }catch{
    cancel();
    return null;
  }
  cancel();

  // 3) parse
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]')
    .toArray()
    .map(el => jsonParse($(el).contents().text()))
    .flatMap(x => Array.isArray(x) ? x : [x])
    .filter(Boolean);

  let ext = extractJsonLd(blocks);
  if (!ext.title && !ext.price && !ext.currency) {
    ext = { ...ext, ...extractMeta($, url) };
  }

  const data = {
    title: ext.title || null,
    price: ext.price || null,
    currency: ext.currency || null,
    brand: ext.brand || null,
    category: ext.category || null,
    image_url: ext.image_url || null,
    specs: null,
    scraped_at: new Date().toISOString()
  };

  await upsertCache(url, data);
  return data;
}

/* ------------------------ Concurrency helper ------------------- */

async function mapLimit(items, limit, worker){
  const out = new Array(items.length);
  let i=0, active=0;
  return await new Promise(resolve => {
    const pump = () => {
      while (active < limit && i < items.length) {
        const idx = i++; active++;
        worker(items[idx])
          .then(v => out[idx]=v)
          .catch(()=> out[idx]=null)
          .finally(()=>{ active--; (i>=items.length && active===0) ? resolve(out) : pump(); });
      }
    };
    pump();
  });
}

/* ----------------------------- Handler ------------------------- */

export default async function handler(req, res){
  try{
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.status(200).json([]);

    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=86400");

    const guard = new Promise((_, rej)=> setTimeout(()=> rej(new Error("overall-timeout")), OVERALL_BUDGET));

    const work = (async ()=>{
      const links = await searchLinks(q);
      if (!links.length) return [];

      const enriched = await mapLimit(links, CONCURRENCY, enrichOne);

      const rows = links.map((url, i) => {
        const h = hostOf(url);
        const e = enriched[i] || {};
        return {
          name: e.title || h,
          category: e.category || "",
          brand: e.brand || "",
          store: h,
          location: "",
          price: e.price || "",
          currency: e.currency || "",
          unit: "",
          specs: "",
          product_link: url,
          image_url: e.image_url || "",
          is_verified: Boolean(e.price && e.currency && ALLOWED_HOSTS.has(h))
        };
      });

      return rows.filter(r => allowedUrl(r.product_link));
    })();

    const result = await Promise.race([work, guard]).catch(e => e?.message==="overall-timeout" ? [] : []);
    return res.status(200).json(result);
  }catch{
    return res.status(200).json([]); // be graceful to the UI
  }
}
