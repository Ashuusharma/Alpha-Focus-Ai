import { NextRequest, NextResponse } from "next/server";

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

function parseHotspots(raw: any): GalaxyHotspot[] {
  const source = raw?.hotspots || raw?.spots || raw?.markers || [];
  if (!Array.isArray(source)) return [];

  return source
    .map((item: any): GalaxyHotspot => {
      const x = toNumber(item?.x ?? item?.left ?? item?.cx, 50);
      const y = toNumber(item?.y ?? item?.top ?? item?.cy, 50);
      return {
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
        label: String(item?.label || item?.name || "Affected area"),
        severity: item?.severity || item?.level,
      };
    })
    .filter((spot) => Number.isFinite(spot.x) && Number.isFinite(spot.y));
}

function parseIssues(raw: any): GalaxyIssue[] {
  const list = raw?.issues || raw?.detectedIssues || raw?.findings || [];
  if (!Array.isArray(list)) return [];

  return list
    .map((issue: any): GalaxyIssue => {
      const confidence = clamp(toNumber(issue?.confidence ?? issue?.score, 75), 0, 100);
      const level = String(issue?.impact || issue?.severity || "moderate").toLowerCase();
      const impact: GalaxyIssue["impact"] =
        level.includes("high") || level.includes("significant")
          ? "significant"
          : level.includes("low") || level.includes("minor")
            ? "minor"
            : "moderate";

      return {
        name: String(issue?.name || issue?.title || "Detected Concern"),
        confidence,
        impact,
        description: String(issue?.description || issue?.details || "Detected by Galaxy AI image analysis."),
        affectedArea: String(issue?.affectedArea || issue?.area || "Target region"),
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InputPayload;

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const apiKey = process.env.GALAXY_API_KEY || process.env.GALAXY_BEARER_TOKEN;
    const apiUrl = process.env.GALAXY_API_URL || "https://api.galaxy.ai/photo-analyzer";

    if (!apiKey) {
      return NextResponse.json({
        provider: "galaxy-ai",
        issues: [],
        hotspots: defaultHotspotsForCategories(body.categories || [body.analyzerType]),
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

    const issues = Array.from(uniqueIssueMap.values());
    const confidence =
      issues.length > 0
        ? Math.round(issues.reduce((sum, issue) => sum + issue.confidence, 0) / issues.length)
        : 75;

    return NextResponse.json({
      provider: "galaxy-ai",
      issues,
      hotspots,
      annotatedImageUrl,
      confidence,
      rawCount: successful.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Galaxy analyze failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
