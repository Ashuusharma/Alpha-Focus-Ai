export type DisciplineInputs = {
  routineCompletionRate: number;
  streakDays: number;
  scanFrequencyPerMonth: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function calculateDisciplineScore({
  routineCompletionRate,
  streakDays,
  scanFrequencyPerMonth,
}: DisciplineInputs) {
  const routineComponent = clamp(routineCompletionRate) * 0.6;
  const streakNormalized = clamp((streakDays / 30) * 100);
  const streakComponent = streakNormalized * 0.3;
  const scanFrequencyNormalized = clamp((scanFrequencyPerMonth / 8) * 100);
  const scanComponent = scanFrequencyNormalized * 0.1;

  return Math.round(clamp(routineComponent + streakComponent + scanComponent));
}

export function calculateRecoveryVelocity(improvementPercentage: number, daysBetweenScans: number) {
  const safeDays = Math.max(1, daysBetweenScans);
  const monthlyRate = (Math.max(0, improvementPercentage) / safeDays) * 30;

  if (monthlyRate >= 20) return { score: 90, label: "Fast" as const };
  if (monthlyRate >= 10) return { score: 70, label: "Moderate" as const };
  if (monthlyRate > 0) return { score: 50, label: "Slow" as const };
  return { score: 25, label: "Stalled" as const };
}
