import "server-only";

export type AIConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

let cached: AIConfig | null = null;

function required(name: "OPENAI_API_KEY" | "OPENAI_MODEL" | "OPENAI_BASE_URL"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[ai-config] Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getAIConfig(): AIConfig {
  if (cached) return cached;

  const apiKey = required("OPENAI_API_KEY");
  const model = required("OPENAI_MODEL");
  const baseUrl = required("OPENAI_BASE_URL").replace(/\/$/, "");

  cached = {
    apiKey,
    model,
    baseUrl,
  };

  return cached;
}
