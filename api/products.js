// /api/products.js

import * as cheerio from "cheerio";

// helper: fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing search query ?q=" });
  }

  try {
    const searchUrls = [
      `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
      `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`
    ];

    const results = [];
    const overallTimeout = 15000; // 15s budget
    const overallController = new AbortController();
    const timer = setTimeout(() => overallController.abort(), overallTimeout);

    await Promise.allSettled(
      searchUrls.map(async (url) => {
        try {
          const response = await fetchWithTimeout(url, {}, 7000); // per-site timeout
          const html = await response.text();
          const $ = cheerio.load(html);

          if (url.includes("amazon")) {
            $(".s-result-item").each((_, el) => {
              const title = $(el).find("h2 a span").text().trim();
              const price = $(el).find(".a-price span.a-offscreen").first().text().trim();
              if (title && price) results.push({ site: "Amazon", title, price });
            });
          } else if (url.includes("ebay")) {
            $(".s-item").each((_, el) => {
              const title = $(el).find(".s-item__title").text().trim();
              const price = $(el).find(".s-item__price").text().trim();
              if (title && price) results.push({ site: "eBay", title, price });
            });
          }
        } catch (err) {
          console.error("Error scraping", url, err.message);
        }
      })
    );

    clearTimeout(timer);
    return res.status(200).json({ query: q, results });
  } catch (err) {
    console.error("Handler failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
