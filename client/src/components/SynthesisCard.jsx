import { Sparkles, Info, Target, AlertTriangle, ShieldCheck, Activity, TrendingUp } from "lucide-react";

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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tone.bd} ${tone.bg}`}>
      <Icon size={14} className={tone.fg} />
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <span className={`text-[13px] font-semibold ${tone.fg}`}>{value}</span>
    </div>
  );
}

export default function SynthesisCard({ analysis, ticker, aiFallback }) {
  // Safe parsing — never crash if a field is missing on a new ticker.
  const qa = analysis?.quantitative_analysis || {};
  const ai = analysis?.ai_synthesis || {};
  const sentiment = qa.market_sentiment || "—";
  const risk = ai.risk_level || "—";
  const confluence = qa.technical_confluence || "";
  const sTone = sentimentTone(sentiment);
  const rTone = riskTone(risk);
  const tTone = trendTone(confluence);
  const diverges = ai.divergence_detected;

  return (
    <section className="glow-ring mt-5 rounded-3xl glass-2 p-7 sm:p-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

      {/* header */}
      <div className="flex items-center gap-3 relative">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shrink-0">
          <Sparkles size={17} className="text-white" />
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase grad-text font-medium">
            Synthesis Engine {ticker ? `· ${ticker}` : ""}
          </div>
          <p className="text-[13px] text-[var(--color-muted)]">Quantitative positioning vs. real-world catalysts.</p>
        </div>
      </div>

      {/* metric badges */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 relative">
        <Badge tone={sTone} icon={Activity} label="Sentiment" value={sentiment} />
        <Badge tone={rTone} icon={AlertTriangle} label="Risk" value={risk} />
        {confluence && (
          <Badge tone={tTone} icon={TrendingUp} label="Technical" value={confluence.replace(/Trend:\s*/i, "").replace(/RSI:\s*/i, "")} />
        )}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${diverges ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/5 text-[var(--color-muted)]"}`}>
          {diverges ? <Target size={14} /> : <ShieldCheck size={14} />}
          <span className="text-[12px] font-semibold">{diverges ? "Divergence Detected" : "Math & News Aligned"}</span>
        </div>
      </div>

      {aiFallback && (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 relative">
          <Info size={14} /> AI engine momentarily unavailable — showing the quantitative read.
        </div>
      )}

      {/* quantitative insight */}
      <div className="mt-6 relative">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Quantitative insight</p>
        <p className="text-[15.5px] leading-relaxed text-[var(--color-ink)]">{qa.headline_insight || "—"}</p>
      </div>

      {/* trading thesis */}
      <div className="mt-5 relative">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Synthesis thesis</p>
        <p className="text-[16px] leading-relaxed font-medium text-[var(--color-ink)]">{ai.trading_thesis || "—"}</p>
      </div>

      {/* elevated strategy sub-panel */}
      <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.04] p-5 relative">
        <div className="flex items-center gap-2 mb-2">
          <Target size={15} className="text-cyan-300" />
          <span className="text-[10px] uppercase tracking-widest text-cyan-300/80">Actionable edge · suggested structure</span>
        </div>
        <p className="text-[19px] font-semibold text-[var(--color-ink)]">{ai.suggested_strategy || "—"}</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-slate-300">{ai.strategy_rationale || "—"}</p>
      </div>

      <p className="mt-5 text-[11px] text-[var(--color-muted)] italic relative">
        Quantitative analysis for informational purposes only · not financial advice.
      </p>
    </section>
  );
}
