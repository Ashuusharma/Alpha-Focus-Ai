type HealthOverviewPanelProps = {
  lastUpdatedLabel: string;
  alphaScore: number;
  confidence: number;
  recovery: number;
  consistency: number;
  primaryConcern: string;
  riskLevel: string;
  environmentalStress: number;
  dataCompleteness: number;
};

function MetricCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white/40 border border-white/40 shadow-sm backdrop-blur-sm hover:bg-white/60 transition-colors">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B665D] mb-2">{label}</p>
      <div>
         <p className="text-2xl font-bold text-[#1F3D2B]">{value}</p>
         {subtext && <p className="text-xs text-[#2F6F57] mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

export default function HealthOverviewPanel({
  lastUpdatedLabel,
  alphaScore,
  confidence,
  recovery,
  consistency,
  primaryConcern,
  riskLevel,
  environmentalStress,
  dataCompleteness,
}: HealthOverviewPanelProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-[#1F3D2B]">Live Health Grid</h2>
        <div className="flex items-center gap-2 text-xs text-[#6B665D]">
           <span className="w-2 h-2 rounded-full bg-[#2F6F57] animate-pulse"></span>
           Updated {lastUpdatedLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Alpha Score" value={alphaScore.toString()} subtext="/ 100" />
        <MetricCard label="Confidence" value={`${confidence}%`} subtext="Projected" />
        <MetricCard label="Recovery" value={`${recovery}%`} subtext="Resting Rate" />
        <MetricCard label="Consistency" value={`${consistency}%`} subtext="Routine Adherence" />
        
        <MetricCard label="Primary Concern" value={primaryConcern} />
        <MetricCard label="Risk Level" value={riskLevel} />
        <MetricCard label="Env. Stress" value={`${environmentalStress}/100`} subtext="Combined Impact" />
        <MetricCard label="Data Quality" value={`${dataCompleteness}%`} subtext="Completeness" />
      </div>
    </section>
  );
}
