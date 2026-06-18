// Supabase client — our primary database + pgvector store for AlphaRAG.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_KEY || "";

export function isSupabaseConfigured() {
  return Boolean(url && key && !url.includes("your_") && !key.includes("your_"));
}

// Null when not configured, so callers can gracefully fall back.
export const supabase = isSupabaseConfigured() ? createClient(url, key) : null;
