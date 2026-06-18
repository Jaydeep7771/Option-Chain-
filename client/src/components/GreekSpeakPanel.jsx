import { Activity } from "lucide-react";

// NSE convention: high PCR = bullish (left), low PCR = bearish (right).
// So invert — a high PCR pushes the marker toward the Bullish (left) end.
function pcrToPercent(pcr) {
  const clamped = Math.max(0.5, Math.min(1.5, pcr));
  return (1 - (clamped - 0.5) / 1.0) * 100;
}

const BADGES = {
  "live-oi": { cls: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10", label: "LIVE OPTIONS", title: "Real option chain (live OI/IV) via Upstox" },
  live: { cls: "border-sky-400/40 text-sky-300 bg-sky-400/10", label: "LIVE SPOT", title: "Live spot price · modeled open interest" },
  mock: { cls: "border-amber-400/40 text-amber-300 bg-amber-400/10", label: "SIMULATED", title: "Live feed unreachable · simulated" },
};

export default function GreekSpeakPanel({ sentiment, chain = [] }) {
  const pct = sentiment ? pcrToPercent(sentiment.pcr) : 50;
  const badge = (sentiment && BADGES[sentiment.source]) || BADGES.mock;
  const maxOI = Math.max(1, ...chain.flatMap((r) => [r.call.oi, r.put.oi]));

  return (
    <section className="rounded-2xl glass p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-muted)] text-xs tracking-widest uppercase">
          <Activity size={14} className="text-[var(--color-cool)]" /> GreekSpeak · the math
        </div>
        <span className={"flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border " + badge.cls} title={badge.title}>
          <span className="h-1.5 w-1.5 rounded-full bg-current live-dot" /> {badge.label}
        </span>
      </div>

      {/* Live price */}
      {sentiment && (
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight mono">{sentiment.spot?.toLocaleString("en-IN")}</span>
          {sentiment.changePct != null && (
            <span className={"text-sm mono " + (sentiment.changePct >= 0 ? "text-emerald-400" : "text-red-400")}>
              {sentiment.changePct >= 0 ? "▲" : "▼"} {Math.abs(sentiment.changePct)}%
            </span>
          )}
          <span className="text-xs text-[var(--color-muted)] uppercase tracking-wide ml-auto">{sentiment.underlying}</span>
        </div>
      )}

      {/* Sentiment meter */}
      <p className="mt-6 text-xs text-[var(--color-muted)] uppercase tracking-wider">Positioning bias</p>
      <div className="relative mt-2 h-2.5 rounded-full overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cool)] via-violet-500 to-[var(--color-warm)] opacity-25" />
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-cool)] via-violet-500 to-[var(--color-warm)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="relative -mt-[16px] h-4 w-4 rounded-full bg-white shadow-lg ring-2 ring-[var(--color-canvas)] transition-[margin] duration-700" style={{ marginLeft: `calc(${pct}% - 8px)` }} />
      <div className="mt-3 flex justify-between text-[11px]">
        <span className="text-[var(--color-cool)]">Bullish</span>
        <span className="text-[var(--color-muted)]">Neutral</span>
        <span className="text-[var(--color-warm)]">Bearish</span>
      </div>

      {/* Open-interest profile — abstract diverging bars, no data grid */}
      {chain.length > 0 && (
        <div className="mt-7 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mb-2.5">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--color-cool)]" /> Calls</span>
            <span className="uppercase tracking-wider">Where the bets sit</span>
            <span className="flex items-center gap-1.5">Puts <span className="h-2 w-2 rounded-sm bg-[var(--color-warm)]" /></span>
          </div>
          <div className="space-y-1">
            {chain.map((r) => {
              const isPain = r.strike === sentiment?.maxPain;
              return (
                <div key={r.strike} className={"flex items-center gap-2 rounded-md px-1 " + (isPain ? "bg-white/[.06]" : "")}>
                  <div className="flex-1 flex justify-end">
                    <div className="h-2 rounded-l-sm bg-gradient-to-l from-[var(--color-cool)] to-sky-400/40" style={{ width: `${(r.call.oi / maxOI) * 100}%` }} />
                  </div>
                  <span className={"w-14 text-center text-[10.5px] mono shrink-0 " + (isPain ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-muted)]")}>{r.strike}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-r-sm bg-gradient-to-r from-[var(--color-warm)] to-amber-300/40" style={{ width: `${(r.put.oi / maxOI) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Max pain */}
      <div className="mt-6 pt-5 border-t border-white/5 flex items-end justify-between">
        <div>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Price gravity · max pain</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight mono">{sentiment ? sentiment.maxPain?.toLocaleString("en-IN") : "—"}</p>
        </div>
        <p className="text-[11px] text-[var(--color-muted)] max-w-[55%] text-right">The level traders are quietly pulling toward this expiry.</p>
      </div>
    </section>
  );
}
