import { useEffect, useState } from "react";
import { Activity, Radio, Sparkles } from "lucide-react";
import SearchHero from "./components/SearchHero.jsx";
import GreekSpeakPanel from "./components/GreekSpeakPanel.jsx";
import AlphaRagPanel from "./components/AlphaRagPanel.jsx";
import SynthesisCard from "./components/SynthesisCard.jsx";
import LoadingSkeleton from "./components/LoadingSkeleton.jsx";

export default function App() {
  const [ticker, setTicker] = useState("NIFTY50");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function analyze(override) {
    const t = (override ?? ticker).trim();
    if (!t) return;
    if (override) setTicker(override);
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t }),
      });
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      setData(await r.json());
    } catch {
      setError("Could not reach the analysis engine. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { analyze(); /* eslint-disable-next-line */ }, []);

  const live = data?.sentiment?.source === "live-oi";

  return (
    <>
      <div className="app-bg" />

      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-semibold tracking-tight">Synapse<span className="grad-text"> AI</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
            <span className="hidden sm:flex items-center gap-1.5"><Activity size={13} className="text-[var(--color-cool)]" /> Math</span>
            <span className="hidden sm:flex items-center gap-1.5"><Radio size={13} className="text-[var(--color-violet)]" /> News</span>
            <span className="flex items-center gap-1.5">
              <span className={"h-2 w-2 rounded-full live-dot " + (data ? "bg-emerald-400" : "bg-amber-400")} />
              {data ? "Engine live" : "Connecting"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28">
        <SearchHero ticker={ticker} setTicker={setTicker} onAnalyze={analyze} loading={loading} />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && data && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="fade-up"><GreekSpeakPanel sentiment={data.sentiment} chain={data.chain} /></div>
              <div className="fade-up" style={{ animationDelay: ".08s" }}><AlphaRagPanel news={data.news} /></div>
            </div>
            <div className="fade-up" style={{ animationDelay: ".16s" }}>
              <SynthesisCard analysis={data.analysis} ticker={data.ticker} aiFallback={data.aiFallback} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
