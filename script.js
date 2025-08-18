// /api/products.js

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get('q') || '';
    const debug = url.searchParams.get('debug') === '1';

    const { GOOGLE_API_KEY, CSE_ENGINE_ID } = process.env;

    // Basic env diagnostics
    if (!GOOGLE_API_KEY || !CSE_ENGINE_ID) {
      const msg = 'Missing GOOGLE_API_KEY or CSE_ENGINE_ID';
      if (debug) return res.status(500).json({ ok: false, reason: msg, have: {
        GOOGLE_API_KEY: !!GOOGLE_API_KEY,
        CSE_ENGINE_ID: !!CSE_ENGINE_ID
      }});
      return res.status(200).json([]); // normal mode returns empty
    }

    if (!q) {
      // No query → nothing to search
      if (debug) return res.status(200).json({ ok: true, reason: 'empty query', items: [] });
      return res.status(200).json([]);
    }

    // Call Google CSE
    const api = new URL('https://www.googleapis.com/customsearch/v1');
    api.searchParams.set('key', GOOGLE_API_KEY);
    api.searchParams.set('cx', CSE_ENGINE_ID);
    api.searchParams.set('q', q);

    const gRes = await fetch(api.toString());
    const rawText = await gRes.text(); // read as text for easier debugging
    let parsed;
    try { parsed = JSON.parse(rawText); } catch { parsed = null; }

    if (!gRes.ok) {
      if (debug) {
        return res.status(502).json({ ok: false, reason: 'Google CSE HTTP error', status: gRes.status, body: rawText });
      }
      return res.status(200).json([]);
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];

    const mapped = items.map(it => {
      const host = (() => { try { return new URL(it.link).host; } catch { return ''; }})();
      const image =
        it.pagemap?.cse_image?.[0]?.src ||
        it.pagemap?.metatags?.[0]?.['og:image'] || '';
      return {
        name: it.title || '',
        category: '',
        brand: '',
        store: host,
        location: '',
        price: '',
        currency: '',
        unit: '',
        specs: it.snippet || '',
        product_link: it.link || '',
        image_url: image,
        is_verified: false,
      };
    });

    if (debug) return res.status(200).json({ ok: true, count: mapped.length, sample: mapped[0] || null });
    return res.status(200).json(mapped);
  } catch (err) {
    if (debug) return res.status(500).json({ ok: false, reason: 'server error', error: String(err) });
    return res.status(200).json([]);
  }
}
