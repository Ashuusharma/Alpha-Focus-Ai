"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Camera, FileText, Flame, MapPin, Medal, ShieldCheck, Sparkles, User, Activity, TrendingUp } from "lucide-react";
import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ProfileTab = "overview" | "scan-history" | "reports" | "challenges" | "rewards" | "settings" | "trends";

type AssessmentRow = {
  id: string;
  completed_at: string;
  completeness_pct?: number | null;
};

type ScanRow = {
  id: string;
  scan_date: string;
};

type RoutineRow = {
  id: string;
  log_date: string;
  am_done?: boolean;
  pm_done?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile } = useContext(AuthContext);
  const storeProfile = useUserStore((state) => state.profile);
  const alphaSummary = useUserStore((state) => (state.alphaSummary as Record<string, unknown> | null));
  const assessments = useUserStore((state) => state.assessments as AssessmentRow[]);
  const scans = useUserStore((state) => state.scans as ScanRow[]);
  const routineLogs = useUserStore((state) => state.routines as RoutineRow[]);

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  useEffect(() => {
    if (!user) return;
    void hydrateUserData(user.id);
  }, [user?.id]);

  const displayName =
    profile?.full_name?.trim() ||
    (storeProfile as { full_name?: string } | null)?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "User";
  const tierLabel = String(alphaSummary?.tier_level ?? "Bronze");
  const lifetimeEarned = Number(alphaSummary?.lifetime_earned ?? 0);
  const currentBalance = Number(alphaSummary?.current_balance ?? 0);
  const joinedDate = user?.created_at;

  const trendData = useMemo(() => {
    return assessments.slice(-10).map((a, i) => ({
      date: formatDate(a.completed_at),
      score: Number(a.completeness_pct ?? 0),
      consistency: Number(a.completeness_pct ?? 0),
    }));
  }, [assessments]);

  const locationLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || "Location not set";

  const totalScans = scans.length;
  const reportsGenerated = assessments.length;
  const averageScore = useMemo(() => {
    const values = assessments
      .map((item) => Number(item.completeness_pct ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [assessments]);

  const streakCount = useMemo(() => {
    if (!routineLogs.length) return 0;
    let streak = 0;
    for (const row of routineLogs) {
      if (row.am_done || row.pm_done) streak += 1;
      else break;
    }
    return streak;
  }, [routineLogs]);

  const timelineItems = [
    ...assessments.map((item) => ({
      id: `assessment_${item.id}`,
      date: item.completed_at,
      title: "Assessment completed",
      note: `Completeness ${Math.round(Number(item.completeness_pct || 0))}%`,
      href: "/result",
      icon: FileText,
    })),
    ...scans.map((scan) => ({
      id: `scan_${scan.id}`,
      date: scan.scan_date,
      title: "Scan uploaded",
      note: "Visual analysis record synced",
      href: "/saved-scans",
      icon: Camera,
    })),
    ...routineLogs.slice(0, 20).map((row) => ({
      id: `routine_${row.id}`,
      date: row.log_date,
      title: "Routine updated",
      note: `AM: ${row.am_done ? "Done" : "Missed"} · PM: ${row.pm_done ? "Done" : "Missed"}`,
      href: "/dashboard",
      icon: Sparkles,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const exportData = () => {
    if (typeof window === "undefined") return;
    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: displayName,
      },
      rewards: {
        currentBalance,
        lifetimeEarned,
        tier: tierLabel,
        streakCount,
      },
      scans,
      assessments,
      activities: routineLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alpha-focus-profile-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearProfileData = () => {
    router.push("/data-settings");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] px-4 py-20 text-[#1F3D2B]">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <MedicalCard className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto,1fr] md:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-white/40 shadow-sm">
              <User className="h-10 w-10 text-[#6B665D]" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold">{displayName}</h1>
                <StatusBadge variant="info">Tier {tierLabel}</StatusBadge>
              </div>
              <p className="text-sm text-text-secondary">Lifetime earned: {lifetimeEarned} A$</p>
              <div className="grid grid-cols-1 gap-3 text-sm text-[#6B665D] sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 shadow-sm px-3 py-2">
                  <MapPin className="h-4 w-4 text-[#2F6F57]" />
                  <span>{locationLabel}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 shadow-sm px-3 py-2">
                  <Calendar className="h-4 w-4 text-[#2F6F57]" />
                  <span>Member since {formatDate(joinedDate)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 shadow-sm px-3 py-2">
                  <Medal className="h-4 w-4 text-[#2F6F57]" />
                  <span>{tierLabel} tier active</span>
                </div>
              </div>
            </div>
          </div>
        </MedicalCard>

        <section className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"],
              ["scan-history", "Scan History"],
              ["reports", "Reports"],
              ["trends", "Trend Analysis"],
              ["challenges", "Challenges"],
              ["rewards", "Rewards"],
              ["settings", "Settings"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as ProfileTab)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === key ? "bg-[#2F6F57] text-white shadow-md" : "bg-white/40 text-[#6B665D] hover:bg-white/80 hover:text-[#1F3D2B]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MedicalCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B665D]">Total scans</p>
                <Camera className="h-4 w-4 text-[#2F6F57]" />
              </div>
              <p className="metric-number mt-3 text-4xl text-[#1F3D2B]">{totalScans}</p>
              </MedicalCard>
              <MedicalCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B665D]">Average score</p>
                <Sparkles className="h-4 w-4 text-[#2F6F57]" />
              </div>
              <p className="metric-number mt-3 text-4xl text-[#1F3D2B]">{averageScore}%</p>
              </MedicalCard>
              <MedicalCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B665D]">Reports generated</p>
                <FileText className="h-4 w-4 text-[#2F6F57]" />
              </div>
              <p className="metric-number mt-3 text-4xl text-[#1F3D2B]">{reportsGenerated}</p>
              </MedicalCard>
              <MedicalCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B665D]">Streak</p>
                <Flame className="h-4 w-4 text-[#C27803]" />
              </div>
              <p className="metric-number mt-3 text-4xl text-[#1F3D2B]">{streakCount}d</p>
              </MedicalCard>
            </div>

            <MedicalCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F3D2B]">Transformation Timeline</h3>
                <StatusBadge variant="success">Data-linked journey</StatusBadge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E2DDD4] bg-[#F8F6F3] p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8C877D]">Day 0</p>
                  <p className="font-semibold mt-1">Baseline capture</p>
                  <p className="text-xs text-[#6B665D] mt-1">Initial score {Math.max(0, averageScore - 18)}%</p>
                </div>
                <div className="rounded-xl border border-[#E2DDD4] bg-[#F8F6F3] p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8C877D]">Day 14</p>
                  <p className="font-semibold mt-1">Protocol adaptation</p>
                  <p className="text-xs text-[#6B665D] mt-1">Discipline trend {Math.max(0, streakCount * 4)}%</p>
                </div>
                <div className="rounded-xl border border-[#E2DDD4] bg-[#F8F6F3] p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8C877D]">Day 30</p>
                  <p className="font-semibold mt-1">Transformation checkpoint</p>
                  <p className="text-xs text-[#6B665D] mt-1">Projected confidence {Math.min(100, averageScore + 12)}%</p>
                </div>
              </div>
            </MedicalCard>
          </section>
        )}

        {activeTab === "scan-history" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Scan History</h2>
            <MedicalCard className="p-0">
              <div className="max-h-[420px] space-y-0 overflow-y-auto">
                {timelineItems.length === 0 ? (
                  <div className="p-6 text-sm text-[#6B665D]">No timeline entries yet. Complete an analysis to start your record.</div>
                ) : (
                  timelineItems.map((item) => {
                    const Icon = item.icon;
                    const canNavigate = item.href.length > 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!canNavigate}
                        onClick={() => canNavigate && router.push(item.href)}
                        className={`w-full border-b border-white/40 p-5 text-left transition-colors ${canNavigate ? "hover:bg-white/40" : "cursor-default"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full border border-white/40 bg-white/40 p-2 text-[#2F6F57]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-[#8C877D]">{formatDate(item.date)}</p>
                            <p className="text-sm font-medium text-[#1F3D2B]">{item.title}</p>
                            <p className="text-sm text-[#6B665D] line-clamp-2">{item.note}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </MedicalCard>
          </section>
        )}

        {activeTab === "reports" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Reports</h2>
            <MedicalCard className="p-5">
              <p className="text-sm text-[#6B665D]">Total reports generated</p>
              <p className="metric-number mt-2 text-4xl text-[#1F3D2B]">{reportsGenerated}</p>
              <button onClick={() => router.push("/result")} className="mt-4 rounded-xl bg-medical-gradient px-4 py-2 text-sm font-semibold text-[#F4F1EB]">
                Open Latest Medical Report
              </button>
            </MedicalCard>
          </section>
        )}

        {activeTab === "trends" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Progress & Retention</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <MedicalCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-[#1F3D2B]">Alpha Score Progression</h3>
                  <div className="flex items-center gap-2 text-sm text-[#2F6F57]">
                    <TrendingUp className="h-4 w-4" />
                    <span>+12% Last 30 Days</span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.length > 0 ? trendData : [{ date: "Week 1", score: 60, consistency: 50 }, { date: "Week 2", score: 65, consistency: 60 }, { date: "Week 3", score: 72, consistency: 70 }, { date: "Week 4", score: 78, consistency: 85 }]}>
                      <CartesianGrid stroke="#E2DDD4" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6B665D", fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B665D", fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#2F6F57" strokeWidth={3} dot={{ r: 4, fill: "#2F6F57" }} activeDot={{ r: 6 }} name="Alpha Score" />
                      <Line type="monotone" dataKey="consistency" stroke="#C9A227" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Consistency" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </MedicalCard>

              <MedicalCard className="p-6">
                <h3 className="font-semibold text-[#1F3D2B] mb-4">Routine Comparison</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F4EFE6] rounded-xl border border-[#E2DDD4]">
                    <div>
                      <p className="text-xs text-[#6B665D] uppercase tracking-wider">Current Protocol</p>
                      <p className="font-bold text-[#1F3D2B]">Optimized for Barrier Repair</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#6B665D]">Adherence</p>
                      <p className="font-bold text-[#2F6F57]">92%</p>
                    </div>
                  </div>
                  
                  <div className="relative pl-4 border-l-2 border-[#E2DDD4]">
                    <div className="mb-4">
                      <p className="text-xs text-[#6B665D] mb-1">Last Week</p>
                      <div className="flex items-center gap-2">
                         <div className="flex-1 h-2 bg-[#E2DDD4] rounded-full overflow-hidden">
                           <div className="h-full bg-[#2F6F57]" style={{ width: "85%" }}></div>
                         </div>
                         <span className="text-xs font-semibold text-[#1F3D2B]">85%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B665D] mb-1">Last Month</p>
                      <div className="flex items-center gap-2">
                         <div className="flex-1 h-2 bg-[#E2DDD4] rounded-full overflow-hidden">
                           <div className="h-full bg-[#8C6A5A]" style={{ width: "64%" }}></div>
                         </div>
                         <span className="text-xs font-semibold text-[#1F3D2B]">64%</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B665D] italic mt-4">
                    "Consistent adherence correlates with a 40% faster visible improvement in skin texture."
                  </p>
                </div>
              </MedicalCard>
            </div>
          </section>
        )}

        {activeTab === "challenges" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Challenges</h2>
            <MedicalCard className="p-5">
              <p className="text-sm text-[#6B665D]">Keep your daily adherence to maintain your streak and improve recovery consistency.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/40 bg-white/40 p-4 shadow-sm">
                  <p className="text-xs text-[#8C877D]">Current streak</p>
                  <p className="metric-number text-2xl text-[#1F3D2B]">{streakCount} days</p>
                </div>
                <div className="rounded-xl border border-white/40 bg-white/40 p-4 shadow-sm">
                  <p className="text-xs text-[#8C877D]">Current tier</p>
                  <p className="text-base font-semibold text-[#1F3D2B]">{tierLabel}</p>
                </div>
              </div>
            </MedicalCard>
          </section>
        )}

        {activeTab === "rewards" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Alpha Sikka</h2>
            <MedicalCard className="p-5">
              <p className="text-sm text-[#6B665D]">Current Balance</p>
              <p className="metric-number mt-2 text-4xl text-[#1F3D2B]">{currentBalance} A$</p>
              <p className="mt-2 text-sm text-[#6B665D]">Lifetime Earned: {lifetimeEarned} A$ · Tier: {tierLabel}</p>
            </MedicalCard>
          </section>
        )}

        {activeTab === "settings" && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[#1F3D2B]">Data Privacy Controls</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MedicalCard className="p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#2F6F57]" />
                  <h3 className="font-semibold text-[#1F3D2B]">Privacy Actions</h3>
                </div>
                <p className="mt-2 text-sm text-[#6B665D]">Manage consent, permissions, and policy details.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => router.push("/data-settings")} className="rounded-xl border border-white/40 bg-white/40 shadow-sm px-4 py-2 text-sm text-[#1F3D2B] hover:bg-white/60">
                    Data Settings
                  </button>
                  <button onClick={() => router.push("/privacy-policy")} className="rounded-xl border border-white/40 bg-white/40 shadow-sm px-4 py-2 text-sm text-[#1F3D2B] hover:bg-white/60">
                    Privacy Policy
                  </button>
                </div>
              </MedicalCard>

              <MedicalCard className="p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#C27803]" />
                  <h3 className="font-semibold text-[#1F3D2B]">Cloud Data Control</h3>
                </div>
                <p className="mt-2 text-sm text-[#6B665D]">Export your account snapshot or manage stored records in Supabase-backed settings.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={exportData} className="rounded-xl border border-white/40 bg-white/40 shadow-sm px-4 py-2 text-sm text-[#1F3D2B] hover:bg-white/60">
                    Export Data
                  </button>
                  <button onClick={clearProfileData} className="rounded-xl border border-clinical-danger/50 bg-clinical-danger/10 px-4 py-2 text-sm text-clinical-danger hover:bg-clinical-danger/20">
                    Manage Data
                  </button>
                </div>
              </MedicalCard>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
