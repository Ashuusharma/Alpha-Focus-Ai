import MedicalCard from "@/components/ui/MedicalCard";

type CauseItem = {
  title: string;
  description: string;
  evidence: string;
};

type RootCauseAnalysisProps = {
  causes: CauseItem[];
};

export default function RootCauseAnalysis({ causes }: RootCauseAnalysisProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-5">
        <h2 className="border-b border-gray-700 pb-4 text-xl font-semibold text-text-primary">Root Cause Analysis</h2>

        <div className="space-y-4">
          {causes.map((cause) => (
            <article key={cause.title} className="rounded-xl border border-gray-700 bg-card-soft p-5">
              <h3 className="text-base font-semibold text-text-primary">{cause.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{cause.description}</p>
              <div className="mt-3 border-t border-gray-700 pt-3">
                <p className="text-xs uppercase tracking-wide text-text-muted">Clinical Evidence</p>
                <p className="mt-1 text-sm text-text-secondary">{cause.evidence}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </MedicalCard>
  );
}
