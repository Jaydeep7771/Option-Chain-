// ── Pipeline 1: GreekSpeak ──────────────────────────────────────────────
// Turns the intimidating options-chain TABLE into one plain-English sentiment.
// It computes two classic signals and a verdict, following NSE convention:
//   • Put-Call Ratio (PCR)
//       PCR > 1.0  → heavy PUT writing → put writers expect support to hold
//                    → BULLISH bias / strong support anchor.
//       PCR < 1.0  → heavy CALL writing → call writers expect resistance to cap
//                    → BEARISH bias / resistance overload.
//   • Max Pain              — the strike where option buyers lose the most;
//                             price often gravitates here near expiry.

import { getMockOptionChain } from "../lib/mockOptionChain.js";

export function computeSentiment(optionChain = getMockOptionChain()) {
  const { chain, spot, underlying } = optionChain;

  const totalCallOI = chain.reduce((s, r) => s + r.call.oi, 0);
  const totalPutOI = chain.reduce((s, r) => s + r.put.oi, 0);
  const pcr = +(totalPutOI / totalCallOI).toFixed(2);

  // Max Pain: for each candidate strike, sum the intrinsic value option
  // WRITERS would have to pay out; the minimum is the "pain" point.
  let maxPain = null;
  let minPayout = Infinity;
  for (const candidate of chain) {
    let payout = 0;
    for (const row of chain) {
      if (candidate.strike > row.strike) payout += (candidate.strike - row.strike) * row.call.oi;
      if (candidate.strike < row.strike) payout += (row.strike - candidate.strike) * row.put.oi;
    }
    if (payout < minPayout) {
      minPayout = payout;
      maxPain = candidate.strike;
    }
  }

  // NSE convention: PCR > 1 = put-writing dominance (bullish / support),
  // PCR < 1 = call-writing dominance (bearish / resistance).
  let bias = "neutral";
  if (pcr > 1.1) bias = "bullish";
  else if (pcr < 0.9) bias = "bearish";

  const writerNote =
    bias === "bullish"
      ? "Put writers dominate, anchoring strong support."
      : bias === "bearish"
      ? "Call writers dominate, building a resistance wall overhead."
      : "Call and put writing are balanced — no clear edge.";

  const summary =
    `Options positioning on ${underlying} (spot ${spot}) reads ${bias.toUpperCase()}. ` +
    `Put-Call Ratio is ${pcr} with Max Pain at ${maxPain}. ${writerNote}`;

  return {
    underlying,
    spot,
    pcr,
    maxPain,
    bias,
    summary,
    source: optionChain.source || "mock", // "live" = real spot, "mock" = fallback
    changePct: optionChain.changePct ?? null,
  };
}
