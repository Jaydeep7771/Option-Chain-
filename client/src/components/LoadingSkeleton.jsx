import { Loader } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((c) => (
          <div key={c} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="skeleton h-3 w-40 rounded" />
            <div className="skeleton mt-6 h-3 w-full rounded" />
            <div className="skeleton mt-3 h-3 w-5/6 rounded" />
            <div className="skeleton mt-3 h-3 w-2/3 rounded" />
            <div className="skeleton mt-8 h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-6 synapse-glow rounded-3xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-8">
        <div className="flex items-center justify-center gap-3 text-[var(--color-muted)]">
          <Loader size={16} className="animate-spin text-[var(--color-accent)]" />
          <span className="text-sm">Synthesizing Market Math &amp; Real-World Catalysts…</span>
        </div>
      </div>
    </div>
  );
}
