"use client";

import { useState, useEffect, useCallback } from "react";

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
        const stored = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
        setAssessments(stored ? JSON.parse(stored) : []);
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
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateAssessment = useCallback((id: string, updates: Partial<AssessmentData>) => {
    setAssessments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
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
        const stored = localStorage.getItem(STORAGE_KEYS.SCANS);
        setScans(stored ? JSON.parse(stored) : []);
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
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(updated));
      logActivity(`Saved ${scan.type} analysis`, "📸");
      return updated;
    });
  }, []);

  const deleteScan = useCallback((id: string) => {
    setScans((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(updated));
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
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
        setActivities(stored ? JSON.parse(stored) : []);
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
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { activities, isLoading, logActivity };
}

export function logActivity(action: string, icon: string, details?: string) {
  try {
    const activities: ActivityLog[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ACTIVITY) || "[]"
    );

    const activity: ActivityLog = {
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      icon,
      details,
    };

    activities.unshift(activity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function getProgressData() {
  try {
    const assessments: AssessmentData[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ASSESSMENTS) || "[]"
    );

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
    const assessments: AssessmentData[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ASSESSMENTS) || "[]"
    );

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
