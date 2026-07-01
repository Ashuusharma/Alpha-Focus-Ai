import "server-only";

import OpenAI from "openai";
import { getAIConfig } from "@/lib/ai/config";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) return client;

  const config = getAIConfig();
  client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return client;
}
