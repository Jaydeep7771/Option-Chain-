// Vercel serverless entry point — wraps the Express app as a function handler.
import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "../server/routes/api.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Synapse AI server is running 🚀" });
});

app.use("/api", apiRoutes);

export default app;
