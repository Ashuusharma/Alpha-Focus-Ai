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
  const deterministicIngredients = input.ingredientIntelligence.slice(0, 3);
  const deterministicProducts = input.productIntelligence.selectedProducts;
  const deterministicRoutines = input.knowledgePack?.routineTemplates;

  const ingredientSection =
    deterministicIngredients.length > 0
      ? deterministicIngredients.map((item) => ({
          ingredient: item.displayName,
          purpose: item.whatItDoes[0] || "Support recovery pathway.",
          targets: item.idealCategories.slice(0, 4),
          whyItWorks: item.whatItDoes.join(" "),
          expectedTimeline: item.expectedTimeline,
          safetyNotes: item.safetyNotes.slice(0, 4),
        }))
      : [
          {
            ingredient: "Niacinamide",
            purpose: "Calm inflammation and support barrier balance.",
            targets: [categoryLabel],
            whyItWorks: "Supports barrier resilience while reducing visible reactivity.",
            expectedTimeline: "Visible stability improvement across weeks 2-4.",
            safetyNotes: ["Patch-test first", "Introduce gradually"],
          },
        ];

  const productSection =
    deterministicProducts.length > 0
      ? deterministicProducts.map((product) => ({
          productId: product.productId,
          name: product.name,
          ingredientMatch: product.ingredients.map((ing) => `${ing.name} ${ing.concentration}`).join(", "),
          whyRecommended: product.whySelected,
          howToUse: product.usage,
          applicationArea: "Concern-priority zone",
          amount: "As labeled for one application",
          timing: "Follow routine window guidance",
          expectedImprovement: "Steadier symptom control with consistent use",
          compatibilityWithCurrentRoutine: product.ownedByUser
            ? "Already in current routine and compatible when used as directed"
            : "Compatible with current routine when introduced one at a time",
        }))
      : [
          {
            productId: "core-cleanser",
            name: "Barrier-Friendly Cleanser",
            ingredientMatch: "Ceramides",
            whyRecommended: "Supports cleansing without stripping.",
            howToUse: "Use on damp skin, then rinse gently.",
            applicationArea: "Target concern zone and surrounding skin",
            amount: "Coin-sized",
            timing: "AM + PM",
            expectedImprovement: "Lower irritation baseline over 1-2 weeks",
            compatibilityWithCurrentRoutine: "Compatible with most routines and active stacks",
          },
        ];

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
      ...ingredientSection,
    ],
    monthlyRecoveryPlan: {
      morning: [
        {
          title: deterministicRoutines?.morning?.[0] || "Morning reset",
          purpose: "Start the day with low-irritation consistency.",
          why: "Early consistency reduces cumulative inflammation and prevents trigger stacking.",
          steps: [
            "Cleanse gently for 30-40 seconds with lukewarm water.",
            "Apply prescribed core product in a thin, even layer.",
            "Protect barrier before sun or pollution exposure.",
          ],
          timing: "6:00-9:00 AM",
          amount: "Coin-sized cleanser; thin treatment layer",
          frequency: "Daily",
          expectedImprovement: "Lower daytime reactivity and better routine adherence.",
          mistakesToAvoid: ["Using hot water", "Rubbing aggressively", "Stacking multiple new actives"],
          escalationCues: ["Persistent burning", "Worsening redness beyond 72 hours"],
        },
      ],
      afternoon: [
        {
          title: deterministicRoutines?.afternoon?.[0] || "Afternoon control window",
          purpose: "Reduce mid-day trigger accumulation.",
          why: "Hydration and friction control protect recovery momentum.",
          steps: [
            "Complete one hydration window.",
            "Avoid touching or picking affected zones.",
          ],
          timing: "1:00-4:00 PM",
          amount: "400-600 ml water",
          frequency: "Daily",
          expectedImprovement: "Smoother evening baseline and fewer flare spikes.",
          mistakesToAvoid: ["Skipping hydration", "High-sugar drinks"],
          escalationCues: ["Sudden swelling", "Rapid spread of irritation"],
        },
      ],
      night: [
        {
          title: deterministicRoutines?.night?.[0] || "Night repair block",
          purpose: "Use uninterrupted repair window for treatment response.",
          why: "Night recovery supports barrier restoration and symptom trend-down.",
          steps: [
            "Apply treatment to clean, dry skin.",
            "Wait 3-5 minutes before moisturizer.",
            "Keep the routine simple and consistent.",
          ],
          timing: "8:00-11:00 PM",
          amount: "Pea-sized active + thin moisturizer",
          frequency: "Daily or as tolerated",
          expectedImprovement: "Steadier week-over-week visible improvement.",
          mistakesToAvoid: ["Over-application", "Mixing conflicting actives"],
          escalationCues: ["Barrier breakdown", "Persistent irritation despite reduced frequency"],
        },
      ],
      weekly: [
        {
          title: "Weekly review and tune",
          purpose: "Prevent relapse and detect drift early.",
          why: "Small weekly adjustments outperform large reactive changes.",
          steps: [
            "Review adherence for the week.",
            "Identify one trigger pattern.",
            "Adjust one variable for next week only.",
          ],
          timing: "Weekend",
          amount: "10-15 minutes",
          frequency: "Weekly",
          expectedImprovement: "Higher precision and lower regression risk.",
          mistakesToAvoid: ["Changing everything at once", "Skipping tracking"],
          escalationCues: ["No improvement after 4 weeks", "Symptoms worsening despite adherence"],
        },
      ],
    },
    thingsToAvoid: {
      food: [
        {
          item: "Frequent high-sugar snacking",
          whyAvoid: "Can destabilize inflammatory pathways and increase volatility.",
          effectOnRecovery: "Slower trend-down and less predictable response.",
          betterAlternative: "Protein + fiber snacks with low added sugar.",
        },
      ],
      habits: [
        {
          item: "Inconsistent sleep timing",
          whyAvoid: "Disrupts repair signaling and stress regulation.",
          effectOnRecovery: "Reduced overnight recovery quality.",
          betterAlternative: "Fixed sleep/wake window with gradual adjustment.",
        },
      ],
      environment: [
        {
          item: "Excess heat/friction exposure",
          whyAvoid: "Increases barrier stress and local inflammation.",
          effectOnRecovery: "Higher irritation baseline and slower stabilization.",
          betterAlternative: "Reduce friction and keep temperature exposure moderate.",
        },
      ],
      productMistakes: [
        {
          item: "Introducing multiple products in one week",
          whyAvoid: "Obscures root cause when irritation appears.",
          effectOnRecovery: "Longer troubleshooting cycle and lower adherence.",
          betterAlternative: "Introduce one change at a time every 7 days.",
        },
      ],
    },
    recommendedProducts: productSection,
    dietPlan: {
      breakfast: ["Protein-rich breakfast", "Fiber source", "Low sugar beverage"],
      lunch: ["Balanced plate with vegetables", "Lean protein", "Hydration"],
      dinner: ["Early light dinner", "Protein + vegetables", "Lower processed carbs"],
      snacks: ["Nuts/seeds", "Fruit", "Unsweetened yogurt"],
      hydration: "Target 2.5-3.0L water daily unless medically restricted.",
      wellnessGuidance: [
        "5+ days with stable meal timing",
        "Limit high-sugar snacks to <=2 days/week",
        "Maintain sleep, hydration, and stress rhythm to support recovery",
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
