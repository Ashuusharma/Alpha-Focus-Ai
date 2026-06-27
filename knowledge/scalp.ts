import { CategoryKnowledgePack } from "@/knowledge/types";

export const scalpKnowledgePack: CategoryKnowledgePack = {
  category: "scalp_health",
  version: "4.1.0",
  clinicalOverview: [
    "Scalp flaking and itch often worsen with oil-yeast imbalance and irritation cycles.",
    "Recovery needs antifungal cadence plus irritation prevention.",
  ],
  commonCauses: ["Yeast/oil imbalance", "Irritation cycle", "Inconsistent wash cadence"],
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
  lifestyleGuidance: ["Avoid scratching", "Dry scalp quickly after sweating"],
  indianAdaptations: ["Adjust wash frequency to humidity/sweat load", "Avoid prolonged damp scalp in monsoon and summer"],
  contraindications: ["Avoid very hot water on active flare days"],
  escalationCriteria: ["Escalate for painful/red swollen scalp", "Escalate if no improvement after one month"],
  expectedTimeline: ["1-3 weeks: itch reduction", "3-6 weeks: stable flake control"],
  confidenceRules: ["Confidence increases with repeated wash adherence", "Confidence decreases with missing flare logs"],
};
