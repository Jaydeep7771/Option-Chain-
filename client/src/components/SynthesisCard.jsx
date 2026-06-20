import { Sparkles, Info, Target, AlertTriangle, ShieldCheck, Activity, TrendingUp, Lightbulb } from "lucide-react";

// Map a free-text sentiment / risk string to a colour family.
function sentimentTone(s = "") {
  const t = s.toLowerCase();
  if (/bear|down|short|negative/.test(t)) return { fg: "text-rose-300", bg: "bg-rose-400/10", bd: "border-rose-400/30" };
  if (/bull|up|accel|positive|long/.test(t)) return { fg: "text-emerald-300", bg: "bg-emerald-400/10", bd: "border-emerald-400/30" };
  return { fg: "text-amber-300", bg: "bg-amber-400/10", bd: "border-amber-400/30" };
}
function riskTone(s = "") {
  const t = s.toLowerCase();
  if (t.includes("high")) return { fg: "text-rose-300", bg: "bg-rose-400/10", bd: "border-rose-400/30" };
  if (t.includes("low")) return { fg: "text-emerald-300", bg: "bg-emerald-400/10", bd: "border-emerald-400/30" };
  return { fg: "text-amber-300", bg: "bg-amber-400/10", bd: "border-amber-400/30" };
}
function trendTone(s = "") {
  const t = s.toLowerCase();
  if (/death|overbought|oversold/.test(t)) return { fg: "text-rose-300", bg: "bg-rose-400/10", bd: "border-rose-400/30" };
  if (/golden|healthy/.test(t)) return { fg: "text-emerald-300", bg: "bg-emerald-400/10", bd: "border-emerald-400/30" };
  return { fg: "text-amber-300", bg: "bg-amber-400/10", bd: "border-amber-400/30" };
}

function Badge({ tone, icon: Icon, label, value }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${tone.bd} ${tone.bg}`}>
      <Icon size={14} className={tone.fg} />
      <span className="text-[10px] mono uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <span className={`text-[13px] font-semibold ${tone.fg}`}>{value}</span>
    </div>
  );
}

export default function SynthesisCard({ analysis, ticker, aiFallback }) {
  // Safe parsing — never crash if a field is missing on a new ticker.
  const qa = analysis?.quantitative_analysis || {};
  const ai = analysis?.ai_synthesis || {};
  const plain = analysis?.plain_english || {};
  const sentiment = qa.market_sentiment || "—";
  const risk = ai.risk_level || "—";
  const confluence = qa.technical_confluence || "";
  // Build the trend label robustly: parse the "Trend: X · RSI: Y" string by its
  // labels, strip ANY non-word/space junk (stray separators, control chars), and
  // re-join with a clean bullet — never depends on the source separator glyph.
  const clean = (s = "") => s.replace(/[^\w\s/]/g, " ").replace(/\s+/g, " ").trim();
  const [, trendPart = "", rsiPart = ""] = confluence.match(/Trend:\s*(.*?)\s*(?:RSI:\s*(.*))?$/i) || [];
  const techDisplay = [clean(trendPart), clean(rsiPart)].filter(Boolean).join(" • ");
  const sTone = sentimentTone(sentiment);
  const rTone = riskTone(risk);
  const tTone = trendTone(confluence);
  const diverges = ai.divergence_detected;

  return (
    <section className="glow-ring mt-4 term rounded-xl relative overflow-hidden">
      <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

      {/* module header strip */}
      <div className="term-head flex items-center justify-between px-4 h-9 relative">
        <div className="flex items-center gap-2 text-[10.5px] mono tracking-[0.16em] uppercase">
          <Sparkles size={13} className="text-violet-300" />
          <span className="grad-text font-medium">Synthesis Engine</span>
          {ticker && <span className="text-[var(--color-muted)]">/ {ticker}</span>}
        </div>
        <div className={`flex items-center gap-1.5 text-[9.5px] mono font-medium px-1.5 py-0.5 rounded-sm border ${diverges ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/5 text-[var(--color-muted)]"}`}>
          {diverges ? <Target size={11} /> : <ShieldCheck size={11} />}
          {diverges ? "DIVERGENCE" : "ALIGNED"}
        </div>
      </div>

      <div className="p-6 sm:p-7 relative">
        {/* metric badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone={sTone} icon={Activity} label="Sentiment" value={sentiment} />
          <Badge tone={rTone} icon={AlertTriangle} label="Risk" value={risk} />
          {confluence && (
            <Badge tone={tTone} icon={TrendingUp} label="Technical" value={techDisplay} />
          )}
        </div>

        {aiFallback && (
          <div className="mt-5 flex items-center gap-2 text-[12px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-md px-3 py-2">
            <Info size={14} /> AI engine momentarily unavailable — showing the quantitative read.
          </div>
        )}

        {/* plain-English layer — friendly summary for non-finance readers, shown first */}
        {plain.summary && (
          <div className="mt-6 rounded-lg border border-violet-400/20 bg-violet-400/[0.05] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={15} className="text-violet-300" />
              <span className="text-[10px] mono uppercase tracking-[0.15em] text-violet-300/80">In plain English</span>
            </div>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">{plain.summary}</p>
            {plain.strategy_explained && (
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-300">
                <span className="text-violet-300/90 font-medium">The trade idea: </span>
                {plain.strategy_explained}
              </p>
            )}
          </div>
        )}

        {/* quantitative insight */}
        <div className="mt-6">
          <p className="text-[10px] mono uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1.5">Quantitative insight</p>
          <p className="text-[15.5px] leading-relaxed text-[var(--color-ink)]">{qa.headline_insight || "—"}</p>
        </div>

        {/* trading thesis */}
        <div className="mt-5">
          <p className="text-[10px] mono uppercase tracking-[0.15em] text-[var(--color-muted)] mb-1.5">Synthesis thesis</p>
          <p className="text-[16px] leading-relaxed font-medium text-[var(--color-ink)]">{ai.trading_thesis || "—"}</p>
        </div>

        {/* elevated strategy sub-panel */}
        <div className="mt-6 rounded-lg border border-cyan-400/25 bg-cyan-400/[0.04] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target size={15} className="text-cyan-300" />
            <span className="text-[10px] mono uppercase tracking-[0.15em] text-cyan-300/80">Actionable edge · suggested structure</span>
          </div>
          <p className="text-[19px] font-semibold text-[var(--color-ink)] mono">{ai.suggested_strategy || "—"}</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-300">{ai.strategy_rationale || "—"}</p>
        </div>

        <p className="mt-5 text-[10.5px] mono text-[var(--color-muted)] italic">
          Quantitative analysis for informational purposes only · not financial advice.
        </p>
      </div>
    </section>
  );
}
