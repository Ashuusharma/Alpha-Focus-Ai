import { CategoryKnowledgePack } from "@/knowledge/types";

export const antiAgingKnowledgePack: CategoryKnowledgePack = {
  category: "anti_aging",
  version: "4.1.0",
  clinicalOverview: [
    "Photoaging and oxidative stress are primary long-term accelerators.",
    "Texture and fine-line improvement requires months of consistency.",
  ],
  commonCauses: ["UV/photoaging", "Oxidative stress", "Irregular long-term adherence"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Photoprotection and antioxidant baseline" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Structured retinoid progression" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Irritation-safe escalation and strict prevention" },
  ],
  recoveryGoals: ["Improve texture resilience", "Slow visible photoaging progression"],
  weeklyObjectives: ["Week 1: tolerance setup", "Week 2: rhythm lock", "Week 3: structural support", "Week 4: long-term handoff"],
  routineTemplates: {
    morning: ["Antioxidant layer", "Sunscreen"],
    afternoon: ["Outdoor reapplication"],
    night: ["Retinoid cadence", "Barrier support"],
    weekly: ["Irritation/tolerance audit"],
  },
  ingredientPriorities: ["retinol", "vitamin_c", "niacinamide"],
  lifestyleGuidance: ["Protect sleep quality", "Hydration and antioxidant-heavy foods"],
  indianAdaptations: ["High UV context needs strict sunscreen discipline", "Account for pollution and commute-related oxidative load"],
  contraindications: ["Avoid rapid high-frequency retinoid escalation", "Avoid sun exposure without SPF"],
  escalationCriteria: ["Escalate persistent irritation", "Escalate suspicious rapidly changing lesions"],
  expectedTimeline: ["4-8 weeks: early tone/texture trend", "8-16+ weeks: structural improvement"],
  confidenceRules: ["Confidence rises with sun-protection adherence", "Confidence lowers if baseline photo history is missing"],
};
