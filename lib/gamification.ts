export function calculateLevel(xp: number): number {
  return Math.floor(Math.max(0, xp) / 500) + 1;
}

export function getLevelTitle(level: number): string {
  if (level >= 10) return "Legendary Alpha";
  if (level >= 8) return "Elite Alpha";
  if (level >= 5) return "Focused Alpha";
  if (level >= 3) return "Disciplined Alpha";
  if (level >= 2) return "Rising Alpha";
  return "Starter Alpha";
}
