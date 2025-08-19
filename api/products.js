// /api/products.js
// Returns product-like links fast, with strict timeouts, limited concurrency,
// and partial results if the overall budget is reached.

import fetch from "node-fetch";
import * as cheerio from "cheerio";

const ALLOWED_HOSTS = new Set([
  "amazon.com", "bestbuy.com", "walmart.com", "samsung.com",
  "lenovo.com", "hp.com", "dell.com", "apple.com", "store.google.com",
  "microcenter.com", "newegg.com", "bhphotovideo.com", "target.com",
  "costco.com", "caudabe.com", "frame.work",
]);

const BLOCKED_HOSTS = new Set([
  "wikipedia.org", "reddit.com", "medium.com", "youtube.com",
  "blogspot.com", "wordpress.com", "h30434.www3.hp.com", // support forum
  "support.hp.com", "support.lenovo.com", "support.dell.com",
  "support.apple.com", "community", "forum",
]);

// --- knobs you can tune ---
const MAX_RESULTS        = 8;      // don’t enrich more than this many pages
const PER_FETCH_TIMEOUT  = 2500;   // ms per site (hard cap)
const OVERALL_BUDGET     = 8000;   // ms total budget for the whole request
const CONCURRENCY        = 3;      // parallel fetches at a time
// ----------------------------

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function allowed(url) {
  const h = hostOf(url);
  if (!h) return false;
  if (BLOCKED_HOSTS.has(h)) return false;
  // block obvious support / forum in path
  const lc = url.toLowerCase();
  if (lc.includes("/support") || lc.includes("/community") || lc.includes("/forum")) return false;
  // if we keep an allow-list, enforce it
  return ALLOWED_HOSTS.size ? ALLOWED_HOSTS.has(h) : true;
}

function withTimeout(promise, ms, msg = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms)),
  ]);
}

async function fetchWithAbort(url, ms) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { signal: ac.signal, headers: { "user-agent": "Mozilla/5.0 PricesCheckerBot" } });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function extractQuickMeta(html, url) {
  // very cheap pass: try to pull price/currency from meta content
  const $ = cheerio.load(html);

  // common price-ish hints
  const text = $("meta[property='og:description'],meta[name='description']").attr("content") || $("body").text() || "";
  const ONE = text.match(/(?:USD|\$|SAR|AED|€|£)\s?\d[\d,]*(?:\.\d{1,2})?/i)?.[0] || "";

  // fallback to first image in the page
  const img =
    $("meta[property='og:image']").attr("content") ||
    $("img[src]").first().attr("src") || "";

  const price = ONE || "";
  const currency = price.startsWith("$") ? "USD" :
                   /SAR/i.test(price) ? "SAR" :
                   /AED/i.test(price) ? "AED" :
                   /€/.test(price)    ? "EUR" :
                   /£/.test(price)    ? "GBP" : "";

  // simple unit and location stays empty unless found later
  return {
    price,
    currency,
    unit: "",
    image_url: img ? new URL(img, url).toString() : "",
  };
}

async function enrichOne(link) {
  // fetch fast; don’t block the whole pipeline
  try {
    const res = await fetchWithAbort(link, PER_FETCH_TIMEOUT);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const html = await withTimeout(res.text(), PER_FETCH_TIMEOUT / 2, "read-timeout");
    const meta = extractQuickMeta(html, link);
    return { ok: true, ...meta };
  } catch {
    return { ok: false };
  }
}

async function runWithLimit(items, limit, worker) {
  const out = [];
  let idx = 0, active = 0;

  return await new Promise(resolve => {
    const kick = () => {
      while (active < limit && idx < items.length) {
        const i = idx++;
        active++;
        worker(items[i])
          .then(v => { out[i] = v; })
          .catch(() => { out[i] = { ok: false }; })
          .finally(() => {
            active--;
            if (idx >= items.length && active === 0) resolve(out);
            else kick();
          });
      }
    };
    kick();
  });
}

function capTime(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error("overall-budget")), ms));
}

export default async function handler(req, res) {
  try {
    const { q = "" } = req.query;
    const query = String(q || "").trim();
    if (!query || query.length < 2) {
      res.status(200).json([]);
      return;
    }

    // Allow CDN caching for a bit to avoid repeated work
    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=86400");

    // 1) Use a quick web search (DuckDuckGo HTML lite) to collect links.
    // (We avoid heavy, rate-limited APIs here.)
    const searchURL = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}+buy`;
    const searchRes = await withTimeout(fetchWithAbort(searchURL, 3000), 3200);
    const searchHtml = await withTimeout(searchRes.text(), 2000);
    const $ = cheerio.load(searchHtml);

    const links = [];
    $("a.result__a[href]").each((_, a) => {
      const href = $(a).attr("href");
      if (!href) return;
      // duckduckgo direct links often okay; ensure http(s)
      if (/^https?:\/\//i.test(href) && allowed(href)) {
        links.push(href);
      }
    });

    const unique = Array.from(new Set(links)).slice(0, MAX_RESULTS);
    if (!unique.length) {
      res.status(200).json([]);
      return;
    }

    // 2) Enrich concurrently with strict per-site timeouts + overall budget
    const resultsPromise = (async () => {
      const enriched = await runWithLimit(unique, CONCURRENCY, enrichOne);

      const items = unique.map((url, i) => {
        const host = hostOf(url);
        const meta = enriched[i] || {};
        return {
          name: $("a.result__a").eq(i).text().trim() || host,
          category: "",
          brand: "",
          store: host,
          location: "",
          price: meta.price || "",
          currency: meta.currency || "",
          unit: meta.unit || "",
          specs: "",   // (kept for now; can be populated later)
          product_link: url,
          image_url: meta.image_url || "",
          is_verified: ALLOWED_HOSTS.has(host),
        };
      });

      return items;
    })();

    const items = await Promise.race([resultsPromise, capTime(OVERALL_BUDGET)]);
    res.status(200).json(items);
  } catch (e) {
    // If we blew the budget, return whatever we managed to gather (if any)
    if (e && e.message === "overall-budget") {
      // Return empty but 200 so UI doesn’t treat it as a hard failure
      res.status(200).json([]);
      return;
    }
    res.status(200).json([]); // be graceful; no 5xx to the UI
  }
}
