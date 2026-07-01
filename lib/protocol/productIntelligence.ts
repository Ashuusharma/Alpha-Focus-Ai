import { CategoryId } from "@/lib/questions";
import { getClinicalDemoProducts } from "@/lib/clinicalProductCatalog";
import { ProtocolToleranceMode } from "@/lib/protocolTemplates";

export type ProductIntelligenceSelection = {
  productId: string;
  name: string;
  ingredients: Array<{ name: string; concentration: string; purpose: string }>;
  category: CategoryId;
  tierLabel: string;
  whySelected: string;
  usage: string;
  ownedByUser: boolean;
  suitableSeverity: { min: number; max: number; label: string };
  suitableSkinOrHairType: string[];
  compatibleProducts: string[];
  incompatibleProducts: string[];
  applicationMethod: string;
  quantity: string;
  frequency: string;
  targetArea: string;
  precautions: string[];
  storage: string;
  expectedTimeline: string;
  expectedBenefit: string;
  faq: Array<{ question: string; answer: string }>;
  evidenceLevel: "clinical" | "established" | "anecdotal";
  version: string;
};

export type ProductIntelligence = {
  selectionLocked: true;
  selectionSource: "rules_v1";
  category?: string;
  severity: number;
  toleranceMode: ProtocolToleranceMode;
  ownershipCoveragePct: number;
  selectedProducts: ProductIntelligenceSelection[];
  explanationGuardrail: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTolerance(value?: string): ProtocolToleranceMode {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }
  return "intermediate";
}

export function buildProductIntelligence(input: {
  category?: string;
  severity: number;
  toleranceMode?: string;
  ownedProductIds?: string[];
}): ProductIntelligence {
  const toleranceMode = normalizeTolerance(input.toleranceMode);
  const category = input.category as CategoryId | undefined;
  const ownedProducts = new Set(input.ownedProductIds || []);

  const catalog = category
    ? getClinicalDemoProducts(category).filter((item) => item.suitableLevels.includes(toleranceMode))
    : [];

  const selectedRaw =
    input.severity >= 70
      ? catalog.slice(0, 2)
      : catalog.length > 0
        ? [catalog[0]]
        : [];

  const selectedProducts: ProductIntelligenceSelection[] = selectedRaw.map((item, index) => ({
    productId: item.id,
    name: item.name,
    ingredients: item.ingredients,
    category: item.category,
    tierLabel: index === 0 ? "Core Protocol" : "Clinical Booster",
    whySelected: item.why,
    usage: item.usage,
    ownedByUser: ownedProducts.has(item.id),
    suitableSeverity: item.suitableSeverity,
    suitableSkinOrHairType: item.suitableSkinOrHairType,
    compatibleProducts: item.compatibleProducts,
    incompatibleProducts: item.incompatibleProducts,
    applicationMethod: item.applicationMethod,
    quantity: item.quantity,
    frequency: item.frequency,
    targetArea: item.targetArea,
    precautions: item.precautions,
    storage: item.storage,
    expectedTimeline: item.expectedTimeline,
    expectedBenefit: item.expectedBenefit,
    faq: item.faq,
    evidenceLevel: item.evidenceLevel,
    version: item.version,
  }));

  const ownedCount = selectedProducts.filter((item) => item.ownedByUser).length;
  const ownershipCoveragePct = selectedProducts.length > 0 ? Math.round((ownedCount / selectedProducts.length) * 100) : 0;

  return {
    selectionLocked: true,
    selectionSource: "rules_v1",
    category: input.category,
    severity: clamp(Math.round(input.severity || 0)),
    toleranceMode,
    ownershipCoveragePct,
    selectedProducts,
    explanationGuardrail: "Products are selected by deterministic clinical logic with all fields pre-populated from product catalog. GPT must explain selected products only and must not introduce new products or modify any deterministic fields.",
  };
}
