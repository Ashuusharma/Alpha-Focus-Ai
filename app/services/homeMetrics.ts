import { CategoryId } from "@/lib/questions";

export const categoryColors: Record<CategoryId, string> = {
  hairCare: "from-blue-700 to-indigo-500",
  skinCare: "from-blue-600 to-cyan-500",
  beardCare: "from-indigo-700 to-blue-600",
  bodyCare: "from-blue-600 to-cyan-400",
  healthCare: "from-indigo-700 to-blue-500",
  fitness: "from-slate-700 to-blue-600",
  fragrance: "from-blue-700 to-indigo-600",
};

export function getPollutionRisk(pm25: number): string {
  if (pm25 <= 20) return "Good";
  if (pm25 <= 50) return "Moderate";
  if (pm25 <= 100) return "Unhealthy";
  return "Very Unhealthy";
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getWeeklyResetTimeLabel() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / dayMs) + 1;
  const currentWeek = Math.ceil(dayOfYear / 7);
  const nextWeekStartDay = currentWeek * 7 + 1;
  const nextReset = new Date(now.getFullYear(), 0, nextWeekStartDay);

  const diff = Math.max(0, nextReset.getTime() - now.getTime());
  const totalMinutes = Math.floor(diff / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
