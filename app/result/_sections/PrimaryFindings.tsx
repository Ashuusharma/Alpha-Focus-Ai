import { AlertCircle, HelpCircle, Repeat, ShieldCheck } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";

type FindingsColumn = {
  icon: React.ReactNode;
  title: string;
  items: string[];
};

export default function PrimaryFindings({
  issueSummary,
  confidenceNotes,
}: {
  issueSummary: ProtocolReport["issueSummary"];
  confidenceNotes: ProtocolReport["confidenceNotes"];
}) {
  const columns: FindingsColumn[] = [
    { icon: <AlertCircle className="h-4 w-4" />, title: "What Was Detected", items: issueSummary.whatWasDetected },
    { icon: <HelpCircle className="h-4 w-4" />, title: "Why It Happens", items: issueSummary.whyItHappens },
    { icon: <Repeat className="h-4 w-4" />, title: "Why Consistency Matters", items: issueSummary.whyConsistencyMatters },
  ];

  return (
    <section id="findings" className="nv-section-white scroll-mt-24">
      <h2 className="af-heading-section font-black text-[var(--ink)]">Primary Findings</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">The clinical picture behind this protocol.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title} className="af-surface-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                {column.icon}
              </span>
              {column.title}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-soft)]">
              {column.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {confidenceNotes.length > 0 && (
        <div className="af-card-subtle mt-4 flex gap-3 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Confidence Notes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
              {confidenceNotes.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
