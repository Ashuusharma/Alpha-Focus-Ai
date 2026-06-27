import { CategoryKnowledgePack } from "@/knowledge/types";
import { IngredientIntelligence } from "@/ingredients/types";

export type ProtocolGraphEdge = {
  issue: string;
  rootCause: string;
  severityModifier: string;
  ingredient: string;
  product: string;
  application: string;
  routine: string;
  lifestyle: string;
  diet: string;
  expectedImprovement: string;
  expectedChange: string;
  milestone: string;
  relapsePrevention: string;
};

export type ProtocolKnowledgeGraph = {
  category?: string;
  graphVersion: string;
  edges: ProtocolGraphEdge[];
};

export function buildProtocolKnowledgeGraph(input: {
  category?: string;
  issueTitles: string[];
  knowledgePack: CategoryKnowledgePack | null;
  ingredients: IngredientIntelligence[];
  selectedProducts: Array<{ name: string }>;
  weeklyMilestones: string[];
}): ProtocolKnowledgeGraph {
  const issue = input.issueTitles[0] || input.category || "priority concern";
  const pack = input.knowledgePack;
  const causes = pack?.commonCauses?.slice(0, 3) || ["Multifactor recovery burden", "Inconsistent adherence"];
  const overview = pack?.clinicalOverview?.[0] || "Clinical context requires consistency and tolerance-safe progression.";
  const milestones = input.weeklyMilestones.length > 0 ? input.weeklyMilestones : ["Week 1 stabilization", "Week 2 consistency"]; 

  const edges = input.ingredients.slice(0, 3).map((ingredient, idx) => ({
    issue,
    rootCause: causes[idx % causes.length],
    severityModifier: pack?.severityStages?.[1]?.focus || "Severity controls escalation speed and caution level",
    ingredient: ingredient.displayName,
    product: input.selectedProducts[idx]?.name || input.selectedProducts[0]?.name || "Core protocol product",
    application: ingredient.whenToUse[0] || "Apply according to tolerance mode",
    routine: pack?.routineTemplates?.night?.[0] || pack?.routineTemplates?.morning?.[0] || "Daily consistent morning and night routine",
    lifestyle: pack?.lifestyleGuidance?.[idx % Math.max(1, pack?.lifestyleGuidance.length || 1)] || overview,
    diet: pack?.indianAdaptations?.[0] || "Follow hydration and low-trigger nutrition consistency",
    expectedImprovement: ingredient.expectedTimeline,
    expectedChange: ingredient.expectedTimeline,
    milestone: milestones[idx % milestones.length],
    relapsePrevention: pack?.confidenceRules?.[0] || "Maintain high adherence and avoid abrupt routine changes",
  }));

  return {
    category: input.category,
    graphVersion: "v1.0.0",
    edges,
  };
}
