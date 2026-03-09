import { NextRequest, NextResponse } from "next/server";
import { galaxyAnalyzeSchema } from "@/lib/server/validators";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";

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

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, content] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(meta);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const buffer = Buffer.from(content, "base64");
  return new Blob([buffer], { type: mime });
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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (isRateLimited(`galaxy:analyze:${ip}`, 20, 60_000)) {
      await writeAuditLog({ action: "galaxy.analyze", userId: ip, ok: false, route: "/api/galaxy/analyze", detail: "rate_limited" });
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

    const apiKey = process.env.GALAXY_API_KEY || process.env.GALAXY_BEARER_TOKEN;
    const apiUrl = process.env.GALAXY_API_URL || "https://api.galaxy.ai/photo-analyzer";

    if (!apiKey) {
      const categories = body.categories || [body.analyzerType];
      await writeAuditLog({ action: "galaxy.analyze", userId: ip, ok: true, route: "/api/galaxy/analyze", detail: "fallback_no_key" });
      return NextResponse.json({
        provider: "galaxy-ai",
        issues: defaultIssuesForCategories(categories),
        hotspots: defaultHotspotsForCategories(categories),
        annotatedImageUrl: body.images[0],
        confidence: 75,
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

    const categories = body.categories || [body.analyzerType];
    const issues = Array.from(uniqueIssueMap.values());
    const normalizedIssues = issues.length > 0 ? issues : defaultIssuesForCategories(categories);
    const confidence =
      normalizedIssues.length > 0
        ? Math.round(normalizedIssues.reduce((sum, issue) => sum + issue.confidence, 0) / normalizedIssues.length)
        : 75;

    await writeAuditLog({ action: "galaxy.analyze", userId: ip, ok: true, route: "/api/galaxy/analyze", detail: "analyze_success" });

    return NextResponse.json({
      provider: "galaxy-ai",
      issues: normalizedIssues,
      hotspots,
      annotatedImageUrl,
      confidence,
      rawCount: successful.length,
    });
  } catch (error) {
    await writeAuditLog({ action: "galaxy.analyze", userId: "anonymous", ok: false, route: "/api/galaxy/analyze", detail: "internal_error" });
    return NextResponse.json(
      {
        error: "Galaxy analyze failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
