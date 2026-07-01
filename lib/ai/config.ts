import "server-only";

import { getServerEnv } from "@/lib/server/env";

export type AIConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

let cached: AIConfig | null = null;

function required(name: "OPENAI_MODEL" | "OPENAI_BASE_URL"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[ai-config] Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getAIConfig(): AIConfig {
  if (cached) return cached;

  const serverEnv = getServerEnv();
  const model = required("OPENAI_MODEL");
  const baseUrl = required("OPENAI_BASE_URL").replace(/\/$/, "");

  cached = {
    apiKey: serverEnv.OPENAI_API_KEY,
    model,
    baseUrl,
  };

  return cached;
}
