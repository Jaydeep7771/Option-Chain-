// ── Pipeline 1: GreekSpeak ──────────────────────────────────────────────
// Turns the intimidating options-chain TABLE into one plain-English sentiment.
// It computes two classic signals and a verdict:
//   • Put-Call Ratio (PCR)  — > 1 means more puts (often bearish positioning)
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

  // Translate the numbers into a sentence a human can read.
  let bias = "neutral";
  if (pcr > 1.15) bias = "bearish";
  else if (pcr < 0.85) bias = "bullish";

  const summary =
    `Options math on ${underlying} (spot ${spot}) reads ${bias.toUpperCase()}. ` +
    `Put-Call Ratio is ${pcr} and Max Pain sits at ${maxPain}, ` +
    `suggesting traders are positioned for a move toward ${maxPain}.`;

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
