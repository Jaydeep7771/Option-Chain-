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
    <section className="rounded-2xl glass p-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-muted)] text-xs tracking-widest uppercase">
          <Radio size={14} className="text-[var(--color-violet)]" /> AlphaRAG · the real world
        </div>
        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">{news.length} catalysts</span>
      </div>

      <div className="mt-5 [column-count:1] sm:[column-count:2] [column-gap:0.6rem]">
        {news.length === 0 && <p className="text-sm text-[var(--color-muted)]">No catalysts retrieved yet.</p>}
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="group mb-2.5 block break-inside-avoid rounded-xl glass p-3.5 hover:border-violet-400/50 hover:bg-white/[.06] transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[13px] font-medium leading-snug">{item.title}</h3>
              <ArrowUpRight size={14} className="shrink-0 mt-0.5 text-[var(--color-muted)] group-hover:text-[var(--color-violet)] transition" />
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
              <span className="px-1.5 py-0.5 rounded bg-white/5 uppercase tracking-wide truncate max-w-[60%]">{item.source}</span>
              {timeAgo(item.publishedAt) && <span>· {timeAgo(item.publishedAt)}</span>}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
