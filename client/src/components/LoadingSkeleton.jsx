import { Loader } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <div key={c} className="rounded-2xl glass p-6">
            <div className="skeleton h-3 w-44 rounded" />
            <div className="skeleton mt-6 h-8 w-40 rounded" />
            <div className="skeleton mt-6 h-2.5 w-full rounded-full" />
            <div className="mt-6 space-y-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton h-3 rounded" style={{ width: `${50 + ((i * 37) % 45)}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 glow-ring rounded-3xl glass-2 p-8">
        <div className="flex items-center justify-center gap-3 text-[var(--color-muted)]">
          <Loader size={16} className="animate-spin text-[var(--color-violet)]" />
          <span className="text-sm">Synthesizing Market Math &amp; Real-World Catalysts…</span>
        </div>
      </div>
    </div>
  );
}
