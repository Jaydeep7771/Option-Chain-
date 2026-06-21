// ── Pipeline 2: AlphaRAG (Retrieval-Augmented Generation) ───────────────
// Reads the REAL WORLD and stores it as an AI-searchable memory:
//   1. A worker scrapes market-news RSS + per-ticker Google News.
//   2. Each headline is turned into a vector (embedding) and saved to the
//      Supabase pgvector store.
//   3. At query time we embed the query and do a SEMANTIC search — matching
//      on meaning, not just keywords.
// Every layer degrades gracefully: if Supabase/embeddings are unavailable we
// fall back to live Google News, then to simple keyword matching.

import Parser from "rss-parser";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { embedText } from "../lib/embeddings.js";

const parser = new Parser({ timeout: 7000 });

// Broad market feeds — multiple sources for resilience.
const FEEDS = [
  "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "https://www.livemint.com/rss/markets",
  "https://www.moneycontrol.com/rss/marketreports.xml",
  "https://www.moneycontrol.com/rss/business.xml",
  "https://www.business-standard.com/rss/markets-106.rss",
];

// Tickers we proactively ingest so the store covers the demo instruments well.
const INGEST_TICKERS = ["NIFTY50", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];

let newsStore = []; // in-memory fallback: [{ title, snippet, link, source, publishedAt }]

// Turn a ticker into a good news-search phrase.
export function searchQueryFor(ticker = "NIFTY50") {
  const key = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const map = {
    NIFTY: "Nifty 50 index",
    NIFTY50: "Nifty 50 index",
    BANKNIFTY: "Bank Nifty index",
    NIFTYBANK: "Bank Nifty index",
    FINNIFTY: "FinNifty index",
    SENSEX: "Sensex index",
  };
  return map[key] || `${ticker} share price NSE`;
}

function toISO(d) {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t) ? t.toISOString() : null;
}

// Pull a Google News search feed for a phrase.
async function googleNews(query, limit = 8) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map((item) => {
      let title = item.title?.trim() || "";
      let source = "Google News";
      const idx = title.lastIndexOf(" - ");
      if (idx > 0) { source = title.slice(idx + 3).trim(); title = title.slice(0, idx).trim(); }
      return { title, snippet: "", link: item.link, source, publishedAt: item.isoDate || item.pubDate || null };
    });
  } catch (err) {
    console.warn(`⚠️  Google News fetch failed (${query}): ${err.message}`);
    return [];
  }
}

// Live Google News for one ticker (used directly as a fallback layer).
export async function fetchTickerNews(ticker = "NIFTY50", limit = 6) {
  return googleNews(searchQueryFor(ticker), limit);
}

// ── Vector store ────────────────────────────────────────────────
// Embed and insert any articles we haven't stored yet.
async function ingestToStore(items) {
  if (!isSupabaseConfigured()) return 0;
  const links = items.map((i) => i.link).filter(Boolean);
  if (!links.length) return 0;

  const { data: existing } = await supabase.from("news_articles").select("link").in("link", links);
  const seen = new Set((existing || []).map((e) => e.link));
  // Cap new embeds per cycle to stay under the free DAILY embedding quota
  // (gemini-embedding-001 = 1000/day). Hourly cycles × this cap keeps us well
  // under it; leftovers get picked up next refresh, dupes are skipped.
  const maxPerCycle = Number(process.env.NEWS_EMBED_CAP) || 25;
  const fresh = items.filter((i) => i.link && !seen.has(i.link)).slice(0, maxPerCycle);

  const rows = [];
  for (const item of fresh) {
    const embedding = await embedText(`${item.title}. ${item.snippet || ""}`.trim());
    if (!embedding) continue;
    rows.push({
      title: item.title,
      link: item.link,
      source: item.source,
      snippet: item.snippet || null,
      published_at: toISO(item.publishedAt),
      embedding,
    });
  }
  if (!rows.length) return 0;

  const { error } = await supabase.from("news_articles").upsert(rows, { onConflict: "link", ignoreDuplicates: true });
  if (error) { console.warn("Vector store insert failed:", error.message); return 0; }
  return rows.length;
}

// Semantic search over the vector store. Returns null if unavailable.
async function semanticSearch(query, limit = 6) {
  if (!isSupabaseConfigured()) return null;
  const qvec = await embedText(query, "RETRIEVAL_QUERY");
  if (!qvec) return null;
  const { data, error } = await supabase.rpc("match_news", { query_embedding: qvec, match_count: limit });
  if (error) { console.warn("Semantic search failed:", error.message); return null; }
  return (data || []).map((r) => ({
    title: r.title,
    snippet: r.snippet || "",
    link: r.link,
    source: r.source || "News",
    publishedAt: r.published_at,
    score: r.similarity,
  }));
}

// ── Worker entry: scrape everything, refresh memory + vector store ──
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

  // Proactively cover the demo tickers via Google News.
  for (const t of INGEST_TICKERS) collected.push(...(await fetchTickerNews(t, 6)));

  if (collected.length) newsStore = collected;

  let stored = 0;
  try { stored = await ingestToStore(collected); } catch (e) { console.warn("Ingest error:", e.message); }

  const where = isSupabaseConfigured() ? `+${stored} new → pgvector store` : "(in-memory only)";
  console.log(`📰 AlphaRAG: scraped ${collected.length} items ${where}.`);
  return collected.length;
}

// ── Retrieval used by Synthesis: best source available ──
// 1) Semantic search (RAG)  2) live Google News  3) keyword fallback
export async function getNewsFor(ticker = "NIFTY50", query = "") {
  const sem = await semanticSearch(searchQueryFor(ticker));
  if (sem && sem.length) return sem;
  const live = await fetchTickerNews(ticker);
  if (live.length) return live;
  return retrieveNews(query || ticker);
}

// Simple keyword scoring over the in-memory store (last-resort fallback).
export function retrieveNews(query, limit = 6) {
  const words = (query || "").toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const scored = newsStore.map((item) => {
    const text = item.title.toLowerCase();
    const score = words.reduce((s, w) => (text.includes(w) ? s + 1 : s), 0);
    return { ...item, score };
  });
  const ranked = scored.filter((i) => i.score > 0).sort((a, b) => b.score - a.score);
  return (ranked.length ? ranked : scored).slice(0, limit);
}
