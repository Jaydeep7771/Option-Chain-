// ── Live market data ────────────────────────────────────────────────────
// Pulls the REAL, current underlying price from Yahoo Finance (no API key,
// works from a server) and builds an option chain anchored to that real
// level. So: the spot/ATM is genuinely live; the open-interest distribution
// is modeled (real OI isn't available free server-side — NSE blocks bots).
//
// If the live fetch fails for any reason, we fall back to a static spot so
// the demo never breaks.

import { fetchOptionChain as fetchUpstoxChain } from "./upstox.js";

const INDEX_MAP = {
  NIFTY: { yahoo: "^NSEI", label: "NIFTY", step: 50 },
  NIFTY50: { yahoo: "^NSEI", label: "NIFTY", step: 50 },
  BANKNIFTY: { yahoo: "^NSEBANK", label: "BANKNIFTY", step: 100 },
  NIFTYBANK: { yahoo: "^NSEBANK", label: "BANKNIFTY", step: 100 },
  SENSEX: { yahoo: "^BSESN", label: "SENSEX", step: 100 },
};

// Turn whatever the user typed into a Yahoo symbol + sensible strike step.
function resolveSymbol(ticker = "NIFTY50") {
  const key = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (INDEX_MAP[key]) return INDEX_MAP[key];
  // Otherwise treat it as an NSE-listed equity (e.g. RELIANCE -> RELIANCE.NS)
  return { yahoo: `${key}.NS`, label: key, step: null };
}

function niceStep(spot) {
  if (spot >= 15000) return 100;
  if (spot >= 5000) return 50;
  if (spot >= 1000) return 20;
  if (spot >= 250) return 5;
  return 2.5;
}

async function fetchSpot(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: ctrl.signal });
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return { price: meta.regularMarketPrice, prevClose: meta.chartPreviousClose ?? meta.regularMarketPrice };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Real daily closing prices (~3 months) for technical-trend analysis.
// Falls back to a synthetic series so the trend engine always has data.
export async function getHistoricalCloses(ticker = "NIFTY50") {
  const sym = resolveSymbol(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym.yahoo)}?range=3mo&interval=1d`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: ctrl.signal });
    const json = await res.json();
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    const clean = (closes || []).filter((c) => typeof c === "number" && isFinite(c));
    if (clean.length >= 50) return clean;
  } catch {
    /* fall through to synthetic */
  } finally {
    clearTimeout(timer);
  }
  // Synthetic ~60-session random walk (absolute level is irrelevant to RSI/EMA regime).
  const base = sym.label === "BANKNIFTY" ? 57000 : sym.label === "SENSEX" ? 79000 : sym.step ? 24000 : 1000;
  const out = [];
  let p = base * 0.95;
  for (let i = 0; i < 60; i++) {
    p += (Math.random() - 0.44) * base * 0.01;
    out.push(+p.toFixed(2));
  }
  return out;
}

// Lightweight quotes for the ticker tape — live spot + % change only, no chain
// build. Runs all symbols in parallel; nulls out anything the feed can't reach.
export async function getQuotes(tickers = ["NIFTY50", "BANKNIFTY", "SENSEX"]) {
  return Promise.all(
    tickers.map(async (t) => {
      const sym = resolveSymbol(t);
      const live = await fetchSpot(sym.yahoo);
      if (!live) return { ticker: t, label: sym.label, spot: null, changePct: null };
      const changePct = +(((live.price - live.prevClose) / live.prevClose) * 100).toFixed(2);
      return { ticker: t, label: sym.label, spot: +live.price.toFixed(2), changePct };
    })
  );
}

// Build a realistic chain centered on the real spot.
// NOTE: this OI is MODELED, not real. It is intentionally UNBIASED — calls and
// puts share the same base weighting so a modeled chain reads ~neutral (PCR≈1.0)
// instead of inventing a directional verdict. Real OI requires Upstox (live-oi).
function buildChain(spot, step, strikes = 11) {
  const atm = Math.round(spot / step) * step;
  const half = Math.floor(strikes / 2);
  const chain = [];
  for (let i = -half; i <= half; i++) {
    const strike = atm + i * step;
    const distance = Math.abs(i);
    const base = (half - distance + 1) * 1600; // symmetric: no fabricated bull/bear tilt
    const callOI = Math.round(base + Math.random() * 800);
    const putOI = Math.round(base + Math.random() * 800);
    chain.push({
      strike,
      call: { oi: callOI, iv: +(12 + distance * 0.6 + Math.random()).toFixed(2) },
      put: { oi: putOI, iv: +(13 + distance * 0.6 + Math.random()).toFixed(2) },
    });
  }
  return chain;
}

export async function getOptionChain(ticker = "NIFTY50") {
  // 1) Best: real option chain (real OI/IV) from Upstox, if logged in.
  const real = await fetchUpstoxChain(ticker);
  if (real) return real;

  // 2) Next: real live spot from Yahoo, modeled OI around it.
  const sym = resolveSymbol(ticker);
  const live = await fetchSpot(sym.yahoo);

  if (live) {
    const step = sym.step || niceStep(live.price);
    const changePct = +(((live.price - live.prevClose) / live.prevClose) * 100).toFixed(2);
    return {
      underlying: sym.label,
      spot: +live.price.toFixed(2),
      changePct,
      source: "live", // real spot from Yahoo Finance
      oiModeled: true, // spot is live; open interest is modeled around it
      generatedAt: new Date().toISOString(),
      chain: buildChain(live.price, step),
    };
  }

  // Fallback so the demo never breaks.
  const fallbackSpot = 22500;
  return {
    underlying: sym.label,
    spot: fallbackSpot,
    changePct: 0,
    source: "mock", // couldn't reach the live feed
    oiModeled: true,
    generatedAt: new Date().toISOString(),
    chain: buildChain(fallbackSpot, sym.step || 100),
  };
}
