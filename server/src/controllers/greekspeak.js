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
  // Open interest is only trustworthy when it comes from a real feed (Upstox).
  // On the Yahoo/mock paths it is MODELED, so any positioning read is low-confidence.
  const oiModeled = optionChain.oiModeled ?? optionChain.source !== "live-oi";

  const totalCallOI = chain.reduce((s, r) => s + r.call.oi, 0);
  const totalPutOI = chain.reduce((s, r) => s + r.put.oi, 0);
  const pcr = +(totalPutOI / totalCallOI).toFixed(2);

  // Support / resistance from OI concentration — the strikes traders actually
  // watch. Max call-OI = resistance ceiling; max put-OI = support floor.
  const resistance = chain.reduce((best, r) => (r.call.oi > best.call.oi ? r : best), chain[0]);
  const support = chain.reduce((best, r) => (r.put.oi > best.put.oi ? r : best), chain[0]);

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

  // Max-Pain gravity: price tends to drift toward Max Pain into expiry. If spot
  // sits ABOVE max pain, that pull is downward (mild bearish) and vice versa.
  const painGapPct = maxPain ? +(((spot - maxPain) / maxPain) * 100).toFixed(2) : 0;
  const painPull = painGapPct > 0.4 ? "downward" : painGapPct < -0.4 ? "upward" : "balanced";

  // NSE convention: PCR > 1 = put-writing dominance (bullish / support),
  // PCR < 1 = call-writing dominance (bearish / resistance).
  let bias = "neutral";
  if (pcr > 1.1) bias = "bullish";
  else if (pcr < 0.9) bias = "bearish";

  // When OI is modeled we cannot stand behind a directional positioning call.
  const biasConfidence = oiModeled ? "low" : "high";

  const writerNote =
    bias === "bullish"
      ? `Put writers dominate, anchoring support near ${support.strike}.`
      : bias === "bearish"
      ? `Call writers dominate, building resistance near ${resistance.strike}.`
      : "Call and put writing are balanced — no clear edge.";

  const confidenceNote = oiModeled
    ? " Open interest is modeled (live OI feed not connected), so treat positioning as indicative, not confirmed."
    : "";

  const summary =
    `Options positioning on ${underlying} (spot ${spot}) reads ${bias.toUpperCase()}. ` +
    `Put-Call Ratio is ${pcr} with Max Pain at ${maxPain} (price gravity ${painPull}). ` +
    `Support ~${support.strike}, resistance ~${resistance.strike}. ${writerNote}${confidenceNote}`;

  return {
    underlying,
    spot,
    pcr,
    maxPain,
    painGapPct,
    painPull,
    support: support.strike,
    resistance: resistance.strike,
    bias,
    biasConfidence,
    oiModeled,
    summary,
    source: optionChain.source || "mock", // "live-oi" real OI · "live" real spot · "mock" fallback
    changePct: optionChain.changePct ?? null,
  };
}
