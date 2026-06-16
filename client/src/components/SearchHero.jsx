import { Search, Sparkles } from "lucide-react";

export default function SearchHero({ ticker, setTicker, onAnalyze, loading }) {
  return (
    <header className="pt-20 pb-10 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-[var(--color-border)] text-xs tracking-wide text-[var(--color-muted)]">
        <Sparkles size={13} className="text-[var(--color-accent)]" />
        SYNAPSE&nbsp;AI
      </div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
        Where the math meets the moment.
      </h1>
      <p className="mt-3 text-[var(--color-muted)] max-w-md mx-auto">
        Type a ticker. We read the options math and the real world, then find the edge between them.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); onAnalyze(); }}
        className="mt-8 mx-auto max-w-xl flex items-center gap-2 px-2 py-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_20px_60px_-20px_rgba(91,140,255,.45)]"
      >
        <Search size={18} className="ml-3 text-[var(--color-muted)] shrink-0" />
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="NIFTY50"
          className="flex-1 bg-transparent outline-none px-2 py-2 text-lg placeholder:text-[var(--color-muted)]/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Synthesizing…" : "Analyze"}
        </button>
      </form>
    </header>
  );
}
