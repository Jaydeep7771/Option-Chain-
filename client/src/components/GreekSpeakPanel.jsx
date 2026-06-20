import { Activity } from "lucide-react";

// NSE convention: high PCR = bullish (left), low PCR = bearish (right).
// So invert — a high PCR pushes the marker toward the Bullish (left) end.
function pcrToPercent(pcr) {
  const clamped = Math.max(0.5, Math.min(1.5, pcr));
  return (1 - (clamped - 0.5) / 1.0) * 100;
}

const BADGES = {
  "live-oi": { cls: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10", label: "LIVE OI", title: "Real option chain (live OI/IV) via Upstox" },
  live: { cls: "border-sky-400/40 text-sky-300 bg-sky-400/10", label: "LIVE SPOT", title: "Live spot price · modeled open interest" },
  mock: { cls: "border-amber-400/40 text-amber-300 bg-amber-400/10", label: "SIM", title: "Live feed unreachable · simulated" },
};

export default function GreekSpeakPanel({ sentiment, chain = [] }) {
  const pct = sentiment ? pcrToPercent(sentiment.pcr) : 50;
  const badge = (sentiment && BADGES[sentiment.source]) || BADGES.mock;
  const maxOI = Math.max(1, ...chain.flatMap((r) => [r.call.oi, r.put.oi]));
  const up = (sentiment?.changePct ?? 0) >= 0;

  return (
    <section className="term rounded-lg overflow-hidden h-full">
      {/* module header strip */}
      <div className="term-head flex items-center justify-between px-4 h-9">
        <div className="flex items-center gap-2 text-[10.5px] mono tracking-[0.16em] uppercase text-[var(--color-muted)]">
          <Activity size={13} className="text-[var(--color-cool)]" /> GreekSpeak <span className="text-white/20">/</span> the math
        </div>
        <span className={"flex items-center gap-1.5 text-[9.5px] mono font-medium px-1.5 py-0.5 rounded-sm border " + badge.cls} title={badge.title}>
          <span className="h-1.5 w-1.5 rounded-full bg-current live-dot" /> {badge.label}
        </span>
      </div>

      <div className="p-5">
        {/* Live price */}
        {sentiment && (
          <div className="flex items-baseline gap-3">
            <span className="text-[2rem] font-semibold tracking-tight mono leading-none">{sentiment.spot?.toLocaleString("en-IN")}</span>
            {sentiment.changePct != null && (
              <span className={"text-sm mono " + (up ? "text-up" : "text-down")}>
                {up ? "▲" : "▼"} {Math.abs(sentiment.changePct)}%
              </span>
            )}
            <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-[0.15em] mono ml-auto">{sentiment.underlying}</span>
          </div>
        )}

        {/* key stats row — terminal style */}
        {sentiment && (
          <div className="mt-4 grid grid-cols-3 gap-px bg-white/5 border hairline rounded-md overflow-hidden text-center">
            {[
              { k: "PCR", v: sentiment.pcr },
              { k: "MAX PAIN", v: sentiment.maxPain?.toLocaleString("en-IN") },
              { k: "BIAS", v: (sentiment.bias || "—").toUpperCase() },
            ].map((s) => (
              <div key={s.k} className="bg-[#0a0d16] px-2 py-2">
                <p className="text-[9px] mono tracking-[0.12em] text-[var(--color-muted)]">{s.k}</p>
                <p className="mt-0.5 text-[15px] mono font-semibold">{s.v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sentiment meter */}
        <p className="mt-6 text-[10px] mono text-[var(--color-muted)] uppercase tracking-[0.15em]">Positioning bias</p>
        <div className="relative mt-2 h-2.5 rounded-full overflow-hidden bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cool)] via-violet-500 to-[var(--color-warm)] opacity-25" />
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-cool)] via-violet-500 to-[var(--color-warm)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="relative -mt-[16px] h-4 w-4 rounded-full bg-white shadow-lg ring-2 ring-[var(--color-canvas)] transition-[margin] duration-700" style={{ marginLeft: `calc(${pct}% - 8px)` }} />
        <div className="mt-3 flex justify-between text-[10px] mono uppercase tracking-wider">
          <span className="text-[var(--color-cool)]">Bullish</span>
          <span className="text-[var(--color-muted)]">Neutral</span>
          <span className="text-[var(--color-warm)]">Bearish</span>
        </div>
        {sentiment?.oiModeled && (
          <p className="mt-2 text-[10px] mono text-amber-300/80">
            ⚠ Modeled OI · indicative — connect Upstox for live positioning.
          </p>
        )}

        {/* Support / resistance band from OI concentration */}
        {sentiment?.support != null && sentiment?.resistance != null && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-[var(--color-cool)]/20 bg-[var(--color-cool)]/[0.06] px-3 py-2">
              <p className="text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--color-muted)]">Support · max put OI</p>
              <p className="mt-0.5 text-lg font-semibold mono text-[var(--color-cool)]">{sentiment.support?.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-md border border-[var(--color-warm)]/20 bg-[var(--color-warm)]/[0.06] px-3 py-2">
              <p className="text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--color-muted)]">Resistance · max call OI</p>
              <p className="mt-0.5 text-lg font-semibold mono text-[var(--color-warm)]">{sentiment.resistance?.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}

        {/* Open-interest profile — diverging bars */}
        {chain.length > 0 && (
          <div className="mt-7 pt-5 border-t hairline">
            <div className="flex items-center justify-between text-[10px] mono text-[var(--color-muted)] mb-2.5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--color-cool)]" /> Calls</span>
              <span>Open interest by strike</span>
              <span className="flex items-center gap-1.5">Puts <span className="h-2 w-2 rounded-sm bg-[var(--color-warm)]" /></span>
            </div>
            <div className="space-y-1">
              {chain.map((r) => {
                const isPain = r.strike === sentiment?.maxPain;
                return (
                  <div key={r.strike} className={"flex items-center gap-2 rounded-sm px-1 " + (isPain ? "bg-white/[.06]" : "")}>
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
        <div className="mt-6 pt-5 border-t hairline flex items-end justify-between">
          <div>
            <p className="text-[10px] mono text-[var(--color-muted)] uppercase tracking-[0.15em]">Price gravity · max pain</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight mono">{sentiment ? sentiment.maxPain?.toLocaleString("en-IN") : "—"}</p>
          </div>
          <p className="text-[10.5px] text-[var(--color-muted)] max-w-[55%] text-right leading-snug">The level traders are quietly pulling toward this expiry.</p>
        </div>
      </div>
    </section>
  );
}
