import { useEffect, useState } from "react";

// Live scrolling index/stock strip — the classic terminal ticker tape.
// Polls /api/quotes every 60s; pauses scroll on hover (CSS).
export default function TickerTape({ onPick }) {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/quotes");
        if (!r.ok) return;
        const data = await r.json();
        if (alive) setQuotes(data.filter((q) => q.spot != null));
      } catch {
        /* keep last good tape */
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!quotes.length) {
    return (
      <div className="h-9 border-b hairline flex items-center px-4 text-[11px] text-[var(--color-muted)] mono">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 live-dot mr-2" /> connecting to market feed…
      </div>
    );
  }

  // Duplicate the list so the marquee can loop seamlessly.
  const items = [...quotes, ...quotes];

  return (
    <div className="h-9 border-b hairline overflow-hidden relative bg-black/20">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#060810] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#060810] to-transparent" />
      <div className="marquee h-full items-center">
        {items.map((q, i) => {
          const up = (q.changePct ?? 0) >= 0;
          return (
            <button
              key={i}
              onClick={() => onPick?.(q.ticker)}
              className="group inline-flex items-center gap-2 px-4 h-9 border-r hairline mono text-[12px] hover:bg-white/[.04] transition"
              title={`Analyze ${q.label}`}
            >
              <span className="text-[var(--color-muted)] group-hover:text-[var(--color-ink)] tracking-wide">{q.label}</span>
              <span className="text-[var(--color-ink)]">{q.spot?.toLocaleString("en-IN")}</span>
              <span className={up ? "text-up" : "text-down"}>
                {up ? "▲" : "▼"} {Math.abs(q.changePct ?? 0).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
