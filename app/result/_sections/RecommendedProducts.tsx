import { PackageSearch, ShoppingBag } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";
import { formatINR } from "@/lib/currency";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function RecommendedProducts({
  products,
  onAddToCart,
}: {
  products: ProtocolReport["recommendedProducts"];
  onAddToCart: (product: ProtocolReport["recommendedProducts"][number], idx: number) => void;
}) {
  return (
    <section id="products" className="nv-section-white scroll-mt-24">
      <h2 className="text-xl font-black text-[var(--ink)]">Recommended Products</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Matched to the ingredients and routine above.</p>

      {products.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<PackageSearch className="h-5 w-5" />}
            title="No product matches yet"
            description="Your routine above still applies in full — product matching can be revisited after your next scan."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {products.map((product, idx) => (
            <div key={`${product.productId}-${idx}`} className="af-surface-soft flex flex-col p-4">
              <p className="text-base font-bold text-[var(--ink)]">{product.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {product.ingredientMatch || "Deterministic match"} · {product.timing}
              </p>

              <div className="mt-2 space-y-1.5 text-sm text-[var(--ink-soft)]">
                <p><span className="font-semibold text-[var(--ink)]">Why:</span> {product.whyRecommended}</p>
                <p><span className="font-semibold text-[var(--ink)]">How:</span> {product.howToUse}</p>
                <p><span className="font-semibold text-[var(--ink)]">Application area:</span> {product.applicationArea}</p>
              </div>

              <details className="mt-2 group">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--accent-blue)]">
                  Expected improvement &amp; compatibility
                </summary>
                <div className="mt-2 space-y-1.5 text-sm text-[var(--ink-soft)]">
                  <p><span className="font-semibold text-[var(--ink)]">Amount:</span> {product.amount}</p>
                  <p><span className="font-semibold text-[var(--ink)]">Expected improvement:</span> {product.expectedImprovement}</p>
                  <p><span className="font-semibold text-[var(--ink)]">Compatibility:</span> {product.compatibilityWithCurrentRoutine}</p>
                </div>
              </details>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3">
                <p className="text-sm font-semibold text-[var(--ink)]">{formatINR(999 + idx * 400)}</p>
                <Button onClick={() => onAddToCart(product, idx)} variant="primary" size="sm">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
