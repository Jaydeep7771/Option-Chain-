// ── Pipeline 2: AlphaRAG ────────────────────────────────────────────────
// Reads the REAL WORLD: pulls financial-news RSS feeds, keeps them in memory,
// and retrieves the items most relevant to a user's query.
//
// HACKATHON NOTE: this starter version uses simple keyword scoring so it runs
// with zero setup. The upgrade path (see IMPLEMENTATION_PLAN.md, Phase 3) is to
// store each headline as a vector in Supabase pgvector and do semantic search.

import Parser from "rss-parser";

const parser = new Parser();

// A few free Indian-market RSS feeds. Add/replace as you like.
const FEEDS = [
  "https://www.business-standard.com/rss/markets-106.rss",
  "https://www.moneycontrol.com/rss/marketreports.xml",
];

let newsStore = []; // [{ title, link, source, publishedAt }]

export async function refreshNews() {
  const collected = [];
  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items.slice(0, 25)) {
        collected.push({
          title: item.title?.trim() || "",
          snippet: (item.contentSnippet || item.content || "").trim().slice(0, 220),
          link: item.link,
          source: feed.title || url,
          publishedAt: item.isoDate || item.pubDate || null,
        });
      }
    } catch (err) {
      console.warn(`⚠️  Could not fetch feed ${url}: ${err.message}`);
    }
  }
  if (collected.length) newsStore = collected;
  console.log(`📰 AlphaRAG: stored ${newsStore.length} news items.`);
  return newsStore.length;
}

// Naive but effective: score by how many query words appear in the headline.
export function retrieveNews(query, limit = 5) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const scored = newsStore.map((item) => {
    const text = item.title.toLowerCase();
    const score = words.reduce((s, w) => (text.includes(w) ? s + 1 : s), 0);
    return { ...item, score };
  });
  const ranked = scored.filter((i) => i.score > 0).sort((a, b) => b.score - a.score);
  // If nothing matches, fall back to the latest headlines so the AI still has context.
  return (ranked.length ? ranked : scored).slice(0, limit);
}
