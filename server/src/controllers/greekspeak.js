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

  // ── Volatility signals from implied vol (real only on the live-oi feed) ──────
  // ATM IV = the volatility regime; IV skew = put IV minus call IV, the options
  // market's fear gauge (positive = downside hedging demand → bearish lean).
  const atmRow = chain.reduce((best, r) => (Math.abs(r.strike - spot) < Math.abs(best.strike - spot) ? r : best), chain[0]);
  const atmIV = atmRow ? +(((atmRow.call.iv || 0) + (atmRow.put.iv || 0)) / 2).toFixed(2) : null;
  const avg = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);
  const callIVs = chain.map((r) => r.call.iv).filter((v) => v > 0);
  const putIVs = chain.map((r) => r.put.iv).filter((v) => v > 0);
  const ivSkew = callIVs.length && putIVs.length ? +(avg(putIVs) - avg(callIVs)).toFixed(2) : null;
  const ivSkewLabel =
    ivSkew == null ? "n/a" : ivSkew > 0.6 ? "put skew (downside hedging)" : ivSkew < -0.6 ? "call skew (upside chase)" : "flat / balanced";
  const volRegime = atmIV == null ? "n/a" : atmIV >= 20 ? "elevated" : atmIV <= 11 ? "compressed" : "normal";

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

  const ivNote =
    !oiModeled && ivSkew != null ? ` Vol: ATM IV ${atmIV} (${volRegime}), ${ivSkewLabel}.` : "";

  const summary =
    `Options positioning on ${underlying} (spot ${spot}) reads ${bias.toUpperCase()}. ` +
    `Put-Call Ratio is ${pcr} with Max Pain at ${maxPain} (price gravity ${painPull}). ` +
    `Support ~${support.strike}, resistance ~${resistance.strike}.${ivNote} ${writerNote}${confidenceNote}`;

  return {
    underlying,
    spot,
    pcr,
    maxPain,
    painGapPct,
    painPull,
    support: support.strike,
    resistance: resistance.strike,
    atmIV,
    ivSkew,
    ivSkewLabel,
    volRegime,
    bias,
    biasConfidence,
    oiModeled,
    summary,
    source: optionChain.source || "mock", // "live-oi" real OI · "live" real spot · "mock" fallback
    changePct: optionChain.changePct ?? null,
  };
}
