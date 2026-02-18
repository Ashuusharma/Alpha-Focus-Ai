"use client";

import { useState, useEffect, useCallback } from "react";
import { getActiveUserName, getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";

export interface UserData {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  lastUpdated: string;
}

export interface AssessmentData {
  id: string;
  categoryId: string;
  answers: Record<string, string>;
  completedAt: string;
  progress: number;
}

export interface ScanData {
  id: string;
  date: string;
  type: "skin" | "hair" | "overall";
  imageUrl?: string;
  condition: string;
  confidence: number;
  recommendations: string[];
  findings: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  icon: string;
  details?: string;
}

const STORAGE_KEYS = {
  USER: "oneman_user_data",
  ASSESSMENTS: "oneman_assessments",
  SCANS: "oneman_scans",
  ACTIVITY: "oneman_activity_log",
  PROGRESS: "oneman_progress",
};

function readScopedJson<T>(key: string, fallback: T): T {
  try {
    const raw = getScopedLocalItem(key, getActiveUserName(), true);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeScopedJson<T>(key: string, value: T, mirrorLegacy = false): void {
  setScopedLocalItem(key, JSON.stringify(value), getActiveUserName(), mirrorLegacy);
}

export function useUserData() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Create default guest user
          const defaultUser: UserData = {
            userId: `user_${Date.now()}`,
            name: "Guest User",
            email: "user@example.com",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
          setUser(defaultUser);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { user, isLoading, updateUser };
}

export function useAssessments() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = () => {
      try {
        setAssessments(readScopedJson<AssessmentData[]>(STORAGE_KEYS.ASSESSMENTS, []));
      } catch (error) {
        console.error("Failed to load assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, []);

  const saveAssessment = useCallback((assessment: AssessmentData) => {
    setAssessments((prev) => {
      const updated = [...prev, assessment];
      writeScopedJson(STORAGE_KEYS.ASSESSMENTS, updated);
      return updated;
    });
  }, []);

  const updateAssessment = useCallback((id: string, updates: Partial<AssessmentData>) => {
    setAssessments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      writeScopedJson(STORAGE_KEYS.ASSESSMENTS, updated);
      return updated;
    });
  }, []);

  return { assessments, isLoading, saveAssessment, updateAssessment };
}

export function useScans() {
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScans = () => {
      try {
        setScans(readScopedJson<ScanData[]>(STORAGE_KEYS.SCANS, []));
      } catch (error) {
        console.error("Failed to load scans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScans();
  }, []);

  const saveScan = useCallback((scan: ScanData) => {
    setScans((prev) => {
      const updated = [scan, ...prev];
      writeScopedJson(STORAGE_KEYS.SCANS, updated);
      logActivity(`Saved ${scan.type} analysis`, "📸");
      return updated;
    });
  }, []);

  const deleteScan = useCallback((id: string) => {
    setScans((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      writeScopedJson(STORAGE_KEYS.SCANS, updated);
      return updated;
    });
  }, []);

  return { scans, isLoading, saveScan, deleteScan };
}

export function useActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = () => {
      try {
        setActivities(readScopedJson<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, []));
      } catch (error) {
        console.error("Failed to load activity log:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, []);

  const logActivity = useCallback((action: string, icon: string, details?: string) => {
    const activity: ActivityLog = {
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      icon,
      details,
    };

    setActivities((prev) => {
      const updated = [activity, ...prev];
      writeScopedJson(STORAGE_KEYS.ACTIVITY, updated);
      return updated;
    });
  }, []);

  return { activities, isLoading, logActivity };
}

export function logActivity(action: string, icon: string, details?: string) {
  try {
    const activities = readScopedJson<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, []);

    const activity: ActivityLog = {
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      icon,
      details,
    };

    activities.unshift(activity);
    writeScopedJson(STORAGE_KEYS.ACTIVITY, activities);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function getProgressData() {
  try {
    const assessments = readScopedJson<AssessmentData[]>(STORAGE_KEYS.ASSESSMENTS, []);

    const totalAnswers = assessments.reduce((sum, a) => sum + Object.keys(a.answers).length, 0);
    const avgProgress = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.progress, 0) / assessments.length 
      : 0;

    return {
      totalAssessments: assessments.length,
      totalAnsweredQuestions: totalAnswers,
      averageProgress: Math.round(avgProgress),
      assessments,
    };
  } catch (error) {
    console.error("Failed to get progress data:", error);
    return {
      totalAssessments: 0,
      totalAnsweredQuestions: 0,
      averageProgress: 0,
      assessments: [],
    };
  }
}

export function getComparisonData() {
  try {
    const assessments = readScopedJson<AssessmentData[]>(STORAGE_KEYS.ASSESSMENTS, []);

    if (assessments.length < 2) {
      return {
        current: null,
        previous: null,
        comparison: [],
      };
    }

    const sorted = [...assessments].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    const current = sorted[0];
    const previous = sorted[1];

    return {
      current,
      previous,
      comparison: [
        {
          metric: "Overall Progress",
          jan: current.progress,
          dec: previous.progress,
          change: `${current.progress - previous.progress > 0 ? "+" : ""}${current.progress - previous.progress}%`,
        },
      ],
    };
  } catch (error) {
    console.error("Failed to get comparison data:", error);
    return {
      current: null,
      previous: null,
      comparison: [],
    };
  }
}
