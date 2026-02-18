// User Profile & History Management System
// Manages user data, scan history, and progress tracking

import { AnalysisResult } from "@/lib/analyzeImage";
import { CombinedAnalysis } from "@/lib/aiAnalysisEngine";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
  lastLogin: number;
  bio?: string;
  level: number;
  xp: number;
  achievements: string[];
  streakCount: number;
}

export interface ScanRecord {
  id: string;
  userId: string;
  timestamp: number;
  photoAnalysis: AnalysisResult | null;
  questionnaireAnswers: Record<string, string>;
  aiAnalysis: CombinedAnalysis;
  notes?: string;
  beforeImage?: string; // base64 of photo taken
}

export interface ProgressMetric {
  recordId: string;
  issueName: string;
  confidenceTrend: number[]; // [92, 88, 85] = improving
  impactTrend: ("minor" | "moderate" | "significant")[];
  daysSince: number;
}

export interface UserHistory {
  userId: string;
  scans: ScanRecord[];
  progressMetrics: ProgressMetric[];
  totalScans: number;
  firstScanDate: number;
  lastScanDate: number;
  averageImprovement: number; // percentage
}

/**
 * Initialize or get current user
 */
export function getCurrentUser(): UserProfile {
  if (typeof window === "undefined") {
    return createNewUser();
  }

  const stored = localStorage.getItem("oneman_user_profile");
  if (stored) {
    const parsed = JSON.parse(stored) as Partial<UserProfile>;
    const hydrated: UserProfile = {
      id: parsed.id || generateId(),
      name: parsed.name || "Guest User",
      email: parsed.email || "",
      avatar: parsed.avatar,
      createdAt: parsed.createdAt || Date.now(),
      lastLogin: parsed.lastLogin || Date.now(),
      bio: parsed.bio,
      level: Number.isFinite(parsed.level) ? Number(parsed.level) : 1,
      xp: Number.isFinite(parsed.xp) ? Number(parsed.xp) : 0,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      streakCount: Number.isFinite(parsed.streakCount) ? Number(parsed.streakCount) : 0,
    };
    localStorage.setItem("oneman_user_profile", JSON.stringify(hydrated));
    return hydrated;
  }

  const user = createNewUser();
  localStorage.setItem("oneman_user_profile", JSON.stringify(user));
  return user;
}

/**
 * Create a new user
 */
function createNewUser(): UserProfile {
  return {
    id: generateId(),
    name: "Guest User",
    email: "",
    createdAt: Date.now(),
    lastLogin: Date.now(),
    level: 1,
    xp: 0,
    achievements: [],
    streakCount: 0,
  };
}

/**
 * Update user profile
 */
export function updateUserProfile(
  updates: Partial<UserProfile>
): UserProfile {
  const user = getCurrentUser();
  const updated = { ...user, ...updates, lastLogin: Date.now() };
  localStorage.setItem("oneman_user_profile", JSON.stringify(updated));
  return updated;
}

/**
 * Save a scan record to history
 */
export function saveScanRecord(
  photoAnalysis: AnalysisResult | null,
  questionnaireAnswers: Record<string, string>,
  aiAnalysis: CombinedAnalysis,
  beforeImage?: string
): ScanRecord {
  const user = getCurrentUser();

  const record: ScanRecord = {
    id: generateId(),
    userId: user.id,
    timestamp: Date.now(),
    photoAnalysis,
    questionnaireAnswers,
    aiAnalysis,
    beforeImage,
  };

  // Save to history
  const history = getUserHistory();
  history.scans.push(record);
  history.totalScans = history.scans.length;
  history.lastScanDate = record.timestamp;

  if (history.scans.length === 1) {
    history.firstScanDate = record.timestamp;
  }

  // Update progress metrics
  updateProgressMetrics(history, record);

  localStorage.setItem(
    `oneman_user_history_${user.id}`,
    JSON.stringify(history)
  );

  return record;
}

/**
 * Get user's complete history
 */
export function getUserHistory(): UserHistory {
  if (typeof window === "undefined") {
    return createEmptyHistory();
  }

  const user = getCurrentUser();
  const key = `oneman_user_history_${user.id}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    return JSON.parse(stored);
  }

  return createEmptyHistory();
}

/**
 * Create empty history structure
 */
function createEmptyHistory(): UserHistory {
  const user = getCurrentUser();
  return {
    userId: user.id,
    scans: [],
    progressMetrics: [],
    totalScans: 0,
    firstScanDate: 0,
    lastScanDate: 0,
    averageImprovement: 0,
  };
}

/**
 * Get all scans for a user
 */
export function getUserScans(): ScanRecord[] {
  return getUserHistory().scans;
}

/**
 * Get latest scan
 */
export function getLatestScan(): ScanRecord | null {
  const history = getUserHistory();
  if (history.scans.length === 0) return null;
  return history.scans[history.scans.length - 1];
}

/**
 * Get previous scan (for comparison)
 */
export function getPreviousScan(): ScanRecord | null {
  const history = getUserHistory();
  if (history.scans.length < 2) return null;
  return history.scans[history.scans.length - 2];
}

/**
 * Calculate progress between two scans
 */
export function calculateProgress(
  previousScan: ScanRecord,
  currentScan: ScanRecord
): {
  improvedIssues: string[];
  worsedIssues: string[];
  newIssues: string[];
  resolvedIssues: string[];
  overallImprovement: number; // -100 to +100
} {
  const previousIssues = previousScan.aiAnalysis.detectedIssues;
  const currentIssues = currentScan.aiAnalysis.detectedIssues;

  const improvedIssues: string[] = [];
  const worsedIssues: string[] = [];
  const resolvedIssues: string[] = [];

  // Find improvements and worsening
  previousIssues.forEach((prevIssue) => {
    const currentMatch = currentIssues.find(
      (ci) => ci.name.toLowerCase() === prevIssue.name.toLowerCase()
    );

    if (!currentMatch) {
      // Issue resolved!
      resolvedIssues.push(prevIssue.name);
    } else if (currentMatch.combinedConfidence < prevIssue.combinedConfidence) {
      // Confidence decreased = improvement
      improvedIssues.push(prevIssue.name);
    } else if (currentMatch.combinedConfidence > prevIssue.combinedConfidence) {
      // Confidence increased = worsening
      worsedIssues.push(prevIssue.name);
    }
  });

  // Find new issues
  const newIssues = currentIssues
    .filter(
      (ci) =>
        !previousIssues.find(
          (pi) => pi.name.toLowerCase() === ci.name.toLowerCase()
        )
    )
    .map((i) => i.name);

  // Calculate overall improvement
  const totalPreviousConfidence = previousIssues.reduce(
    (sum, i) => sum + i.combinedConfidence,
    0
  );
  const totalCurrentConfidence = currentIssues.reduce(
    (sum, i) => sum + i.combinedConfidence,
    0
  );

  const overallImprovement =
    totalPreviousConfidence > 0
      ? Math.round(
          ((totalPreviousConfidence - totalCurrentConfidence) /
            totalPreviousConfidence) *
            100
        )
      : 0;

  return {
    improvedIssues,
    worsedIssues,
    newIssues,
    resolvedIssues,
    overallImprovement,
  };
}

/**
 * Update progress metrics in history
 */
function updateProgressMetrics(history: UserHistory, newScan: ScanRecord) {
  if (history.scans.length <= 1) return;

  const previousScan = history.scans[history.scans.length - 2];
  const issues = newScan.aiAnalysis.detectedIssues;

  // Build confidence trend for each issue
  issues.forEach((issue) => {
    const metric = history.progressMetrics.find(
      (m) => m.issueName.toLowerCase() === issue.name.toLowerCase()
    );

    if (metric) {
      // Update existing metric
      metric.confidenceTrend.push(issue.combinedConfidence);
      metric.impactTrend.push(issue.impact);
      metric.daysSince = Math.floor(
        (Date.now() - newScan.timestamp) / (1000 * 60 * 60 * 24)
      );
    } else {
      // Create new metric
      history.progressMetrics.push({
        recordId: newScan.id,
        issueName: issue.name,
        confidenceTrend: [issue.combinedConfidence],
        impactTrend: [issue.impact],
        daysSince: 0,
      });
    }
  });

  // Calculate average improvement
  const improvements = history.progressMetrics
    .filter((m) => m.confidenceTrend.length > 1)
    .map((m) => {
      const first = m.confidenceTrend[0];
      const last = m.confidenceTrend[m.confidenceTrend.length - 1];
      return ((first - last) / first) * 100;
    });

  history.averageImprovement =
    improvements.length > 0
      ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
      : 0;
}

/**
 * Get improvement percentage for specific issue
 */
export function getIssueImprovement(issueName: string): number {
  const history = getUserHistory();
  const metric = history.progressMetrics.find(
    (m) => m.issueName.toLowerCase() === issueName.toLowerCase()
  );

  if (!metric || metric.confidenceTrend.length < 2) return 0;

  const first = metric.confidenceTrend[0];
  const last = metric.confidenceTrend[metric.confidenceTrend.length - 1];
  return Math.round(((first - last) / first) * 100);
}

/**
 * Get confidence trend for issue (for charts)
 */
export function getIssueTrend(issueName: string): number[] {
  const history = getUserHistory();
  const metric = history.progressMetrics.find(
    (m) => m.issueName.toLowerCase() === issueName.toLowerCase()
  );
  return metric?.confidenceTrend || [];
}

/**
 * Clear all user data (for testing/reset)
 */
export function clearAllUserData() {
  if (typeof window === "undefined") return;

  const user = getCurrentUser();
  localStorage.removeItem("oneman_user_profile");
  localStorage.removeItem(`oneman_user_history_${user.id}`);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export user data as JSON (for backup)
 */
export function exportUserData(): string {
  const user = getCurrentUser();
  const history = getUserHistory();
  return JSON.stringify({ user, history }, null, 2);
}

/**
 * Import user data from JSON
 */
export function importUserData(jsonData: string) {
  try {
    const { user, history } = JSON.parse(jsonData);
    localStorage.setItem("oneman_user_profile", JSON.stringify(user));
    localStorage.setItem(
      `oneman_user_history_${user.id}`,
      JSON.stringify(history)
    );
    return true;
  } catch (e) {
    console.error("Failed to import user data:", e);
    return false;
  }
}
