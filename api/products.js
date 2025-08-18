// /api/products.js
// Serverless route that queries Google Programmable Search (CSE)
// and returns normalized results. Secrets are read from Vercel env vars.

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
      return res.status(200).json([]); // no query, no results
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const CSE_ENGINE_ID  = process.env.CSE_ENGINE_ID;

    if (!GOOGLE_API_KEY || !CSE_ENGINE_ID) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY or CSE_ENGINE_ID" });
    }

    // Query Google CSE
    const apiURL = new URL("https://www.googleapis.com/customsearch/v1");
    apiURL.searchParams.set("key", GOOGLE_API_KEY);
    apiURL.searchParams.set("cx",  CSE_ENGINE_ID);
    apiURL.searchParams.set("q",   q);
    apiURL.searchParams.set("num", "10"); // 1..10
    apiURL.searchParams.set("safe", "off");

    const gRes = await fetch(apiURL);
    if (!gRes.ok) {
      const text = await gRes.text();
      return res.status(gRes.status).json({ error: "CSE request failed", detail: text });
    }

    const data = await gRes.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // Normalize to your table columns
    const results = items.map((it) => {
      const link = it.link || "";
      let hostname = "";
      try { hostname = new URL(link).hostname.replace(/^www\./, ""); } catch {}

      const image =
        it.pagemap?.cse_image?.[0]?.src ||
        it.pagemap?.metatags?.[0]?.["og:image"] ||
        null;

      return {
        name: it.title || "",
        category: "",          // unknown from CSE
        brand: "",             // unknown from CSE
        store: hostname,
        location: "",          // unknown from CSE
        price: null,           // unknown from CSE
        currency: "",          // unknown from CSE
        unit: "",              // unknown from CSE
        specs: it.snippet || "",
        product_link: link,
        image_url: image,
        is_verified: false
      };
    });

    // Optional: upsert to Supabase in the background (safe on the server)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && results.length) {
      try {
        // Minimal insert using PostgREST endpoint
        await fetch(`${SUPABASE_URL}/rest/v1/all_products`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
          },
          body: JSON.stringify(results)
        });
      } catch (e) {
        // Just log; we still return results to the client
        console.error("Supabase insert error:", e);
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
