import { CategoryKnowledgePack } from "@/knowledge/types";

export const acneKnowledgePack: CategoryKnowledgePack = {
  category: "acne",
  version: "4.1.0",
  clinicalOverview: [
    "Acne intensity usually tracks with sebum load, clogged pores, and inflammation.",
    "Recovery depends on repeatable irritation control, not aggressive over-treatment.",
  ],
  commonCauses: [
    "Excess sebum and pore congestion",
    "Inflammatory cascade and barrier stress",
    "Lifestyle inconsistency and trigger exposure",
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Pore hygiene and barrier stability" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Consistent anti-congestion active cadence" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Irritation control and relapse risk reduction" },
  ],
  recoveryGoals: [
    "Reduce active breakouts and inflammation",
    "Improve tolerance to sustained routine",
  ],
  weeklyObjectives: ["Week 1: calm inflammation", "Week 2: reduce congestion", "Week 3: improve tolerance", "Week 4: relapse prevention"],
  routineTemplates: {
    morning: ["Gentle cleanse", "Niacinamide support", "Sunscreen"],
    afternoon: ["Hydration reset", "Hands-off lesion zones"],
    night: ["Targeted active", "Barrier moisturizer"],
    weekly: ["Progress review", "Trigger adjustment"],
  },
  ingredientPriorities: ["niacinamide", "salicylic_acid"],
  lifestyleGuidance: ["Sleep consistency", "Hydration rhythm", "Avoid picking lesions"],
  indianAdaptations: [
    "Use sweat-aware cleansing after commute and humid weather exposure.",
    "Keep sunscreen reapplication practical for outdoor Indian heat.",
  ],
  contraindications: ["Avoid over-exfoliation during irritation flare", "Avoid stacking many strong actives same day"],
  escalationCriteria: ["Escalate if painful nodules or scarring increase", "Escalate if no meaningful trend improvement by week 8-12"],
  expectedTimeline: ["Week 1-2: irritation and oil stabilization", "Week 3-4: visible breakout trend down"],
  confidenceRules: ["Increase confidence when adherence >=80%", "Lower confidence when key context is missing"],
};
