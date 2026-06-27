import { ProtocolInput } from "@/lib/protocol/contract";
import { ProtocolReport } from "@/types/protocolReport";
import { PROTOCOL_REPORT_SCHEMA_VERSION } from "@/types/protocolReport";

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
  const categoryLabel = input.context.category?.replace(/_/g, " ") || "recovery concern";
  const severityText = severityLabel(input.scores.overallSeverity).toLowerCase();
  const confidenceText = confidenceLabel(input.scores.confidenceScore).toLowerCase();
  const baseEvidence = primary?.evidence?.slice(0, 3) || input.assessmentFacts.topSignals.slice(0, 3);

  return {
    schemaVersion: PROTOCOL_REPORT_SCHEMA_VERSION,
    issueSummary: {
      whatWasDetected: [
        `Your top priority is ${primary?.title || categoryLabel}.`,
        `Current signal intensity appears ${severityText}.`,
        `Confidence in this protocol is ${confidenceText}.`,
      ],
      whyItHappens: [
        "Daily inconsistency compounds inflammation and slows repair.",
        "Sleep, stress, and hydration variability can amplify visible symptoms.",
        ...(baseEvidence.length > 0 ? [`Observed driver: ${baseEvidence[0]}.`] : []),
      ],
      whyConsistencyMatters: [
        "Barrier and tissue recovery are cumulative, not one-day fixes.",
        "A stable routine lowers relapse risk week over week.",
        "Measured adherence improves prediction confidence for next protocol updates.",
      ],
    },
    mainResolvingIngredients: [
      {
        ingredient: "Niacinamide",
        purpose: "Calm inflammation and support barrier balance.",
        howItHelps: "Reduces visible reactivity while improving tolerance.",
        expectedRecoveryBenefit: "Lower flare frequency in weeks 2-4.",
      },
      {
        ingredient: "Ceramides",
        purpose: "Repair and maintain skin barrier integrity.",
        howItHelps: "Decreases irritation from active routines.",
        expectedRecoveryBenefit: "Improved comfort and adherence consistency.",
      },
      {
        ingredient: "Targeted Active",
        purpose: `Address ${primary?.title || categoryLabel} directly.`,
        howItHelps: "Works on root pattern instead of surface-only suppression.",
        expectedRecoveryBenefit: "Visible severity trend-down by week 4.",
      },
    ],
    monthlyRecoveryPlan: {
      morning: [
        {
          stepTitle: "Morning cleanse",
          reason: "Remove overnight buildup without stripping barrier.",
          exactlyHowToPerform: "Use a gentle cleanser for 30-40 seconds, rinse with lukewarm water, and pat dry.",
          time: "6:00-9:00 AM",
          quantity: "Coin-sized",
          applicationArea: "Target concern zone and surrounding area",
          commonMistakes: ["Using hot water", "Over-scrubbing"],
          expectedBenefit: "Lower irritation baseline through the day.",
        },
      ],
      afternoon: [
        {
          stepTitle: "Hydration reset",
          reason: "Midday dehydration worsens inflammation signaling.",
          exactlyHowToPerform: "Drink water and avoid touching or rubbing affected areas.",
          time: "1:00-4:00 PM",
          quantity: "400-600 ml water",
          applicationArea: "Whole body hydration behavior",
          commonMistakes: ["Skipping water windows", "High-sugar drinks"],
          expectedBenefit: "Improved recovery consistency by evening.",
        },
      ],
      night: [
        {
          stepTitle: "Night treatment",
          reason: "Night window allows longer, uninterrupted repair.",
          exactlyHowToPerform: "Apply treatment in a thin, even layer, then seal with moisturizer after 3-5 minutes.",
          time: "8:00-11:00 PM",
          quantity: "Pea-sized active + thin moisturizer",
          applicationArea: "Concern-priority regions",
          commonMistakes: ["Applying too much", "Layering many new actives"],
          expectedBenefit: "Steadier weekly improvement in visible symptoms.",
        },
      ],
      weekly: [
        {
          stepTitle: "Weekly reset review",
          reason: "Protocol tuning prevents plateau and relapse.",
          exactlyHowToPerform: "Review adherence, identify 1 trigger, and adjust only one variable for the next week.",
          time: "Weekend",
          quantity: "10-15 minutes",
          applicationArea: "Routine behavior and trigger log",
          commonMistakes: ["Changing everything at once", "Skipping tracking"],
          expectedBenefit: "Higher precision and lower regression risk.",
        },
      ],
    },
    thingsToAvoid: {
      food: [
        {
          item: "Frequent high-sugar snacking",
          whyItDelaysRecovery: "Can amplify inflammatory load and recovery volatility.",
        },
      ],
      habits: [
        {
          item: "Inconsistent sleep timing",
          whyItDelaysRecovery: "Disrupts repair hormones and increases stress signals.",
        },
      ],
      environment: [
        {
          item: "Excess heat/friction exposure",
          whyItDelaysRecovery: "Increases irritation and barrier stress.",
        },
      ],
      productMistakes: [
        {
          item: "Introducing multiple products in one week",
          whyItDelaysRecovery: "Makes adverse reactions hard to detect and control.",
        },
      ],
    },
    recommendedProducts: [
      {
        productId: "core-cleanser",
        name: "Barrier-Friendly Cleanser",
        ingredientMatch: "Ceramides",
        whyRecommended: "Supports daily cleansing without stripping.",
        howToUse: "Use morning and night on damp skin.",
        howMuch: "Coin-sized",
        whenToUse: "AM + PM",
        expectedTimeline: "Comfort improvement in 7-10 days",
        commonMistakes: ["Using too much pressure"],
      },
      {
        productId: "core-treatment",
        name: "Target Active",
        ingredientMatch: "Issue-specific active",
        whyRecommended: `Directly addresses ${primary?.title || categoryLabel}.`,
        howToUse: "Apply on dry skin in a thin layer at night.",
        howMuch: "Pea-sized",
        whenToUse: "PM",
        expectedTimeline: "Visible trend change by weeks 3-4",
        commonMistakes: ["Over-application", "Mixing incompatible actives"],
      },
    ],
    dietPlan: {
      breakfast: ["Protein-rich breakfast", "Fiber source", "Low sugar beverage"],
      lunch: ["Balanced plate with vegetables", "Lean protein", "Hydration"],
      dinner: ["Early light dinner", "Protein + vegetables", "Lower processed carbs"],
      snacks: ["Nuts/seeds", "Fruit", "Unsweetened yogurt"],
      hydration: "Target 2.5-3.0L water daily unless medically restricted.",
      weeklyNutritionGoals: [
        "5+ days with stable meal timing",
        "Limit high-sugar snacks to <=2 days/week",
      ],
    },
    motivation: "Small daily wins compound into visible recovery. Do not chase perfection; chase consistency.",
    expectedTimeline: [
      {
        week: 1,
        expectedImprovements: ["Lower reactivity", "Better routine stability"],
        possibleSetbacks: ["Initial adjustment dryness"],
        continueDoing: ["Keep routine simple", "Track adherence daily"],
      },
      {
        week: 2,
        expectedImprovements: ["Early symptom trend-down"],
        possibleSetbacks: ["Inconsistent sleep effects"],
        continueDoing: ["Protect sleep and hydration windows"],
      },
      {
        week: 3,
        expectedImprovements: ["Visible improvement in primary concern"],
        possibleSetbacks: ["Overuse of actives can irritate"],
        continueDoing: ["Maintain measured product usage"],
      },
      {
        week: 4,
        expectedImprovements: ["More stable baseline and lower relapse risk"],
        possibleSetbacks: ["Dropping adherence after early gains"],
        continueDoing: ["Plan next month based on adherence and response"],
      },
    ],
    weeklyMilestones: [
      { week: 1, milestone: "Build baseline consistency", adherenceTarget: ">=75%" },
      { week: 2, milestone: "Reduce trigger variability", adherenceTarget: ">=80%" },
      { week: 3, milestone: "Stabilize active response", adherenceTarget: ">=85%" },
      { week: 4, milestone: "Lock sustainable routine", adherenceTarget: ">=85%" },
    ],
    confidenceNotes: [
      `Severity estimate: ${severityLabel(input.scores.overallSeverity)}.`,
      `Model confidence: ${confidenceLabel(input.scores.confidenceScore)}.`,
      "Protocol generated by fallback safety template when AI output is unavailable or invalid.",
      "Escalate to a licensed clinician for persistent or worsening symptoms.",
    ],
  };
}
