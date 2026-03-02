import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt";

type ClinicalReportRow = {
  id: string;
  user_id: string;
  alpha_score: number;
  severity_index: number;
  confidence_score: number;
  recovery_probability: number;
  created_at: string;
  primary_issue?: string;
  severity_label?: string;
  root_drivers?: string[];
  risk_if_ignored?: string;
};

type RoutineLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  am_done: boolean;
  pm_done: boolean;
  hydration_ml: number;
  sleep_hours: number;
  stress_level: number;
  adherence_score?: number;
};

type PhotoScanRow = {
  id: string;
  user_id: string;
  scan_date: string;
  image_url?: string;
  density_score?: number;
  inflammation_score?: number;
  oil_balance_score?: number;
};

type AssessmentSummaryRow = {
  id: string;
  user_id: string;
  completed_at: string;
  completeness_pct?: number;
};

type SikkaTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

type ProductRecommendationRow = {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  match_pct: number;
  purpose: string;
  usage_status: "active" | "pending" | "paused";
};

type ShopifyOrder = {
  id: string;
  created_at: string;
  line_items?: Array<{ product_id?: string | number; title?: string; quantity?: number }>;
};

type MetricCard = {
  key: "alphaScore" | "severityIndex" | "confidence" | "recoveryProbability" | "adherenceScore" | "dataCompleteness";
  label: string;
  value: number;
  delta: number;
  trend: "up" | "down" | "flat";
  confidence: number;
};

export type DashboardPayload = {
  profile: {
    userId: string;
    displayName: string;
    greeting: string;
    streakDays: number;
    consistencyPct: number;
    improvementMessage: string;
  };
  metrics: MetricCard[];
  trends: {
    points: Array<{ date: string; alphaScore: number; consistency: number; recovery: number }>;
    biggestImprovementDriver: string;
    biggestRiskFactor: string;
    projected30DayScore: number;
    trajectory: "Improving" | "Flat" | "Declining";
    improvementVelocity: number;
  };
  primaryConcern: {
    issue: string;
    severity: string;
    rootDrivers: string[];
    estimatedWindow: string;
    riskIfIgnored: string;
  };
  routineStatus: {
    amDone: boolean;
    pmDone: boolean;
    hydrationDone: boolean;
    sleepDone: boolean;
    todayPriorityAction: string;
    adherenceImpact: string;
  };
  productIntelligence: {
    activeRegimen: Array<{ productName: string; matchPct: number; purpose: string; usageStatus: string }>;
    purchaseHistory: Array<{ orderId: string; productName: string; lastPurchaseDate: string; remainingSupplyDays: number }>;
  };
  scanComparison: {
    latestPhotoUrl: string | null;
    previousPhotoUrl: string | null;
    densityImprovementPct: number;
    inflammationImprovementPct: number;
    oilBalanceImprovementPct: number;
    hasScans: boolean;
  };
  rewardsSummary: {
    currentBalance: number;
    lifetimeEarned: number;
    tierLevel: "Bronze" | "Silver" | "Gold" | "Platinum" | "Elite";
    nextTierProgressPct: number;
    nextTierLabel: string;
    nextUnlock: string;
    estimatedDaysToNextTier: number;
    availableDiscount: string;
  };
  environmentImpact: {
    uvIndex: number;
    pollution: number;
    humidity: number;
    sleep: number;
    stress: number;
    hydration: number;
    combinedRiskScore: number;
    explanation: string;
  };
  roadmap: {
    currentPhase: "Stabilize" | "Repair" | "Optimize";
    phases: Array<{ name: "Stabilize" | "Repair" | "Optimize"; complete: boolean }>;
  };
  alerts: Array<{ id: string; level: "warning" | "critical"; message: string }>;
  dataSources: string[];
};

function trendDirection(delta: number): "up" | "down" | "flat" {
  if (delta > 0.5) return "up";
  if (delta < -0.5) return "down";
  return "flat";
}

function toISODate(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function resolveViewer(cookieHeader?: string): Promise<{ userId: string; name: string }> {
  if (!cookieHeader) return { userId: "user_ashu", name: "Ashu" };

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  const token = match?.split("=")[1];
  if (!token) return { userId: "user_ashu", name: "Ashu" };

  try {
    const payload = await verifyAuthToken(token);
    return {
      userId: payload.sub,
      name: payload.name,
    };
  } catch {
    return { userId: "user_ashu", name: "Ashu" };
  }
}

async function querySupabase<T>(table: string, params: URLSearchParams): Promise<T[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`;

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return [];
  const data = (await response.json()) as T[];
  return Array.isArray(data) ? data : [];
}

async function fetchShopifyOrders(customerTag: string): Promise<ShopifyOrder[]> {
  const shop = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !accessToken) return [];

  const response = await fetch(`https://${shop}/admin/api/2024-10/orders.json?status=any&limit=20`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { orders?: ShopifyOrder[] };
  const orders = payload.orders || [];
  return orders.filter((order) => JSON.stringify(order).toLowerCase().includes(customerTag.toLowerCase()));
}

function buildFallbackPayload(userId: string, displayName: string): DashboardPayload {
  const now = new Date();
  const points = Array.from({ length: 30 }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (29 - index));
    const alpha = 58 + Math.round(index * 0.75);
    const consistency = 52 + Math.round(index * 0.65);
    const recovery = 54 + Math.round(index * 0.7);
    return {
      date: toISODate(date.toISOString()),
      alphaScore: Math.min(alpha, 86),
      consistency: Math.min(consistency, 90),
      recovery: Math.min(recovery, 88),
    };
  });

  return {
    profile: {
      userId,
      displayName,
      greeting: `Good Morning, ${displayName}`,
      streakDays: 11,
      consistencyPct: 78,
      improvementMessage: "Your hydration improved 8% this week.",
    },
    metrics: [
      { key: "alphaScore", label: "Alpha Score", value: 74, delta: 4, trend: "up", confidence: 92 },
      { key: "severityIndex", label: "Severity Index", value: 38, delta: -5, trend: "down", confidence: 88 },
      { key: "confidence", label: "Confidence", value: 81, delta: 3, trend: "up", confidence: 90 },
      { key: "recoveryProbability", label: "Recovery Probability", value: 76, delta: 2, trend: "up", confidence: 86 },
      { key: "adherenceScore", label: "Adherence Score", value: 79, delta: 6, trend: "up", confidence: 89 },
      { key: "dataCompleteness", label: "Data Completeness", value: 84, delta: 1, trend: "up", confidence: 94 },
    ],
    trends: {
      points,
      biggestImprovementDriver: "PM routine compliance and stable hydration",
      biggestRiskFactor: "Late sleep on 3 of last 7 days",
      projected30DayScore: 82,
      trajectory: "Improving",
      improvementVelocity: 0.93,
    },
    primaryConcern: {
      issue: "Barrier inflammation around T-zone",
      severity: "Moderate",
      rootDrivers: ["Inconsistent PM closure", "High outdoor UV", "Below-target hydration"],
      estimatedWindow: "4-6 weeks with consistent PM repair",
      riskIfIgnored: "Progress plateau with higher relapse probability.",
    },
    routineStatus: {
      amDone: true,
      pmDone: false,
      hydrationDone: false,
      sleepDone: true,
      todayPriorityAction: "Complete PM routine before 10 PM to improve barrier repair.",
      adherenceImpact: "Strong adherence adds +5 to projected 30-day score.",
    },
    productIntelligence: {
      activeRegimen: [
        { productName: "Niacinamide Repair Serum", matchPct: 94, purpose: "Reduce inflammation", usageStatus: "active" },
        { productName: "Ceramide Barrier Cream", matchPct: 91, purpose: "Barrier restoration", usageStatus: "active" },
      ],
      purchaseHistory: [
        { orderId: "ORD-2191", productName: "Ceramide Barrier Cream", lastPurchaseDate: toISODate(now.toISOString()), remainingSupplyDays: 18 },
      ],
    },
    scanComparison: {
      latestPhotoUrl: null,
      previousPhotoUrl: null,
      densityImprovementPct: 7,
      inflammationImprovementPct: 10,
      oilBalanceImprovementPct: 6,
      hasScans: false,
    },
    rewardsSummary: {
      currentBalance: 460,
      lifetimeEarned: 760,
      tierLevel: "Gold",
      nextTierProgressPct: 11,
      nextTierLabel: "Platinum",
      nextUnlock: "Premium Regimen Coupon",
      estimatedDaysToNextTier: 12,
      availableDiscount: "10%",
    },
    environmentImpact: {
      uvIndex: 6,
      pollution: 58,
      humidity: 39,
      sleep: 7.2,
      stress: 6,
      hydration: 1900,
      combinedRiskScore: 61,
      explanation: "UV and pollution are elevating oxidative stress; hydration and PM closure mitigate recovery drag.",
    },
    roadmap: {
      currentPhase: "Repair",
      phases: [
        { name: "Stabilize", complete: true },
        { name: "Repair", complete: false },
        { name: "Optimize", complete: false },
      ],
    },
    alerts: [
      { id: "a1", level: "warning", message: "PM routine missed yesterday." },
      { id: "a2", level: "warning", message: "Hydration is below your target today." },
    ],
    dataSources: [
      "Assessment",
      "Photo AI",
      "Routine Logs",
      "Environmental API",
      "Purchase History",
    ],
  };
}

export async function getDashboardDataForViewer(viewer: { userId: string; name: string }): Promise<DashboardPayload> {
  const fallback = buildFallbackPayload(viewer.userId, viewer.name);

  const reportParams = new URLSearchParams({
    select: "id,user_id,alpha_score,severity_index,confidence_score,recovery_probability,created_at,primary_issue,severity_label,root_drivers,risk_if_ignored",
    user_id: `eq.${viewer.userId}`,
    order: "created_at.desc",
    limit: "30",
  });

  const routineParams = new URLSearchParams({
    select: "id,user_id,log_date,am_done,pm_done,hydration_ml,sleep_hours,stress_level,adherence_score",
    user_id: `eq.${viewer.userId}`,
    order: "log_date.desc",
    limit: "30",
  });

  const scanParams = new URLSearchParams({
    select: "id,user_id,scan_date,image_url,density_score,inflammation_score,oil_balance_score",
    user_id: `eq.${viewer.userId}`,
    order: "scan_date.desc",
    limit: "5",
  });

  const assessmentParams = new URLSearchParams({
    select: "id,user_id,completed_at,completeness_pct",
    user_id: `eq.${viewer.userId}`,
    order: "completed_at.desc",
    limit: "1",
  });

  const sikkaParams = new URLSearchParams({
    select: "id,user_id,amount,created_at",
    user_id: `eq.${viewer.userId}`,
    order: "created_at.desc",
    limit: "200",
  });

  const recommendationParams = new URLSearchParams({
    select: "id,user_id,product_id,product_name,match_pct,purpose,usage_status",
    user_id: `eq.${viewer.userId}`,
    order: "match_pct.desc",
    limit: "20",
  });

  const [reports, routineLogs, scans, assessments, sikkaTransactions, recommendations, orders] = await Promise.all([
    querySupabase<ClinicalReportRow>("clinical_reports", reportParams),
    querySupabase<RoutineLogRow>("routine_logs", routineParams),
    querySupabase<PhotoScanRow>("photo_scans", scanParams),
    querySupabase<AssessmentSummaryRow>("assessment_answers", assessmentParams),
    querySupabase<SikkaTransactionRow>("alpha_sikka_transactions", sikkaParams),
    querySupabase<ProductRecommendationRow>("product_recommendations", recommendationParams),
    fetchShopifyOrders(viewer.userId),
  ]);

  if (!reports.length && !routineLogs.length && !scans.length && !recommendations.length) {
    return fallback;
  }

  const latestReport = reports[0];
  const previousReport = reports[1] || latestReport;

  const last7Logs = routineLogs.slice(0, 7);
  const adherenceValues = last7Logs
    .map((log) => Number(log.adherence_score ?? ((Number(log.am_done) + Number(log.pm_done)) * 50)))
    .filter((value) => Number.isFinite(value));

  const adherenceScore = Math.round(average(adherenceValues));
  const consistencyPct = Math.round(
    average(last7Logs.map((log) => (Number(log.am_done) + Number(log.pm_done)) * 50))
  );

  const dataCompleteness = Math.round(
    assessments[0]?.completeness_pct ?? Math.min(100, 35 + (routineLogs.length * 2 + scans.length * 6))
  );

  const alphaDelta = Number((latestReport?.alpha_score ?? fallback.metrics[0].value) - (previousReport?.alpha_score ?? fallback.metrics[0].value));
  const recoveryDelta = Number((latestReport?.recovery_probability ?? fallback.metrics[3].value) - (previousReport?.recovery_probability ?? fallback.metrics[3].value));
  const severityDelta = Number((latestReport?.severity_index ?? fallback.metrics[1].value) - (previousReport?.severity_index ?? fallback.metrics[1].value));

  const trendPoints = reports
    .slice()
    .reverse()
    .map((item, idx) => {
      const routine = routineLogs[routineLogs.length - 1 - idx];
      const consistency = routine
        ? Math.round((Number(routine.am_done) + Number(routine.pm_done)) * 50)
        : consistencyPct;

      return {
        date: toISODate(item.created_at),
        alphaScore: Math.round(item.alpha_score),
        consistency,
        recovery: Math.round(item.recovery_probability),
      };
    });

  const recentWindow = trendPoints.slice(-7);
  const earlyWindow = trendPoints.slice(-14, -7);
  const recentAlphaAvg = average(recentWindow.map((point) => point.alphaScore));
  const earlyAlphaAvg = average(earlyWindow.map((point) => point.alphaScore));
  const velocity = Number((recentAlphaAvg - earlyAlphaAvg).toFixed(2));

  const trajectory: "Improving" | "Flat" | "Declining" = velocity > 1 ? "Improving" : velocity < -1 ? "Declining" : "Flat";

  const projected30DayScore = Math.max(
    0,
    Math.min(100, Math.round((latestReport?.alpha_score ?? 0) + velocity * 4 + (adherenceScore - 60) * 0.08))
  );

  const hydrationAvg = average(last7Logs.map((log) => log.hydration_ml));
  const sleepAvg = average(last7Logs.map((log) => log.sleep_hours));
  const stressAvg = average(last7Logs.map((log) => log.stress_level));

  const uvRisk = hydrationAvg > 0 ? 0 : 8;
  const pollutionRisk = stressAvg > 6 ? 12 : 6;
  const humidityRisk = hydrationAvg < 2200 ? 11 : 5;
  const combinedRiskScore = Math.max(0, Math.min(100, Math.round(uvRisk + pollutionRisk + humidityRisk + (100 - adherenceScore) * 0.35)));

  const latestScan = scans[0];
  const previousScan = scans[1];

  const densityImprovementPct = Math.round((latestScan?.density_score ?? 65) - (previousScan?.density_score ?? 60));
  const inflammationImprovementPct = Math.round((previousScan?.inflammation_score ?? 55) - (latestScan?.inflammation_score ?? 48));
  const oilBalanceImprovementPct = Math.round((latestScan?.oil_balance_score ?? 68) - (previousScan?.oil_balance_score ?? 62));

  const sikkaBalance = sikkaTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const lifetimeEarned = sikkaTransactions
    .filter((tx) => Number(tx.amount || 0) > 0)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const tierThresholds = [
    { label: "Bronze" as const, min: 0, max: 199, discount: "5%" },
    { label: "Silver" as const, min: 200, max: 599, discount: "10%" },
    { label: "Gold" as const, min: 600, max: 1499, discount: "20%" },
    { label: "Platinum" as const, min: 1500, max: 2999, discount: "40%" },
    { label: "Elite" as const, min: 3000, max: Number.MAX_SAFE_INTEGER, discount: "60%" },
  ];

  const currentTier = tierThresholds.find((tier) => lifetimeEarned >= tier.min && lifetimeEarned <= tier.max) || tierThresholds[0];
  const nextTier = tierThresholds.find((tier) => tier.min > currentTier.min) || null;
  const nextTierProgressPct = nextTier
    ? Math.max(0, Math.min(100, Math.round(((lifetimeEarned - currentTier.min) / Math.max(1, nextTier.min - currentTier.min)) * 100)))
    : 100;

  const nextTierThreshold = 600;
  const remainingCredits = Math.max(0, nextTierThreshold - sikkaBalance);
  const creditsPerDay = Math.max(1, Math.round(adherenceScore / 20));
  const estimatedDaysToTier = Math.ceil(remainingCredits / creditsPerDay);

  const activeRegimen = recommendations.map((item) => ({
    productName: item.product_name,
    matchPct: Math.round(item.match_pct),
    purpose: item.purpose,
    usageStatus: item.usage_status,
  }));

  const purchaseHistory = orders.flatMap((order) =>
    (order.line_items || []).map((line) => ({
      orderId: String(order.id),
      productName: line.title || "Product",
      lastPurchaseDate: toISODate(order.created_at),
      remainingSupplyDays: Math.max(0, 30 - Math.ceil((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))),
    }))
  );

  const alerts: DashboardPayload["alerts"] = [];

  if (last7Logs[0] && !last7Logs[0].pm_done) {
    alerts.push({ id: "alert_routine", level: "warning", message: "PM routine missed in the latest log." });
  }
  if (hydrationAvg < 2200) {
    alerts.push({ id: "alert_hydration", level: "warning", message: "Hydration is below recommended threshold." });
  }
  if (severityDelta > 2) {
    alerts.push({ id: "alert_severity", level: "critical", message: "Severity trend is worsening week-over-week." });
  }
  if (combinedRiskScore >= 70) {
    alerts.push({ id: "alert_env", level: "warning", message: "Environmental risk is high; prioritize protective routine." });
  }

  const streakDays = routineLogs.reduce((count, row, idx) => {
    if (idx === 0 && (row.am_done || row.pm_done)) return 1;
    if (idx > 0 && (row.am_done || row.pm_done)) return count + 1;
    return count;
  }, 0);

  const roadmapPhase: DashboardPayload["roadmap"]["currentPhase"] =
    (latestReport?.alpha_score ?? 0) < 55 ? "Stabilize" :
    (latestReport?.alpha_score ?? 0) < 78 ? "Repair" : "Optimize";

  const payload: DashboardPayload = {
    profile: {
      userId: viewer.userId,
      displayName: viewer.name,
      greeting: `Good Morning, ${viewer.name}`,
      streakDays,
      consistencyPct,
      improvementMessage: `Your hydration improved ${Math.max(0, Math.round((hydrationAvg - 1800) / 100))}% this week.`,
    },
    metrics: [
      {
        key: "alphaScore",
        label: "Alpha Score",
        value: Math.round(latestReport?.alpha_score ?? fallback.metrics[0].value),
        delta: alphaDelta,
        trend: trendDirection(alphaDelta),
        confidence: 93,
      },
      {
        key: "severityIndex",
        label: "Severity Index",
        value: Math.round(latestReport?.severity_index ?? fallback.metrics[1].value),
        delta: severityDelta,
        trend: trendDirection(-severityDelta),
        confidence: 88,
      },
      {
        key: "confidence",
        label: "Confidence",
        value: Math.round(latestReport?.confidence_score ?? fallback.metrics[2].value),
        delta: Math.round((alphaDelta + adherenceScore * 0.02) * 10) / 10,
        trend: trendDirection(alphaDelta),
        confidence: 90,
      },
      {
        key: "recoveryProbability",
        label: "Recovery Probability",
        value: Math.round(latestReport?.recovery_probability ?? fallback.metrics[3].value),
        delta: recoveryDelta,
        trend: trendDirection(recoveryDelta),
        confidence: 85,
      },
      {
        key: "adherenceScore",
        label: "Adherence Score",
        value: Math.round(adherenceScore || fallback.metrics[4].value),
        delta: Math.round((adherenceScore - average(routineLogs.slice(7, 14).map((row) => row.adherence_score ?? 0))) * 10) / 10,
        trend: trendDirection(adherenceScore - 70),
        confidence: 87,
      },
      {
        key: "dataCompleteness",
        label: "Data Completeness",
        value: dataCompleteness,
        delta: Math.round((dataCompleteness - fallback.metrics[5].value) * 10) / 10,
        trend: trendDirection(dataCompleteness - 80),
        confidence: 95,
      },
    ],
    trends: {
      points: trendPoints.length ? trendPoints : fallback.trends.points,
      biggestImprovementDriver: adherenceScore >= 75 ? "Routine adherence and PM completion" : "Hydration recovery", 
      biggestRiskFactor: sleepAvg < 6.5 ? "Sleep debt reducing nightly repair" : "Inconsistent evening compliance",
      projected30DayScore,
      trajectory,
      improvementVelocity: velocity,
    },
    primaryConcern: {
      issue: latestReport?.primary_issue || fallback.primaryConcern.issue,
      severity: latestReport?.severity_label || fallback.primaryConcern.severity,
      rootDrivers: latestReport?.root_drivers?.length ? latestReport.root_drivers : fallback.primaryConcern.rootDrivers,
      estimatedWindow: projected30DayScore >= 80 ? "2-4 weeks" : "4-8 weeks",
      riskIfIgnored: latestReport?.risk_if_ignored || fallback.primaryConcern.riskIfIgnored,
    },
    routineStatus: {
      amDone: Boolean(last7Logs[0]?.am_done),
      pmDone: Boolean(last7Logs[0]?.pm_done),
      hydrationDone: hydrationAvg >= 2200,
      sleepDone: sleepAvg >= 7,
      todayPriorityAction: !last7Logs[0]?.pm_done
        ? "Complete PM routine before 10 PM to improve barrier repair."
        : "Maintain hydration and lock in sleep before 11 PM.",
      adherenceImpact: `Current adherence contributes +${Math.max(1, Math.round((adherenceScore - 60) / 5))} projected Alpha points.`,
    },
    productIntelligence: {
      activeRegimen: activeRegimen.length ? activeRegimen : fallback.productIntelligence.activeRegimen,
      purchaseHistory: purchaseHistory.length ? purchaseHistory : fallback.productIntelligence.purchaseHistory,
    },
    scanComparison: {
      latestPhotoUrl: latestScan?.image_url || null,
      previousPhotoUrl: previousScan?.image_url || null,
      densityImprovementPct,
      inflammationImprovementPct,
      oilBalanceImprovementPct,
      hasScans: Boolean(latestScan && previousScan),
    },
    rewardsSummary: {
      currentBalance: sikkaBalance || fallback.rewardsSummary.currentBalance,
      lifetimeEarned: lifetimeEarned || fallback.rewardsSummary.lifetimeEarned,
      tierLevel: currentTier.label,
      nextTierProgressPct,
      nextTierLabel: nextTier?.label || "Top Tier",
      nextUnlock: "Premium Regimen Coupon",
      estimatedDaysToNextTier: estimatedDaysToTier || fallback.rewardsSummary.estimatedDaysToNextTier,
      availableDiscount: currentTier.discount,
    },
    environmentImpact: {
      uvIndex: 6,
      pollution: 58,
      humidity: Math.round((hydrationAvg / 60) || 40),
      sleep: Number(sleepAvg.toFixed(1)) || 7,
      stress: Number(stressAvg.toFixed(1)) || 5,
      hydration: Math.round(hydrationAvg || 2000),
      combinedRiskScore,
      explanation: "External exposure and lifestyle signals are combined into one recovery risk score to guide today’s protocol intensity.",
    },
    roadmap: {
      currentPhase: roadmapPhase,
      phases: [
        { name: "Stabilize", complete: roadmapPhase !== "Stabilize" },
        { name: "Repair", complete: roadmapPhase === "Optimize" },
        { name: "Optimize", complete: false },
      ],
    },
    alerts: alerts.length ? alerts : fallback.alerts,
    dataSources: [
      "Assessment",
      "Photo AI",
      "Routine Logs",
      "Environmental API",
      "Purchase History",
    ],
  };

  return payload;
}

export async function getDashboardData(cookieHeader?: string): Promise<DashboardPayload> {
  const viewer = await resolveViewer(cookieHeader);
  return getDashboardDataForViewer(viewer);
}
