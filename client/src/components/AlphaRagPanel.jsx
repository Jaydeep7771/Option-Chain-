import { Radio, ArrowUpRight } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (isNaN(mins)) return "";
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function AlphaRagPanel({ news = [] }) {
  return (
    <section className="term rounded-lg overflow-hidden h-full">
      {/* module header strip */}
      <div className="term-head flex items-center justify-between px-4 h-9">
        <div className="flex items-center gap-2 text-[10.5px] mono tracking-[0.16em] uppercase text-[var(--color-muted)]">
          <Radio size={13} className="text-[var(--color-violet)]" /> AlphaRAG <span className="text-white/20">/</span> the real world
        </div>
        <span className="text-[9.5px] mono text-[var(--color-muted)] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-sm border hairline">
          {news.length} catalysts
        </span>
      </div>

      <div className="p-4">
        <div className="[column-count:1] sm:[column-count:2] [column-gap:0.5rem]">
          {news.length === 0 && <p className="text-sm text-[var(--color-muted)] mono">No catalysts retrieved yet.</p>}
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="group mb-2 block break-inside-avoid rounded-md border hairline bg-white/[.015] p-3 hover:border-violet-400/50 hover:bg-white/[.05] transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[12.5px] font-medium leading-snug">{item.title}</h3>
                <ArrowUpRight size={14} className="shrink-0 mt-0.5 text-[var(--color-muted)] group-hover:text-[var(--color-violet)] transition" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[9.5px] mono text-[var(--color-muted)] uppercase tracking-wide">
                <span className="px-1.5 py-0.5 rounded-sm bg-white/5 truncate max-w-[60%]">{item.source}</span>
                {timeAgo(item.publishedAt) && <span className="text-white/40">· {timeAgo(item.publishedAt)}</span>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
