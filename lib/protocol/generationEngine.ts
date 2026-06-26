import { ProtocolInput, validateDefaultProtocolOutput } from "@/lib/protocol/contract";
import { buildFallbackProtocolReport } from "@/lib/protocol/fallbackReport";
import { ProtocolReport } from "@/types/protocolReport";

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildPrompt(input: ProtocolInput): string {
  return [
    "You are Alpha Focus clinical protocol generator.",
    "Return strict JSON only, no markdown.",
    "Required keys: reportVersion, generatedAt, model, source, issueSnapshot, ingredients, letsFixThis, avoid, products, diet, progressExpectation, disclaimers.",
    "Sections must be concise, practical, and realistic for India daily life constraints when relevant.",
    "No diagnosis claims, no miracle language, no guaranteed outcomes.",
    "Use this structured protocol input JSON:",
    JSON.stringify(input),
  ].join("\n");
}

export async function generateProtocolReportFromAI(input: ProtocolInput): Promise<{ report: ProtocolReport; usedFallback: boolean; model: string }> {
  const model = process.env.PROTOCOL_AI_MODEL || "gpt-5.4-mini";
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey) {
    return {
      report: buildFallbackProtocolReport(input),
      usedFallback: true,
      model: "fallback-template-v1",
    };
  }

  const prompt = buildPrompt(input);
  const maxTokens = envNumber("PROTOCOL_AI_MAX_TOKENS", 1800);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You generate safe, practical, strictly structured clinical lifestyle protocols. Output valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        report: buildFallbackProtocolReport(input),
        usedFallback: true,
        model: "fallback-template-v1",
      };
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return {
        report: buildFallbackProtocolReport(input),
        usedFallback: true,
        model: "fallback-template-v1",
      };
    }

    const parsed = JSON.parse(content) as unknown;
    const report = validateDefaultProtocolOutput(parsed);

    return {
      report: {
        ...report,
        generatedAt: new Date().toISOString(),
        model,
        source: "ai",
      },
      usedFallback: false,
      model,
    };
  } catch {
    return {
      report: buildFallbackProtocolReport(input),
      usedFallback: true,
      model: "fallback-template-v1",
    };
  }
}
