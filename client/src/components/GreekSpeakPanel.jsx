import { Activity } from "lucide-react";

// Maps Put-Call Ratio (~0.5 bullish → ~1.5 bearish) onto a 0–100% track.
function pcrToPercent(pcr) {
  const clamped = Math.max(0.5, Math.min(1.5, pcr));
  return ((clamped - 0.5) / 1.0) * 100;
}

export default function GreekSpeakPanel({ sentiment }) {
  const pct = sentiment ? pcrToPercent(sentiment.pcr) : 50;

  return (
    <section className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-muted)] text-xs tracking-widest uppercase">
          <Activity size={14} className="text-[var(--color-cool)]" />
          GreekSpeak · The Math
        </div>
        {sentiment && (
          <span
            className={
              "text-[10px] font-medium px-2 py-0.5 rounded-full border " +
              (sentiment.source === "live"
                ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10"
                : "border-amber-400/40 text-amber-300 bg-amber-400/10")
            }
            title={sentiment.source === "live" ? "Live spot price · modeled open interest" : "Live feed unreachable · simulated"}
          >
            {sentiment.source === "live" ? "● LIVE SPOT" : "● SIMULATED"}
          </span>
        )}
      </div>

      {/* Real, live underlying price */}
      {sentiment && (
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight">
            {sentiment.spot?.toLocaleString("en-IN")}
          </span>
          {sentiment.changePct != null && (
            <span className={sentiment.changePct >= 0 ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
              {sentiment.changePct >= 0 ? "▲" : "▼"} {Math.abs(sentiment.changePct)}%
            </span>
          )}
          <span className="text-xs text-[var(--color-muted)] uppercase tracking-wide">{sentiment.underlying}</span>
        </div>
      )}

      <p className="mt-6 text-sm text-[var(--color-muted)]">Positioning bias</p>

      {/* Abstract gradient indicator — cool blue (bullish) → warm amber (bearish) */}
      <div className="relative mt-3 h-3 rounded-full overflow-hidden bg-[var(--color-surface-2)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cool)] to-[var(--color-warm)] opacity-90" />
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-cool)] to-[var(--color-warm)] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className="relative -mt-[18px] h-5 w-5 rounded-full bg-white shadow-lg ring-2 ring-[var(--color-canvas)] transition-[margin] duration-700 ease-out"
        style={{ marginLeft: `calc(${pct}% - 10px)` }}
      />

      <div className="mt-4 flex justify-between text-xs">
        <span className="text-[var(--color-cool)]">Bullish</span>
        <span className="font-medium capitalize text-[var(--color-ink)]">
          {sentiment ? sentiment.bias : "—"}
        </span>
        <span className="text-[var(--color-warm)]">Bearish</span>
      </div>

      {/* Max Pain as an abstract "gravity" marker, not a data grid */}
      <div className="mt-7 pt-5 border-t border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-muted)]">Price gravity (Max Pain)</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {sentiment ? sentiment.maxPain : "—"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          The level traders are quietly pulling toward this expiry.
        </p>
      </div>
    </section>
  );
}
