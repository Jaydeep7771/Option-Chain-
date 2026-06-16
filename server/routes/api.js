import { Router } from "express";
import { computeSentiment } from "../src/controllers/greekspeak.js";
import { retrieveNews, refreshNews } from "../src/controllers/alpharag.js";
import { generateThesis } from "../src/controllers/synthesis.js";
import { getOptionChain } from "../src/lib/marketData.js";

const router = Router();

// Pipeline 1 — just the options math/sentiment (?ticker=NIFTY50)
router.get("/sentiment", async (req, res) => {
  const chain = await getOptionChain(req.query.ticker || "NIFTY50");
  res.json(computeSentiment(chain));
});

// Pipeline 2 — news retrieval for a query (?q=nifty)
router.get("/news", (req, res) => {
  res.json(retrieveNews(req.query.q || "nifty market"));
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
