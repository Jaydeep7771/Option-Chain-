import { ChevronRight, CornerDownLeft } from "lucide-react";

const QUICK = ["NIFTY50", "BANKNIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

export default function SearchHero({ ticker, setTicker, onAnalyze, loading }) {
  return (
    <section className="pt-9 pb-7">
      {/* eyebrow */}
      <div className="flex items-center gap-2 text-[11px] mono tracking-[0.18em] text-[var(--color-muted)] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 live-dot" />
        Options Math <span className="text-white/20">·</span> Live News <span className="text-white/20">·</span> AI Synthesis
      </div>

      <div className="mt-4 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-end">
        {/* headline */}
        <div>
          <h1 className="text-[2.4rem] sm:text-[3rem] font-semibold tracking-tight leading-[1.05]">
            Where the math meets <span className="grad-text">the moment.</span>
          </h1>
          <p className="mt-3 text-[var(--color-muted)] text-[15px] max-w-lg">
            Read the live options chain and the real-world news in one terminal — then surface the
            divergence between them. <span className="text-[var(--color-ink)]">That gap is the edge.</span>
          </p>
        </div>

        {/* command console */}
        <div className="term scanlines rounded-xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(80,140,255,.45)]">
          <div className="term-head flex items-center gap-1.5 px-3 h-8">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-down)]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-up)]/70" />
            <span className="ml-2 text-[10.5px] mono text-[var(--color-muted)] tracking-wide">synapse — analyze</span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); onAnalyze(); }}
            className="p-4"
          >
            <div className="flex items-center gap-2 mono text-[15px]">
              <ChevronRight size={18} className="text-[var(--color-up)] shrink-0" />
              <span className="text-[var(--color-muted)] select-none">analyze</span>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="NIFTY50"
                spellCheck={false}
                className="flex-1 bg-transparent outline-none text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/40 min-w-0"
              />
              {!loading && <span className="w-[9px] h-[18px] bg-cyan-400/80 cursor-blink shrink-0" />}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 transition disabled:opacity-50 mono text-[13px] tracking-wide"
            >
              {loading ? (
                <>RUNNING SYNTHESIS<span className="cursor-blink">_</span></>
              ) : (
                <>RUN ANALYSIS <CornerDownLeft size={14} /></>
              )}
            </button>
          </form>

          {/* watchlist chips */}
          <div className="px-4 pb-4">
            <p className="text-[10px] mono tracking-[0.2em] text-[var(--color-muted)] uppercase mb-2">Watchlist</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => onAnalyze(q)}
                  disabled={loading}
                  className={
                    "px-2.5 py-1 rounded text-[11px] mono border transition disabled:opacity-50 " +
                    (ticker === q
                      ? "border-cyan-400/40 bg-cyan-400/10 text-[var(--color-ink)]"
                      : "border-white/10 bg-white/[.03] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-white/20")
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
