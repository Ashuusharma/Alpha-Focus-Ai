import { CategoryKnowledgePack } from "@/knowledge/types";

export const hairLossKnowledgePack: CategoryKnowledgePack = {
  category: "hair_loss",
  version: "4.1.0",
  clinicalOverview: [
    "Differentiate stress-linked shedding from progressive patterned loss.",
    "Progress requires scalp environment support and long-term adherence.",
  ],
  commonCauses: ["Pattern progression", "Scalp inflammation/buildup", "Stress and nutrition gaps"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Scalp conditioning and baseline consistency" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Targeted scalp actives and adherence" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Relapse prevention and specialist escalation readiness" },
  ],
  recoveryGoals: ["Reduce trigger-driven shedding", "Preserve existing follicle quality"],
  weeklyObjectives: ["Week 1: stabilize scalp", "Week 2: lock routine", "Week 3: reduce shedding triggers", "Week 4: maintain consistency"],
  routineTemplates: {
    morning: ["Scalp hygiene check", "Growth-support topical if prescribed"],
    afternoon: ["Hydration and stress break"],
    night: ["Gentle scalp care", "Friction reduction before sleep"],
    weekly: ["Shedding trend review", "Routine adherence audit"],
  },
  ingredientPriorities: ["ketoconazole"],
  lifestyleGuidance: ["Protein with every main meal", "Lower heat styling", "Stress-control habit"],
  indianAdaptations: [
    "Handle helmet, sweat, and pollution-related scalp load with wash scheduling.",
    "Prioritize protein intake in common Indian meal patterns.",
  ],
  contraindications: ["Avoid aggressive rubbing and harsh cleansers", "Avoid tight hairstyles during active shedding"],
  escalationCriteria: ["Escalate for sudden patchy loss or pain", "Escalate if rapid progression persists"],
  expectedTimeline: ["2-6 weeks: shedding trigger stabilization", "8-16+ weeks: visible density trend insight"],
  confidenceRules: ["Confidence rises with repeated photo tracking", "Confidence drops when adherence <60%"],
};
