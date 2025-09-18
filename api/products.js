// /api/products.js
// Serverless function for Prices Checker
//
// - Loads Allowed/Blocked host patterns from Supabase (cached 10 min)
// - Filters search results so only “real” product/service pages pass through
// - Plug your existing aggregator/scraper inside gatherResults()

import { createClient } from "@supabase/supabase-js";

// ---------- Supabase client (Service Role strongly recommended) ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY || // optional alias
  process.env.SUPABASE_ANON_KEY;      // fallback (only if you added read policies)

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn(
    "[/api/products] Missing SUPABASE_URL or service key. " +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in Vercel env."
  );
}

const supabase = createClient(SUPABASE_URL || "", SERVICE_KEY || "");

// ---------- In-memory hostlist cache ----------
let _hostCache = { allow: [], block: [], ts: 0 };
const CACHE_MS = 10 * 60 * 1000; // 10 minutes

// ---------- Helpers ----------
function normalizeHost(h) {
  try {
    // Accept either “example.com” or full URL
    const url = new URL(h.startsWith("http") ? h : `https://${h}`);
    return url.hostname.replace(/^www\./, "");
  } catch (_) {
    // If it's not a valid URL, treat input as a bare host and normalize
    return String(h || "").trim().replace(/^www\./, "");
  }
}

/**
 * Supports:
 *  - exact: "amazon.com"
 *  - wildcard: "*.lazada.com" or "lazada.com" (will also match subdomains)
 */
function hostMatchesPattern(host, pattern) {
  const h = normalizeHost(host);
  const p = String(pattern || "").trim().toLowerCase().replace(/^www\./, "");

  if (!h || !p) return false;
  if (p.includes("*")) {
    // convert wildcard to regex
    const re = new RegExp(
      "^" +
        p
          .replace(/\./g, "\\.")
          .replace(/\*/g, ".*") +
        "$",
      "i"
    );
    return re.test(h);
  }
  // exact or subdomain match (treat bare "amazon.com" as also matching *.amazon.com)
  return h === p || h.endsWith("." + p);
}

async function loadHostLists() {
  const now = Date.now();
  if (now - _hostCache.ts < CACHE_MS && _hostCache.allow.length + _hostCache.block.length > 0) {
    return _hostCache;
  }

  // Fetch allowed_hosts
  const { data: allowRows, error: allowErr } = await supabase
    .from("allowed_hosts")
    .select("host_pattern");

  if (allowErr) {
    console.error("[/api/products] allow fetch error:", allowErr);
  }

  // Fetch blocked_hosts
  const { data: blockRows, error: blockErr } = await supabase
    .from("blocked_hosts")
    .select("host_pattern");

  if (blockErr) {
    console.error("[/api/products] block fetch error:", blockErr);
  }

  _hostCache = {
    allow: (allowRows || []).map((r) => r.host_pattern).filter(Boolean),
    block: (blockRows || []).map((r) => r.host_pattern).filter(Boolean),
    ts: Date.now(),
  };

  return _hostCache;
}

function isHostAllowed(host, hostLists) {
  const h = normalizeHost(host);
  if (!h) return false;

  // Explicit block wins
  for (const patt of hostLists.block) {
    if (hostMatchesPattern(h, patt)) return false;
  }

  // If allow list exists, require a match (whitelist mode)
  if (hostLists.allow.length > 0) {
    for (const patt of hostLists.allow) {
      if (hostMatchesPattern(h, patt)) return true;
    }
    return false;
  }

  // If no allow list defined, then not blocked = allowed
  return true;
}

// ---------- Your aggregator / scraper hook ----------
// Replace this with your real aggregator that returns an array of items.
// Each item should include a URL so we can extract the host.
// Minimal shape we use here: { product_link, name, store, ... }
async function gatherResults(query, location) {
  // TODO: plug in your existing code here.
  // Keep the return shape so the filter works.
  // For now, return [] and let the filter + UI do their jobs.

  // Example structure:
  // return [
  //   {
  //     name: "Samsung Galaxy S24",
  //     category: "phones",
  //     brand: "Samsung",
  //     store: "amazon.com",
  //     location: "US",
  //     price: "$799",
  //     currency: "USD",
  //     unit: "",
  //     specs: "256GB, 8GB RAM",
  //     product_link: "https://www.amazon.com/dp/XXXX",
  //     image_url: "https://images.amazon.com/....jpg",
  //     is_verified: true
  //   }
  // ];
  return [];
}

// ---------- Main handler ----------
export default async function handler(req, res) {
  // CORS for your client (optional)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = String(req.query.q || "").trim();
    const loc = String(req.query.loc || req.query.location || "").trim();

    if (!q) {
      return res.status(200).json({ query: q, results: [] });
    }

    // 1) get results (plug your real code inside gatherResults)
    const rawResults = await gatherResults(q, loc);

    // 2) load allow/block lists
    const hostLists = await loadHostLists();

    // 3) filter by host
    const filtered = rawResults.filter((item) => {
      // We try product_link first, then store, then fallback
      const link = item?.product_link || item?.url || "";
      let host = "";
      try {
        if (link) host = new URL(link).hostname;
        else if (item?.store) host = item.store;
      } catch (_) {
        host = item?.store || "";
      }
      return isHostAllowed(host, hostLists);
    });

    // 4) respond
    return res.status(200).json({
      query: q,
      location: loc || "All Locations",
      counts: {
        total: rawResults.length,
        allowed: filtered.length,
        blocked: rawResults.length - filtered.length,
      },
      results: filtered,
    });
  } catch (err) {
    console.error("[/api/products] fatal error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
