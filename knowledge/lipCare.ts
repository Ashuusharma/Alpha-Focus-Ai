import { CategoryKnowledgePack } from "@/knowledge/types";

export const lipCareKnowledgePack: CategoryKnowledgePack = {
  category: "lip_care",
  version: "4.1.0",
  clinicalOverview: [
    "Lip concerns usually involve barrier damage and UV-linked darkening cycles.",
    "Fastest gains come from steady daytime protection and night repair.",
  ],
  commonCauses: ["UV exposure", "Barrier damage", "Dehydration and friction"],
  severityStages: [
    { label: "mild", severityMin: 0, severityMax: 39, focus: "Hydration and SPF consistency" },
    { label: "moderate", severityMin: 40, severityMax: 69, focus: "Repair plus tone-support rhythm" },
    { label: "high", severityMin: 70, severityMax: 100, focus: "Crack prevention and escalation readiness" },
  ],
  recoveryGoals: ["Repair lip barrier", "Prevent UV-linked darkening"],
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
