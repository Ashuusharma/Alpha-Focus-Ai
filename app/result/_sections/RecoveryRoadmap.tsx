import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";

/**
 * expectedTimeline and weeklyMilestones are both keyed 1-4 in the schema and
 * describe the same 4 weeks from two angles - merged here into one roadmap
 * instead of two separate flat lists. The schema caps at 4 weeks
 * (`.length(4)`), so this only ever renders the phases the data actually
 * has - no "Month 2" / "long-term maintenance" phase is fabricated.
 */
export default function RecoveryRoadmap({
  expectedTimeline,
  weeklyMilestones,
  currentWeek,
}: {
  expectedTimeline: ProtocolReport["expectedTimeline"];
  weeklyMilestones: ProtocolReport["weeklyMilestones"];
  currentWeek: number | null;
}) {
  const milestoneByWeek = new Map(weeklyMilestones.map((m) => [m.week, m]));
  const weeks = [...expectedTimeline].sort((a, b) => a.week - b.week);

  return (
    <section id="roadmap" className="nv-section-white scroll-mt-24">
      <h2 className="text-xl font-black text-[var(--ink)]">Recovery Roadmap</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">What to expect, week by week, over your 30-day protocol.</p>

      <ol className="mt-5 space-y-3 border-l-2 border-[var(--border-hairline)] pl-5 md:pl-6">
        {weeks.map((week) => {
          const milestone = milestoneByWeek.get(week.week);
          const isCurrent = currentWeek === week.week;

          return (
            <li key={week.week} className="relative">
              <span
                className={`absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                  isCurrent ? "bg-[var(--accent-blue)]" : "bg-[var(--border-hairline)]"
                }`}
                aria-hidden="true"
              />
              <details className="af-surface-soft group open:pb-1" open={isCurrent || week.week === 1}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                      Week {week.week}
                      {isCurrent && (
                        <span className="af-badge-chip text-[10px] text-[var(--accent-blue)]">You are here</span>
                      )}
                    </h3>
                    {milestone && <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{milestone.milestone}</p>}
                  </div>
                  <span className="shrink-0 text-[var(--ink-soft)] transition-transform group-open:rotate-180">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </summary>

                <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--accent-green)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Expected Improvements
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
                      {week.expectedImprovements.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--warning-accent)]">Possible Setbacks</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
                      {week.possibleSetbacks.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                  {week.continueDoing.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-blue)]">Keep Doing</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
                        {week.continueDoing.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                  )}
                  {milestone && (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)] md:col-span-2">
                      <Target className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                      Adherence target: <span className="font-semibold text-[var(--ink)]">{milestone.adherenceTarget}</span>
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
