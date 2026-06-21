// Background worker: refreshes the news store on a timer so AlphaRAG always
// has fresh context. Called once from index.js at startup.

import cron from "node-cron";
import { refreshNews } from "../controllers/alpharag.js";

export function startNewsWorker() {
  refreshNews(); // run once immediately on boot
  // Hourly by default (not every 15 min) to stay under the free embedding quota
  // (gemini-embedding-001 = 1000/day). Override with NEWS_REFRESH_CRON if needed.
  const schedule = process.env.NEWS_REFRESH_CRON || "0 * * * *";
  cron.schedule(schedule, refreshNews);
  console.log(`🛰️  News worker scheduled (cron: ${schedule}).`);
}
