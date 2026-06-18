const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

// ── palette ──────────────────────────────────────────────
const C = {
  bg: "0A0C16",
  card: "141A2B",
  cardHi: "181633",
  border: "2A3350",
  ink: "EAEDF7",
  muted: "9AA3BC",
  faint: "6B7490",
  violet: "A78BFA",
  cyan: "37D6EE",
  blue: "5B8CFF",
  amber: "F6B24A",
  green: "34D399",
  red: "FB7185",
};

const W = 13.33, H = 7.5, MX = 0.7;

// ── icon rasteriser (cached) ─────────────────────────────
const iconCache = {};
async function icon(Comp, hex) {
  const key = Comp.name + hex;
  if (iconCache[key]) return iconCache[key];
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: hex, size: "256" })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + png.toString("base64"));
}
const sh = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 90, opacity: 0.34 });

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: W, height: H });
pres.layout = "WIDE";
pres.author = "Synapse AI";
pres.title = "Synapse AI — Idea Submission";

// helpers --------------------------------------------------
function base(slide, hero = false) {
  slide.background = { path: hero ? "bg-hero.png" : "bg-content.png" };
}
function footer(slide, n) {
  slide.addText("SYNAPSE AI", { x: MX, y: 7.05, w: 3, h: 0.3, fontFace: "Arial", fontSize: 9, color: C.faint, charSpacing: 2, margin: 0 });
  slide.addText("Level 1 · Idea Submission · 2 July 2026", { x: W - 5.7, y: 7.05, w: 4.5, h: 0.3, fontFace: "Arial", fontSize: 9, color: C.faint, align: "right", margin: 0 });
  slide.addText(String(n), { x: W - 1.05, y: 7.05, w: 0.35, h: 0.3, fontFace: "Arial", fontSize: 9, color: C.faint, align: "right", margin: 0 });
}
function label(slide, txt) {
  slide.addText(txt.toUpperCase(), { x: MX, y: 0.5, w: 11, h: 0.35, fontFace: "Arial", fontSize: 13, bold: true, color: C.cyan, charSpacing: 3, margin: 0 });
}
function title(slide, txt, opts = {}) {
  slide.addText(txt, { x: MX, y: 0.92, w: opts.w || 11.9, h: opts.h || 1.0, fontFace: "Arial", fontSize: opts.size || 33, bold: true, color: C.ink, margin: 0, lineSpacingMultiple: 1.02 });
}
async function iconChip(slide, Comp, accent, x, y, d = 0.62) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: d, h: d, rectRadius: 0.12, fill: { color: accent, transparency: 84 }, line: { color: accent, width: 1, transparency: 40 } });
  slide.addImage({ data: await icon(Comp, "#" + accent), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52 });
}
function card(slide, x, y, w, h, fill = C.card, border = C.border) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: border, width: 1 }, shadow: sh() });
}

(async () => {
  // ===== Slide 1 — Title =====
  let s = pres.addSlide(); base(s, true);
  await iconChip(s, fa.FaBolt, C.violet, MX, 0.85, 0.66);
  s.addText("SYNAPSE AI", { x: MX + 0.85, y: 0.88, w: 6, h: 0.55, fontFace: "Arial", fontSize: 21, bold: true, color: C.ink, charSpacing: 2, valign: "middle", margin: 0 });

  s.addText("AI OPTIONS-TRADING THESIS ENGINE", { x: MX, y: 2.55, w: 11, h: 0.4, fontFace: "Arial", fontSize: 14, bold: true, color: C.cyan, charSpacing: 3, margin: 0 });
  s.addText([
    { text: "Where the math meets", options: { breakLine: true } },
    { text: "the moment.", options: { color: C.violet } },
  ], { x: MX, y: 3.0, w: 11.5, h: 1.8, fontFace: "Arial", fontSize: 50, bold: true, color: C.ink, lineSpacingMultiple: 1.0, margin: 0 });
  s.addText("Turning intimidating options data and live market news into one clear, plain-English trading thesis — powered by AI.", { x: MX, y: 4.95, w: 9.6, h: 0.8, fontFace: "Calibri", fontSize: 17, color: C.muted, lineSpacingMultiple: 1.1, margin: 0 });

  s.addText([
    { text: "[Your Team Name]", options: { bold: true, color: C.ink, fontSize: 15, breakLine: true } },
    { text: "[Hackathon Name]  ·  Level 1 — Idea Submission", options: { color: C.muted, fontSize: 12 } },
  ], { x: MX, y: 6.25, w: 8, h: 0.7, fontFace: "Calibri", margin: 0, lineSpacingMultiple: 1.2 });
  s.addText([
    { text: "Submission deadline", options: { color: C.faint, fontSize: 11, breakLine: true } },
    { text: "2 July 2026", options: { bold: true, color: C.cyan, fontSize: 15 } },
  ], { x: W - 3.7, y: 6.25, w: 3, h: 0.7, fontFace: "Calibri", align: "right", margin: 0, lineSpacingMultiple: 1.2 });

  // ===== Slide 2 — The Problem =====
  s = pres.addSlide(); base(s);
  label(s, "The Problem");
  title(s, "Retail traders are drowning in data — and starving for clarity.", { w: 11.9, size: 30 });

  // stat callout card
  card(s, MX, 2.35, 4.1, 4.0, C.card);
  s.addText("~9 in 10", { x: MX + 0.1, y: 2.7, w: 3.9, h: 1.2, fontFace: "Arial", fontSize: 60, bold: true, color: C.red, align: "center", margin: 0 });
  s.addText("retail F&O traders in India lose money", { x: MX + 0.35, y: 3.95, w: 3.4, h: 0.9, fontFace: "Calibri", fontSize: 16, color: C.ink, align: "center", lineSpacingMultiple: 1.1, margin: 0 });
  s.addText("Source: SEBI study on individual traders in equity derivatives, 2024", { x: MX + 0.3, y: 5.55, w: 3.5, h: 0.6, fontFace: "Calibri", fontSize: 10, italic: true, color: C.faint, align: "center", margin: 0 });

  const pains = [
    [fa.FaLayerGroup, C.blue, "An intimidating wall of numbers", "Option chains bury people in Greeks, open interest and implied volatility — unreadable to most."],
    [fa.FaExchangeAlt, C.violet, "Two worlds that never talk", "The options math says one thing; the news says another. Nobody connects the two."],
    [fa.FaExclamationTriangle, C.amber, "Tools show data, not decisions", "Dashboards dump charts and grids, but never answer the only question that matters: 'so what?'"],
  ];
  let py = 2.45;
  for (const [Ic, col, head, body] of pains) {
    await iconChip(s, Ic, col, 5.3, py, 0.6);
    s.addText(head, { x: 6.1, y: py - 0.04, w: 6.9, h: 0.45, fontFace: "Arial", fontSize: 17, bold: true, color: C.ink, margin: 0 });
    s.addText(body, { x: 6.1, y: py + 0.42, w: 6.95, h: 0.8, fontFace: "Calibri", fontSize: 13.5, color: C.muted, lineSpacingMultiple: 1.05, margin: 0 });
    py += 1.32;
  }
  footer(s, 2);

  // ===== Slide 3 — Problem Statement =====
  s = pres.addSlide(); base(s);
  label(s, "Problem Statement");
  card(s, MX, 2.0, 11.93, 3.7, C.card);
  s.addImage({ data: await icon(fa.FaQuoteLeft, "#" + C.violet), x: MX + 0.55, y: 2.45, w: 0.7, h: 0.7 });
  s.addText([
    { text: "Retail traders have access to more market data than ever — yet less ", options: {} },
    { text: "clarity", options: { color: C.cyan, bold: true } },
    { text: " than ever.\n\nThey cannot reconcile what the ", options: {} },
    { text: "options math", options: { color: C.blue, bold: true } },
    { text: " implies with what real-world ", options: {} },
    { text: "news", options: { color: C.violet, bold: true } },
    { text: " means — so they trade blind. No tool translates both into a single, human decision.", options: {} },
  ], { x: MX + 0.55, y: 3.25, w: 10.8, h: 2.2, fontFace: "Calibri", fontSize: 23, color: C.ink, lineSpacingMultiple: 1.15, margin: 0 });
  s.addText("Synapse AI exists to close that gap.", { x: MX, y: 6.0, w: 11.9, h: 0.5, fontFace: "Arial", fontSize: 17, bold: true, italic: true, color: C.muted, align: "center", margin: 0 });
  footer(s, 3);

  // ===== Slide 4 — The Solution =====
  s = pres.addSlide(); base(s);
  label(s, "Our Solution");
  title(s, "Synapse AI — a translation & synthesis engine.", { size: 31 });
  s.addText("We read two worlds that never talk to each other — the live options math and the real-world news — and use AI to find where they disagree. That gap is the edge. The output is one calm, plain-English thesis anyone can act on.", { x: MX, y: 2.05, w: 5.7, h: 2.6, fontFace: "Calibri", fontSize: 16.5, color: C.muted, lineSpacingMultiple: 1.25, margin: 0 });

  s.addText("NO charts to decode. NO jargon. NO data overload.", { x: MX, y: 4.75, w: 5.7, h: 0.9, fontFace: "Arial", fontSize: 15, bold: true, color: C.cyan, lineSpacingMultiple: 1.2, margin: 0 });

  // example thesis card (mirrors the real product output)
  card(s, 6.95, 2.0, 5.68, 4.55, C.card);
  await iconChip(s, fa.FaBolt, C.violet, 7.2, 2.25, 0.5);
  s.addText("SYNTHESIS · NIFTY", { x: 7.8, y: 2.27, w: 4.5, h: 0.4, fontFace: "Arial", fontSize: 12, bold: true, color: C.violet, charSpacing: 1, valign: "middle", margin: 0 });
  const ex = [
    ["The mood", "Traders lean bullish on NIFTY, near 24,000.", C.cyan],
    ["The news", "RBI unexpectedly paused rate hikes — supportive.", C.cyan],
    ["The twist", "Math and news AGREE — momentum has room to run.", C.cyan],
    ["Bottom line", "A cautious bet that the price drifts higher.", C.cyan],
  ];
  let ey = 2.95;
  for (const [lab, txt, col] of ex) {
    s.addText([
      { text: lab + "  ", options: { bold: true, color: col } },
      { text: txt, options: { color: C.ink } },
    ], { x: 7.2, y: ey, w: 5.2, h: 0.7, fontFace: "Calibri", fontSize: 13.5, lineSpacingMultiple: 1.05, margin: 0 });
    ey += 0.82;
  }
  s.addText("Just information, not financial advice.", { x: 7.2, y: 6.18, w: 5.2, h: 0.3, fontFace: "Calibri", fontSize: 10, italic: true, color: C.faint, margin: 0 });
  footer(s, 4);

  // ===== Slide 5 — How it works (3 engines) =====
  s = pres.addSlide(); base(s);
  label(s, "How It Works");
  title(s, "Three engines, one clear answer.");
  const engines = [
    [fa.FaChartLine, C.blue, "GreekSpeak", "The Math", "Reads the live options chain — Put-Call Ratio, Max Pain — and turns it into a simple bullish or bearish read."],
    [fa.FaGlobeAsia, C.violet, "AlphaRAG", "The Real World", "Continuously reads live market news and retrieves what's relevant using an AI vector memory (RAG)."],
    [fa.FaBolt, C.cyan, "Synthesis", "The Alpha", "Gemini AI compares both realities and writes one plain-English thesis — where they agree, where they clash."],
  ];
  let cx = MX;
  const cw = 3.84, gap = 0.205;
  for (const [Ic, col, name, sub, body] of engines) {
    card(s, cx, 2.15, cw, 4.25, C.card);
    await iconChip(s, Ic, col, cx + 0.4, 2.55, 0.78);
    s.addText(name, { x: cx + 0.4, y: 3.55, w: cw - 0.8, h: 0.45, fontFace: "Arial", fontSize: 21, bold: true, color: C.ink, margin: 0 });
    s.addText(sub.toUpperCase(), { x: cx + 0.4, y: 4.02, w: cw - 0.8, h: 0.35, fontFace: "Arial", fontSize: 12, bold: true, color: col, charSpacing: 2, margin: 0 });
    s.addText(body, { x: cx + 0.4, y: 4.5, w: cw - 0.78, h: 1.7, fontFace: "Calibri", fontSize: 14, color: C.muted, lineSpacingMultiple: 1.2, margin: 0 });
    cx += cw + gap;
  }
  footer(s, 5);

  // ===== Slide 6 — The core insight (divergence) =====
  s = pres.addSlide(); base(s);
  label(s, "The Core Insight");
  title(s, "The edge lives where the math and the news disagree.", { size: 30 });

  card(s, MX, 2.4, 5.5, 2.5, C.card, C.blue);
  await iconChip(s, fa.FaChartLine, C.blue, MX + 0.35, 2.7, 0.55);
  s.addText("THE MATH", { x: MX + 1.05, y: 2.74, w: 4, h: 0.45, fontFace: "Arial", fontSize: 15, bold: true, color: C.blue, charSpacing: 2, valign: "middle", margin: 0 });
  s.addText("Options positioning leans bearish — traders are betting NIFTY drops this expiry.", { x: MX + 0.35, y: 3.5, w: 4.85, h: 1.2, fontFace: "Calibri", fontSize: 16, color: C.ink, lineSpacingMultiple: 1.15, margin: 0 });

  card(s, 7.13, 2.4, 5.5, 2.5, C.card, C.amber);
  await iconChip(s, fa.FaGlobeAsia, C.amber, 7.48, 2.7, 0.55);
  s.addText("THE NEWS", { x: 8.18, y: 2.74, w: 4, h: 0.45, fontFace: "Arial", fontSize: 15, bold: true, color: C.amber, charSpacing: 2, valign: "middle", margin: 0 });
  s.addText("The RBI just paused rate hikes unexpectedly — a strongly bullish real-world signal.", { x: 7.48, y: 3.5, w: 4.85, h: 1.2, fontFace: "Calibri", fontSize: 16, color: C.ink, lineSpacingMultiple: 1.15, margin: 0 });

  card(s, MX, 5.2, 11.93, 1.55, C.cardHi, C.violet);
  await iconChip(s, fa.FaBullseye, C.violet, MX + 0.45, 5.58, 0.78);
  s.addText([
    { text: "Divergence detected. ", options: { bold: true, color: C.violet } },
    { text: "The two realities clash — the market may be mispriced. ", options: { color: C.ink } },
    { text: "That gap is the opportunity Synapse surfaces.", options: { color: C.ink } },
  ], { x: MX + 1.5, y: 5.42, w: 10.2, h: 1.1, fontFace: "Calibri", fontSize: 17, color: C.ink, valign: "middle", lineSpacingMultiple: 1.1, margin: 0 });
  footer(s, 6);

  // ===== Slide 7 — Why we're different =====
  s = pres.addSlide(); base(s);
  label(s, "Why Synapse Is Different");
  title(s, "Everyone shows data. We deliver a decision.");

  card(s, MX, 2.25, 5.7, 4.2, C.card, C.border);
  s.addText("TYPICAL TRADING TOOLS", { x: MX + 0.45, y: 2.55, w: 5, h: 0.4, fontFace: "Arial", fontSize: 14, bold: true, color: C.muted, charSpacing: 1, margin: 0 });
  const cons = ["Walls of numbers & Greeks", "Cluttered charts and data grids", "You decode it yourself", "Math and news kept separate", "Built for experts only"];
  let cy = 3.2;
  for (const t of cons) {
    s.addImage({ data: await icon(fa.FaTimesCircle, "#" + C.red), x: MX + 0.45, y: cy + 0.02, w: 0.26, h: 0.26 });
    s.addText(t, { x: MX + 0.85, y: cy - 0.05, w: 4.7, h: 0.42, fontFace: "Calibri", fontSize: 14.5, color: C.muted, valign: "middle", margin: 0 });
    cy += 0.62;
  }

  card(s, 6.93, 2.25, 5.7, 4.2, C.cardHi, C.cyan);
  s.addText("SYNAPSE AI", { x: 7.38, y: 2.55, w: 5, h: 0.4, fontFace: "Arial", fontSize: 14, bold: true, color: C.cyan, charSpacing: 1, margin: 0 });
  const pros = ["One plain-English sentence", "Calm, abstract visuals", "AI interprets it for you", "Math + news fused into one view", "Built for everyone"];
  cy = 3.2;
  for (const t of pros) {
    s.addImage({ data: await icon(fa.FaCheckCircle, "#" + C.green), x: 7.38, y: cy + 0.02, w: 0.26, h: 0.26 });
    s.addText(t, { x: 7.78, y: cy - 0.05, w: 4.7, h: 0.42, fontFace: "Calibri", fontSize: 14.5, color: C.ink, valign: "middle", margin: 0 });
    cy += 0.62;
  }
  footer(s, 7);

  // ===== Slide 8 — Architecture & feasibility =====
  s = pres.addSlide(); base(s);
  label(s, "Architecture & Feasibility");
  title(s, "Not just an idea — a working prototype.");

  const stack = [
    [fa.FaLaptopCode, C.cyan, "React UI", "Clean dashboard"],
    [fa.FaServer, C.blue, "Node engine", "Runs the pipelines"],
    [fa.FaDatabase, C.violet, "Live data + RAG", "Upstox · news · pgvector"],
    [fa.FaBrain, C.amber, "Gemini AI", "Writes the thesis"],
  ];
  let sx = MX; const sw = 2.74, sgap = 0.32;
  for (let i = 0; i < stack.length; i++) {
    const [Ic, col, name, sub] = stack[i];
    card(s, sx, 2.35, sw, 2.5, C.card);
    await iconChip(s, Ic, col, sx + sw / 2 - 0.34, 2.7, 0.68);
    s.addText(name, { x: sx + 0.15, y: 3.55, w: sw - 0.3, h: 0.4, fontFace: "Arial", fontSize: 15.5, bold: true, color: C.ink, align: "center", margin: 0 });
    s.addText(sub, { x: sx + 0.15, y: 3.98, w: sw - 0.3, h: 0.6, fontFace: "Calibri", fontSize: 12, color: C.muted, align: "center", lineSpacingMultiple: 1.05, margin: 0 });
    if (i < stack.length - 1) s.addImage({ data: await icon(fa.FaChevronRight, "#" + C.faint), x: sx + sw + sgap / 2 - 0.13, y: 3.45, w: 0.26, h: 0.26 });
    sx += sw + sgap;
  }

  card(s, MX, 5.25, 11.93, 1.45, C.cardHi, C.green);
  await iconChip(s, fa.FaCheckCircle, C.green, MX + 0.45, 5.58, 0.72);
  s.addText([
    { text: "Already functional: ", options: { bold: true, color: C.green } },
    { text: "live exchange options data, an AI vector-search news memory, and a plain-English AI thesis — all working end-to-end today.", options: { color: C.ink } },
  ], { x: MX + 1.45, y: 5.38, w: 10.25, h: 1.1, fontFace: "Calibri", fontSize: 16, valign: "middle", lineSpacingMultiple: 1.1, margin: 0 });
  footer(s, 8);

  // ===== Slide 9 — Impact & timing =====
  s = pres.addSlide(); base(s);
  label(s, "Impact & Timing");
  title(s, "The right product at the right moment.");
  const imp = [
    [fa.FaChartLine, C.cyan, "World's largest", "India's NSE is the world's biggest derivatives exchange by contracts traded — retail F&O is booming."],
    [fa.FaExclamationTriangle, C.red, "A painful gap", "~90% of retail derivatives traders lose money — a desperate, unmet need for clarity and guidance."],
    [fa.FaBrain, C.violet, "AI makes it possible", "Modern AI makes institutional-grade synthesis affordable for every individual trader, right now."],
  ];
  cx = MX;
  for (const [Ic, col, head, body] of imp) {
    card(s, cx, 2.2, 3.84, 3.0, C.card);
    await iconChip(s, Ic, col, cx + 0.4, 2.55, 0.7);
    s.addText(head, { x: cx + 0.4, y: 3.4, w: 3.1, h: 0.45, fontFace: "Arial", fontSize: 17, bold: true, color: C.ink, margin: 0 });
    s.addText(body, { x: cx + 0.4, y: 3.9, w: 3.15, h: 1.2, fontFace: "Calibri", fontSize: 13, color: C.muted, lineSpacingMultiple: 1.18, margin: 0 });
    cx += 3.84 + 0.205;
  }
  s.addText([
    { text: "Our impact:  ", options: { bold: true, color: C.cyan } },
    { text: "we democratise institutional-grade market reasoning — clarity for the everyday trader.", options: { color: C.ink } },
  ], { x: MX, y: 5.5, w: 11.93, h: 0.9, fontFace: "Calibri", fontSize: 17, italic: true, align: "center", valign: "middle", lineSpacingMultiple: 1.1, margin: 0 });
  footer(s, 9);

  // ===== Slide 10 — Roadmap =====
  s = pres.addSlide(); base(s);
  label(s, "Roadmap");
  title(s, "From idea to a personal AI markets analyst.");
  const steps = [
    [C.green, "NOW · LEVEL 1", "Working prototype: live options + news RAG + AI thesis."],
    [C.cyan, "NEXT", "More instruments, expiry selection, accuracy tuning."],
    [C.blue, "THEN", "Divergence alerts, portfolio view, mobile app."],
    [C.violet, "VISION", "A personal AI markets analyst for every retail trader."],
  ];
  let ry = 2.3; const rh = 1.0;
  for (let i = 0; i < steps.length; i++) {
    const [col, head, body] = steps[i];
    s.addShape(pres.shapes.OVAL, { x: MX + 0.05, y: ry, w: 0.5, h: 0.5, fill: { color: col, transparency: 80 }, line: { color: col, width: 1.5 } });
    s.addText(String(i + 1), { x: MX + 0.05, y: ry, w: 0.5, h: 0.5, fontFace: "Arial", fontSize: 18, bold: true, color: col, align: "center", valign: "middle", margin: 0 });
    if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: MX + 0.3, y: ry + 0.5, w: 0, h: rh - 0.5, line: { color: C.border, width: 1.5 } });
    s.addText(head, { x: MX + 0.9, y: ry - 0.02, w: 3.6, h: 0.5, fontFace: "Arial", fontSize: 14, bold: true, color: col, charSpacing: 1, valign: "middle", margin: 0 });
    s.addText(body, { x: 4.7, y: ry - 0.02, w: 8, h: 0.5, fontFace: "Calibri", fontSize: 15.5, color: C.ink, valign: "middle", margin: 0 });
    ry += rh;
  }
  footer(s, 10);

  // ===== Slide 11 — Closing =====
  s = pres.addSlide(); base(s, true);
  await iconChip(s, fa.FaBolt, C.violet, W / 2 - 0.35, 1.85, 0.7);
  s.addText("SYNAPSE AI", { x: 0, y: 2.75, w: W, h: 0.8, fontFace: "Arial", fontSize: 40, bold: true, color: C.ink, align: "center", charSpacing: 2, margin: 0 });
  s.addText("Where the math meets the moment.", { x: 0, y: 3.6, w: W, h: 0.5, fontFace: "Calibri", fontSize: 19, italic: true, color: C.violet, align: "center", margin: 0 });
  s.addText("Clarity for every trader — the math, the news, and the edge between them.", { x: 0, y: 4.2, w: W, h: 0.5, fontFace: "Calibri", fontSize: 14, color: C.muted, align: "center", margin: 0 });
  s.addText([
    { text: "[Your Team Name]   ·   [Member names]", options: { color: C.ink, fontSize: 13, breakLine: true } },
    { text: "[Hackathon Name]   ·   Level 1 Idea Submission   ·   2 July 2026", options: { color: C.faint, fontSize: 11 } },
  ], { x: 0, y: 5.7, w: W, h: 0.8, fontFace: "Calibri", align: "center", lineSpacingMultiple: 1.3, margin: 0 });

  await pres.writeFile({ fileName: "Synapse_AI_Idea_Submission.pptx" });
  console.log("deck written");
})();
