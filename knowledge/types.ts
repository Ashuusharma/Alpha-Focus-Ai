export interface CategoryKnowledge {
  category: string;
  version: string;
  clinicalOverview: string[];
  commonCauses: string[];
  severityStages: Array<{
    label: "mild" | "moderate" | "high";
    severityMin: number;
    severityMax: number;
    focus: string;
  }>;
  recoveryGoals: string[];
  weeklyObjectives: string[];
  routineTemplates: {
    morning: string[];
    afternoon: string[];
    night: string[];
    weekly: string[];
  };
  ingredientPriorities: string[];
  lifestyleGuidance: string[];
  indianAdaptations: string[];
  contraindications: string[];
  escalationCriteria: string[];
  expectedTimeline: string[];
  confidenceRules: string[];
}

export type CategoryKnowledgePack = CategoryKnowledge;
