import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type InsightsPanelProps = {
  aiInsight: string;
  warning: string;
  improvementNote: string;
};

export default function InsightsPanel({ aiInsight, warning, improvementNote }: InsightsPanelProps) {
  return (
    <MedicalCard className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Insights Panel</h3>

      <div className="rounded-xl border border-[#DDD7CC] bg-[#F7F4EE] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge variant="info">AI Recommendation</StatusBadge>
          <StatusBadge variant="warning">Attention Area</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-text-secondary">{aiInsight} {warning} {improvementNote}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/result" className="rounded-xl bg-medical-gradient px-4 py-2 text-sm font-semibold text-[#F4F1EB]">View Full Protocol</a>
          <a href="/tracking" className="rounded-xl border border-[#D9D2C7] bg-white px-4 py-2 text-sm font-semibold text-[#2F6F57]">Log Today’s Routine</a>
        </div>
      </div>
    </MedicalCard>
  );
}
