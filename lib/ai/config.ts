import "server-only";

export type AIConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

let cached: AIConfig | null = null;
let cachedVision: AIConfig | null = null;

function required(
  name: "OPENAI_API_KEY" | "OPENAI_MODEL" | "OPENAI_BASE_URL" | "OPENAI_VISION_MODEL"
): string {
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

// Vision analysis is configured independently of text/protocol generation
// (OPENAI_VISION_MODEL vs OPENAI_MODEL) so the two can be tuned and costed
// separately, while sharing the same OpenAI account (API key + base URL).
export function getVisionAIConfig(): AIConfig {
  if (cachedVision) return cachedVision;

  const apiKey = required("OPENAI_API_KEY");
  const model = required("OPENAI_VISION_MODEL");
  const baseUrl = required("OPENAI_BASE_URL").replace(/\/$/, "");

  cachedVision = {
    apiKey,
    model,
    baseUrl,
  };

  return cachedVision;
}
