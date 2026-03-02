"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/contexts/AuthProvider";

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

export function useUserData() {
  const { user: authUser, profile } = useContext(AuthContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    const nextUser: UserData = {
      userId: authUser.id,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || "",
      createdAt: authUser.created_at,
      lastUpdated: new Date().toISOString(),
    };

    setUserData(nextUser);
    setIsLoading(false);
  }, [authUser, profile]);

  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!authUser) return;

    if (typeof updates.name === "string" && updates.name.trim()) {
      await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: updates.name.trim(),
      });
    }

    setUserData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [authUser]);

  return { user: userData, isLoading, updateUser };
}

export function useAssessments() {
  const { user: authUser } = useContext(AuthContext);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      if (!authUser) {
        setAssessments([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("assessment_answers")
          .select("id,completed_at,completeness_pct")
          .eq("user_id", authUser.id)
          .order("completed_at", { ascending: false });

        const mapped = (data || []).map((item: { id: string; completed_at: string; completeness_pct?: number | null }) => ({
          id: item.id,
          categoryId: "assessment",
          answers: {},
          completedAt: item.completed_at,
          progress: Math.round(Number(item.completeness_pct || 0)),
        }));
        setAssessments(mapped);
      } catch (error) {
        console.error("Failed to load assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, [authUser]);

  const saveAssessment = useCallback(async (assessment: AssessmentData) => {
    if (!authUser) return;

    await supabase.from("assessment_answers").insert({
      user_id: authUser.id,
      completed_at: assessment.completedAt,
      completeness_pct: assessment.progress,
    });

    setAssessments((prev) => {
      const updated = [...prev, assessment];
      return updated;
    });
  }, [authUser]);

  const updateAssessment = useCallback(async (id: string, updates: Partial<AssessmentData>) => {
    setAssessments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      return updated;
    });

    if (!authUser) return;
    await supabase
      .from("assessment_answers")
      .update({
        completeness_pct: updates.progress,
      })
      .eq("id", id)
      .eq("user_id", authUser.id);
  }, [authUser]);

  return { assessments, isLoading, saveAssessment, updateAssessment };
}

export function useScans() {
  const { user: authUser } = useContext(AuthContext);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScans = async () => {
      if (!authUser) {
        setScans([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("photo_scans")
          .select("id,scan_date,image_url")
          .eq("user_id", authUser.id)
          .order("scan_date", { ascending: false });

        const mapped = (data || []).map((scan: { id: string; scan_date: string; image_url?: string | null }) => ({
          id: scan.id,
          date: scan.scan_date,
          type: "overall" as const,
          imageUrl: scan.image_url || undefined,
          condition: "Synced",
          confidence: 0,
          recommendations: [],
          findings: [],
        }));

        setScans(mapped);
      } catch (error) {
        console.error("Failed to load scans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScans();
  }, [authUser]);

  const saveScan = useCallback(async (scan: ScanData) => {
    if (authUser) {
      await supabase.from("photo_scans").insert({
        user_id: authUser.id,
        scan_date: scan.date,
        image_url: scan.imageUrl || null,
      });
    }

    setScans((prev) => {
      const updated = [scan, ...prev];
      logActivity(`Saved ${scan.type} analysis`, "📸");
      return updated;
    });
  }, [authUser]);

  const deleteScan = useCallback(async (id: string) => {
    setScans((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      return updated;
    });

    if (!authUser) return;
    await supabase.from("photo_scans").delete().eq("id", id).eq("user_id", authUser.id);
  }, [authUser]);

  return { scans, isLoading, saveScan, deleteScan };
}

export function useActivityLog() {
  const { user: authUser } = useContext(AuthContext);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      if (!authUser) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("routine_logs")
          .select("id,log_date,am_done,pm_done")
          .eq("user_id", authUser.id)
          .order("log_date", { ascending: false })
          .limit(40);

        const mapped = (data || []).map((row: { id: string; log_date: string; am_done?: boolean; pm_done?: boolean }) => ({
          id: row.id,
          timestamp: row.log_date,
          action: "Routine updated",
          icon: "✅",
          details: `AM: ${row.am_done ? "Done" : "Missed"} · PM: ${row.pm_done ? "Done" : "Missed"}`,
        }));

        setActivities(mapped);
      } catch (error) {
        console.error("Failed to load activity log:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [authUser]);

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
      return updated;
    });
  }, []);

  return { activities, isLoading, logActivity };
}

export function logActivity(action: string, icon: string, details?: string) {
  console.debug("Activity:", { action, icon, details });
}

export function getProgressData() {
  return {
    totalAssessments: 0,
    totalAnsweredQuestions: 0,
    averageProgress: 0,
    assessments: [],
  };
}

export function getComparisonData() {
  return {
    current: null,
    previous: null,
    comparison: [],
  };
}
