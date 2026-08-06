import { FlaskConical } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";

function humanize(label: string) {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProtocolIngredients({ ingredients }: { ingredients: ProtocolReport["mainResolvingIngredients"] }) {
  return (
    <section id="ingredients" className="nv-section-white scroll-mt-24">
      <h2 className="af-heading-section font-black text-[var(--ink)]">Ingredients &amp; Treatments</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">The active ingredients this protocol is built around, and why.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {ingredients.map((item) => (
          <div key={item.ingredient} className="af-surface-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              {item.ingredient}
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.purpose}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.targets.map((target) => (
                <span key={target} className="af-badge-chip text-[10px]">{humanize(target)}</span>
              ))}
            </div>

            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--accent-blue)]">
                Why it works &amp; safety notes
              </summary>
              <div className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
                <p>{item.whyItWorks}</p>
                <p><span className="font-semibold text-[var(--ink)]">Expected timeline:</span> {item.expectedTimeline}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {item.safetyNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
