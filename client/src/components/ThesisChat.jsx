import { useState, useRef, useEffect } from "react";
import { MessagesSquare, CornerDownLeft, Sparkles } from "lucide-react";

const STARTERS = [
  "Why this strategy and not a long straddle?",
  "What's the biggest risk in this setup?",
  "What single thing would flip your view?",
  "Explain the thesis like I'm new to options.",
];

export default function ThesisChat({ ticker, context }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, context, messages: next }),
      });
      const j = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: j.answer || "No answer returned." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the AI engine — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="term rounded-xl overflow-hidden mt-4">
      <div className="term-head flex items-center gap-2 px-4 h-9 text-[10.5px] mono uppercase tracking-[0.16em] text-[var(--color-muted)]">
        <MessagesSquare size={13} className="text-cyan-300" /> Ask the analyst <span className="text-white/20">/</span> {ticker}
      </div>

      <div className="p-4">
        {messages.length === 0 && (
          <p className="text-[13px] text-[var(--color-muted)] mb-3">
            Interrogate this thesis — answers are grounded in the exact data above.
          </p>
        )}

        {messages.length > 0 && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed " +
                    (m.role === "user"
                      ? "bg-cyan-500/15 border border-cyan-400/25 text-[var(--color-ink)]"
                      : "border hairline bg-white/[.02] text-[var(--color-ink)]")
                  }
                >
                  {m.role === "assistant" && (
                    <span className="flex items-center gap-1.5 text-[9.5px] mono uppercase tracking-wider text-violet-300/80 mb-1">
                      <Sparkles size={11} /> Synapse
                    </span>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="border hairline bg-white/[.02] rounded-lg px-3.5 py-2.5 text-[14px] text-[var(--color-muted)] mono">
                  thinking<span className="cursor-blink">_</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-2.5 py-1 rounded text-[11px] mono border border-white/10 bg-white/[.03] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-white/20 transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 border hairline bg-white/[.02]"
        >
          <span className="text-[var(--color-up)] mono shrink-0">&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask a follow-up…"
            className="flex-1 bg-transparent outline-none text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)]/50 min-w-0"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1 text-[12px] mono px-2.5 py-1.5 rounded bg-gradient-to-r from-violet-500 to-cyan-500 text-white disabled:opacity-40 transition shrink-0"
          >
            <CornerDownLeft size={13} />
          </button>
        </form>
      </div>
    </section>
  );
}
