import { Search } from "lucide-react";

const QUICK = ["NIFTY50", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];

export default function SearchHero({ ticker, setTicker, onAnalyze, loading }) {
  return (
    <header className="pt-16 pb-9 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full glass text-[11px] tracking-wide text-[var(--color-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 live-dot" />
        LIVE OPTIONS · NEWS · AI SYNTHESIS
      </div>

      <h1 className="text-4xl sm:text-[2.9rem] font-semibold tracking-tight leading-[1.1]">
        Where the math meets <br className="hidden sm:block" />
        <span className="grad-text">the moment.</span>
      </h1>
      <p className="mt-4 text-[var(--color-muted)] max-w-md mx-auto">
        Type a ticker. We read the live options math and the real-world news, then find the edge between them.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); onAnalyze(); }}
        className="mt-8 mx-auto max-w-xl flex items-center gap-2 p-2 rounded-2xl glass-2 shadow-[0_24px_70px_-24px_rgba(80,140,255,.5)]"
      >
        <Search size={18} className="ml-3 text-[var(--color-muted)] shrink-0" />
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="NIFTY50"
          className="flex-1 bg-transparent outline-none px-2 py-2 text-lg mono placeholder:text-[var(--color-muted)]/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Synthesizing…" : "Find the edge"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => onAnalyze(q)}
            disabled={loading}
            className={
              "px-3 py-1.5 rounded-lg text-xs mono transition disabled:opacity-50 " +
              (ticker === q ? "glass-2 text-[var(--color-ink)]" : "glass text-[var(--color-muted)] hover:text-[var(--color-ink)]")
            }
          >
            {q}
          </button>
        ))}
      </div>
    </header>
  );
}
