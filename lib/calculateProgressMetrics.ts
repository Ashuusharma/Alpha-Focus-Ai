import { supabase } from "@/lib/supabaseClient";
import { calculateDisciplineScore, calculateRecoveryVelocity } from "@/lib/calculateDisciplineScore";
import { CategoryId } from "@/lib/questions";

type ProgressMetricRecord = {
  category: string;
  improvement_percentage: number;
  consistency_score: number;
  recovery_velocity: number;
  discipline_score: number;
  confidence_score: number;
  scans_count: number;
};

type PhotoScan = {
  analyzer_category: string;
  scan_date: string;
  severity_snapshot?: number | null;
  inflammation_snapshot?: number | null;
};

type RoutineLog = {
  log_date?: string | null;
  am_done?: boolean | null;
  pm_done?: boolean | null;
};

type ClinicalScore = {
  category: string;
  confidence_score?: number | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function dateDiffInDays(start: string, end: string) {
  const d1 = new Date(start).getTime();
  const d2 = new Date(end).getTime();
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function calculateConsistencyScore(logs: RoutineLog[]) {
  if (!logs.length) return 0;
  const points = logs.map((log) => Number(Boolean(log.am_done)) + Number(Boolean(log.pm_done)));
  const average = points.reduce((sum, point) => sum + point, 0) / logs.length;
  return Math.round((average / 2) * 100);
}

function calculateStreakDays(logs: RoutineLog[]) {
  const sortedDates = logs
    .filter((log) => log.log_date && (log.am_done || log.pm_done))
    .map((log) => String(log.log_date))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!sortedDates.length) return 0;

  let streak = 1;
  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = new Date(sortedDates[index - 1]);
    const current = new Date(sortedDates[index]);
    const diff = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak += 1;
    else break;
  }

  return streak;
}

export async function calculateProgressMetrics(userId: string): Promise<ProgressMetricRecord[]> {
  const [scanRes, routineRes, clinicalRes] = await Promise.all([
    supabase
      .from("photo_scans")
      .select("analyzer_category,scan_date,severity_snapshot,inflammation_snapshot")
      .eq("user_id", userId)
      .not("analyzer_category", "is", null)
      .order("scan_date", { ascending: false }),
    supabase
      .from("routine_logs")
      .select("log_date,am_done,pm_done")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(30),
    supabase
      .from("user_category_clinical_scores")
      .select("category,confidence_score")
      .eq("user_id", userId),
  ]);

  const scans = (scanRes.data || []) as PhotoScan[];
  const routines = (routineRes.data || []) as RoutineLog[];
  const clinicalRows = (clinicalRes.data || []) as ClinicalScore[];

  const routines14 = routines.slice(0, 14);
  const consistencyScore = calculateConsistencyScore(routines14);
  const streakDays = calculateStreakDays(routines);

  const scansByCategory = scans.reduce<Record<string, PhotoScan[]>>((acc, row) => {
    const key = row.analyzer_category;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const results: ProgressMetricRecord[] = [];

  for (const [category, categoryScans] of Object.entries(scansByCategory)) {
    const usableScans = categoryScans.filter((scan) => scan.severity_snapshot !== null && scan.severity_snapshot !== undefined);
    const sortedAsc = [...usableScans].sort((a, b) => new Date(a.scan_date).getTime() - new Date(b.scan_date).getTime());

    const first = sortedAsc[0];
    const latest = sortedAsc[sortedAsc.length - 1];
    const firstSeverity = Number(first?.severity_snapshot || 0);
    const latestSeverity = Number(latest?.severity_snapshot || 0);
    const firstInflammation = Number(first?.inflammation_snapshot || 0);
    const latestInflammation = Number(latest?.inflammation_snapshot || 0);

    const improvementPercentage = firstSeverity > 0
      ? Math.round(((firstSeverity - latestSeverity) / firstSeverity) * 100)
      : 0;

    const inflammationReduction = firstInflammation > 0
      ? Math.round(((firstInflammation - latestInflammation) / firstInflammation) * 100)
      : 0;

    const daysBetween = first && latest ? dateDiffInDays(first.scan_date, latest.scan_date) : 1;
    const recovery = calculateRecoveryVelocity(improvementPercentage, daysBetween);

    const scansLast30 = categoryScans.filter((scan) => {
      const scanTime = new Date(scan.scan_date).getTime();
      return scanTime >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    }).length;

    const disciplineScore = calculateDisciplineScore({
      routineCompletionRate: consistencyScore,
      streakDays,
      scanFrequencyPerMonth: scansLast30,
    });

    const confidence = Number(clinicalRows.find((row) => row.category === category)?.confidence_score || 0);

    const trendDirection = improvementPercentage > 10
      ? "improving"
      : improvementPercentage < -5
        ? "worsening"
        : "stable";

    const trendMessage = trendDirection === "improving"
      ? `Inflammation reduced by ${Math.max(0, inflammationReduction)}% in recent cycle.`
      : trendDirection === "worsening"
        ? "Trend indicates rising severity. Re-analysis and protocol adjustment advised."
        : "Progress is stable. Continue daily adherence for stronger gains.";

    await supabase.from("user_progress_metrics").upsert({
      user_id: userId,
      category,
      scans_count: categoryScans.length,
      first_severity: firstSeverity,
      latest_severity: latestSeverity,
      improvement_pct: improvementPercentage,
      inflammation_reduction_rate: clamp(inflammationReduction),
      consistency_score: clamp(consistencyScore),
      recovery_velocity: recovery.score,
      discipline_index: disciplineScore,
      confidence_score: clamp(confidence),
      trend_direction: trendDirection,
      trend_message: trendMessage,
      updated_at: new Date().toISOString(),
    });

    results.push({
      category,
      improvement_percentage: improvementPercentage,
      consistency_score: consistencyScore,
      recovery_velocity: recovery.score,
      discipline_score: disciplineScore,
      confidence_score: confidence,
      scans_count: categoryScans.length,
    });
  }

  return results;
}

export async function calculateProgressMetricsForCategory(userId: string, category: CategoryId) {
  const all = await calculateProgressMetrics(userId);
  return all.find((item) => item.category === category) || null;
}
