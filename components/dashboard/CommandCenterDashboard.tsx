"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Image as ImageIcon,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPayload } from "@/services/dashboardService";

type Props = {
  data: DashboardPayload;
};

function TrendBadge({ trend, delta }: { trend: "up" | "down" | "flat"; delta: number }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F57]/10 px-2 py-1 text-xs font-bold text-[#2F6F57]">
        <ArrowUpRight className="h-3.5 w-3.5" /> +{delta}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#8C6A5A]/10 px-2 py-1 text-xs font-bold text-[#8C6A5A]">
        <ArrowDownRight className="h-3.5 w-3.5" /> {delta}
      </span>
    );
  }
  return <span className="rounded-full bg-[#6B665D]/10 px-2 py-1 text-xs font-bold text-[#6B665D]">Flat</span>;
}

function StatusDot({ active }: { active: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#2F6F57]" : "bg-[#B8B2A6]"}`} />;
}

function useSectionVisibility() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

export default function CommandCenterDashboard({ data }: Props) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [productTab, setProductTab] = useState<"regimen" | "history">("regimen");
  const trendSection = useSectionVisibility();
  const productSection = useSectionVisibility();
  const scanSection = useSectionVisibility();

  const filteredTrend = useMemo(() => {
    const size = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return data.trends.points.slice(-size);
  }, [data.trends.points, range]);

  return (
    <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.profile.greeting}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B665D]">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F4EFE6] px-3 py-1 font-semibold">
                  <Sparkles className="h-4 w-4 text-[#2F6F57]" /> Current Streak: {data.profile.streakDays} days
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F4EFE6] px-3 py-1 font-semibold">
                  <Target className="h-4 w-4 text-[#2F6F57]" /> Consistency: {data.profile.consistencyPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link href="/image-analyzer" className="rounded-xl bg-[#2F6F57] px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#1F4D3B]">
                New Scan
              </Link>
              <Link href="/dashboard" className="rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 text-center text-sm font-bold text-[#1F3D2B] transition hover:border-[#2F6F57]">
                Log Routine
              </Link>
              <Link href="/assessment" className="rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 text-center text-sm font-bold text-[#1F3D2B] transition hover:border-[#2F6F57]">
                Start Reassessment
              </Link>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#2F6F57]/10 px-3 py-2 text-sm font-semibold text-[#2F6F57]">{data.profile.improvementMessage}</p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.metrics.map((metric) => (
            <article key={metric.key} className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#6B665D]">{metric.label}</p>
                <TrendBadge trend={metric.trend} delta={Number(metric.delta.toFixed(1))} />
              </div>
              <p className="text-3xl font-black tracking-tight">{metric.value}</p>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#6B665D]">
                <span>Change vs last week: {metric.delta > 0 ? "+" : ""}{Number(metric.delta.toFixed(1))}</span>
                <span>Confidence: {metric.confidence}%</span>
              </div>
            </article>
          ))}
        </section>

        <section ref={trendSection.ref} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {!trendSection.visible ? (
            <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm lg:col-span-3">
              <p className="text-sm text-[#6B665D]">Loading progress intelligence...</p>
            </article>
          ) : (
          <>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Progress Intelligence</h2>
              <div className="inline-flex rounded-xl border border-[#E2DDD3] bg-[#F8F6F0] p-1">
                {(["7d", "30d", "90d"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRange(item)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${range === item ? "bg-[#2F6F57] text-white" : "text-[#6B665D]"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredTrend}>
                  <CartesianGrid stroke="#EFE8DD" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#6B665D", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#6B665D", fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="alphaScore" stroke="#2F6F57" strokeWidth={3} dot={false} name="Alpha Score" />
                  <Line dataKey="consistency" stroke="#8C6A5A" strokeWidth={2} dot={false} name="Consistency" />
                  <Line dataKey="recovery" stroke="#1F3D2B" strokeWidth={2} dot={false} name="Recovery %" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Improvement Analysis</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-[#F8F6F0] p-3"><strong>Biggest Improvement Driver:</strong> {data.trends.biggestImprovementDriver}</div>
              <div className="rounded-lg bg-[#F8F6F0] p-3"><strong>Biggest Risk Factor:</strong> {data.trends.biggestRiskFactor}</div>
              <div className="rounded-lg bg-[#F8F6F0] p-3"><strong>Projected 30-day score:</strong> {data.trends.projected30DayScore}</div>
              <div className="rounded-lg bg-[#F8F6F0] p-3"><strong>Trajectory:</strong> {data.trends.trajectory}</div>
            </div>
          </article>
          </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Your Active Clinical Focus</h3>
              <Link href="/assessment" className="inline-flex items-center gap-1 rounded-lg bg-[#1F3D2B] px-3 py-2 text-xs font-bold text-white hover:bg-[#2F6F57]">
                Reassess Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F8F6F0] p-4"><p className="text-xs font-semibold text-[#6B665D]">Primary Issue</p><p className="mt-1 font-bold">{data.primaryConcern.issue}</p></div>
              <div className="rounded-xl bg-[#F8F6F0] p-4"><p className="text-xs font-semibold text-[#6B665D]">Severity</p><p className="mt-1 font-bold">{data.primaryConcern.severity}</p></div>
              <div className="rounded-xl bg-[#F8F6F0] p-4"><p className="text-xs font-semibold text-[#6B665D]">Estimated Window</p><p className="mt-1 font-bold">{data.primaryConcern.estimatedWindow}</p></div>
              <div className="rounded-xl bg-[#F8F6F0] p-4"><p className="text-xs font-semibold text-[#6B665D]">Risk If Ignored</p><p className="mt-1 font-bold">{data.primaryConcern.riskIfIgnored}</p></div>
            </div>
            <div className="mt-4 rounded-xl border border-[#E2DDD3] p-4">
              <p className="mb-2 text-xs font-semibold text-[#6B665D]">Root Drivers</p>
              <div className="flex flex-wrap gap-2">
                {data.primaryConcern.rootDrivers.map((driver) => (
                  <span key={driver} className="rounded-full bg-[#2F6F57]/10 px-3 py-1 text-xs font-bold text-[#2F6F57]">{driver}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Daily Execution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span className="font-semibold">AM Routine</span><StatusDot active={data.routineStatus.amDone} /></div>
              <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span className="font-semibold">PM Routine</span><StatusDot active={data.routineStatus.pmDone} /></div>
              <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span className="font-semibold">Hydration</span><StatusDot active={data.routineStatus.hydrationDone} /></div>
              <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span className="font-semibold">Sleep</span><StatusDot active={data.routineStatus.sleepDone} /></div>
            </div>
            <div className="mt-4 rounded-xl border border-[#2F6F57]/20 bg-[#2F6F57]/10 p-4">
              <p className="text-xs font-bold uppercase text-[#2F6F57]">Today's Priority Action</p>
              <p className="mt-1 text-sm font-semibold">{data.routineStatus.todayPriorityAction}</p>
              <p className="mt-2 text-xs text-[#6B665D]">{data.routineStatus.adherenceImpact}</p>
            </div>
          </article>
        </section>

        <section ref={productSection.ref} className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
          {!productSection.visible ? (
            <p className="text-sm text-[#6B665D]">Loading product intelligence...</p>
          ) : (
          <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Product Intelligence</h3>
            <div className="inline-flex rounded-xl border border-[#E2DDD3] bg-[#F8F6F0] p-1">
              <button onClick={() => setProductTab("regimen")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${productTab === "regimen" ? "bg-[#2F6F57] text-white" : "text-[#6B665D]"}`}>Active Regimen</button>
              <button onClick={() => setProductTab("history")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${productTab === "history" ? "bg-[#2F6F57] text-white" : "text-[#6B665D]"}`}>Purchase History</button>
            </div>
          </div>

          {productTab === "regimen" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.productIntelligence.activeRegimen.map((item) => (
                <div key={item.productName} className="rounded-xl border border-[#E2DDD3] p-4">
                  <p className="font-bold">{item.productName}</p>
                  <p className="mt-1 text-sm text-[#6B665D]">{item.purpose}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <span>Match: {item.matchPct}%</span>
                    <span className="rounded-full bg-[#2F6F57]/10 px-2 py-1 text-[#2F6F57]">{item.usageStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.productIntelligence.purchaseHistory.map((item) => (
                <div key={`${item.orderId}-${item.productName}`} className="flex flex-col gap-3 rounded-xl border border-[#E2DDD3] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-sm text-[#6B665D]">Last purchased: {item.lastPurchaseDate}</p>
                    <p className="text-xs font-semibold text-[#6B665D]">Remaining supply estimate: {item.remainingSupplyDays} days</p>
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-lg bg-[#1F3D2B] px-3 py-2 text-xs font-bold text-white hover:bg-[#2F6F57]">
                    Reorder <ShoppingBag className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        <section ref={scanSection.ref} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {!scanSection.visible ? (
            <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm lg:col-span-2">
              <p className="text-sm text-[#6B665D]">Loading scan and environment intelligence...</p>
            </article>
          ) : (
          <>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Scan History & Visual Progress</h3>
            {data.scanComparison.hasScans ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F0] p-3">
                    <p className="mb-2 text-xs font-semibold text-[#6B665D]">Previous Scan</p>
                    {data.scanComparison.previousPhotoUrl ? (
                      <img src={data.scanComparison.previousPhotoUrl} alt="Previous scan" className="h-40 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-white text-xs text-[#6B665D]">No image</div>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F0] p-3">
                    <p className="mb-2 text-xs font-semibold text-[#6B665D]">Latest Scan</p>
                    {data.scanComparison.latestPhotoUrl ? (
                      <img src={data.scanComparison.latestPhotoUrl} alt="Latest scan" className="h-40 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-white text-xs text-[#6B665D]">No image</div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-[#F8F6F0] p-3 text-sm font-bold">Density +{data.scanComparison.densityImprovementPct}%</div>
                  <div className="rounded-lg bg-[#F8F6F0] p-3 text-sm font-bold">Inflammation +{data.scanComparison.inflammationImprovementPct}%</div>
                  <div className="rounded-lg bg-[#F8F6F0] p-3 text-sm font-bold">Oil Balance +{data.scanComparison.oilBalanceImprovementPct}%</div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D9D3C7] bg-[#F8F6F0] p-6 text-center">
                <ImageIcon className="mx-auto mb-2 h-6 w-6 text-[#6B665D]" />
                <p className="font-semibold">No scan comparison available yet.</p>
                <Link href="/image-analyzer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#2F6F57] hover:text-[#1F3D2B]">
                  Take your first scan <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </article>

          <article className="space-y-6">
            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">Environment & Lifestyle Impact</h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">UV Index</p><p className="font-bold">{data.environmentImpact.uvIndex}</p></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">Pollution</p><p className="font-bold">{data.environmentImpact.pollution}</p></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">Humidity</p><p className="font-bold">{data.environmentImpact.humidity}%</p></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">Sleep</p><p className="font-bold">{data.environmentImpact.sleep} h</p></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">Stress</p><p className="font-bold">{data.environmentImpact.stress}/10</p></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3"><p className="text-xs text-[#6B665D]">Hydration</p><p className="font-bold">{data.environmentImpact.hydration} ml</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-[#8C6A5A]/20 bg-[#8C6A5A]/10 p-3">
                <p className="text-xs font-bold uppercase text-[#8C6A5A]">Combined Environmental Risk Score</p>
                <p className="text-xl font-black">{data.environmentImpact.combinedRiskScore}</p>
                <p className="text-xs text-[#6B665D]">{data.environmentImpact.explanation}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold">Alpha Sikka Progress</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Current Balance</span><strong>{data.rewardsSummary.currentBalance} A$</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Lifetime Earned</span><strong>{data.rewardsSummary.lifetimeEarned} A$</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Tier Level</span><strong>{data.rewardsSummary.tierLevel}</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Next Tier</span><strong>{data.rewardsSummary.nextTierLabel}</strong></div>
                <div className="rounded-lg bg-[#F8F6F0] p-3">
                  <div className="mb-1 flex items-center justify-between"><span>Next Tier Progress</span><strong>{data.rewardsSummary.nextTierProgressPct}%</strong></div>
                  <div className="h-2 w-full rounded-full bg-[#E2DDD3]">
                    <div className="h-2 rounded-full bg-[#2F6F57]" style={{ width: `${data.rewardsSummary.nextTierProgressPct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Next Unlock</span><strong>{data.rewardsSummary.nextUnlock}</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Estimated days to next tier</span><strong>{data.rewardsSummary.estimatedDaysToNextTier}</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-[#F8F6F0] p-3"><span>Available Discount</span><strong>{data.rewardsSummary.availableDiscount}</strong></div>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#1F3D2B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2F6F57]">Redeem A$</button>
            </div>
          </article>
          </>
          )}
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Transformation Roadmap</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.roadmap.phases.map((phase, index) => {
              const active = phase.name === data.roadmap.currentPhase;
              return (
                <div
                  key={phase.name}
                  className={`rounded-xl border p-4 ${active ? "border-[#2F6F57] bg-[#2F6F57]/10" : phase.complete ? "border-[#A9CBB7] bg-[#F2F8F4]" : "border-[#E2DDD3] bg-[#F8F6F0]"}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B665D]">Phase {index + 1}</p>
                  <p className="mt-1 text-lg font-bold">{phase.name}</p>
                  <p className="mt-2 text-xs font-semibold text-[#6B665D]">
                    {active ? "Current stage" : phase.complete ? "Completed" : "Upcoming"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Intelligent Alerts</h3>
          {data.alerts.length ? (
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className={`flex items-start gap-3 rounded-lg border p-3 ${alert.level === "critical" ? "border-[#D97757]/30 bg-[#D97757]/10" : "border-[#C9A227]/30 bg-[#F4EED7]"}`}>
                  {alert.level === "critical" ? <ShieldAlert className="mt-0.5 h-4 w-4 text-[#D97757]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-[#C9A227]" />}
                  <p className="text-sm font-semibold">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#A9CBB7] bg-[#F2F8F4] p-3 text-sm font-semibold text-[#2F6F57]">No critical alerts right now. Keep current protocol consistency.</div>
          )}
        </section>

        <details className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm">
          <summary className="cursor-pointer list-none text-sm font-bold text-[#1F3D2B]">
            <span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> Data Transparency</span>
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.dataSources.map((source) => (
              <span key={source} className="rounded-full bg-[#F8F6F0] px-3 py-1 text-xs font-semibold text-[#6B665D]">{source}</span>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}
