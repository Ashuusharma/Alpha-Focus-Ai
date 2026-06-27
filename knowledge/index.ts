import { CategoryId } from "@/lib/questions";
import { CategoryKnowledgePack } from "@/knowledge/types";
import { acneKnowledgePack } from "@/knowledge/acne";
import { hairLossKnowledgePack } from "@/knowledge/hairLoss";
import { darkCirclesKnowledgePack } from "@/knowledge/darkCircles";
import { scalpKnowledgePack } from "@/knowledge/scalp";
import { bodyAcneKnowledgePack } from "@/knowledge/bodyAcne";
import { lipCareKnowledgePack } from "@/knowledge/lipCare";
import { antiAgingKnowledgePack } from "@/knowledge/antiAging";
import { beardGrowthKnowledgePack } from "@/knowledge/beardGrowth";

const knowledgeByCategory: Partial<Record<CategoryId, CategoryKnowledgePack>> = {
  acne: acneKnowledgePack,
  hair_loss: hairLossKnowledgePack,
  dark_circles: darkCirclesKnowledgePack,
  scalp_health: scalpKnowledgePack,
  body_acne: bodyAcneKnowledgePack,
  lip_care: lipCareKnowledgePack,
  anti_aging: antiAgingKnowledgePack,
  beard_growth: beardGrowthKnowledgePack,
};

export function getCategoryKnowledgePack(category?: string): CategoryKnowledgePack | null {
  if (!category) return null;
  return knowledgeByCategory[category as CategoryId] || null;
}
