// /api/products.js  (CommonJS version)
// - Works in Vercel "Other" projects without `"type":"module"` in package.json
// - Loads allow/block patterns from Supabase (cached 10 min)
// - Filters results from gatherResults()

const { createClient } = require("@supabase/supabase-js");

// ---------- Supabase client ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn(
    "[/api/products] Missing SUPABASE_URL or service key. " +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in Vercel env."
  );
}

const supabase =
  SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

// ---------- In-memory hostlist cache ----------
let _hostCache = { allow: [], block: [], ts: 0 };
const CACHE_MS = 10 * 60 * 1000; // 10 minutes

// ---------- Helpers ----------
function normalizeHost(h) {
  try {
    const url = new URL(h.startsWith("http") ? h : `https://${h}`);
    return url.hostname.replace(/^www\./, "");
  } catch (_) {
    return String(h || "").trim().replace(/^www\./, "");
  }
}

function hostMatchesPattern(host, pattern) {
  const h = normalizeHost(host);
  const p = String(pattern || "").trim().toLowerCase().replace(/^www\./, "");
  if (!h || !p) return false;

  if (p.includes("*")) {
    const re = new RegExp(
      "^" + p.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
      "i"
    );
    return re.test(h);
  }
  return h === p || h.endsWith("." + p);
}

async function loadHostLists() {
  const now = Date.now();
  if (now - _hostCache.ts < CACHE_MS && (_hostCache.allow.length + _hostCache.block.length) > 0) {
    return _hostCache;
  }

  if (!supabase) {
    _hostCache = { allow: [], block: [], ts: Date.now() };
    return _hostCache;
  }

  const { data: allowRows, error: allowErr } = await supabase
    .from("allowed_hosts")
    .select("host_pattern");

  if (allowErr) console.error("[/api/products] allow fetch error:", allowErr);

  const { data: blockRows, error: blockErr } = await supabase
    .from("blocked_hosts")
    .select("host_pattern");

  if (blockErr) console.error("[/api/products] block fetch error:", blockErr);

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

  for (const patt of hostLists.block) {
    if (hostMatchesPattern(h, patt)) return false;
  }
  if (hostLists.allow.length > 0) {
    for (const patt of hostLists.allow) {
      if (hostMatchesPattern(h, patt)) return true;
    }
    return false;
  }
  return true;
}

// ---------- Replace with your real aggregator ----------
async function gatherResults(query, location) {
  // Plug your fetchers/scrapers here. Must return array of items that include
  // product_link (full URL) and/or store (hostname). Example shape shown earlier.
  return [];
}

// ---------- Handler ----------
module.exports = async (req, res) => {
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

    const rawResults = await gatherResults(q, loc);
    const hostLists = await loadHostLists();

    const filtered = rawResults.filter((item) => {
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
};
