import { ProductIntelligence } from "@/lib/protocol/productIntelligence";
import { ProtocolKnowledgeGraph } from "@/lib/protocol/knowledgeGraph";

export type RecommendationExplanation = {
  recommendation: string;
  reasons: string[];
};

export type ExplainabilityReport = {
  explainabilityVersion: string;
  summary: string[];
  recommendationExplanations: RecommendationExplanation[];
};

export function buildExplainabilityReport(input: {
  productIntelligence: ProductIntelligence;
  knowledgeGraph: ProtocolKnowledgeGraph;
}): ExplainabilityReport {
  const recommendationExplanations = input.productIntelligence.selectedProducts.map((product) => ({
    recommendation: product.name,
    reasons: [
      `Selected by deterministic product intelligence (${input.productIntelligence.selectionSource}).`,
      `Matched ingredient path for this category: ${product.ingredient}.`,
      product.ownedByUser ? "Already owned by user, supports immediate adherence." : "Not owned, keep fallback route active until available.",
    ],
  }));

  const graphReasons = input.knowledgeGraph.edges.slice(0, 2).map(
    (edge) => `Issue ${edge.issue} maps to ${edge.ingredient} through routine ${edge.routine}.`
  );

  return {
    explainabilityVersion: "v1.0.0",
    summary: [
      "Recommendations are generated from structured clinical intelligence before GPT drafting.",
      ...graphReasons,
    ],
    recommendationExplanations,
  };
}
