import { useEffect, useState } from "react";
import { Sparkles, Activity, Radio, Zap, Plug } from "lucide-react";

// Compute IST clock + NSE market session (Mon–Fri, 09:15–15:30 IST).
function useMarketClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const time = ist.toLocaleTimeString("en-GB", { hour12: false });
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const open = day >= 1 && day <= 5 && mins >= 555 && mins <= 930; // 9:15–15:30
  return { time, open };
}

// Maps the live data source to a status pill.
const SOURCE = {
  "live-oi": { label: "LIVE OI", cls: "text-up border-[var(--color-up)]/40 bg-[var(--color-up)]/10", icon: Zap },
  live: { label: "LIVE SPOT", cls: "text-sky-300 border-sky-400/40 bg-sky-400/10", icon: Activity },
  mock: { label: "SIM FEED", cls: "text-amber-300 border-amber-400/40 bg-amber-400/10", icon: Radio },
};

export default function TopBar({ source }) {
  const { time, open } = useMarketClock();
  const [upstox, setUpstox] = useState({ configured: false, connected: false });

  useEffect(() => {
    const load = () => fetch("/api/upstox/status").then((r) => r.json()).then(setUpstox).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const src = SOURCE[source] || SOURCE.mock;
  const SrcIcon = src.icon;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#060810]/80 border-b hairline">
      <div className="mx-auto max-w-[1400px] px-4 h-12 flex items-center gap-4">
        {/* brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="grid place-items-center h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-cyan-400">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight text-[15px] mono">
            SYNAPSE<span className="text-[var(--color-muted)]">//</span><span className="grad-text">AI</span>
          </span>
          <span className="hidden md:inline text-[10px] text-[var(--color-muted)] tracking-[0.2em] uppercase border-l hairline pl-2.5 ml-1">
            Derivatives Intelligence Terminal
          </span>
        </div>

        <div className="flex-1" />

        {/* live data source */}
        <span className={`hidden sm:flex items-center gap-1.5 text-[10.5px] font-medium px-2 py-1 rounded border mono ${src.cls}`}>
          <SrcIcon size={12} /> {src.label}
        </span>

        {/* market session */}
        <div className="hidden sm:flex items-center gap-2 mono text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-[var(--color-up)] live-dot" : "bg-[var(--color-down)]"}`} />
          <span className={open ? "text-up" : "text-[var(--color-muted)]"}>{open ? "MKT OPEN" : "MKT CLOSED"}</span>
          <span className="text-[var(--color-ink)] tabular-nums">{time}</span>
          <span className="text-[var(--color-muted)]">IST</span>
        </div>

        {/* upstox connect / live */}
        {upstox.connected ? (
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium px-2 py-1 rounded border text-up border-[var(--color-up)]/40 bg-[var(--color-up)]/10 mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-up)] live-dot" /> UPSTOX
          </span>
        ) : (
          <a
            href="/api/upstox/login"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded border text-amber-300 border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 transition mono"
            title="Connect Upstox for live option-chain OI (daily login)"
          >
            <Plug size={12} /> CONNECT LIVE
          </a>
        )}
      </div>
    </header>
  );
}
