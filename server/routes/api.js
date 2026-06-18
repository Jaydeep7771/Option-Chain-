import { Router } from "express";
import { computeSentiment } from "../src/controllers/greekspeak.js";
import { retrieveNews, refreshNews, getNewsFor } from "../src/controllers/alpharag.js";
import { generateThesis } from "../src/controllers/synthesis.js";
import { getOptionChain } from "../src/lib/marketData.js";
import { supabase, isSupabaseConfigured } from "../src/lib/supabase.js";
import { getAuthUrl, exchangeCodeForToken, isConfigured, hasToken } from "../src/lib/upstox.js";

const router = Router();

// ── Upstox auth ──────────────────────────────────────────────
// Visit /api/upstox/login in your browser once a day to get a fresh token.
router.get("/upstox/login", (req, res) => {
  if (!isConfigured()) return res.status(400).send("Set UPSTOX_API_KEY and UPSTOX_API_SECRET in server/.env first.");
  res.redirect(getAuthUrl());
});

router.get("/upstox/callback", async (req, res) => {
  try {
    if (!req.query.code) throw new Error("No authorization code returned by Upstox.");
    await exchangeCodeForToken(req.query.code);
    res.send(
      `<body style="font-family:system-ui;background:#07090f;color:#e9ecf5;text-align:center;padding:80px">
      <h1 style="color:#7be0a4">✓ Upstox connected</h1>
      <p>Live option-chain data is now active. You can close this tab and return to Synapse AI.</p>
      </body>`
    );
  } catch (err) {
    res.status(500).send(`Upstox login failed: ${err.message}`);
  }
});

router.get("/upstox/status", (req, res) => {
  res.json({ configured: isConfigured(), connected: hasToken() });
});

// Pipeline 1 — just the options math/sentiment (?ticker=NIFTY50)
router.get("/sentiment", async (req, res) => {
  const chain = await getOptionChain(req.query.ticker || "NIFTY50");
  res.json(computeSentiment(chain));
});

// Pipeline 2 — semantic news for a ticker (?ticker=NIFTY50), or keyword (?q=...)
router.get("/news", async (req, res) => {
  if (req.query.ticker) return res.json(await getNewsFor(req.query.ticker, req.query.q));
  res.json(retrieveNews(req.query.q || "nifty market"));
});

// Vector store status — how many articles are stored as embeddings
router.get("/store/status", async (req, res) => {
  if (!isSupabaseConfigured()) return res.json({ configured: false, count: 0 });
  const { count, error } = await supabase.from("news_articles").select("*", { count: "exact", head: true });
  res.json({ configured: true, count: error ? 0 : count, error: error?.message || null });
});

// Manually trigger a news refresh (the worker also does this on a timer)
router.post("/news/refresh", async (req, res) => {
  const count = await refreshNews();
  res.json({ refreshed: count });
});

// Pipeline 3 — THE MAIN ENDPOINT: full synthesized thesis.
// Accepts either { ticker } (preferred, used by the UI) or { query }.
async function analyze(req, res) {
  try {
    const ticker = req.body?.ticker?.trim();
    const query = req.body?.query?.trim() || (ticker ? `What's the options setup on ${ticker}?` : "");
    if (!query) return res.status(400).json({ error: "Missing 'ticker' or 'query' in request body." });
    const result = await generateThesis(query, ticker || "NIFTY50");
    res.json({ ticker: ticker || null, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Synthesis failed.", detail: err.message });
  }
}

router.post("/analyze", analyze); // matches the Phase 3 frontend
router.post("/ask", analyze); // kept as an alias

export default router;
