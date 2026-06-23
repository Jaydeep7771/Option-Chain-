// ── Conversational follow-up ────────────────────────────────────────────
// Lets the user interrogate a thesis the engine already produced. Stateless:
// the client sends back the analysis context + the running message list, and
// we ground Gemini strictly in that context so answers stay consistent with
// the card the user is looking at.

import { GoogleGenerativeAI } from "@google/generative-ai";

function buildPreamble(ticker, context = {}) {
  const s = context.sentiment || {};
  const a = context.analysis || {};
  const qa = a.quantitative_analysis || {};
  const ai = a.ai_synthesis || {};
  const trend = context.trend || {};
  const newsBlock = (context.news || []).map((n, i) => `${i + 1}. ${n.title} (${n.source})`).join("\n");

  return `You are the Synapse AI derivatives analyst, answering FOLLOW-UP questions about an
options analysis you already produced for ${ticker || s.underlying || "this instrument"}.

RULES:
- Ground every answer ONLY in the data context below. Never invent prices, levels, news, or events.
- Be concise: 2-4 sentences. Precise market terminology, but plain enough for a non-expert.
- If asked something the data can't answer, say so plainly rather than guessing.
- Never give personalised financial advice or tell the user to buy/sell. Explain, don't instruct.
- Do not repeat a "not financial advice" disclaimer unless explicitly asked.

DATA CONTEXT (the analysis you produced):
- Spot ${s.spot} | PCR ${s.pcr} | Max Pain ${s.maxPain} | Support ${s.support} | Resistance ${s.resistance}
- Positioning bias: ${s.bias} (confidence ${s.biasConfidence}; open interest ${s.oiModeled ? "MODELED, low confidence" : "LIVE"})
- Price trend: ${trend.trend_status}; momentum ${trend.rsi_state}${trend.rsi != null ? ` (RSI ${trend.rsi})` : ""}
- Verdict: ${qa.market_sentiment} | Risk: ${ai.risk_level} | Divergence detected: ${ai.divergence_detected}
- Quant insight: ${qa.headline_insight}
- Thesis: ${ai.trading_thesis}
- Suggested strategy: ${ai.suggested_strategy} — ${ai.strategy_rationale}
- News catalysts:
${newsBlock || "(none retrieved)"}`;
}

export async function answerFollowUp({ ticker, context, messages }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_")) {
    return { answer: "The AI engine isn't configured (missing Gemini key), so I can't answer follow-ups right now.", aiFallback: true };
  }
  if (!Array.isArray(messages) || !messages.length) {
    return { answer: "Ask me a question about the thesis above.", aiFallback: true };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const preamble = buildPreamble(ticker, context);

  // Gemini chat history must be prior turns only; the final user message is sent
  // separately. History must begin with a user turn (it always will here).
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content || "") }],
  }));
  const last = String(messages[messages.length - 1]?.content || "");

  const modelName = process.env.SYNTHESIS_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: preamble,
    generationConfig: { temperature: 0.3 },
  });
  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last);
    return { answer: result.response.text().trim(), model: modelName };
  } catch (err) {
    console.warn(`Follow-up via ${modelName} failed (${err.status || err.message}).`);
  }
  return { answer: "The AI engine had a brief hiccup — try asking that again.", aiFallback: true };
}
