"use client";

interface IngredientsDisplayProps {
  productName: string;
  ingredients?: string[];
}

export default function IngredientsDisplay({
  productName,
  ingredients,
}: IngredientsDisplayProps) {
  // Mock ingredients based on product type for demo
  const ingredientMap: Record<string, string[]> = {
    "Hair Growth Tonic": [
      "Biotin - Strengthens hair follicles",
      "Caffeine - Stimulates blood flow to scalp",
      "Ginger Extract - Increases nutrient delivery",
      "Vitamin B5 - Nourishes and hydrates",
      "Plant-based Oils - Conditions & seals cuticle",
    ],
    "Anti-Dandruff Shampoo": [
      "Ketoconazole 2% - Kills dandruff-causing fungi",
      "Zinc Pyrithione - Balances scalp microbiome",
      "Tea Tree Oil - Natural antimicrobial",
      "Aloe Vera - Soothes irritation",
      "Sodium Sulfate - Gentle cleansing",
    ],
    "Oil-Free Face Wash": [
      "Salicylic Acid - Unclogs pores",
      "Niacinamide - Controls sebum production",
      "Zinc - Reduces inflammation",
      "Charcoal - Deep cleaning detoxifier",
      "Green Tea Extract - Antioxidant protection",
    ],
  };

  const items = ingredients || ingredientMap[productName] || [];

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <h5 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
        🧪 Key Ingredients
      </h5>

      <div className="space-y-2">
        {items.map((ingredient, idx) => (
          <div key={idx} className="flex gap-3 text-xs sm:text-sm">
            <span className="text-primary font-bold">✓</span>
            <span className="text-gray-300">{ingredient}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-xs text-secondary/80">
          💡 These ingredients work together to target your specific concern and
          accelerate healing.
        </p>
      </div>
    </div>
  );
}
