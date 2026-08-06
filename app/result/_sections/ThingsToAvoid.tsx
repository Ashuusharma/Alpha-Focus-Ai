import { AlertTriangle } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";

const BUCKET_LABELS: Record<keyof ProtocolReport["thingsToAvoid"], string> = {
  food: "Food",
  habits: "Habits",
  environment: "Environment",
  productMistakes: "Product Mistakes",
};

export default function ThingsToAvoid({ thingsToAvoid }: { thingsToAvoid: ProtocolReport["thingsToAvoid"] }) {
  const buckets = (Object.keys(BUCKET_LABELS) as (keyof ProtocolReport["thingsToAvoid"])[])
    .filter((bucket) => thingsToAvoid[bucket].length > 0);

  if (buckets.length === 0) return null;

  return (
    <section id="avoid" className="nv-section-white scroll-mt-24">
      <h2 className="af-heading-section font-black text-[var(--ink)]">Things To Avoid</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Common setbacks this protocol is designed to route around.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {buckets.map((bucket) => (
          <div key={bucket}>
            <h3 className="text-sm font-bold text-[var(--ink)]">{BUCKET_LABELS[bucket]}</h3>
            <div className="mt-2 space-y-2">
              {thingsToAvoid[bucket].map((item) => (
                <div
                  key={item.item}
                  className="flex gap-2.5 rounded-xl p-3 text-sm"
                  style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--warning-accent)]" />
                  <div>
                    <p><span className="font-semibold">{item.item}:</span> {item.whyAvoid}</p>
                    <p className="mt-1 text-xs opacity-80">Effect on recovery: {item.effectOnRecovery}</p>
                    <p className="text-xs opacity-80">Better alternative: {item.betterAlternative}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
