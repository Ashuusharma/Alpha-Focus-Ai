import Link from "next/link";
import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type Compatibility = "high" | "moderate" | "low";

type ProductItem = {
  id: string;
  name: string;
  concern: string;
  compatibility: Compatibility;
  confidence: number;
  href: string;
};

type CompatibleProductsProps = {
  products: ProductItem[];
};

function variantForCompatibility(level: Compatibility): "success" | "warning" | "danger" {
  if (level === "high") return "success";
  if (level === "moderate") return "warning";
  return "danger";
}

export default function CompatibleProducts({ products }: CompatibleProductsProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-semibold text-text-primary">Compatible Products</h2>
          <p className="mt-2 text-sm text-text-secondary">Products aligned to current protocol and tolerance profile.</p>
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <Link key={product.id} href={product.href} className="block rounded-2xl border border-gray-700 bg-card-soft p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{product.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">Target concern: {product.concern}</p>
                </div>
                <div className="text-right">
                  <StatusBadge variant={variantForCompatibility(product.compatibility)}>
                    {product.compatibility} compatibility
                  </StatusBadge>
                  <p className="metric-number mt-2 text-sm text-text-primary">{product.confidence}% confidence</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MedicalCard>
  );
}
