import { CategoryKnowledgePack } from "@/knowledge/types";

export const lipCareKnowledgePack: CategoryKnowledgePack = {
  category: "lip_care",
  version: "4.3.0",
  evidenceRegistry: "lip_care",
  lastEvidenceReview: "2026-07-01",
  clinicalConfidenceScore: 89,
  clinicalOverview: [
    "Lip concerns usually involve barrier damage and UV-linked darkening cycles.",
    "Fastest gains come from steady daytime protection and night repair.",
  ],
  commonCauses: ["UV exposure", "Barrier damage", "Dehydration and friction"],
  thirtyDayPlan: [
    { week: 1, focus: "Seal the barrier", priorities: ["occlusive balm", "avoid licking", "hydrate"], expectedChange: "Less cracking and tightness" },
    { week: 2, focus: "Protect from sun", priorities: ["SPF balm", "reapply outdoors", "keep routine simple"], expectedChange: "Less UV-triggered worsening" },
    { week: 3, focus: "Improve repair", priorities: ["night ointment", "gentle exfoliation only if needed", "no picking"], expectedChange: "Faster comfort rebound" },
    { week: 4, focus: "Maintain softness", priorities: ["keep SPF and occlusion", "review triggers", "consistent hydration"], expectedChange: "More stable lip texture" },
  ],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Hydration and SPF consistency" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Repair plus tone-support rhythm" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Crack prevention and escalation readiness" },
  ],
  recoveryGoals: ["Repair lip barrier", "Prevent UV-linked darkening"],
  productMapping: [
    { ingredient: "SPF", productTypes: ["lip balm"], rationale: "Protects against UV-driven worsening and pigment rebound." },
    { ingredient: "petrolatum", productTypes: ["ointment"], rationale: "Locks in moisture and supports overnight repair." },
  ],
  homeCareGuidance: ["Apply balm before outdoor exposure.", "Avoid frequent lip licking.", "Use a thick night layer when cracking is active."],
  dietGuidance: ["Hydrate consistently.", "Keep spicy/irritant foods in check if they trigger lip licking.", "Use regular meal timing to support recovery habits."],
  commonMistakes: ["Using matte drying products", "Ignoring sun exposure", "Picking dry skin"],
  weeklyObjectives: ["Week 1: crack reduction", "Week 2: hydration lock", "Week 3: tone support", "Week 4: sustain protection"],
  routineTemplates: {
    morning: ["SPF lip layer"],
    afternoon: ["Reapply protection outdoors"],
    night: ["Occlusive repair layer"],
    weekly: ["Irritation trigger review"],
  },
  ingredientPriorities: ["vitamin_c"],
  lifestyleGuidance: ["Avoid lip licking", "Hydrate steadily"],
  indianAdaptations: ["Keep daytime SPF lip reapply easy during travel", "Hydration support in dry and hot climates"],
  contraindications: ["Avoid over-exfoliating active cracked lips"],
  escalationCriteria: ["Escalate if cracking/bleeding persists", "Escalate for sudden severe swelling"],
  expectedTimeline: ["3-10 days: crack repair support", "2-6 weeks: tone stabilization"],
  confidenceRules: ["Confidence rises with SPF adherence", "Confidence lowers if UV exposure context is unknown"],
};
