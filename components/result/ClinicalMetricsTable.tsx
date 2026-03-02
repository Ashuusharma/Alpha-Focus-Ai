import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type Severity = "low" | "moderate" | "high";

type MetricRow = {
  metric: string;
  value: string;
  confidence: number;
  severity: Severity;
};

type ClinicalMetricsTableProps = {
  rows: MetricRow[];
};

function severityVariant(severity: Severity): "success" | "warning" | "danger" {
  if (severity === "low") return "success";
  if (severity === "moderate") return "warning";
  return "danger";
}

export default function ClinicalMetricsTable({ rows }: ClinicalMetricsTableProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-5">
        <h2 className="border-b border-gray-700 pb-4 text-xl font-semibold text-text-primary">Clinical Metrics</h2>

        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-card-soft">
              <tr className="text-text-secondary">
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metric} className="border-t border-gray-700 text-text-secondary">
                  <td className="px-4 py-3 text-text-primary">{row.metric}</td>
                  <td className="px-4 py-3">{row.value}</td>
                  <td className="px-4 py-3">{row.confidence}%</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={severityVariant(row.severity)}>{row.severity}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MedicalCard>
  );
}
