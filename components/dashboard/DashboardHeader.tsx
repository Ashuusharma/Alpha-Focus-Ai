import MedicalCard from "@/components/ui/MedicalCard";

type DashboardHeaderProps = {
  greeting: string;
  confidenceScore: number;
  primaryConcern: string;
  streakDays: number;
  chartPoints?: number[];
};

function buildPolyline(points: number[]) {
  const width = 280;
  const height = 80;
  const safe = points.length > 1 ? points : [40, 42, 43, 45, 47, 48, 50];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = Math.max(max - min, 1);

  return safe
    .map((point, index) => {
      const x = (index / (safe.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function DashboardHeader({
  greeting,
  confidenceScore,
  primaryConcern,
  streakDays,
  chartPoints = [58, 60, 63, 61, 66, 69, 72],
}: DashboardHeaderProps) {
  const polyline = buildPolyline(chartPoints);
  const trendDelta = chartPoints[chartPoints.length - 1] - chartPoints[0];
  const recoveryPercent = Math.max(0, Math.min(100, confidenceScore));

  return (
    <MedicalCard className="p-6 md:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">{greeting}</p>
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[conic-gradient(#2F6F57_0deg,#6E9F87_220deg,#E8E3DA_220deg,#E8E3DA_360deg)]">
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F4F1EB]">
                <span className="metric-number text-2xl text-text-primary">{confidenceScore}</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Health Overview</p>
              <p className="text-base font-semibold text-text-primary">Clinical Confidence</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-text-secondary">Primary Concern</p>
            <p className="text-lg font-semibold text-text-primary">{primaryConcern}</p>
          </div>

          <div className="rounded-xl border border-[#DDD7CC] bg-[#F7F4EE] px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Recovery</span>
              <span className="metric-number text-text-primary">{recoveryPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E3DA]">
              <div className="h-full rounded-full bg-medical-gradient" style={{ width: `${recoveryPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">7-day trend</p>
            <div className="rounded-xl border border-[#DDD7CC] bg-[#F7F4EE] p-3">
              <svg viewBox="0 0 280 80" className="h-20 w-full" role="img" aria-label="7-day confidence trend line">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  className="text-clinical-blue"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polyline}
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#DDD7CC] bg-[#F7F4EE] px-4 py-3">
            <span className="text-sm text-text-secondary">Trend & Streak</span>
            <span className="metric-number text-lg text-accent-teal">{trendDelta >= 0 ? "↗" : "↘"} {Math.abs(Math.round(trendDelta))} · {streakDays}d</span>
          </div>
        </div>
      </div>
    </MedicalCard>
  );
}
