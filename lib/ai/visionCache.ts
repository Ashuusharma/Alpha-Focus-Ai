import "server-only";
import { createHash } from "crypto";

export type VisionCacheLookup = {
  imageHash: string;
  category: string;
  visionModel: string;
  promptVersion: string;
};

export type VisionCacheOriginalMetrics = {
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
};

export type VisionCacheEntry = VisionCacheLookup & {
  analysisResult: unknown;
  /** The real cost/latency/tokens of the call that produced this result —
   *  stored so a later cache hit can report accurate savings (Phase 5.9 Part 4).
   *  Requires supabase/ai_governance_schema_v2.sql. */
  original?: VisionCacheOriginalMetrics;
};

export type VisionCacheHit = {
  analysisResult: unknown;
  original: VisionCacheOriginalMetrics | null;
};

const DEFAULT_TTL_MS = Number(process.env.VISION_CACHE_TTL_MS || 24 * 60 * 60 * 1000);

function getSupabaseServerConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

/**
 * Deterministic, order-independent hash identifying an exact set of images:
 * each image is hashed individually, the per-image hashes are sorted, then
 * hashed together. The same photos submitted in a different order still hit
 * the same cache entry; any different image, or a different number of
 * images, misses.
 */
export function computeImageSetHash(buffers: Buffer[]): string {
  const perImageHashes = buffers.map((buf) => createHash("sha256").update(buf).digest("hex")).sort();
  return createHash("sha256").update(perImageHashes.join(":")).digest("hex");
}

/**
 * Looks up a cached Vision result. Scoped to the exact (imageHash, category,
 * visionModel, promptVersion) tuple — a change in category, model, or
 * prompt version is a guaranteed miss, never a stale hit, because all four
 * are part of both the lookup and the table's unique constraint.
 */
export async function getCachedVisionResult(lookup: VisionCacheLookup): Promise<VisionCacheHit | null> {
  const config = getSupabaseServerConfig();
  if (!config) return null;

  try {
    const url = new URL(`${config.baseUrl}/rest/v1/vision_analysis_cache`);
    url.searchParams.set(
      "select",
      "analysis_result,expires_at,original_prompt_tokens,original_completion_tokens,original_cost_usd,original_latency_ms"
    );
    url.searchParams.set("image_hash", `eq.${lookup.imageHash}`);
    url.searchParams.set("category", `eq.${lookup.category}`);
    url.searchParams.set("vision_model", `eq.${lookup.visionModel}`);
    url.searchParams.set("prompt_version", `eq.${lookup.promptVersion}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const rows = (await response.json()) as Array<{
      analysis_result: unknown;
      expires_at: string;
      original_prompt_tokens: number | null;
      original_completion_tokens: number | null;
      original_cost_usd: number | string | null;
      original_latency_ms: number | null;
    }>;
    const row = rows[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) return null;

    const hasOriginal =
      row.original_prompt_tokens != null &&
      row.original_completion_tokens != null &&
      row.original_cost_usd != null &&
      row.original_latency_ms != null;

    return {
      analysisResult: row.analysis_result,
      original: hasOriginal
        ? {
            promptTokens: Number(row.original_prompt_tokens),
            completionTokens: Number(row.original_completion_tokens),
            costUsd: Number(row.original_cost_usd),
            latencyMs: Number(row.original_latency_ms),
          }
        : null,
    };
  } catch (error) {
    console.error("[ai.visionCache] lookup_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

export async function setCachedVisionResult(entry: VisionCacheEntry, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  const config = getSupabaseServerConfig();
  if (!config) return;

  try {
    const response = await fetch(`${config.baseUrl}/rest/v1/vision_analysis_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        image_hash: entry.imageHash,
        category: entry.category,
        vision_model: entry.visionModel,
        prompt_version: entry.promptVersion,
        analysis_result: entry.analysisResult,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
        original_prompt_tokens: entry.original?.promptTokens ?? null,
        original_completion_tokens: entry.original?.completionTokens ?? null,
        original_cost_usd: entry.original?.costUsd ?? null,
        original_latency_ms: entry.original?.latencyMs ?? null,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[ai.visionCache] write_failed", { status: response.status, bodyPreview: body.slice(0, 300) });
    }
  } catch (error) {
    console.error("[ai.visionCache] write_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
