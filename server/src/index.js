import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "../routes/api.js";
import { startNewsWorker } from "./workers/newsWorker.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check — visit http://localhost:5000/api/health in your browser
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Synapse AI server is running 🚀",
    keysLoaded: {
      gemini: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_")),
      supabaseUrl: Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes("your_")),
      supabaseKey: Boolean(process.env.SUPABASE_KEY && !process.env.SUPABASE_KEY.includes("your_")),
    },
  });
});

// The three pipelines live under /api  (sentiment, news, ask)
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Synapse AI server listening on http://localhost:${PORT}`);
  startNewsWorker();
});
