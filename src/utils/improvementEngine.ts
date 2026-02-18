export function calculateImprovementPercent(currentScore: number, previousScore: number): number {
  if (!Number.isFinite(currentScore) || !Number.isFinite(previousScore)) return 0;
  if (previousScore <= 0) return 0;
  const value = ((currentScore - previousScore) / previousScore) * 100;
  return Number(value.toFixed(2));
}
