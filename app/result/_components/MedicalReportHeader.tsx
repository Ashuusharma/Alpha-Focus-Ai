interface MedicalReportHeaderProps {
  reportId: string;
}

export default function MedicalReportHeader({ reportId }: MedicalReportHeaderProps) {
  return (
    <div className="border-b border-border-soft pb-6">
      <h1 className="text-3xl font-semibold text-white">AI Dermatology Report</h1>
      <div className="text-sm text-text-secondary mt-2">Report ID: {reportId}</div>
    </div>
  );
}
