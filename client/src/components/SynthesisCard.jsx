import { Sparkles } from "lucide-react";

export default function SynthesisCard({ thesis, ticker }) {
  return (
    <section className="synapse-glow mt-6 rounded-3xl border border-[var(--color-accent)]/40 bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] p-8">
      <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[var(--color-accent)]">
        <Sparkles size={15} />
        Synthesis Engine {ticker ? `· ${ticker}` : ""}
      </div>
      <p className="mt-2 text-[var(--color-muted)] text-sm">
        The edge lives where the math and the news disagree.
      </p>
      <div className="mt-5 whitespace-pre-wrap leading-relaxed text-[15px] text-[var(--color-ink)]">
        {thesis}
      </div>
    </section>
  );
}
