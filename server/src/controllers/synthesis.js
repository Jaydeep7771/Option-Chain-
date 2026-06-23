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
    // Plain-English layer so non-finance readers understand the output.
    plain_english: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING },
        strategy_explained: { type: SchemaType.STRING },
      },
      required: ["summary", "strategy_explained"],
    },
  },
  required: ["quantitative_analysis", "ai_synthesis", "plain_english"],
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

  // ── Deterministic signal table — computed, not guessed, so the model reasons
  // over a consistent structure instead of one ambiguous PCR number. ──────────
  const optionsVote = sentiment.oiModeled ? "neutral (modeled OI — low confidence)" : sentiment.bias;
  const trendVote =
    trend.trend_status === "Golden Cross" ? "bullish" : trend.trend_status === "Death Cross" ? "bearish" : "neutral";
  // Volatility skew vote — only a real signal on the live OI/IV feed.
  const ivVote =
    sentiment.oiModeled || sentiment.ivSkew == null
      ? "n/a (no live IV)"
      : sentiment.ivSkew > 0.6
      ? "bearish lean — puts bid (downside hedging)"
      : sentiment.ivSkew < -0.6
      ? "bullish lean — calls bid (upside demand)"
      : "neutral — balanced skew";
  // Math vs price-action conflict is computable; news direction is left to the model.
  const quantConflict =
    !sentiment.oiModeled &&
    ((sentiment.bias === "bullish" && trendVote === "bearish") ||
      (sentiment.bias === "bearish" && trendVote === "bullish"));

  const prompt = `You are the Synapse AI Synthesis Engine — a senior institutional derivatives
analyst. Your tone is authoritative, precise, and metrics-driven. You analyse the
divergence between options-market positioning ("the math") and real-world catalysts
("the news") for ${sentiment.underlying}.

PCR INTERPRETATION RULES (NSE convention — apply strictly):
- PCR < 1.0  → heavy CALL writing → BEARISH bias / resistance overload (writers cap the upside).
- PCR > 1.0  → heavy PUT writing  → BULLISH bias / strong support anchor (writers defend the downside).
- PCR ≈ 1.0  → balanced / neutral.
Never interpret a low PCR as bullish momentum. A PCR of ${sentiment.pcr} reads ${sentiment.bias.toUpperCase()}.

DATA-CONFIDENCE RULE (critical):
${
  sentiment.oiModeled
    ? `- Open interest for this chain is MODELED, not a live feed. Treat the PCR/Max-Pain positioning
  as LOW CONFIDENCE and indicative only. Do NOT issue a strong directional options verdict from it —
  anchor your thesis primarily on the live price trend and the news catalysts, and explicitly hedge.
- risk_level must not be "Low" when the positioning read is modeled.`
    : `- Open interest is from a LIVE feed (real OI/IV). You may treat the positioning read as high confidence.`
}

CONFLUENCE & CONVICTION RULE:
- Weigh four signals: options positioning, price trend, volatility skew, and news. When 3 or more
  agree in the same direction (and OI is live), state a DIRECTIONAL view with conviction and you may
  set risk_level "Low" or "Moderate". When they conflict, do not force a directional call — say so
  plainly and prefer a neutral / defined-risk stance with higher risk_level.
- Do not water down a genuinely aligned setup into "neutral"; reserve neutral for genuinely mixed signals.

QUANTITATIVE DATA${sentiment.oiModeled ? " (live spot; MODELED open interest)" : " (live options chain — real OI)"}:
- Underlying: ${sentiment.underlying} | Spot: ${sentiment.spot}
- Put-Call Ratio: ${sentiment.pcr} | Max Pain: ${sentiment.maxPain} (spot is ${sentiment.painPull === "balanced" ? "near" : sentiment.painPull === "downward" ? "above" : "below"} max pain → gravity ${sentiment.painPull})
- OI-derived support ~${sentiment.support} | OI-derived resistance ~${sentiment.resistance}
- Positioning bias: ${sentiment.bias} (confidence: ${sentiment.biasConfidence})${
    !sentiment.oiModeled && sentiment.ivSkew != null
      ? `
- Implied volatility: ATM IV ${sentiment.atmIV} (${sentiment.volRegime} regime) | IV skew ${sentiment.ivSkew} → ${sentiment.ivSkewLabel}`
      : ""
  }

SIGNAL TABLE (each pillar's directional vote):
- Options positioning: ${optionsVote}
- Price trend (20/50-EMA): ${trendVote} — regime ${trend.trend_status}, momentum ${trend.rsi_state}${trend.rsi != null ? ` (RSI-14 ${trend.rsi})` : ""}
- Volatility skew: ${ivVote}
- News catalysts: (you judge from the headlines below)
- Math-vs-trend check: ${quantConflict ? "CONFLICT between options bias and price trend" : "options bias and price trend are aligned or neutral"}

NEWS CATALYSTS (retrieved context — the ONLY catalysts you may cite):
${newsBlock || "No material catalysts retrieved."}

Analyst query: "${query}"

Produce an institutional-grade analysis as JSON matching the required schema. Rules:
- ANTI-HALLUCINATION: reference only catalysts present in the NEWS list above. Do not invent
  events, numbers, dates, or central-bank actions. If the list is empty, state that no material
  catalysts were retrieved and base the read on the math and trend only.
- STRICTLY FORBIDDEN: casual or storytelling language. Never use words like "mood",
  "twist", "bottom line", "vibe", or address the reader as a beginner.
- Use precise market terminology (e.g. "writers", "skew", "unwinding", "OI build-up").
- market_sentiment: a sharp 2-4 word verdict, e.g. "Bearish Bias", "Bullish Acceleration",
  "Range-bound / Neutral". It must be consistent with the signal table above.
- headline_insight: one authoritative sentence referencing concrete levels (PCR, Max Pain,
  support ${sentiment.support}, resistance ${sentiment.resistance}).
- technical_confluence: set this field to EXACTLY this string: "${trend.technical_confluence}".
- divergence_detected: true if the NEWS catalysts point in a direction that conflicts with the
  options-math + price-trend read; else false. ${quantConflict ? "Note the math-vs-trend conflict already flagged." : ""}
- risk_level: exactly one of "Low", "Moderate", or "High". Higher when signals conflict or OI is modeled.
- trading_thesis: 1-2 crisp sentences stating the core divergence (or alignment) across the three pillars.
- suggested_strategy: a specific options strategy, e.g. "Bull Call Spread", "Iron Condor",
  "Bear Put Spread", "Long Straddle". For a conflicted/uncertain read prefer a defined-risk,
  range, or volatility structure rather than a strong directional bet. Factor in the IV regime:
  ELEVATED ATM IV favours premium-selling/defined-risk credit structures (e.g. credit spread,
  iron condor); COMPRESSED IV favours long-volatility/debit structures (e.g. straddle, debit spread).
- strategy_rationale: one sentence on why this derivative structure best fits the setup,
  referencing the support/resistance band where relevant.

PLAIN-ENGLISH LAYER (for a reader who knows NOTHING about options — write these two
fields in everyday language, no jargon, no abbreviations like PCR/OI/Max Pain):
- plain_english.summary: 1-2 friendly sentences explaining what is going on with
  ${sentiment.underlying} right now and what the analysis means, as if explaining to a friend.
  Translate the jargon (e.g. say "traders expect the price to stay roughly flat" instead of
  "neutral positioning"). Mention the rough price levels to watch in normal words.
- plain_english.strategy_explained: one simple sentence explaining what the strategy you
  chose in suggested_strategy actually is and when it makes/loses money, in plain words
  (e.g. "An Iron Condor is a bet that the price stays inside a range — you win if it doesn't
  move much, and lose if it swings sharply either way."). Do NOT give financial advice; just explain.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) {
    return { ...base, analysis: fallbackAnalysis(sentiment, trend, "Gemini key not set."), aiFallback: true };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Reasoning ladder (FREE-TIER friendly — no billing required). gemini-2.0-flash
  // has a far higher free daily quota (~200/day) than 2.5-flash (~20/day) and is
  // plenty capable here since the structured prompt does the heavy lifting; the
  // lite model is the higher-quota fallback. Only drops to a data-derived read if
  const modelName = process.env.SYNTHESIS_MODEL || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const analysis = JSON.parse(result.response.text());
      return { ...base, analysis, model: modelName };
    } catch (err) {
      if (err.status === 503 && attempt === 1) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn(`Synthesis via ${modelName} failed (${err.status || err.message}).`);
      break;
    }
  }

  return { ...base, analysis: fallbackAnalysis(sentiment, trend, "AI engine momentarily unavailable."), aiFallback: true };
}

// Data-derived analysis used only when the AI is unreachable, so the card
// always renders a useful institutional read.
function fallbackAnalysis(sentiment, trend, reason) {
  // When OI is modeled we genuinely don't have a confident positioning verdict.
  const verdict = sentiment.oiModeled
    ? "Range-bound / Neutral"
    : { bullish: "Bullish Bias", bearish: "Bearish Bias", neutral: "Range-bound / Neutral" }[sentiment.bias] || "Neutral";
  const confNote = sentiment.oiModeled ? " (modeled OI — low confidence)" : "";
  return {
    quantitative_analysis: {
      market_sentiment: verdict,
      headline_insight: `PCR ${sentiment.pcr}, Max Pain ${sentiment.maxPain} (gravity ${sentiment.painPull}); OI clusters mark support ~${sentiment.support} and resistance ~${sentiment.resistance} on ${sentiment.underlying} near ${sentiment.spot}${confNote}.`,
      technical_confluence: trend.technical_confluence,
    },
    ai_synthesis: {
      divergence_detected: false,
      risk_level: "Moderate",
      trading_thesis: `${reason} Showing the quantitative positioning read only; full news-vs-math synthesis will resume shortly. Watch the ${sentiment.support}–${sentiment.resistance} band.`,
      suggested_strategy: "Awaiting synthesis",
      strategy_rationale: "Reconnect to the AI engine to generate a strategy aligned to the divergence.",
    },
    plain_english: {
      summary: `In simple terms: ${sentiment.underlying} is trading near ${sentiment.spot}, and right now the options data doesn't point strongly up or down${sentiment.oiModeled ? " (and we're using estimated data until the live feed reconnects)" : ""}. Watch the ${sentiment.support}–${sentiment.resistance} zone — that's where buyers and sellers are clustered.`,
      strategy_explained: "The AI engine is reconnecting, so there's no specific trade idea to explain just yet — the numbers above are still live.",
    },
  };
}
