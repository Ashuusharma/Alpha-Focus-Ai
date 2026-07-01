export interface CategoryKnowledge {
  category: string;
  version: string;
  clinicalOverview: string[];
  commonCauses: string[];
  evidenceRegistry?: string; // Reference to EVIDENCE_REGISTRY_INDEX key for clinical audit trail
  lastEvidenceReview?: string; // ISO 8601 date when evidence was last validated
  clinicalConfidenceScore?: number; // 0-100, from evidence registry
  thirtyDayPlan: Array<{
    week: 1 | 2 | 3 | 4;
    focus: string;
    priorities: string[];
    expectedChange: string;
  }>;
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
  productMapping: Array<{
    ingredient: string;
    productTypes: string[];
    rationale: string;
  }>;
  homeCareGuidance: string[];
  dietGuidance: string[];
  commonMistakes: string[];
  lifestyleGuidance: string[];
  indianAdaptations: string[];
  contraindications: string[];
  escalationCriteria: string[];
  expectedTimeline: string[];
  confidenceRules: string[];
}

export type CategoryKnowledgePack = CategoryKnowledge;
