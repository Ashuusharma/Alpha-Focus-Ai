import { CategoryKnowledgePack } from "@/knowledge/types";

export const bodyAcneKnowledgePack: CategoryKnowledgePack = {
  category: "body_acne",
  version: "4.1.0",
  clinicalOverview: [
    "Body acne is often driven by sweat retention, friction, and delayed post-workout cleansing.",
    "Barrier-friendly consistency is needed for long-term control.",
  ],
  commonCauses: ["Sweat retention", "Fabric friction", "Delayed post-workout cleansing"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Sweat hygiene consistency" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Pore-active cadence plus barrier support" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Inflammation control and scar-risk prevention" },
  ],
  recoveryGoals: ["Reduce recurrent body congestion", "Lower inflammation and mark risk"],
  weeklyObjectives: ["Week 1: sweat hygiene reset", "Week 2: congestion control", "Week 3: irritation reduction", "Week 4: maintenance"],
  routineTemplates: {
    morning: ["Breathable fabric prep", "Irritation-safe layer"],
    afternoon: ["Post-sweat clean-up"],
    night: ["Body active + repair"],
    weekly: ["Friction trigger review"],
  },
  ingredientPriorities: ["salicylic_acid", "niacinamide"],
  lifestyleGuidance: ["Change sweaty clothes quickly", "Avoid squeezing lesions"],
  indianAdaptations: ["Post-gym shower windows are critical in Indian heat", "Prefer breathable fabrics for commute and training"],
  contraindications: ["Avoid heavy occlusive body layers on active lesions"],
  escalationCriteria: ["Escalate for painful boils/fever", "Escalate for increasing dark marks/scars"],
  expectedTimeline: ["2-4 weeks: congestion reduction", "4-8 weeks: flare frequency drop"],
  confidenceRules: ["Confidence rises with post-sweat adherence", "Confidence falls if friction context is missing"],
};
