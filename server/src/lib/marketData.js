// ── Live market data ────────────────────────────────────────────────────
// Pulls the REAL, current underlying price from Yahoo Finance (no API key,
// works from a server) and builds an option chain anchored to that real
// level. So: the spot/ATM is genuinely live; the open-interest distribution
// is modeled (real OI isn't available free server-side — NSE blocks bots).
//
// If the live fetch fails for any reason, we fall back to a static spot so
// the demo never breaks.

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

// Build a realistic chain centered on the real spot.
function buildChain(spot, step, strikes = 11) {
  const atm = Math.round(spot / step) * step;
  const half = Math.floor(strikes / 2);
  const chain = [];
  for (let i = -half; i <= half; i++) {
    const strike = atm + i * step;
    const distance = Math.abs(i);
    const callOI = Math.round((half - distance + 1) * 1500 + Math.random() * 800);
    const putOI = Math.round((half - distance + 1) * 1700 + Math.random() * 800);
    chain.push({
      strike,
      call: { oi: callOI, iv: +(12 + distance * 0.6 + Math.random()).toFixed(2) },
      put: { oi: putOI, iv: +(13 + distance * 0.6 + Math.random()).toFixed(2) },
    });
  }
  return chain;
}

export async function getOptionChain(ticker = "NIFTY50") {
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
    generatedAt: new Date().toISOString(),
    chain: buildChain(fallbackSpot, sym.step || 100),
  };
}
