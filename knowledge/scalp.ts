import { CategoryKnowledgePack } from "@/knowledge/types";

export const scalpKnowledgePack: CategoryKnowledgePack = {
  category: "scalp_health",
  version: "4.3.0",
  evidenceRegistry: "scalp_health",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 87,
  clinicalOverview: [
    "Scalp flaking and itch often worsen with oil-yeast imbalance and irritation cycles.",
    "Recovery needs antifungal cadence plus irritation prevention.",
  ],
  commonCauses: ["Yeast/oil imbalance", "Irritation cycle", "Inconsistent wash cadence"],
  thirtyDayPlan: [
    { week: 1, focus: "Reduce itch", priorities: ["wash cadence", "dry scalp fully", "stop scratching"], expectedChange: "Less itch during the day" },
    { week: 2, focus: "Control flakes", priorities: ["targeted cleanser", "gentle rinse", "simple styling"], expectedChange: "Lower visible flake load" },
    { week: 3, focus: "Stabilize comfort", priorities: ["watch triggers", "post-sweat dry-down", "sleep rhythm"], expectedChange: "Fewer flare spikes" },
    { week: 4, focus: "Lock prevention", priorities: ["review wash schedule", "avoid scratching", "keep one routine"], expectedChange: "Better long-term scalp control" },
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Consistent scalp hygiene" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Targeted antifungal cadence" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Flare control and escalation monitoring" },
  ],
  recoveryGoals: ["Reduce itch and flakes", "Stabilize scalp comfort"],
  weeklyObjectives: ["Week 1: itch reduction", "Week 2: flake control", "Week 3: comfort stabilization", "Week 4: relapse guardrails"],
  routineTemplates: {
    morning: ["Scalp check and dryness control"],
    afternoon: ["Post-sweat dry-down routine"],
    night: ["Targeted soothing if itchy"],
    weekly: ["Wash cadence review"],
  },
  ingredientPriorities: ["ketoconazole"],
  productMapping: [
    { ingredient: "ketoconazole", productTypes: ["shampoo", "scalp cleanser"], rationale: "Useful for scalp flake control and maintaining a calmer scalp environment." },
    { ingredient: "panthenol", productTypes: ["tonic", "leave-on serum"], rationale: "Supports comfort and barrier care after wash days." },
  ],
  homeCareGuidance: ["Dry the scalp fully after sweating.", "Avoid very hot water on flare days.", "Keep nails short to reduce damage from scratching."],
  dietGuidance: ["Use regular meals instead of long fasting gaps.", "Hydrate consistently in hot weather.", "Make protein a daily baseline."],
  commonMistakes: ["Leaving the scalp damp", "Using harsh cleansing too often", "Scratching flakes off forcefully"],
  lifestyleGuidance: ["Avoid scratching", "Dry scalp quickly after sweating"],
  indianAdaptations: ["Adjust wash frequency to humidity/sweat load", "Avoid prolonged damp scalp in monsoon and summer"],
  contraindications: ["Avoid very hot water on active flare days"],
  escalationCriteria: ["Escalate for painful/red swollen scalp", "Escalate if no improvement after one month"],
  expectedTimeline: ["1-3 weeks: itch reduction", "3-6 weeks: stable flake control"],
  confidenceRules: ["Confidence increases with repeated wash adherence", "Confidence decreases with missing flare logs"],
};
