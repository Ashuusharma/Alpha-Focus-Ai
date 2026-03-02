import Link from "next/link";
import ClinicalSnapshotPanel from "@/components/dashboard/ClinicalSnapshotPanel";

type TrendPoint = {
  day: string;
  alpha: number;
  consistency: number;
  recovery: number;
};

type HomePrimaryStatusProps = {
  alphaScore: number;
  confidence: number;
  recovery: number;
  consistency: number;
  environmentalStress: number;
  primaryConcern: string;
  nextAction: string;
  aiInsight: string;
  lastUpdatedLabel: string;
  expectedVisibleChange: string;
  trendData: TrendPoint[];
};

export default function HomePrimaryStatus({
  alphaScore,
  confidence,
  recovery,
  consistency,
  environmentalStress,
  primaryConcern,
  nextAction,
  aiInsight,
  lastUpdatedLabel,
  expectedVisibleChange,
  trendData,
}: HomePrimaryStatusProps) {
  const safeRecovery = Math.max(0, Math.min(100, Math.round(recovery)));
  const safeConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
  const safeAlpha = Math.max(0, Math.min(100, Math.round(alphaScore)));

  return (
    <section className="grid grid-cols-12 gap-4 lg:gap-5 items-stretch">
      <div className="col-span-12 min-w-0 rounded-2xl border border-[#E2DDD4] bg-card-soft-gradient p-4 sm:p-6 shadow-card lg:col-span-7">
        <p className="text-xs uppercase tracking-wide text-[#6E9F87]">Personal Wellness Command Center</p>
        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1E4D3A] leading-tight">Your skin and scalp outcomes are improving with consistency.</h2>
        <p className="mt-3 text-sm sm:text-base text-[#2F6F57] leading-relaxed">{aiInsight}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/result"
            className="rounded-xl bg-medical-gradient px-4 py-3 text-center text-sm font-semibold text-[#F4F1EB]"
          >
            View Full Protocol
          </Link>
          <Link
            href="/assessment"
            className="rounded-xl border border-[#DDD7CC] bg-white px-4 py-3 text-center text-sm font-semibold text-[#2F6F57] hover:bg-[#F7F4EE]"
          >
            Log Today’s Routine
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-[#F7F4EE] p-3">
            <p className="text-[10px] uppercase text-[#6E9F87]">Live Score</p>
            <p className="metric-number mt-1 text-sm sm:text-base text-[#1E4D3A]">{safeAlpha}</p>
          </div>
          <div className="rounded-xl bg-[#F7F4EE] p-3">
            <p className="text-[10px] uppercase text-[#6E9F87]">Confidence</p>
            <p className="metric-number mt-1 text-sm sm:text-base text-[#1E4D3A]">{safeConfidence}%</p>
          </div>
          <div className="rounded-xl bg-[#F7F4EE] p-3">
            <p className="text-[10px] uppercase text-[#6E9F87]">Recovery</p>
            <p className="metric-number mt-1 text-sm sm:text-base text-[#1E4D3A]">{safeRecovery}%</p>
          </div>
        </div>
      </div>

      <ClinicalSnapshotPanel
        alphaScore={safeAlpha}
        confidence={safeConfidence}
        primaryConcern={primaryConcern}
        lastUpdatedLabel={lastUpdatedLabel}
        recovery={safeRecovery}
        consistency={consistency}
        environmentalStress={environmentalStress}
        trendData={trendData}
        nextAction={nextAction}
        expectedVisibleChange={expectedVisibleChange}
      />
    </section>
  );
}
