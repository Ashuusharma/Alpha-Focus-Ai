import { CategoryKnowledgePack } from "@/knowledge/types";

export const beardGrowthKnowledgePack: CategoryKnowledgePack = {
  category: "beard_growth",
  version: "4.3.0",
  evidenceRegistry: "beard_growth",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 88,
  clinicalOverview: [
    "Beard appearance is influenced by genetics, inflammation, and grooming friction.",
    "Consistency in skin-under-beard care improves density presentation and comfort.",
  ],
  commonCauses: ["Genetic pattern variability", "Ingrown/inflammation burden", "Grooming friction"],
  thirtyDayPlan: [
    { week: 1, focus: "Protect follicles", priorities: ["gentle cleanse", "stop over-trimming", "map patchy zones"], expectedChange: "Less irritation around the beard line" },
    { week: 2, focus: "Support growth environment", priorities: ["topical consistency", "massage", "hydration"], expectedChange: "Better routine adherence" },
    { week: 3, focus: "Reduce ingrowns", priorities: ["light exfoliation", "grooming direction", "avoid picking"], expectedChange: "Fewer bump-related setbacks" },
    { week: 4, focus: "Maintain pattern", priorities: ["compare photos", "review trigger zones", "keep simple routine"], expectedChange: "More stable visible grooming outcome" },
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Grooming consistency and irritation prevention" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Ingrown control plus density support" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Inflammation reduction and escalation safeguards" },
  ],
  recoveryGoals: ["Reduce ingrown recurrence", "Improve beard density presentation"],
  productMapping: [
    { ingredient: "peptides", productTypes: ["serum"], rationale: "Supports density-focused grooming and follicle conditioning." },
    { ingredient: "salicylic_acid", productTypes: ["exfoliant", "pad"], rationale: "Helps prevent ingrown-prone blockage." },
  ],
  homeCareGuidance: ["Trim conservatively during active growth phases.", "Brush in the natural growth direction.", "Avoid harsh scratching or pulling."],
  dietGuidance: ["Make protein a daily baseline.", "Include zinc-supportive foods where appropriate.", "Keep hydration consistent through the day."],
  commonMistakes: ["Over-trimming patchy areas", "Skipping skin care under the beard", "Using too many fragrances or harsh products"],
  weeklyObjectives: ["Week 1: irritation control", "Week 2: ingrown reduction", "Week 3: density support", "Week 4: maintenance"],
  routineTemplates: {
    morning: ["Beard-zone cleanse", "Light hydration"],
    afternoon: ["Sweat and friction control"],
    night: ["Growth-support and ingrown prevention"],
    weekly: ["Shave pattern review"],
  },
  ingredientPriorities: ["niacinamide", "salicylic_acid"],
  lifestyleGuidance: ["Shave with grain", "Clean trimmer tools"],
  indianAdaptations: ["Manage shave frequency for climate and sweat load", "Control ingrown-prone zones after close shaving"],
  contraindications: ["Avoid aggressive against-grain shaving on inflamed skin"],
  escalationCriteria: ["Escalate for painful folliculitis", "Escalate recurring pustules with scarring risk"],
  expectedTimeline: ["2-4 weeks: ingrown control", "8-12 weeks: visible density pattern improvement"],
  confidenceRules: ["Confidence rises with grooming adherence", "Confidence lowers when ingrown history is incomplete"],
};
