import { useEffect, useState } from "react";
import TopBar from "./components/TopBar.jsx";
import TickerTape from "./components/TickerTape.jsx";
import SearchHero from "./components/SearchHero.jsx";
import GreekSpeakPanel from "./components/GreekSpeakPanel.jsx";
import AlphaRagPanel from "./components/AlphaRagPanel.jsx";
import SynthesisCard from "./components/SynthesisCard.jsx";
import ThesisChat from "./components/ThesisChat.jsx";
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

  return (
    <>
      <div className="app-bg" />

      <TopBar source={data?.sentiment?.source} />
      <TickerTape onPick={analyze} />

      <main className="mx-auto max-w-[1400px] px-4 pb-28">
        <SearchHero ticker={ticker} setTicker={setTicker} onAnalyze={analyze} loading={loading} />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && data && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="fade-up"><GreekSpeakPanel sentiment={data.sentiment} chain={data.chain} /></div>
              <div className="fade-up" style={{ animationDelay: ".08s" }}><AlphaRagPanel news={data.news} /></div>
            </div>
            <div className="fade-up" style={{ animationDelay: ".16s" }}>
              <SynthesisCard analysis={data.analysis} ticker={data.ticker} aiFallback={data.aiFallback} />
            </div>
            <div className="fade-up" style={{ animationDelay: ".22s" }}>
              <ThesisChat
                key={data.ticker || "x"}
                ticker={data.ticker || ticker}
                context={{
                  sentiment: data.sentiment,
                  trend: data.trend,
                  analysis: data.analysis,
                  news: (data.news || []).map((n) => ({ title: n.title, source: n.source })),
                }}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}
