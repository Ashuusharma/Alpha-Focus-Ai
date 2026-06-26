import { ProtocolInput } from "@/lib/protocol/contract";
import { ProtocolReport } from "@/types/protocolReport";

function severityLabel(score: number): string {
  if (score >= 75) return "High";
  if (score >= 45) return "Moderate";
  return "Mild";
}

function confidenceLabel(score: number): string {
  if (score >= 80) return "High confidence";
  if (score >= 55) return "Medium confidence";
  return "Limited confidence";
}

export function buildFallbackProtocolReport(input: ProtocolInput): ProtocolReport {
  const primary = input.concerns[0];
  const categoryLabel = input.context.category?.replace(/_/g, " ") || "primary concern";

  return {
    reportVersion: "v1",
    generatedAt: new Date().toISOString(),
    model: "fallback-template-v1",
    source: "fallback",
    issueSnapshot: {
      headline: `Your highest-impact issue is currently ${categoryLabel}.`,
      primaryIssue: primary?.title || categoryLabel,
      severityLabel: severityLabel(input.scores.overallSeverity),
      confidenceLabel: confidenceLabel(input.scores.confidenceScore),
      keyDrivers: primary?.evidence?.slice(0, 3) || ["Recent assessment and image-analysis signals were used."],
    },
    ingredients: {
      mustHave: ["gentle cleanser", "targeted treatment", "non-comedogenic moisturizer", "daily SPF"],
      optional: ["barrier-support serum", "weekly recovery mask"],
      avoidMixes: ["multiple new actives in the same week", "over-exfoliation with harsh scrubs"],
    },
    letsFixThis: {
      weekWindow: "Weeks 1-4",
      steps: [
        {
          title: "Morning baseline routine",
          details: "Cleanse, apply target treatment in thin layer, moisturize, and finish with SPF.",
          timeOfDay: "morning",
          frequency: "Daily",
        },
        {
          title: "Night repair routine",
          details: "Cleanse, apply treatment based on tolerance, then barrier-support moisturizer.",
          timeOfDay: "evening",
          frequency: "Daily",
        },
        {
          title: "Consistency guardrail",
          details: "Track compliance and avoid changing more than one active every 7 days.",
          timeOfDay: "lifestyle",
          frequency: "Daily",
        },
      ],
    },
    avoid: [
      "Skipping SPF on outdoor days",
      "Adding many products at once",
      "Picking, squeezing, or harsh rubbing on sensitive areas",
    ],
    products: [
      {
        name: "Barrier-friendly cleanser",
        role: "Cleanse without stripping",
        why: "Supports routine consistency while reducing irritation risk.",
        usage: "Use morning and evening with lukewarm water.",
        priority: "core",
      },
      {
        name: "Target treatment",
        role: "Address primary issue directly",
        why: "Targets highest-impact concern with measurable weekly progression.",
        usage: "Use once daily initially, then scale if tolerated.",
        priority: "core",
      },
    ],
    diet: {
      include: ["high-protein balanced meals", "vegetable-rich lunches", "low-sugar hydration support"],
      reduce: ["late-night high sugar snacking", "dehydration and missed water windows"],
      hydrationRule: "Target 2.5 to 3.0L water daily unless medically restricted.",
    },
    progressExpectation: {
      timelineSummary: "Early improvement in 2-4 weeks with stronger visible change by weeks 6-8.",
      milestones: [
        { week: 1, expectedChange: "Stabilization and lower reactivity", reviewFocus: "routine consistency" },
        { week: 3, expectedChange: "Reduced flare frequency and better texture", reviewFocus: "trigger control" },
        { week: 6, expectedChange: "Noticeable improvement in severity trend", reviewFocus: "adherence and tolerance" },
      ],
    },
    disclaimers: [
      "This is a supportive lifestyle and grooming protocol, not a medical diagnosis.",
      "Escalate to a licensed clinician for persistent or worsening symptoms.",
    ],
  };
}
