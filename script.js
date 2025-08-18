// /api/products.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get('q') || '';

    // No query? return empty list (frontend will show "No results")
    if (!q) {
      return res.status(200).json([]);
    }

    const { GOOGLE_API_KEY, CSE_ENGINE_ID } = process.env;
    if (!GOOGLE_API_KEY || !CSE_ENGINE_ID) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY or CSE_ENGINE_ID' });
    }

    // Call Google Programmable Search
    const api = new URL('https://www.googleapis.com/customsearch/v1');
    api.searchParams.set('key', GOOGLE_API_KEY);
    api.searchParams.set('cx', CSE_ENGINE_ID);
    api.searchParams.set('q', q);
    // optionally tweak:
    // api.searchParams.set('num', '10');

    const gRes = await fetch(api.toString());
    if (!gRes.ok) {
      const text = await gRes.text();
      return res.status(502).json({ error: 'Google CSE error', details: text });
    }

    const data = await gRes.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // Map Google CSE items to your table columns
    const mapped = items.map((it) => {
      const host = (() => {
        try { return new URL(it.link).host; } catch { return ''; }
      })();

      const image =
        it.pagemap?.cse_image?.[0]?.src ||
        it.pagemap?.metatags?.[0]?.['og:image'] ||
        '';

      return {
        name: it.title || '',
        category: '',          // unknown from Google, leave blank or infer later
        brand: '',             // unknown
        store: host || '',
        location: '',          // unknown
        price: '',             // unknown
        currency: '',          // unknown
        unit: '',              // unknown
        specs: it.snippet || '',
        product_link: it.link || '',
        image_url: image,
        is_verified: false,
      };
    });

    return res.status(200).json(mapped);
  } catch (err) {
    console.error('API /products error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
