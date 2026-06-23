import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeSentiment } from "../src/controllers/greekspeak.js";
import { retrieveNews, refreshNews, getNewsFor } from "../src/controllers/alpharag.js";
import { generateThesis } from "../src/controllers/synthesis.js";
import { answerFollowUp } from "../src/controllers/chat.js";
import { getOptionChain, getQuotes } from "../src/lib/marketData.js";
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

// Live quotes for the ticker tape (?tickers=NIFTY50,BANKNIFTY,SENSEX,RELIANCE)
router.get("/quotes", async (req, res) => {
  const tickers = (req.query.tickers || "NIFTY50,BANKNIFTY,SENSEX,RELIANCE,TCS,INFY,HDFCBANK")
    .split(",").map((s) => s.trim()).filter(Boolean);
  res.json(await getQuotes(tickers));
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

// Gemini connectivity test — visit /api/gemini/test to diagnose AI failures
router.get("/gemini/test", async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("your_")) return res.json({ ok: false, error: "GEMINI_API_KEY not set" });
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Reply with just the word: OK");
    res.json({ ok: true, reply: result.response.text().trim(), keyPrefix: key.slice(0, 8) + "..." });
  } catch (err) {
    res.json({ ok: false, error: err.message, status: err.status, keyPrefix: key.slice(0, 8) + "..." });
  }
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

// Conversational follow-up about an existing thesis.
router.post("/chat", async (req, res) => {
  try {
    const { ticker, context, messages } = req.body || {};
    res.json(await answerFollowUp({ ticker, context, messages }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed.", detail: err.message });
  }
});

export default router;
