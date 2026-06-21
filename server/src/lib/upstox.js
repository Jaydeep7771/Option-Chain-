// ── Upstox integration ──────────────────────────────────────────────────
// Real option-chain data (OI, IV) for NSE indices. Flow:
//   1. /api/upstox/login  → sends you to Upstox to authorize
//   2. /api/upstox/callback → Upstox returns a code; we swap it for a daily
//      access token and save it to .env automatically.
//   3. fetchOptionChain() uses that token to pull the real chain.
// The token expires daily (~3:30 AM IST); just hit /login again to refresh.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../.env");

// Upstox instrument keys for the indices we support.
const INDEX_KEYS = {
  NIFTY: "NSE_INDEX|Nifty 50",
  NIFTY50: "NSE_INDEX|Nifty 50",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
  NIFTYBANK: "NSE_INDEX|Nifty Bank",
  FINNIFTY: "NSE_INDEX|Nifty Fin Service",
};

export function isConfigured() {
  const k = process.env.UPSTOX_API_KEY || "";
  const s = process.env.UPSTOX_API_SECRET || "";
  return k && s && !k.includes("your_") && !s.includes("your_");
}

export function hasToken() {
  return Boolean(process.env.UPSTOX_ACCESS_TOKEN);
}

export function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.UPSTOX_API_KEY,
    redirect_uri: process.env.UPSTOX_REDIRECT_URI,
  });
  return `https://api.upstox.com/v2/login/authorization/dialog?${params}`;
}

// Persist the token to .env AND to the running process so it works immediately.
function saveToken(token) {
  process.env.UPSTOX_ACCESS_TOKEN = token;
  try {
    let env = fs.readFileSync(ENV_PATH, "utf8");
    if (/^UPSTOX_ACCESS_TOKEN=.*$/m.test(env)) {
      env = env.replace(/^UPSTOX_ACCESS_TOKEN=.*$/m, `UPSTOX_ACCESS_TOKEN=${token}`);
    } else {
      env += `\nUPSTOX_ACCESS_TOKEN=${token}\n`;
    }
    fs.writeFileSync(ENV_PATH, env);
  } catch (e) {
    console.warn("Could not persist token to .env:", e.message);
  }
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.UPSTOX_API_KEY,
    client_secret: process.env.UPSTOX_API_SECRET,
    redirect_uri: process.env.UPSTOX_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://api.upstox.com/v2/login/authorization/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(json.message || JSON.stringify(json));
  saveToken(json.access_token);
  return json.access_token;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`,
    Accept: "application/json",
  };
}

// The daily token expires ~3:30 AM IST. When the API rejects it (401), drop it
// from the running process so /upstox/status honestly reports "disconnected"
// and the UI can prompt a re-login instead of silently serving modeled OI.
function invalidateToken() {
  if (process.env.UPSTOX_ACCESS_TOKEN) {
    delete process.env.UPSTOX_ACCESS_TOKEN;
    console.warn("Upstox token expired/invalid — cleared. Visit /api/upstox/login to refresh.");
  }
}

// Find the nearest expiry for an instrument.
async function getNearestExpiry(instrumentKey) {
  const url = `https://api.upstox.com/v2/option/contract?instrument_key=${encodeURIComponent(instrumentKey)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 401) { invalidateToken(); return null; }
  const json = await res.json();
  const expiries = [...new Set((json.data || []).map((d) => d.expiry))].sort();
  return expiries[0] || null;
}

// Returns our standard chain object, or null if it can't (caller falls back).
export async function fetchOptionChain(ticker = "NIFTY50") {
  if (!isConfigured() || !hasToken()) return null;
  const key = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const instrumentKey = INDEX_KEYS[key];
  if (!instrumentKey) return null; // only indices supported via Upstox here

  try {
    const expiry = await getNearestExpiry(instrumentKey);
    if (!expiry) return null;

    const url = `https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiry}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401) {
      invalidateToken();
      return null;
    }
    const json = await res.json();
    const rows = json.data || [];
    if (!rows.length) return null;

    const spot = rows[0].underlying_spot_price;
    // Keep the full Greeks Upstox returns (delta/gamma/theta/vega), not just IV —
    // they power the IV-skew and volatility signals downstream.
    const leg = (o) => {
      const g = o?.option_greeks || {};
      return {
        oi: o?.market_data?.oi ?? 0,
        volume: o?.market_data?.volume ?? 0,
        iv: g.iv ?? 0,
        delta: g.delta ?? null,
        gamma: g.gamma ?? null,
        theta: g.theta ?? null,
        vega: g.vega ?? null,
      };
    };
    const chain = rows
      .map((r) => ({ strike: r.strike_price, call: leg(r.call_options), put: leg(r.put_options) }))
      .sort((a, b) => a.strike - b.strike);

    // Trim to ~11 strikes around ATM for a clean view.
    const atmIdx = chain.reduce(
      (best, r, i) => (Math.abs(r.strike - spot) < Math.abs(chain[best].strike - spot) ? i : best),
      0
    );
    const window = chain.slice(Math.max(0, atmIdx - 5), atmIdx + 6);

    return {
      underlying: key === "BANKNIFTY" || key === "NIFTYBANK" ? "BANKNIFTY" : key === "FINNIFTY" ? "FINNIFTY" : "NIFTY",
      spot: +Number(spot).toFixed(2),
      changePct: null,
      source: "live-oi", // fully real: live spot + real open interest
      oiModeled: false,
      expiry,
      generatedAt: new Date().toISOString(),
      chain: window,
    };
  } catch (e) {
    console.warn("Upstox fetch failed, falling back:", e.message);
    return null;
  }
}
