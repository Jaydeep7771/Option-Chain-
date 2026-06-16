import { useEffect, useState } from "react";
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

  async function analyze() {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError("Could not reach the analysis engine. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  }

  // Populate the dashboard once on load so it never looks empty.
  useEffect(() => { analyze(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-5xl px-4 pb-24">
        <SearchHero
          ticker={ticker}
          setTicker={setTicker}
          onAnalyze={analyze}
          loading={loading}
        />

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && data && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <GreekSpeakPanel sentiment={data.sentiment} />
              <AlphaRagPanel news={data.news} />
            </div>
            <SynthesisCard thesis={data.thesis} ticker={data.ticker} />
          </>
        )}
      </div>
    </div>
  );
}
