import MedicalCard from "@/components/ui/MedicalCard";

type ReportHeaderProps = {
  title: string;
  subtitle?: string;
  patientName?: string;
  reportId?: string;
  generatedAt?: string;
  clinicianNote?: string;
};

export default function ReportHeader({
  title,
  subtitle,
  patientName = "Guest User",
  reportId,
  generatedAt,
  clinicianNote,
}: ReportHeaderProps) {
  return (
    <MedicalCard className="p-8">
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-5">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Clinical Report</p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-text-secondary">{subtitle}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-text-secondary md:grid-cols-3">
          <div className="rounded-xl border border-gray-700 bg-card-soft px-4 py-3">
            <p className="text-xs text-text-muted">Patient</p>
            <p className="mt-1 font-medium text-text-primary">{patientName}</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-card-soft px-4 py-3">
            <p className="text-xs text-text-muted">Report ID</p>
            <p className="mt-1 font-medium text-text-primary">{reportId ?? "AF-CLINICAL"}</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-card-soft px-4 py-3">
            <p className="text-xs text-text-muted">Generated</p>
            <p className="mt-1 font-medium text-text-primary">{generatedAt ?? "Just now"}</p>
          </div>
        </div>

        {clinicianNote ? (
          <div className="rounded-xl border border-gray-700 bg-card-soft px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">Clinician Note</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{clinicianNote}</p>
          </div>
        ) : null}
      </div>
    </MedicalCard>
  );
}
