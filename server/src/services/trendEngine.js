// ── Trend Engine ────────────────────────────────────────────────────────
// Computes traditional technical indicators (RSI + EMA crossover) from a
// series of closing prices, and distils them into abstract status labels so
// the UI can show them as badges — no charts, true to the minimalist aesthetic.

import ti from "technicalindicators";
const { RSI, EMA } = ti;

// closes: array of recent closing prices, oldest → newest.
export function computeTrend(closes = []) {
  const values = (closes || []).filter((c) => typeof c === "number" && isFinite(c));

  // Need enough history for a 50-period EMA to be meaningful.
  if (values.length < 50) {
    return {
      trend_status: "Neutral",
      rsi_state: "Healthy Momentum",
      rsi: null,
      ema20: null,
      ema50: null,
      technical_confluence: "Trend: Neutral - RSI: Healthy Momentum",
    };
  }

  const rsiArr = RSI.calculate({ period: 14, values });
  const ema20Arr = EMA.calculate({ period: 20, values });
  const ema50Arr = EMA.calculate({ period: 50, values });

  const rsi = rsiArr.length ? +rsiArr[rsiArr.length - 1].toFixed(1) : null;
  const ema20 = ema20Arr.length ? ema20Arr[ema20Arr.length - 1] : null;
  const ema50 = ema50Arr.length ? ema50Arr[ema50Arr.length - 1] : null;

  // EMA regime: 20 above 50 = Golden Cross (uptrend), below = Death Cross.
  let trend_status = "Neutral";
  if (ema20 != null && ema50 != null) {
    const gapPct = ((ema20 - ema50) / ema50) * 100;
    if (gapPct > 0.15) trend_status = "Golden Cross";
    else if (gapPct < -0.15) trend_status = "Death Cross";
  }

  // RSI momentum bands.
  let rsi_state = "Healthy Momentum";
  if (rsi != null) {
    if (rsi >= 70) rsi_state = "Overbought";
    else if (rsi <= 30) rsi_state = "Oversold";
  }

  return {
    trend_status,
    rsi_state,
    rsi,
    ema20: ema20 != null ? +ema20.toFixed(1) : null,
    ema50: ema50 != null ? +ema50.toFixed(1) : null,
    technical_confluence: `Trend: ${trend_status} - RSI: ${rsi_state}`,
  };
}
