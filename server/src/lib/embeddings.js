// Turns text into a 768-number vector ("embedding") using Google's
// gemini-embedding-001 model (capped to 768 dims so it fits the pgvector
// index). Two pieces of text with similar MEANING get similar vectors —
// that's what powers semantic search in AlphaRAG.
import { GoogleGenerativeAI } from "@google/generative-ai";

const DIMS = 768;
let model = null;
function getModel() {
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  }
  return model;
}

export function canEmbed() {
  const k = process.env.GEMINI_API_KEY || "";
  return Boolean(k && !k.includes("your_"));
}

// taskType: "RETRIEVAL_DOCUMENT" when storing, "RETRIEVAL_QUERY" when searching.
export async function embedText(text, taskType = "RETRIEVAL_DOCUMENT") {
  if (!canEmbed() || !text) return null;
  try {
    const res = await getModel().embedContent({
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: DIMS,
    });
    return res.embedding.values; // length 768
  } catch (err) {
    console.warn("Embedding failed:", err.message);
    return null;
  }
}
