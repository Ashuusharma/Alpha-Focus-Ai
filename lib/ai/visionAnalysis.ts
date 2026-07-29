import "server-only";
import { getVisionAIConfig } from "@/lib/ai/config";
import { VisionAnalysisResult, visionAnalysisResultSchema } from "@/types/visionAnalysis";

// Bump this whenever buildSystemPrompt/buildUserPrompt change meaningfully,
// so logged metadata can be correlated to the exact prompt that produced it.
export const VISION_PROMPT_VERSION = "vision_prompt.v1.0.0";

export type VisionTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type VisionAnalysisMetadata = {
  promptVersion: string;
  model: string;
  latencyMs: number;
  retryCount: number;
  timeoutReason: string | null;
  tokenUsage: VisionTokenUsage | null;
};

export type VisionAnalysisOutcome = {
  result: VisionAnalysisResult;
  metadata: VisionAnalysisMetadata;
};

export type VisionAnalysisErrorDetails = {
  promptVersion: string;
  model: string;
  retryCount: number;
  latencyMs: number;
  timeoutReason: string | null;
  lastHttpStatus: number | null;
  lastErrorMessage: string;
};

// Thrown when analyzePhotosWithVision exhausts all retries. Carries the same
// telemetry shape as the success metadata, plus the last HTTP status (if any
// attempt got as far as receiving a response) and the last error message, so
// a caller can log or make fallback decisions without re-deriving this state.
export class VisionAnalysisError extends Error {
  readonly promptVersion: string;
  readonly model: string;
  readonly retryCount: number;
  readonly latencyMs: number;
  readonly timeoutReason: string | null;
  readonly lastHttpStatus: number | null;

  constructor(details: VisionAnalysisErrorDetails) {
    super(details.lastErrorMessage);
    this.name = "VisionAnalysisError";
    this.promptVersion = details.promptVersion;
    this.model = details.model;
    this.retryCount = details.retryCount;
    this.latencyMs = details.latencyMs;
    this.timeoutReason = details.timeoutReason;
    this.lastHttpStatus = details.lastHttpStatus;
  }
}

const VISION_TIMEOUT_MS = Number(process.env.VISION_AI_TIMEOUT_MS || 25_000);
const VISION_MAX_RETRIES = Number(process.env.VISION_AI_MAX_RETRIES || 1);
const VISION_MAX_TOKENS = Number(process.env.VISION_AI_MAX_TOKENS || 1200);
const VISION_MAX_IMAGES = 3;

function buildSystemPrompt(): string {
  return [
    "You are a careful visual-observation assistant inside a men's grooming self-analysis app used mainly by Indian users.",
    "You are not a medical device and must never provide a diagnosis. Describe only what is visibly present in the supplied photo(s).",
    "If a photo is blurry, poorly lit, doesn't clearly show the relevant area, or you are otherwise uncertain, lower your confidence scores and say so in the summary instead of guessing.",
    "Never invent findings that aren't visually supported. Returning zero issues is correct and expected when nothing notable is visible.",
    "Output strict JSON only, matching this shape exactly, with no extra keys and no prose outside the JSON:",
    '{"issues":[{"name":string,"confidence":number 0-100,"impact":"minor"|"moderate"|"significant","description":string,"affectedArea":string}],"hotspots":[{"x":number 0-100,"y":number 0-100,"label":string,"severity":"low"|"medium"|"high"}],"confidence":number 0-100,"summary":string}',
    "x/y are percentages of image width/height locating each hotspot. Keep issues under 6 and hotspots under 8.",
  ].join(" ");
}

function buildUserPrompt(analyzerType: string, categories: string[], answers?: Record<string, string>): string {
  const categoryLabel = categories.length ? categories.join(", ") : analyzerType;
  const answerLines =
    answers && Object.keys(answers).length
      ? Object.entries(answers).slice(0, 20).map(([key, value]) => `${key}: ${value}`).join("; ")
      : "none provided";

  return [
    `Analyzer focus: ${categoryLabel} (type: ${analyzerType}).`,
    "The user is based in India, so factor in common climate-linked causes (heat, humidity, pollution, sun exposure) when they're relevant to what you actually observe.",
    `Questionnaire context, for calibration only — do not restate it as a finding if the photo disagrees: ${answerLines}.`,
    "Examine the attached photo(s) and return only the JSON object described in the system message.",
  ].join(" ");
}

type CompletionAttempt =
  | { ok: true; response: Response }
  | { ok: false; timedOut: boolean; error: unknown };

async function callVisionCompletion(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
  images: string[];
  analyzerType: string;
  categories: string[];
  answers?: Record<string, string>;
  timeoutMs: number;
  maxTokens: number;
}): Promise<CompletionAttempt> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, input.timeoutMs);

  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.2,
        max_completion_tokens: input.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: [
              { type: "text", text: buildUserPrompt(input.analyzerType, input.categories, input.answers) },
              ...input.images.slice(0, VISION_MAX_IMAGES).map((url) => ({
                type: "image_url" as const,
                image_url: { url, detail: "high" as const },
              })),
            ],
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    return { ok: true, response };
  } catch (error) {
    return { ok: false, timedOut, error };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTokenUsage(payload: unknown): VisionTokenUsage | null {
  const usage = (payload as { usage?: Record<string, unknown> } | null)?.usage;
  if (!usage) return null;

  const promptTokens = Number(usage.prompt_tokens || 0);
  const completionTokens = Number(usage.completion_tokens || 0);
  const totalTokens = Number(usage.total_tokens || promptTokens + completionTokens);

  return { promptTokens, completionTokens, totalTokens };
}

/**
 * Calls OpenAI Vision to analyze the given photo(s) and returns a schema-validated
 * result plus request metadata (latency, retries, token usage, timeout reason).
 *
 * Standalone: not wired into any route yet. Throws on total failure (schema
 * validation failure and transport errors both count as a failed attempt and
 * are retried up to VISION_AI_MAX_RETRIES before the final error is thrown).
 */
export async function analyzePhotosWithVision(input: {
  images: string[];
  analyzerType: string;
  categories: string[];
  answers?: Record<string, string>;
}): Promise<VisionAnalysisOutcome> {
  const config = getVisionAIConfig();
  const startedAt = Date.now();

  let retryCount = 0;
  let timeoutReason: string | null = null;
  let lastHttpStatus: number | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= VISION_MAX_RETRIES; attempt += 1) {
    retryCount = attempt;

    const attemptResult = await callVisionCompletion({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      images: input.images,
      analyzerType: input.analyzerType,
      categories: input.categories,
      answers: input.answers,
      timeoutMs: VISION_TIMEOUT_MS,
      maxTokens: VISION_MAX_TOKENS,
    });

    if (!attemptResult.ok) {
      if (attemptResult.timedOut) {
        timeoutReason = `Request aborted after ${VISION_TIMEOUT_MS}ms timeout on attempt ${attempt + 1}`;
      }
      console.error("[ai.vision] attempt_error", {
        attempt,
        timedOut: attemptResult.timedOut,
        message: attemptResult.error instanceof Error ? attemptResult.error.message : "unknown_error",
      });
      lastError = attemptResult.error;
      continue;
    }

    const { response } = attemptResult;
    lastHttpStatus = response.status;
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[ai.vision] non_2xx", { attempt, status: response.status, bodyPreview: body.slice(0, 300) });
      lastError = new Error(`vision_http_${response.status}`);
      continue;
    }

    const payload = await response.json().catch(() => null);
    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[ai.vision] empty_content", { attempt });
      lastError = new Error("vision_empty_content");
      continue;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch (error) {
      console.error("[ai.vision] invalid_json", { attempt });
      lastError = error instanceof Error ? error : new Error("vision_invalid_json");
      continue;
    }

    const validated = visionAnalysisResultSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error("[ai.vision] schema_validation_failed", {
        attempt,
        issues: validated.error.issues.slice(0, 5),
      });
      lastError = new Error("vision_schema_validation_failed");
      continue;
    }

    const result: VisionAnalysisResult = validated.data;
    const metadata: VisionAnalysisMetadata = {
      promptVersion: VISION_PROMPT_VERSION,
      model: config.model,
      latencyMs: Date.now() - startedAt,
      retryCount,
      timeoutReason,
      tokenUsage: extractTokenUsage(payload),
    };

    console.info("[ai.vision] success", {
      model: metadata.model,
      latencyMs: metadata.latencyMs,
      retryCount: metadata.retryCount,
      tokenUsage: metadata.tokenUsage,
    });

    return { result, metadata };
  }

  const finalError = lastError instanceof Error ? lastError : new Error("vision_analysis_failed");
  const latencyMs = Date.now() - startedAt;

  console.error("[ai.vision] all_attempts_failed", {
    retryCount,
    timeoutReason,
    latencyMs,
    lastHttpStatus,
    message: finalError.message,
  });

  throw new VisionAnalysisError({
    promptVersion: VISION_PROMPT_VERSION,
    model: config.model,
    retryCount,
    latencyMs,
    timeoutReason,
    lastHttpStatus,
    lastErrorMessage: finalError.message,
  });
}
