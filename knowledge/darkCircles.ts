import { CategoryKnowledgePack } from "@/knowledge/types";

export const darkCirclesKnowledgePack: CategoryKnowledgePack = {
  category: "dark_circles",
  version: "4.1.0",
  clinicalOverview: [
    "Under-eye concerns are often multifactorial: sleep, vascular tone, pigmentation, and hydration.",
    "Consistency in sleep and sun protection drives visible recovery.",
  ],
  commonCauses: ["Sleep disruption", "Pigmentation and vascular tone", "Dehydration/allergy load"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Sleep-hydration correction" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Pigment and puffiness control" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Strict adherence and escalation safeguards" },
  ],
  recoveryGoals: ["Reduce puffiness", "Improve under-eye tone consistency"],
  weeklyObjectives: ["Week 1: sleep reset", "Week 2: puffiness control", "Week 3: tone support", "Week 4: maintenance"],
  routineTemplates: {
    morning: ["Cold compress", "Caffeine/brightening layer", "Sunscreen"],
    afternoon: ["Hydration check", "Eye-rubbing avoidance"],
    night: ["Repair layer and sleep prep"],
    weekly: ["Photo comparison", "Salt/sleep trigger review"],
  },
  ingredientPriorities: ["niacinamide", "retinol", "vitamin_c"],
  lifestyleGuidance: ["Regular bedtime", "Lower late-night screen intensity"],
  indianAdaptations: ["Manage salt-heavy dinners and late-night screen exposure", "Use commute-friendly morning de-puff routine"],
  contraindications: ["Avoid aggressive rubbing and over-exfoliation near eye area"],
  escalationCriteria: ["Escalate for pain/swelling asymmetry", "Escalate for persistent severe allergy symptoms"],
  expectedTimeline: ["2-4 weeks: puffiness stability", "6-12 weeks: tone improvement trend"],
  confidenceRules: ["Confidence improves with stable sleep data", "Confidence lowers if allergy context is missing"],
};
