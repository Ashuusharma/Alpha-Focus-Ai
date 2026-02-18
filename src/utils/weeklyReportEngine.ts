export type WeeklyInput = {
  sleepHours: number[];
  hydrationMl: number[];
  moods: Array<"calm" | "neutral" | "stressed">;
  routineCompliance: number[];
  scoreTrend: number[];
};

export type WeeklySummary = {
  strengths: string[];
  risks: string[];
  suggestedFocus: string;
  avgSleep: number;
  avgHydration: number;
  compliance: number;
  scoreDelta: number;
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildWeeklySummary(input: WeeklyInput): WeeklySummary {
  const avgSleep = Number(avg(input.sleepHours).toFixed(1));
  const avgHydration = Math.round(avg(input.hydrationMl));
  const compliance = Math.round(avg(input.routineCompliance));
  const scoreDelta = input.scoreTrend.length > 1 ? input.scoreTrend[input.scoreTrend.length - 1] - input.scoreTrend[0] : 0;

  const stressedDays = input.moods.filter((mood) => mood === "stressed").length;
  const strengths: string[] = [];
  const risks: string[] = [];

  if (avgSleep >= 7) strengths.push("Sleep consistency is strong.");
  else risks.push("Sleep is below optimal recovery range.");

  if (avgHydration >= 3000) strengths.push("Hydration target is consistently met.");
  else risks.push("Hydration remains below 3000ml target.");

  if (compliance >= 80) strengths.push("Routine compliance is high.");
  else risks.push("Routine adherence can be improved.");

  if (stressedDays >= 4) risks.push("Stress pattern is elevated this week.");
  else strengths.push("Mood trend is stable.");

  const suggestedFocus = risks.length > 0
    ? "Prioritize sleep + hydration, then stabilize routine timing."
    : "Maintain current consistency and progressively optimize active treatments.";

  return { strengths, risks, suggestedFocus, avgSleep, avgHydration, compliance, scoreDelta };
}
