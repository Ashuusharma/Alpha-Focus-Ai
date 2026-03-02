"use client";

import { useEffect, useMemo, useState } from "react";
import { HabitTier, calculateHabitScore } from "@/lib/habitScore";
import { categories, CategoryId, questions } from "@/lib/questions";
import { AlphaScoreInput, calculateAlphaScore } from "@/lib/calculateAlphaScore";
import { getActiveUserName, getScopedLocalItem, getScopedSessionItem } from "@/lib/userScopedStorage";
import { clampScore } from "@/app/services/homeMetrics";
import { EnvSummary } from "@/app/hooks/useHomeEnvironment";

export type ProgressPoint = {
  date: string;
  score: number;
};

type Activity = {
  timestamp?: string;
  action?: string;
};

type UseHomeProgressParams = {
  userId: string | null;
  envSummary: EnvSummary | null;
  refreshKey?: number;
};

type UseHomeProgressResult = {
  alphaScore: number;
  confidence: number;
  monthlyDelta: number;
  progressPercentage: number;
  chartData: ProgressPoint[];
  alphaScoreInput: AlphaScoreInput;
  assessmentAnsweredCount: number;
  categoriesCompleted: number;
  habitScore: { score: number; tier: HabitTier } | null;
  streakDays: number;
  isLoading: boolean;
  error: string | null;
};

const EMPTY_ALPHA_INPUT: AlphaScoreInput = {
  skinScore: 0,
  hairScore: 0,
  lifestyleScore: 0,
  streakScore: 0,
};

export function useHomeProgress({ userId, envSummary, refreshKey = 0 }: UseHomeProgressParams): UseHomeProgressResult {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId) {
      setAnswers({});
      setActivities([]);
      setStreakDays(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const activeUser = userId || getActiveUserName();
      const answersRaw = getScopedSessionItem("assessment_answers_v1", activeUser, true);
      const answersParsed = answersRaw ? (JSON.parse(answersRaw) as Record<string, string>) : {};

      const activityRaw =
        getScopedLocalItem("oneman_activity", activeUser, true) ||
        getScopedLocalItem("oneman_activity_log", activeUser, true);
      const activitiesParsed = activityRaw ? (JSON.parse(activityRaw) as Activity[]) : [];

      const streakState = getScopedLocalItem("oneman_streak", activeUser, true);
      const streakParsed = streakState ? JSON.parse(streakState).streak || 0 : 0;

      setAnswers(answersParsed);
      setActivities(Array.isArray(activitiesParsed) ? activitiesParsed : []);
      setStreakDays(Number.isFinite(streakParsed) ? Math.max(0, Math.round(streakParsed)) : 0);
    } catch {
      setError("Could not load local progress data.");
      setAnswers({});
      setActivities([]);
      setStreakDays(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshKey]);

  const assessmentAnsweredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const categoriesCompleted = useMemo(() => {
    const answeredIds = new Set(Object.keys(answers));
    const questionToCategory = new Map<string, CategoryId>();

    categories.forEach((cat) => {
      questions[cat.id].forEach((question) => {
        questionToCategory.set(question.id, cat.id);
      });
    });

    const completed = new Set<CategoryId>();
    answeredIds.forEach((questionId) => {
      const category = questionToCategory.get(questionId);
      if (category) completed.add(category);
    });

    return completed.size;
  }, [answers]);

  const habitScore = useMemo(() => {
    if (!userId) return null;

    const now = Date.now();
    const last7d = activities.filter(
      (activity) => activity.timestamp && now - new Date(activity.timestamp).getTime() < 7 * 86400000
    );

    return calculateHabitScore({
      routineCompletions7d: last7d.length,
      scansLast14d: activities.filter((activity) => activity.action?.includes("scan")).length,
      remindersOpened7d: last7d.filter((activity) => activity.action?.includes("reminder")).length,
      remindersDismissed7d: 0,
      cartInteractions7d: last7d.filter((activity) => activity.action?.includes("cart")).length,
      streakDays,
      lastActiveAt: activities[0]?.timestamp,
    });
  }, [activities, streakDays, userId]);

  const alphaScoreInput = useMemo<AlphaScoreInput>(() => {
    if (!userId) return EMPTY_ALPHA_INPUT;

    const categoryQuestionIds = new Map<CategoryId, string[]>();
    categories.forEach((category) => {
      categoryQuestionIds.set(
        category.id,
        questions[category.id].map((question) => question.id)
      );
    });

    const getCategoryCompletion = (targetCategories: CategoryId[]) => {
      const targetIds = targetCategories.flatMap((categoryId) => categoryQuestionIds.get(categoryId) || []);
      if (targetIds.length === 0) return 0;
      const answeredCount = targetIds.reduce((count, questionId) => (answers[questionId] ? count + 1 : count), 0);
      return clampScore((answeredCount / targetIds.length) * 100);
    };

    const consistencyScore = habitScore?.score ?? clampScore(streakDays * 6);
    const skinScore = getCategoryCompletion(["skinCare", "bodyCare"]);
    const hairScore = getCategoryCompletion(["hairCare", "beardCare", "fragrance"]);
    const lifestyleQuestionScore = getCategoryCompletion(["healthCare", "fitness"]);
    const environmentScore = envSummary
      ? clampScore(100 - envSummary.pm25 * 1.2 + envSummary.humidity * 0.1 + (10 - Math.abs(24 - envSummary.tempC)) * 2)
      : 60;
    const lifestyleScore = clampScore(lifestyleQuestionScore * 0.7 + environmentScore * 0.3);

    return {
      skinScore,
      hairScore,
      lifestyleScore,
      streakScore: consistencyScore,
    };
  }, [answers, envSummary, habitScore?.score, streakDays, userId]);

  const alphaScore = useMemo(() => calculateAlphaScore(alphaScoreInput), [alphaScoreInput]);

  const chartData = useMemo<ProgressPoint[]>(() => {
    if (!userId) return [];

    const today = new Date();
    const points: ProgressPoint[] = [];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const day = new Date(today);
      day.setHours(0, 0, 0, 0);
      day.setDate(today.getDate() - dayOffset);

      const dailyActivityCount = activities.filter((activity) => {
        if (!activity.timestamp) return false;
        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === day.getTime();
      }).length;

      const trendBoost = (6 - dayOffset) * 1.5;
      const score = clampScore(alphaScore - 8 + trendBoost + dailyActivityCount * 2);

      points.push({
        date: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score,
      });
    }

    return points;
  }, [activities, alphaScore, userId]);

  const monthlyDelta = useMemo(() => {
    if (!userId) return 0;

    const getMonthScore = (monthOffset: number) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);

      const monthActivities = activities.filter((activity) => {
        if (!activity.timestamp) return false;
        const timestamp = new Date(activity.timestamp);
        return timestamp >= start && timestamp < end;
      });

      const scanCount = monthActivities.filter((activity) => activity.action?.includes("scan")).length;
      const reminderCount = monthActivities.filter((activity) => activity.action?.includes("reminder")).length;
      const cartCount = monthActivities.filter((activity) => activity.action?.includes("cart")).length;

      const engagementBoost = Math.min(18, monthActivities.length * 1.2 + scanCount * 2 + reminderCount + cartCount * 0.5);
      return clampScore(alphaScore - 10 + engagementBoost);
    };

    const currentMonthScore = getMonthScore(0);
    const previousMonthScore = getMonthScore(1);
    return currentMonthScore - previousMonthScore;
  }, [activities, alphaScore, userId]);

  const confidence = useMemo(() => {
    if (!userId) return 0;
    const assessmentComponent = Math.min(35, categoriesCompleted * 5);
    const activityComponent = Math.min(35, activities.length * 2);
    const envComponent = envSummary ? 10 : 0;
    const consistencyComponent = Math.round((habitScore?.score || 0) * 0.2);
    return clampScore(20 + assessmentComponent + activityComponent + envComponent + consistencyComponent);
  }, [activities.length, categoriesCompleted, envSummary, habitScore?.score, userId]);

  const progressPercentage = useMemo(() => alphaScore, [alphaScore]);

  return {
    alphaScore,
    confidence,
    monthlyDelta,
    progressPercentage,
    chartData,
    alphaScoreInput,
    assessmentAnsweredCount,
    categoriesCompleted,
    habitScore,
    streakDays,
    isLoading,
    error,
  };
}