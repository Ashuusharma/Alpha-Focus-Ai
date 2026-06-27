import { CategoryKnowledgePack } from "@/knowledge/types";

export const beardGrowthKnowledgePack: CategoryKnowledgePack = {
  category: "beard_growth",
  version: "4.1.0",
  clinicalOverview: [
    "Beard appearance is influenced by genetics, inflammation, and grooming friction.",
    "Consistency in skin-under-beard care improves density presentation and comfort.",
  ],
  commonCauses: ["Genetic pattern variability", "Ingrown/inflammation burden", "Grooming friction"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Grooming consistency and irritation prevention" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Ingrown control plus density support" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Inflammation reduction and escalation safeguards" },
  ],
  recoveryGoals: ["Reduce ingrown recurrence", "Improve beard density presentation"],
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
