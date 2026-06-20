import { Loader } from "lucide-react";

export default function LoadingSkeleton() {
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <div key={c} className="term rounded-lg overflow-hidden">
            <div className="term-head h-9 flex items-center px-4">
              <div className="skeleton h-2.5 w-40 rounded-sm" />
            </div>
            <div className="p-5">
              <div className="skeleton h-8 w-40 rounded" />
              <div className="skeleton mt-5 h-2.5 w-full rounded-full" />
              <div className="mt-6 space-y-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skeleton h-3 rounded-sm" style={{ width: `${50 + ((i * 37) % 45)}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 glow-ring term rounded-xl overflow-hidden">
        <div className="term-head h-9 flex items-center px-4">
          <div className="skeleton h-2.5 w-44 rounded-sm" />
        </div>
        <div className="p-8 flex items-center justify-center gap-3 text-[var(--color-muted)] mono text-[13px]">
          <Loader size={16} className="animate-spin text-[var(--color-violet)]" />
          <span>Synthesizing market math &amp; real-world catalysts<span className="cursor-blink">_</span></span>
        </div>
      </div>
    </div>
  );
}
