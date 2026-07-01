import { CategoryKnowledgePack } from "@/knowledge/types";

export const darkCirclesKnowledgePack: CategoryKnowledgePack = {
  category: "dark_circles",
  version: "4.3.0",
  evidenceRegistry: "dark_circles",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 85,
  clinicalOverview: [
    "Under-eye concerns are often multifactorial: sleep, vascular tone, pigmentation, and hydration.",
    "Consistency in sleep and sun protection drives visible recovery.",
  ],
  commonCauses: ["Sleep disruption", "Pigmentation and vascular tone", "Dehydration/allergy load"],
  thirtyDayPlan: [
    { week: 1, focus: "Reduce puffiness", priorities: ["sleep timing", "hydration", "gentle AM care"], expectedChange: "Slightly calmer morning eye area" },
    { week: 2, focus: "Improve protection", priorities: ["daily SPF", "avoid rubbing", "simple routine"], expectedChange: "Less irritation and rebound darkening" },
    { week: 3, focus: "Build consistency", priorities: ["night repair", "screen cutoff", "photo tracking"], expectedChange: "More stable under-eye appearance" },
    { week: 4, focus: "Lock maintenance", priorities: ["keep sleep window", "repeat gentle steps", "review triggers"], expectedChange: "Better baseline and clearer trend" },
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Sleep-hydration correction" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Pigment and puffiness control" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Strict adherence and escalation safeguards" },
  ],
  recoveryGoals: ["Reduce puffiness", "Improve under-eye tone consistency"],
  productMapping: [
    { ingredient: "caffeine", productTypes: ["eye serum"], rationale: "Helps morning puffiness and vascular tone." },
    { ingredient: "retinoid", productTypes: ["eye cream"], rationale: "Supports gradual texture and tone refinement." },
  ],
  homeCareGuidance: ["Avoid rubbing the under-eye area.", "Use gentle application only.", "Keep sleep timing as steady as possible."],
  dietGuidance: ["Prioritize hydration first thing in the day.", "Keep late salty snacking modest.", "Use stable sleep-supportive habits before adding more topicals."],
  commonMistakes: ["Using too much eye product", "Skipping sunscreen around the orbital bone", "Chasing quick fixes without sleep correction"],
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
