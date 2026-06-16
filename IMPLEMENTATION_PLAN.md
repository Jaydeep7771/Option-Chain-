# Synapse AI — Implementation Plan

A FinTech app for a 48-hour hackathon.

---

## 1. The pitch (one sentence)
**Synapse AI is a translation & synthesis engine for options traders: it reads the options-chain math, reads the real-world news, and uses AI to spot where the two disagree — that gap is the trading edge ("Alpha").**

It does **not** execute trades and does **not** show cluttered candlestick charts or raw data grids. It outputs one clean, human-readable trading *thesis*.

## 2. Tech stack (all free)
| Layer | Tool | Why |
|---|---|---|
| Frontend | React + Vite | Fast, minimalist UI — the clean "thesis card" |
| Backend | Node.js + Express | Runs the three data pipelines; keeps API keys secret |
| AI | Google Gemini | Does the synthesis/divergence reasoning |
| Database / Vectors | Supabase (Postgres + pgvector) | Stores news vectors + query history |

## 3. The three pipelines (this IS the product)

```
                ┌──────────────────────────────────────┐
  User query ──▶│            SYNTHESIS LAYER            │──▶ Clean thesis
                │   "Compare these two realities"       │     (Gemini)
                └──────────────────────────────────────┘
                      ▲                        ▲
        REALITY A: THE MATH          REALITY B: THE REAL WORLD
        ┌──────────────────┐         ┌──────────────────────┐
        │   GreekSpeak     │         │      AlphaRAG        │
        │  options-chain → │         │  RSS news → vectors  │
        │  PCR, Max Pain → │         │  → relevant context  │
        │  sentiment       │         │                      │
        └──────────────────┘         └──────────────────────┘
```

1. **GreekSpeak (the math).** Pull the options chain, compute Put-Call Ratio + Max Pain, translate into a one-line sentiment ("traders are betting NIFTY drops below 22,500").
2. **AlphaRAG (the real world).** Continuously scrape financial-news RSS, store as searchable context, retrieve what's relevant to the query ("RBI just paused rate hikes").
3. **Synthesis (the alpha).** Hand both realities to Gemini with one instruction: *compare them and flag the divergence.* Output a hedged, plain-English thesis.

## 4. Roadmap (the 48 hours)

### ✅ Phase 0 — Scaffold (DONE)
Folders, `.env`, and a **runnable skeleton of all three pipelines** (see folder map below). Mock option chain + keyword news retrieval means it runs end-to-end *today*, even before keys are added.

### Phase 1 — Run it locally (~45 min)
- `npm install` in `server/` and `client/`, start both, confirm `/api/health` is ok and `/api/sentiment` returns numbers.

### Phase 2 — Backend data controllers (the core build, ~5–6 hrs)
This is where most of the work is — three controllers feeding one Gemini call:
- **GreekSpeak** → upgrade `lib/mockOptionChain.js` toward more realistic data; verify PCR/Max Pain math.
- **AlphaRAG** → confirm RSS feeds pull cleanly; tune which feeds.
- **Synthesis** → add your Gemini key, refine the divergence prompt until the thesis reads sharp.
- **Demo milestone:** type a question → get a thesis that *names* the divergence.

### Phase 3 — Real semantic search (~3 hrs, optional but impressive)
- Swap AlphaRAG's keyword scoring for **Gemini embeddings + Supabase pgvector** so retrieval is semantic, not just word-matching. Store query history too.

### Phase 4 — Polish for judges (~3 hrs)
- Refine the thesis card UI, add the sentiment chips, a logo, loading state, and a tight 2-minute demo script.

## 5. The "must-have" demo (what wins)
Judge types *"What's the setup on Nifty?"* → sees the math sentiment, the news context, and a clear **"Divergence detected: math is bearish but the RBI pause is bullish → consider a Bull Call Spread."** If only one thing works, make it that synthesis flow (Phase 2).

## 6. Risks & cut lines
- **No live market feed?** We ship on the **mock option chain** — the math is identical, judges won't care, and it never rate-limits mid-demo.
- **RSS feed down?** AlphaRAG falls back to latest headlines so the AI always has context.
- **Gemini key not set?** The app still runs and returns the math + news; the thesis field just says "add your key."
- **Cut line:** drop Phase 3 (vectors) before Phase 2. Semantic search is a nice-to-have; the divergence thesis is the product.
- **Compliance:** every thesis ends with "This is not financial advice."

## 7. Folder map (current — all of this exists now)
```
Option Trading AI/
├── client/                          # React + Vite frontend
│   ├── src/{App.jsx, main.jsx, index.css}
│   ├── index.html, vite.config.js, package.json
├── server/                          # Node + Express backend
│   ├── src/
│   │   ├── index.js                 # server entry; wires routes + worker
│   │   ├── controllers/
│   │   │   ├── greekspeak.js        # Pipeline 1: PCR + Max Pain → sentiment
│   │   │   ├── alpharag.js          # Pipeline 2: RSS scrape + retrieve
│   │   │   └── synthesis.js         # Pipeline 3: combine → Gemini → thesis
│   │   ├── lib/mockOptionChain.js   # fake-but-realistic Nifty chain
│   │   └── workers/newsWorker.js    # refreshes news every 15 min
│   ├── routes/api.js                # /api/sentiment, /api/news, /api/ask
│   ├── .env                         # ← your 3 secret keys
│   ├── .env.example, .gitignore, package.json
├── IMPLEMENTATION_PLAN.md           # this file
└── README.md
```

## 8. API endpoints (already built)
| Method | Route | What it returns |
|---|---|---|
| GET | `/api/health` | server status + which keys are loaded |
| GET | `/api/sentiment` | GreekSpeak math (PCR, Max Pain, bias) |
| GET | `/api/news?q=...` | AlphaRAG retrieved headlines |
| POST | `/api/ask` `{query}` | **the full synthesized thesis** |
