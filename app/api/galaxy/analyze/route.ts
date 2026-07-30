import { NextRequest, NextResponse } from "next/server";
import { galaxyAnalyzeSchema } from "@/lib/server/validators";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { analyzePhotosWithVision } from "@/lib/ai/visionAnalysis";
import { uploadPreparedImageForVision, deleteUploadedImage, UploadPreparedImageResult } from "@/lib/ai/uploadPreparedImageForVision";

type InputPayload = {
  images: string[];
  analyzerType: string;
  categories?: string[];
  answers?: Record<string, string>;
};

type GalaxyIssue = {
  name: string;
  confidence: number;
  impact: "minor" | "moderate" | "significant";
  description: string;
  affectedArea: string;
};

type GalaxyHotspot = {
  x: number;
  y: number;
  label: string;
  severity?: "low" | "medium" | "high";
};

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 15 * 1024 * 1024;

type ParsedDataUrl = {
  mime: string;
  base64: string;
  bytes: Buffer;
};

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const marker = ";base64,";
  if (!dataUrl.startsWith("data:image/")) return null;
  const markerIndex = dataUrl.indexOf(marker);
  if (markerIndex <= 5) return null;

  const mime = String(dataUrl.slice(5, markerIndex) || "").toLowerCase();
  const base64 = String(dataUrl.slice(markerIndex + marker.length) || "");
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  return { mime, base64, bytes };
}

function hasValidSignature(mime: string, bytes: Buffer): boolean {
  if (mime === "image/jpeg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mime === "image/png") {
    return (
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mime === "image/webp") {
    return (
      bytes.length > 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("invalid_data_url");
  }
  const mime = parsed.mime;
  const view = parsed.bytes;
  const arrayBuffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: mime });
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function parseHotspots(raw: unknown): GalaxyHotspot[] {
  const parsed = asRecord(raw);
  const source = parsed.hotspots || parsed.spots || parsed.markers || [];
  if (!Array.isArray(source)) return [];

  return source
    .map((item): GalaxyHotspot => {
      const entry = asRecord(item);
      const x = toNumber(entry.x ?? entry.left ?? entry.cx, 50);
      const y = toNumber(entry.y ?? entry.top ?? entry.cy, 50);
      return {
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
        label: String(entry.label || entry.name || "Affected area"),
        severity: (entry.severity || entry.level) as GalaxyHotspot["severity"],
      };
    })
    .filter((spot) => Number.isFinite(spot.x) && Number.isFinite(spot.y));
}

function parseIssues(raw: unknown): GalaxyIssue[] {
  const parsed = asRecord(raw);
  const list = parsed.issues || parsed.detectedIssues || parsed.findings || [];
  if (!Array.isArray(list)) return [];

  return list
    .map((issue): GalaxyIssue => {
      const entry = asRecord(issue);
      const confidence = clamp(toNumber(entry.confidence ?? entry.score, 75), 0, 100);
      const level = String(entry.impact || entry.severity || "moderate").toLowerCase();
      const impact: GalaxyIssue["impact"] =
        level.includes("high") || level.includes("significant")
          ? "significant"
          : level.includes("low") || level.includes("minor")
            ? "minor"
            : "moderate";

      return {
        name: String(entry.name || entry.title || "Detected Concern"),
        confidence,
        impact,
        description: String(entry.description || entry.details || "Detected by Galaxy AI image analysis."),
        affectedArea: String(entry.affectedArea || entry.area || "Target region"),
      };
    })
    .filter((issue) => issue.name.length > 0);
}

function defaultHotspotsForCategories(categories: string[]): GalaxyHotspot[] {
  const lower = categories.map((c) => c.toLowerCase());
  const spots: GalaxyHotspot[] = [];

  if (lower.some((c) => c.includes("skin") || c.includes("acne"))) {
    spots.push({ x: 35, y: 40, label: "Left Cheek", severity: "medium" });
    spots.push({ x: 65, y: 40, label: "Right Cheek", severity: "medium" });
  }
  if (lower.some((c) => c.includes("dark") || c.includes("eye"))) {
    spots.push({ x: 40, y: 30, label: "Under-eye Left", severity: "low" });
    spots.push({ x: 60, y: 30, label: "Under-eye Right", severity: "low" });
  }
  if (lower.some((c) => c.includes("hair") || c.includes("scalp"))) {
    spots.push({ x: 50, y: 12, label: "Hairline / Crown", severity: "medium" });
  }
  if (lower.some((c) => c.includes("beard"))) {
    spots.push({ x: 50, y: 62, label: "Beard line", severity: "medium" });
  }
  if (lower.some((c) => c.includes("odor") || c.includes("sweat"))) {
    spots.push({ x: 50, y: 45, label: "Underarm / chest sweat zone", severity: "medium" });
  }
  if (lower.some((c) => c.includes("dull") || c.includes("tan"))) {
    spots.push({ x: 50, y: 40, label: "Cheek and forehead tone", severity: "medium" });
  }
  if (lower.some((c) => c.includes("energy") || c.includes("fatigue"))) {
    spots.push({ x: 50, y: 32, label: "Under-eye fatigue signal", severity: "low" });
  }
  if (lower.some((c) => c.includes("fitness") || c.includes("recovery"))) {
    spots.push({ x: 50, y: 58, label: "Recovery stress zone", severity: "low" });
  }

  return spots.slice(0, 8);
}

function defaultIssuesForCategories(categories: string[]): GalaxyIssue[] {
  const lower = categories.map((c) => c.toLowerCase());

  if (lower.some((c) => c.includes("acne"))) {
    return [
      {
        name: "Inflammation Pattern (Baseline)",
        confidence: 76,
        impact: "moderate",
        description: "Baseline inflammatory pattern detected for acne protocol calibration.",
        affectedArea: "T-zone",
      },
    ];
  }

  if (lower.some((c) => c.includes("hair") || c.includes("scalp"))) {
    return [
      {
        name: "Density Stress Marker (Baseline)",
        confidence: 74,
        impact: "moderate",
        description: "Baseline scalp/hair stress marker detected for protocol initialization.",
        affectedArea: "Hairline / Crown",
      },
    ];
  }

  if (lower.some((c) => c.includes("beard"))) {
    return [
      {
        name: "Growth Consistency Marker (Baseline)",
        confidence: 73,
        impact: "moderate",
        description: "Baseline beard growth consistency marker detected for protocol calibration.",
        affectedArea: "Beard line",
      },
    ];
  }

  if (lower.some((c) => c.includes("dark") || c.includes("eye"))) {
    return [
      {
        name: "Under-eye Stress Marker (Baseline)",
        confidence: 72,
        impact: "minor",
        description: "Baseline under-eye stress marker detected for lifestyle correlation.",
        affectedArea: "Under-eye",
      },
    ];
  }

  if (lower.some((c) => c.includes("odor") || c.includes("sweat"))) {
    return [
      {
        name: "Sweat Retention Marker (Baseline)",
        confidence: 74,
        impact: "moderate",
        description: "Baseline sweat and odor-retention pattern detected for hygiene and fabric-control protocol calibration.",
        affectedArea: "Underarm / torso",
      },
    ];
  }

  if (lower.some((c) => c.includes("dull") || c.includes("tan"))) {
    return [
      {
        name: "Tone Fatigue Marker (Baseline)",
        confidence: 75,
        impact: "moderate",
        description: "Baseline dullness and tan-load marker detected for brightening and protection planning.",
        affectedArea: "Forehead / cheeks",
      },
    ];
  }

  if (lower.some((c) => c.includes("energy") || c.includes("fatigue"))) {
    return [
      {
        name: "Fatigue Signal Marker (Baseline)",
        confidence: 72,
        impact: "minor",
        description: "Baseline fatigue-linked appearance marker detected for sleep, hydration, and energy routine planning.",
        affectedArea: "Under-eye / overall face",
      },
    ];
  }

  if (lower.some((c) => c.includes("fitness") || c.includes("recovery"))) {
    return [
      {
        name: "Recovery Load Marker (Baseline)",
        confidence: 73,
        impact: "minor",
        description: "Baseline recovery-load marker detected for hydration, protein, and training-balance calibration.",
        affectedArea: "Target recovery region",
      },
    ];
  }

  return [
    {
      name: "Clinical Baseline Marker",
      confidence: 70,
      impact: "minor",
      description: "Baseline marker generated to initialize clinical flow when external analyzer is unavailable.",
      affectedArea: "Target region",
    },
  ];
}

// Mirrors the confidence gate app/image-analyzer/page.tsx's
// assertValidImagePayload() already applies client-side. Kept as an explicit,
// named constant here (rather than silently duplicated) so the two stay easy
// to compare if either changes.
const LOW_CONFIDENCE_THRESHOLD = 45;

type QualitySignal = {
  retakeRecommended: boolean;
  reason?: string;
};

// Additive-only: exists so a low-confidence/no-issue analysis can be labeled
// honestly instead of silently presented as a confident result. Does not
// remove or rename any existing response field — a consumer that doesn't
// read `quality` is unaffected.
function buildQualitySignal(confidence: number, issueCount: number): QualitySignal {
  const retakeRecommended = issueCount === 0 || confidence < LOW_CONFIDENCE_THRESHOLD;
  return {
    retakeRecommended,
    reason: retakeRecommended
      ? "Photo quality, lighting, or angle made this analysis less reliable. Consider retaking in bright, even light with the target area fully visible."
      : undefined,
  };
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();

  try {
    const auth = await getRequestAuth(request);
    const actor = auth?.userId || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(`galaxy:analyze:${actor}`, 20, 60_000)) {
      await writeAuditLog({ action: "galaxy.analyze", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "rate_limited" });
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as InputPayload;
    const validated = galaxyAnalyzeSchema.safeParse(raw);
    if (!validated.success) {
      await writeAuditLog({ action: "galaxy.analyze", userId: ip, ok: false, route: "/api/galaxy/analyze", detail: "validation_failed" });
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const body = validated.data as InputPayload;

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    let totalBytes = 0;
    const parsedImages: ParsedDataUrl[] = [];
    for (const imageData of body.images) {
      const parsedData = parseDataUrl(imageData);
      if (!parsedData) {
        await writeAuditLog({ action: "upload.image", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "invalid_data_url" });
        return NextResponse.json({ error: "invalid_image_data_url" }, { status: 400 });
      }

      if (!ALLOWED_IMAGE_MIME.has(parsedData.mime)) {
        await writeAuditLog({ action: "upload.image", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "mime_rejected" });
        return NextResponse.json({ error: "invalid_image_mime" }, { status: 415 });
      }

      if (parsedData.bytes.length <= 0 || parsedData.bytes.length > MAX_IMAGE_BYTES) {
        await writeAuditLog({ action: "upload.image", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "image_size_rejected" });
        return NextResponse.json({ error: "image_too_large" }, { status: 413 });
      }

      if (!hasValidSignature(parsedData.mime, parsedData.bytes)) {
        await writeAuditLog({ action: "upload.image", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "signature_rejected" });
        return NextResponse.json({ error: "invalid_image_signature" }, { status: 400 });
      }

      totalBytes += parsedData.bytes.length;
      if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
        await writeAuditLog({ action: "upload.image", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "total_upload_size_rejected" });
        return NextResponse.json({ error: "total_upload_too_large" }, { status: 413 });
      }

      parsedImages.push(parsedData);
    }

    const categories = body.categories || [body.analyzerType];

    // Primary provider: OpenAI Vision. Prepares + uploads each image, then
    // runs one multimodal analysis call over the full set, and normalizes
    // the result into the exact response shape Galaxy AI already returns so
    // no downstream consumer (frontend, assessment, protocol generation,
    // result page) needs to know which provider actually served the request.
    // Galaxy AI remains the fallback: any failure in this block falls
    // through unchanged to the existing Galaxy logic below.
    // Tracks images that made it into Storage so they can be cleaned up if a
    // later step in this same try block fails (see the catch block below).
    // Left empty on full success — the uploaded image is the response's
    // annotatedImageUrl at that point and must NOT be deleted.
    let uploadedForCleanup: UploadPreparedImageResult[] = [];

    try {
      console.info("[vision] prepare_started", { imageCount: parsedImages.length, analyzerType: body.analyzerType });

      const storageUserId = auth?.userId || "anonymous";
      const uploadStartedAt = Date.now();
      const uploaded: UploadPreparedImageResult[] = [];
      for (const parsedImage of parsedImages) {
        const result = await uploadPreparedImageForVision({
          buffer: parsedImage.bytes,
          userId: storageUserId,
          category: body.analyzerType,
        });
        uploaded.push(result);
      }
      uploadedForCleanup = uploaded;
      const uploadDurationMs = Date.now() - uploadStartedAt;

      console.info("[vision] upload_complete", {
        imageCount: uploaded.length,
        compressedBytes: uploaded.reduce((sum, u) => sum + u.compressedBytes, 0),
        originalBytes: uploaded.reduce((sum, u) => sum + u.originalBytes, 0),
        uploadDurationMs,
      });

      console.info("[vision] request_started", { imageCount: uploaded.length, analyzerType: body.analyzerType });
      const visionOutcome = await analyzePhotosWithVision({
        images: uploaded.map((u) => u.uploadedUrl),
        analyzerType: body.analyzerType,
        categories,
        answers: body.answers,
      });
      console.info("[vision] request_success", {
        model: visionOutcome.metadata.model,
        latencyMs: visionOutcome.metadata.latencyMs,
        retryCount: visionOutcome.metadata.retryCount,
        tokenUsage: visionOutcome.metadata.tokenUsage,
      });

      const normalized = {
        provider: "galaxy-ai",
        issues: visionOutcome.result.issues,
        hotspots: visionOutcome.result.hotspots.length ? visionOutcome.result.hotspots : defaultHotspotsForCategories(categories),
        annotatedImageUrl: uploaded[0]?.uploadedUrl || body.images[0],
        confidence: visionOutcome.result.confidence,
        quality: buildQualitySignal(visionOutcome.result.confidence, visionOutcome.result.issues.length),
        // Every captured image was already persisted to Storage as part of
        // the Vision pipeline (uploadPreparedImageForVision), in the same
        // order as the request's `images` array. Exposing all of them (not
        // just the first) lets the client skip its own redundant upload of
        // the originals entirely instead of only avoiding it for one image.
        uploadedImageUrls: uploaded.map((u) => u.uploadedUrl),
      };
      console.info("[vision] normalized_response", { issueCount: normalized.issues.length, hotspotCount: normalized.hotspots.length });

      await writeAuditLog({ action: "vision.analyze", userId: actor, ok: true, route: "/api/galaxy/analyze", detail: "openai_vision_success" });
      console.info("[vision] completed", {
        outcome: "vision_success",
        selectedModel: visionOutcome.metadata.model,
        fallbackModel: null,
        uploadDurationMs,
        visionDurationMs: visionOutcome.metadata.latencyMs,
        totalDurationMs: Date.now() - requestStartedAt,
        tokenUsage: visionOutcome.metadata.tokenUsage,
      });
      return NextResponse.json(normalized);
    } catch (visionError) {
      console.error("[vision] fallback_to_galaxy", {
        message: visionError instanceof Error ? visionError.message : "unknown_error",
        name: visionError instanceof Error ? visionError.name : undefined,
      });

      if (uploadedForCleanup.length) {
        console.info("[vision] orphan_cleanup_started", { imageCount: uploadedForCleanup.length });
        const results = await Promise.allSettled(uploadedForCleanup.map((u) => deleteUploadedImage(u)));
        const failed = results.filter((r) => r.status === "rejected").length;
        console.info("[vision] orphan_cleanup_completed", { imageCount: uploadedForCleanup.length, failed });
      }

      await writeAuditLog({ action: "vision.analyze", userId: actor, ok: false, route: "/api/galaxy/analyze", detail: "vision_failed_fallback_galaxy" });
      // Fall through to the existing Galaxy implementation below, unchanged.
    }

    const apiKey = process.env.GALAXY_API_KEY || process.env.GALAXY_BEARER_TOKEN;
    const apiUrl = process.env.GALAXY_API_URL || "https://api.galaxy.ai/photo-analyzer";

    if (!apiKey) {
      await writeAuditLog({ action: "galaxy.analyze", userId: actor, ok: true, route: "/api/galaxy/analyze", detail: "fallback_no_key" });
      const fallbackIssues = defaultIssuesForCategories(categories);
      console.info("[vision] completed", {
        outcome: "galaxy_fallback_no_key",
        selectedModel: null,
        fallbackModel: "galaxy-ai",
        totalDurationMs: Date.now() - requestStartedAt,
      });
      return NextResponse.json({
        provider: "galaxy-ai",
        issues: fallbackIssues,
        hotspots: defaultHotspotsForCategories(categories),
        annotatedImageUrl: body.images[0],
        confidence: 75,
        quality: buildQualitySignal(75, fallbackIssues.length),
        note: "GALAXY_API_KEY is not configured. Returned fallback response.",
      });
    }

    const responses = await Promise.all(
      body.images.map(async (imageData, idx) => {
        const formData = new FormData();
        const blob = dataUrlToBlob(imageData);
        formData.append("file", blob, `scan-${idx + 1}.jpg`);
        formData.append("analyzerType", body.analyzerType);
        formData.append("categories", JSON.stringify(body.categories || []));
        formData.append("answers", JSON.stringify(body.answers || {}));

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
          cache: "no-store",
        });

        const json = await response.json().catch(() => ({}));
        return { ok: response.ok, json, original: imageData };
      })
    );

    const successful = responses.filter((r) => r.ok);
    const mergedIssues = successful.flatMap((r) => parseIssues(r.json));

    const hotspotCandidates = successful.flatMap((r) => parseHotspots(r.json));
    const hotspots = hotspotCandidates.length
      ? hotspotCandidates
      : defaultHotspotsForCategories(body.categories || [body.analyzerType]);

    const annotatedImageUrl =
      successful.find((r) => r.json?.annotatedImageUrl)?.json?.annotatedImageUrl ||
      successful.find((r) => r.json?.annotated_image)?.json?.annotated_image ||
      successful.find((r) => r.json?.resultImage)?.json?.resultImage ||
      successful.find((r) => r.json?.image)?.json?.image ||
      body.images[0];

    const uniqueIssueMap = new Map<string, GalaxyIssue>();
    mergedIssues.forEach((issue) => {
      const key = issue.name.toLowerCase();
      const existing = uniqueIssueMap.get(key);
      if (!existing || issue.confidence > existing.confidence) {
        uniqueIssueMap.set(key, issue);
      }
    });

    const issues = Array.from(uniqueIssueMap.values());
    const normalizedIssues = issues.length > 0 ? issues : defaultIssuesForCategories(categories);
    const confidence =
      normalizedIssues.length > 0
        ? Math.round(normalizedIssues.reduce((sum, issue) => sum + issue.confidence, 0) / normalizedIssues.length)
        : 75;

    await writeAuditLog({ action: "galaxy.analyze", userId: actor, ok: true, route: "/api/galaxy/analyze", detail: "analyze_success" });
    console.info("[vision] completed", {
      outcome: "galaxy_success",
      selectedModel: null,
      fallbackModel: "galaxy-ai",
      totalDurationMs: Date.now() - requestStartedAt,
    });

    return NextResponse.json({
      provider: "galaxy-ai",
      issues: normalizedIssues,
      hotspots,
      annotatedImageUrl,
      confidence,
      quality: buildQualitySignal(confidence, normalizedIssues.length),
      rawCount: successful.length,
    });
  } catch (error) {
    await writeAuditLog({ action: "galaxy.analyze", userId: "anonymous", ok: false, route: "/api/galaxy/analyze", detail: "internal_error" });
    return NextResponse.json(
      {
        error: "Galaxy analyze failed",
        detail: "Unknown error",
      },
      { status: 500 }
    );
  }
}

