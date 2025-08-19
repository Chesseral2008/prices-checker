// /api/products.js
import * as cheerio from 'cheerio';

// ---- settings --------------------------------------------------
const ALLOWED_HOSTS = [
  'amazon.com', 'bestbuy.com', 'walmart.com', 'lenovo.com', 'hp.com',
  'dell.com', 'samsung.com', 'apple.com', 'newegg.com', 'bhphotovideo.com',
  'microcenter.com', 'target.com', 'costco.com', 'store.google.com'
];

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const UA = 'Mozilla/5.0 (compatible; PricesCheckerBot/1.0; +https://www.priceschecker.com)';

// ---- utils -----------------------------------------------------
const hostOf = (url='') => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

const allowedHost = (url) => {
  const h = hostOf(url);
  return ALLOWED_HOSTS.some(d => h.endsWith(d));
};

const supaFetch = async (path, init={}) => {
  const base = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...init.headers
  };
  const r = await fetch(`${base}${path}`, { ...init, headers });
  return r;
};

// ---- cache ops -------------------------------------------------
async function getCache(url) {
  // GET /rest/v1/price_cache?url=eq.<url>&select=*
  const r = await supaFetch(`/rest/v1/price_cache?url=eq.${encodeURIComponent(url)}&select=*`);
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] || null;
}

async function upsertCache(url, data) {
  const r = await supaFetch('/rest/v1/price_cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ url, ...data }])
  });
  return r.ok;
}

// ---- HTML -> JSON-LD parse ------------------------------------
function findJsonLdBlocks(html) {
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]')
    .toArray()
    .map(el => {
      try { return JSON.parse($(el).contents().text()); } catch { return null; }
    })
    .flatMap(obj => Array.isArray(obj) ? obj : [obj])
    .filter(Boolean);
  return blocks;
}

function extractFromJsonLd(blocks) {
  // Look for @type Product and Offers
  const isType = (obj, type) => {
    const t = obj?.['@type'];
    return typeof t === 'string' ? t.toLowerCase() === type
      : Array.isArray(t) ? t.map(x => String(x).toLowerCase()).includes(type)
      : false;
  };

  const product = blocks.find(b => isType(b, 'product')) || null;

  // Offers may be nested or separate
  let offer = product?.offers || blocks.find(b => isType(b, 'offer')) || null;
  if (Array.isArray(offer)) offer = offer[0];

  const price =
    offer?.price ?? offer?.lowPrice ?? offer?.highPrice ?? null;
  const currency = offer?.priceCurrency ?? null;
  const brand = product?.brand?.name || product?.brand || null;
  const category = product?.category || null;
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image || null;
  const availability = offer?.availability || null;

  return {
    price: price ? Number(price) : null,
    currency: currency || null,
    brand: brand || null,
    category: category || null,
    image_url: image || null,
    availability: availability || null
  };
}

async function enrichUrl(url) {
  try {
    // 1) cache hit?
    const cached = await getCache(url);
    if (cached) {
      const fresh = Date.now() - new Date(cached.scraped_at).getTime() < CACHE_TTL_MS;
      if (fresh) return { ...cached, verified: Boolean(cached.price && cached.currency) };
    }

    // 2) fetch page & parse
    const resp = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!resp.ok) return null;
    const html = await resp.text();
    const blocks = findJsonLdBlocks(html);
    const extracted = extractFromJsonLd(blocks);

    const enriched = {
      ...extracted,
      scraped_at: new Date().toISOString()
    };

    // 3) upsert cache
    await upsertCache(url, enriched);

    return { ...enriched, verified: Boolean(enriched.price && enriched.currency) };
  } catch {
    return null;
  }
}

// ---- Google CSE ------------------------------------------------
async function searchCSE(q) {
  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.CSE_ENGINE_ID;
  if (!key || !cx) throw new Error('Missing GOOGLE_API_KEY or CSE_ENGINE_ID');

  const api = new URL('https://www.googleapis.com/customsearch/v1');
  api.searchParams.set('key', key);
  api.searchParams.set('cx', cx);
  api.searchParams.set('q', q);
  api.searchParams.set('num', '10');

  const r = await fetch(api.toString());
  if (!r.ok) throw new Error(`CSE ${r.status}`);
  const data = await r.json();
  return Array.isArray(data.items) ? data.items : [];
}

// ---- handler ---------------------------------------------------
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return res.status(200).json([]);

    const items = await searchCSE(q);

    // normalize + filter to shopping hosts
    const base = items.map(it => {
      const link = it.link || '';
      const h = hostOf(link);
      const img =
        it.pagemap?.cse_image?.[0]?.src ||
        it.pagemap?.metatags?.[0]?.['og:image'] ||
        null;

      return {
        name: it.title || '',
        category: '',
        brand: '',
        store: h,
        location: '',
        price: null,
        currency: '',
        unit: '',
        specs: it.snippet || '',
        product_link: link,
        image_url: img,
        is_verified: false
      };
    }).filter(row => allowedHost(row.product_link));

    // enrich in parallel, but cap concurrency to be polite (e.g., 3 at a time)
    const chunks = [];
    const CONC = 3;
    for (let i = 0; i < base.length; i += CONC) {
      chunks.push(base.slice(i, i + CONC));
    }

    const enriched = [];
    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async row => {
          const extra = await enrichUrl(row.product_link);
          if (!extra) return row;
          return {
            ...row,
            price: extra.price ?? row.price,
            currency: extra.currency ?? row.currency,
            brand: extra.brand ?? row.brand,
            category: extra.category ?? row.category,
            image_url: extra.image_url ?? row.image_url,
            is_verified: extra.verified ?? row.is_verified
          };
        })
      );
      enriched.push(...results);
    }

    return res.status(200).json(enriched);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
