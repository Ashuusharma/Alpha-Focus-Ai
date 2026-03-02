import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type Severity = "low" | "moderate" | "high" | "critical";

type ClinicalSummaryProps = {
  overview: string;
  keyFindings: string[];
  severity: Severity;
};

function severityVariant(severity: Severity): "success" | "warning" | "danger" | "info" {
  if (severity === "low") return "success";
  if (severity === "moderate") return "warning";
  if (severity === "high" || severity === "critical") return "danger";
  return "info";
}

export default function ClinicalSummary({ overview, keyFindings, severity }: ClinicalSummaryProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
          <h2 className="text-xl font-semibold text-text-primary">Clinical Summary</h2>
          <StatusBadge variant={severityVariant(severity)}>
            Severity: {severity.toUpperCase()}
          </StatusBadge>
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">{overview}</p>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-muted">Key Findings</p>
          <ul className="space-y-2">
            {keyFindings.map((finding) => (
              <li key={finding} className="rounded-xl border border-gray-700 bg-card-soft px-4 py-3 text-sm text-text-secondary">
                {finding}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MedicalCard>
  );
}
