// Background worker: refreshes the news store on a timer so AlphaRAG always
// has fresh context. Called once from index.js at startup.

import cron from "node-cron";
import { refreshNews } from "../controllers/alpharag.js";

export function startNewsWorker() {
  refreshNews(); // run once immediately on boot
  // then every 15 minutes
  cron.schedule("*/15 * * * *", refreshNews);
  console.log("🛰️  News worker scheduled (every 15 min).");
}
