// ── Pipeline 3: Synthesis (the main event) ──────────────────────────────
// Bundles the options-math sentiment + the retrieved news, then asks Gemini
// — acting as an institutional derivatives analyst — to find the DIVERGENCE
// between the market math and the news, and return a strict JSON analysis.

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { computeSentiment } from "./greekspeak.js";
import { getNewsFor } from "./alpharag.js";
import { getOptionChain, getHistoricalCloses } from "../lib/marketData.js";
import { computeTrend } from "../services/trendEngine.js";

// Strict output contract enforced by Gemini's JSON mode.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    quantitative_analysis: {
      type: SchemaType.OBJECT,
      properties: {
        market_sentiment: { type: SchemaType.STRING },
        headline_insight: { type: SchemaType.STRING },
        technical_confluence: { type: SchemaType.STRING },
      },
      required: ["market_sentiment", "headline_insight", "technical_confluence"],
    },
    ai_synthesis: {
      type: SchemaType.OBJECT,
      properties: {
        divergence_detected: { type: SchemaType.BOOLEAN },
        risk_level: { type: SchemaType.STRING },
        trading_thesis: { type: SchemaType.STRING },
        suggested_strategy: { type: SchemaType.STRING },
        strategy_rationale: { type: SchemaType.STRING },
      },
      required: ["divergence_detected", "risk_level", "trading_thesis", "suggested_strategy", "strategy_rationale"],
    },
  },
  required: ["quantitative_analysis", "ai_synthesis"],
};

export async function generateThesis(query, ticker = "NIFTY50") {
  const optionChain = await getOptionChain(ticker); // real live spot when available
  const sentiment = computeSentiment(optionChain);

  // Semantic retrieval from the pgvector store (falls back to live news).
  const news = await getNewsFor(ticker, query);

  // Technical trend — third confluence point (RSI + EMA crossover).
  const trend = computeTrend(await getHistoricalCloses(ticker));

  // Shared payload — chain + trend included so the UI can render them.
  const base = { query, sentiment, news, chain: optionChain.chain, trend };

  const newsBlock = news.map((n, i) => `${i + 1}. ${n.title} (${n.source})`).join("\n");

  const prompt = `You are the Synapse AI Synthesis Engine — a senior institutional derivatives
analyst. Your tone is authoritative, precise, and metrics-driven. You analyse the
divergence between options-market positioning ("the math") and real-world catalysts
("the news") for ${sentiment.underlying}.

PCR INTERPRETATION RULES (NSE convention — apply strictly):
- PCR < 1.0  → heavy CALL writing → BEARISH bias / resistance overload (writers cap the upside).
- PCR > 1.0  → heavy PUT writing  → BULLISH bias / strong support anchor (writers defend the downside).
- PCR ≈ 1.0  → balanced / neutral.
Never interpret a low PCR as bullish momentum. A PCR of ${sentiment.pcr} on this chain is therefore ${sentiment.bias.toUpperCase()}.

QUANTITATIVE DATA (live options chain):
- Underlying: ${sentiment.underlying} | Spot: ${sentiment.spot}
- Put-Call Ratio: ${sentiment.pcr} | Max Pain: ${sentiment.maxPain}
- Derived positioning bias: ${sentiment.bias}
- Narrative: ${sentiment.summary}

TECHNICAL TREND (price action — third confluence point):
- Moving-average regime: ${trend.trend_status} (20-EMA vs 50-EMA)
- Momentum: ${trend.rsi_state}${trend.rsi != null ? ` (RSI-14 = ${trend.rsi})` : ""}

NEWS CATALYSTS (retrieved context):
${newsBlock || "No material catalysts retrieved."}

Analyst query: "${query}"

Produce an institutional-grade analysis as JSON matching the required schema. Rules:
- STRICTLY FORBIDDEN: casual or storytelling language. Never use words like "mood",
  "twist", "bottom line", "vibe", or address the reader as a beginner.
- Use precise market terminology (e.g. "writers", "skew", "unwinding", "OI build-up").
- market_sentiment: a sharp 2-4 word verdict, e.g. "Bearish Bias", "Bullish Acceleration",
  "Range-bound / Neutral".
- headline_insight: one authoritative sentence on what option writers are doing
  mathematically (reference PCR / Max Pain / OI positioning).
- technical_confluence: set this field to EXACTLY this string: "${trend.technical_confluence}".
  Factor this trend in as a third point of confluence when forming the thesis — note whether
  the options math, the news, and the price trend agree or conflict.
- divergence_detected: true if the options math and the news catalysts point in
  conflicting directions, else false.
- risk_level: exactly one of "Low", "Moderate", or "High".
- trading_thesis: 1-2 crisp sentences stating the core divergence (or alignment) between
  the market math and the news context.
- suggested_strategy: a specific options strategy, e.g. "Bull Call Spread", "Iron Condor",
  "Bear Put Spread", "Long Straddle".
- strategy_rationale: one sentence on why this derivative structure best fits the setup.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) {
    return { ...base, analysis: fallbackAnalysis(sentiment, trend, "Gemini key not set."), aiFallback: true };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });

  // Retry on transient errors (503 high demand / 429 rate limit) so a brief
  // Google hiccup never breaks the demo. If it still fails, fall back to a
  // data-derived analysis object.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const analysis = JSON.parse(result.response.text());
      return { ...base, analysis };
    } catch (err) {
      const transient = err.status === 503 || err.status === 429;
      if (!transient || attempt === 3) {
        console.warn(`Gemini synthesis failed (${err.status || err.message}); using data-based fallback.`);
        return { ...base, analysis: fallbackAnalysis(sentiment, trend, "AI engine momentarily unavailable."), aiFallback: true };
      }
      await new Promise((r) => setTimeout(r, attempt * 1200)); // brief backoff
    }
  }
}

// Data-derived analysis used only when the AI is unreachable, so the card
// always renders a useful institutional read.
function fallbackAnalysis(sentiment, trend, reason) {
  const verdict = { bullish: "Bullish Bias", bearish: "Bearish Bias", neutral: "Range-bound / Neutral" }[sentiment.bias] || "Neutral";
  return {
    quantitative_analysis: {
      market_sentiment: verdict,
      headline_insight: `PCR at ${sentiment.pcr} with Max Pain at ${sentiment.maxPain} indicates option writers are positioned ${sentiment.bias} on ${sentiment.underlying} near ${sentiment.spot}.`,
      technical_confluence: trend.technical_confluence,
    },
    ai_synthesis: {
      divergence_detected: false,
      risk_level: "Moderate",
      trading_thesis: `${reason} Showing the quantitative positioning read only; full news-vs-math synthesis will resume shortly.`,
      suggested_strategy: "Awaiting synthesis",
      strategy_rationale: "Reconnect to the AI engine to generate a strategy aligned to the divergence.",
    },
  };
}
