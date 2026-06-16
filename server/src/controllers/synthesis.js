// ── Pipeline 3: Synthesis (the main event) ──────────────────────────────
// Bundles the options-math sentiment + the retrieved news, then asks Gemini
// to find the DIVERGENCE between what traders are betting and what the news
// implies — and to output one clean, modern trading thesis.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeSentiment } from "./greekspeak.js";
import { retrieveNews } from "./alpharag.js";
import { getOptionChain } from "../lib/marketData.js";

export async function generateThesis(query, ticker = "NIFTY50") {
  const optionChain = await getOptionChain(ticker); // real live spot when available
  const sentiment = computeSentiment(optionChain);
  const news = retrieveNews(query);

  const newsBlock = news.map((n, i) => `${i + 1}. ${n.title} (${n.source})`).join("\n");

  const prompt = `You are Synapse AI, an options-strategy analyst for Indian markets.
You are given two SEPARATE realities. Your job is to compare them and find the divergence.

REALITY A — THE MATH (options-chain sentiment):
${sentiment.summary}
(PCR=${sentiment.pcr}, MaxPain=${sentiment.maxPain}, bias=${sentiment.bias})

REALITY B — THE REAL WORLD (latest relevant news):
${newsBlock || "No specific news found; treat macro backdrop as neutral."}

User's question: "${query}"

Respond in this exact structure, in clean plain English (no tables, no jargon dumps):
1. **Sentiment:** one line on what the math says.
2. **Context:** one line on what the news says.
3. **Divergence:** state clearly whether the two AGREE or DISAGREE, and why.
4. **Thesis:** one actionable, clearly-hedged idea (e.g. a Bull Call Spread), with a one-line reason.
End with: "This is not financial advice."`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) {
    // Lets the app run end-to-end before keys are added.
    return {
      query,
      sentiment,
      news,
      thesis: "⚠️ Gemini key not set yet. Add GEMINI_API_KEY to server/.env to get a live thesis.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);

  return { query, sentiment, news, thesis: result.response.text() };
}
