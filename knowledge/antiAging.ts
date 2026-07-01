import { CategoryKnowledgePack } from "@/knowledge/types";

export const antiAgingKnowledgePack: CategoryKnowledgePack = {
  category: "anti_aging",
  version: "4.3.0",
  evidenceRegistry: "anti_aging",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 94,
  clinicalOverview: [
    "Photoaging and oxidative stress are primary long-term accelerators.",
    "Texture and fine-line improvement requires months of consistency.",
  ],
  commonCauses: ["UV/photoaging", "Oxidative stress", "Irregular long-term adherence"],
  thirtyDayPlan: [
    { week: 1, focus: "Protect daily", priorities: ["daily SPF", "gentle cleanse", "hydration"], expectedChange: "Less daily stress and better consistency" },
    { week: 2, focus: "Add antioxidant support", priorities: ["AM antioxidant", "night repair", "avoid over-exfoliation"], expectedChange: "Subtle tone and comfort improvement" },
    { week: 3, focus: "Improve turnover tolerance", priorities: ["slow active cadence", "barrier moisturizer", "sleep rhythm"], expectedChange: "Better tolerance to the core routine" },
    { week: 4, focus: "Maintain structure", priorities: ["keep SPF strict", "review photos", "avoid product jumps"], expectedChange: "More stable tone/texture trend" },
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Photoprotection and antioxidant baseline" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Structured retinoid progression" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Irritation-safe escalation and strict prevention" },
  ],
  recoveryGoals: ["Improve texture resilience", "Slow visible photoaging progression"],
  productMapping: [
    { ingredient: "vitamin_c", productTypes: ["serum"], rationale: "Supports antioxidant defense and daily brightness." },
    { ingredient: "retinoid", productTypes: ["night cream", "treatment"], rationale: "Supports gradual turnover and texture refinement." },
    { ingredient: "niacinamide", productTypes: ["serum", "moisturizer"], rationale: "Helps barrier and tone support alongside actives." },
  ],
  homeCareGuidance: ["Use sunscreen every day.", "Introduce stronger actives slowly.", "Maintain a barrier-first approach when irritation appears."],
  dietGuidance: ["Prioritize hydration and regular meals.", "Use antioxidant-rich foods as support, not replacement.", "Keep alcohol and sleep debt modest when possible."],
  commonMistakes: ["Using too many active products together", "Skipping sunscreen", "Expecting rapid visible changes"],
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
