import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type IngredientRisk = "compatible" | "caution" | "avoid" | "monitor";

type IngredientItem = {
  name: string;
  purpose: string;
  rationale: string;
  risk: IngredientRisk;
};

type IngredientCardsProps = {
  ingredients: IngredientItem[];
};

function riskVariant(risk: IngredientRisk): "success" | "warning" | "danger" | "info" {
  if (risk === "compatible") return "success";
  if (risk === "caution") return "warning";
  if (risk === "avoid") return "danger";
  return "info";
}

export default function IngredientCards({ ingredients }: IngredientCardsProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-semibold text-text-primary">Ingredient Review</h2>
          <p className="mt-2 text-sm text-text-secondary">Clinical suitability and tolerance guidance.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ingredients.map((item) => (
            <article key={item.name} className="rounded-2xl border border-gray-700 bg-card-soft p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-text-primary">{item.name}</h3>
                <StatusBadge variant={riskVariant(item.risk)}>{item.risk}</StatusBadge>
              </div>

              <p className="mt-2 text-sm text-text-secondary">{item.purpose}</p>

              <div className="mt-4 border-t border-gray-700 pt-3">
                <p className="text-xs uppercase tracking-wide text-text-muted">Clinical rationale</p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.rationale}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </MedicalCard>
  );
}
