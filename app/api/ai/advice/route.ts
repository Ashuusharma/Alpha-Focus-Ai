import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { aiAdviceSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";

type AdviceRequest = {
  issues: string[];
  answers?: Record<string, string>;
  locale?: string;
  category?: string;
  severity?: "mild" | "moderate" | "high";
  environment?: {
    climate?: string;
    humidity?: number;
    uv?: number;
    aqi?: number;
  };
  lifestyle?: {
    workMode?: string;
    sleepHours?: number;
    stressLevel?: string;
    workoutFrequency?: string;
  };
};

type AdviceResponse = {
  summary: string;
  actions: string[];
  source: "ai" | "fallback";
  meta?: {
    cached: boolean;
    remainingBudgetUsd?: number;
  };
};

type CacheValue = {
  expiresAt: number;
  value: AdviceResponse;
};

const responseCache = new Map<string, CacheValue>();
const requestWindowByIp = new Map<string, number[]>();
const usageByDay = new Map<string, number>();

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "local";
}

function makeCacheKey(body: AdviceRequest): string {
  return createHash("sha1").update(JSON.stringify(body)).digest("hex");
}

function checkRateLimit(ip: string): boolean {
  const maxPerMinute = envNumber("AI_REQUESTS_PER_MINUTE", 20);
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  const current = requestWindowByIp.get(ip) ?? [];
  const fresh = current.filter((t) => t > oneMinuteAgo);
  fresh.push(now);
  requestWindowByIp.set(ip, fresh);

  return fresh.length <= maxPerMinute;
}

function estimateCostUsd(prompt: string): number {
  const approxInputTokens = Math.ceil(prompt.length / 4);
  const maxOutputTokens = envNumber("AI_MAX_TOKENS", 320);
  const estimatedTotal = approxInputTokens + maxOutputTokens;
  const per1k = envNumber("AI_ESTIMATED_COST_PER_1K_TOKENS_USD", 0.002);
  return (estimatedTotal / 1000) * per1k;
}

function buildFallback(body: AdviceRequest): AdviceResponse {
  const primary = body.issues[0] ?? "grooming";
  const category = body.category?.replace(/_/g, " ") || primary;
  const indiaAware = (body.locale || "").toLowerCase().includes("in");
  const climateLines: string[] = [];

  if ((body.environment?.humidity || 0) >= 75) {
    climateLines.push("Keep the daytime routine lighter because humid weather and sweat can worsen congestion and scalp irritation.");
  }

  if ((body.environment?.aqi || 0) >= 150) {
    climateLines.push("Prioritize evening cleansing on commute or outdoor days to clear pollution, dust, and sunscreen residue.");
  }

  if ((body.environment?.uv || 0) >= 7) {
    climateLines.push("Use strict SPF and reapply during long outdoor exposure to control pigmentation and inflammation rebound.");
  }

  return {
    summary:
      body.issues.length > 1
        ? `You currently have ${body.issues.length} priority concerns. Start with the highest-impact ${category} routine first, then add secondary steps after 7 to 10 days so the skin or scalp does not get overloaded.`
        : `Your top focus is ${category}. A simple 14-day routine built around cleansing, targeted treatment, sun protection, sleep, and consistency is the fastest realistic path to visible improvement.`,
    actions: [
      indiaAware
        ? "Follow one short AM routine and one short PM routine that still fits commute, work, gym, and late evenings."
        : "Follow one short AM routine and one short PM routine daily for 14 days.",
      climateLines[0] || "Track progress photos every 7 days in similar lighting and keep the routine steady.",
      climateLines[1] || "Pause harsh combinations if burning, peeling, or tightness appears.",
      climateLines[2] || "Re-scan after one week so the protocol can be adjusted from fresh data.",
    ],
    source: "fallback",
  };
}

function buildEnvironmentContext(body: AdviceRequest) {
  const points: string[] = [];

  if (body.environment?.climate) points.push(`climate: ${body.environment.climate}`);
  if (typeof body.environment?.humidity === "number") points.push(`humidity: ${body.environment.humidity}`);
  if (typeof body.environment?.uv === "number") points.push(`uv: ${body.environment.uv}`);
  if (typeof body.environment?.aqi === "number") points.push(`aqi: ${body.environment.aqi}`);
  if (body.lifestyle?.workMode) points.push(`work mode: ${body.lifestyle.workMode}`);
  if (typeof body.lifestyle?.sleepHours === "number") points.push(`sleep hours: ${body.lifestyle.sleepHours}`);
  if (body.lifestyle?.stressLevel) points.push(`stress: ${body.lifestyle.stressLevel}`);
  if (body.lifestyle?.workoutFrequency) points.push(`workouts: ${body.lifestyle.workoutFrequency}`);

  return points.length > 0 ? points.join(", ") : "not provided";
}

function normalizeActions(actions: unknown): string[] {
  if (!Array.isArray(actions)) return [];
  return actions.filter((a): a is string => typeof a === "string").slice(0, 4);
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as AdviceRequest;
    const validated = aiAdviceSchema.safeParse(raw);
    if (!validated.success) {
      await writeAuditLog({ action: "ai.advice", userId: "anonymous", ok: false, route: "/api/ai/advice", detail: "validation_failed" });
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const body = validated.data as AdviceRequest;

    if (!Array.isArray(body.issues) || body.issues.length === 0) {
      return NextResponse.json({ error: "issues are required" }, { status: 400 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      const fallback = buildFallback(body);
      await writeAuditLog({ action: "ai.advice", userId: ip, ok: false, route: "/api/ai/advice", detail: "rate_limited_fallback" });
      return NextResponse.json(
        {
          ...fallback,
          meta: { cached: false },
        },
        { status: 200 }
      );
    }

    const cacheKey = makeCacheKey(body);
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      await writeAuditLog({ action: "ai.advice", userId: ip, ok: true, route: "/api/ai/advice", detail: "cache_hit" });
      return NextResponse.json({ ...cached.value, meta: { ...(cached.value.meta ?? {}), cached: true } });
    }

    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
    const maxTokens = envNumber("AI_MAX_TOKENS", 320);

    const dailyBudget = envNumber("AI_DAILY_BUDGET_USD", 0.5);
    const today = getTodayKey();

    const prompt = `You are a premium personal grooming and recovery coach.

  User issues: ${body.issues.join(", ")}
  Primary category: ${body.category || "not provided"}
  Severity hint: ${body.severity || "moderate"}
  Questionnaire answers: ${JSON.stringify(body.answers ?? {})}
  Language locale: ${body.locale || "en-IN"}
  Environment and lifestyle context: ${buildEnvironmentContext(body)}

  Return strict JSON only: {"summary":"...","actions":["...","...","...","..."]}.

  Rules:
  - summary max 85 words
  - actions exactly 4 concise action lines
  - no medical diagnosis claims
  - no unrealistic promises, no fairness language, no miracle wording
  - make the plan practical for Indian daily life when locale or context fits India
  - use relevant constraints only when helpful: heat, humidity, dust, pollution, hard water, long commute, shaving irritation, gym sweat, irregular sleep, office routine
  - keep it mobile-friendly and easy to follow
  - prioritize consistency, affordable practicality, and low confusion`;

    const estimatedCost = estimateCostUsd(prompt);
    const spent = usageByDay.get(today) ?? 0;

    if (!apiKey || spent + estimatedCost > dailyBudget) {
      const fallback = buildFallback(body);
      const remaining = Math.max(0, dailyBudget - spent);
      const response: AdviceResponse = {
        ...fallback,
        meta: { cached: false, remainingBudgetUsd: Number(remaining.toFixed(4)) },
      };
      await writeAuditLog({ action: "ai.advice", userId: ip, ok: true, route: "/api/ai/advice", detail: "budget_fallback" });
      return NextResponse.json(response);
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a trusted men's grooming coach focused on practical routines, consistency, and safe guidance for real daily life. When the user context points to India, adapt routines for climate, commute, sweat, dust, and schedule constraints without stereotyping.",
          },
          { role: "user", content: prompt },
        ],
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const fallback = buildFallback(body);
      await writeAuditLog({ action: "ai.advice", userId: ip, ok: false, route: "/api/ai/advice", detail: "upstream_error" });
      return NextResponse.json(fallback);
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      const fallback = buildFallback(body);
      return NextResponse.json(fallback);
    }

    let parsed: { summary?: string; actions?: unknown } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content };
    }

    const actions = normalizeActions(parsed.actions);
    const response: AdviceResponse = {
      summary:
        parsed.summary?.trim() ||
        "Your personalized guidance is ready. Stay consistent and follow your high-priority actions daily.",
      actions:
        actions.length > 0
          ? actions
          : [
              "Follow your AM and PM routine consistently",
              "Hydrate and protect skin with SPF daily",
              "Review triggers and reduce irritants",
              "Re-assess after 7 days",
            ],
      source: "ai",
      meta: {
        cached: false,
        remainingBudgetUsd: Number(Math.max(0, dailyBudget - (spent + estimatedCost)).toFixed(4)),
      },
    };

    usageByDay.set(today, spent + estimatedCost);

    const ttlSec = envNumber("AI_CACHE_TTL_SEC", 1800);
    responseCache.set(cacheKey, {
      expiresAt: Date.now() + ttlSec * 1000,
      value: response,
    });

    await writeAuditLog({ action: "ai.advice", userId: ip, ok: true, route: "/api/ai/advice", detail: "ai_success" });
    return NextResponse.json(response);
  } catch {
    await writeAuditLog({ action: "ai.advice", userId: "anonymous", ok: false, route: "/api/ai/advice", detail: "internal_error" });
    return NextResponse.json(
      {
        summary: "We could not fetch AI guidance right now. Your core report is still available.",
        actions: [
          "Follow your current routine for 7 days",
          "Avoid adding multiple new actives at once",
          "Use SPF daily",
          "Retry AI guidance in a few minutes",
        ],
        source: "fallback",
      },
      { status: 200 }
    );
  }
}

