import { CategoryKnowledgePack } from "@/knowledge/types";

export const acneKnowledgePack: CategoryKnowledgePack = {
  category: "acne",
  version: "4.3.0",
  evidenceRegistry: "acne",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 92,
  clinicalOverview: [
    "Acne intensity usually tracks with sebum load, clogged pores, and inflammation.",
    "Recovery depends on repeatable irritation control, not aggressive over-treatment.",
  ],
  commonCauses: [
    "Excess sebum and pore congestion",
    "Inflammatory cascade and barrier stress",
    "Lifestyle inconsistency and trigger exposure",
  ],
  thirtyDayPlan: [
    { week: 1, focus: "Calm the barrier", priorities: ["gentle cleanse", "single active only", "sunscreen"], expectedChange: "Less stinging and fewer new irritation spikes" },
    { week: 2, focus: "Reduce congestion", priorities: ["consistent acne active", "no picking", "sweat cleanup"], expectedChange: "Early reduction in clogged pore activity" },
    { week: 3, focus: "Improve tolerance", priorities: ["stable moisturizer", "no stacking actives", "sleep rhythm"], expectedChange: "Better adherence and lower dryness" },
    { week: 4, focus: "Lock maintenance", priorities: ["review triggers", "photo tracking", "keep one change at a time"], expectedChange: "More stable baseline with fewer flare rebounds" },
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
  productMapping: [
    { ingredient: "niacinamide", productTypes: ["serum", "moisturizer"], rationale: "Supports oil balance, redness control, and barrier tolerance." },
    { ingredient: "salicylic_acid", productTypes: ["leave-on treatment", "cleanser"], rationale: "Targets clogged pores and recurring congestion." },
    { ingredient: "ceramides", productTypes: ["moisturizer"], rationale: "Helps keep the routine tolerable when actives are used." },
  ],
  homeCareGuidance: ["Keep cleansing gentle and avoid over-washing.", "Use non-comedogenic moisturizer daily.", "Do not squeeze or scrub active lesions."],
  dietGuidance: ["Build meals around protein and fiber.", "Keep sugary snacks occasional instead of daily.", "Use stable meal timing to support adherence."],
  commonMistakes: ["Adding too many actives in one week", "Skipping sunscreen", "Picking lesions"],
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
