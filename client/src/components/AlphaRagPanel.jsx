import { Radio, ArrowUpRight } from "lucide-react";

export default function AlphaRagPanel({ news = [] }) {
  return (
    <section className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
      <div className="flex items-center gap-2 text-[var(--color-muted)] text-xs tracking-widest uppercase">
        <Radio size={14} className="text-[var(--color-accent)]" />
        AlphaRAG · The Real World
      </div>

      {/* Pinterest-style masonry via CSS columns */}
      <div className="mt-5 [column-count:1] sm:[column-count:2] [column-gap:0.75rem]">
        {news.length === 0 && (
          <p className="text-sm text-[var(--color-muted)]">No catalysts retrieved yet.</p>
        )}
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="group mb-3 block break-inside-avoid rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-[var(--color-accent)]/60 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
              <ArrowUpRight size={15} className="shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition" />
            </div>
            {item.snippet && (
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-4">
                {item.snippet}
              </p>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]/70">
              {item.source}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
