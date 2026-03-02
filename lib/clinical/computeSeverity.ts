import { UserClinicalProfile } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computeSeverity(profile: UserClinicalProfile): number {
  let base = 0;

  const photo = profile.photoAnalysis;
  if (photo?.densityScore !== undefined) {
    base += 40 - photo.densityScore;
  }
  if (photo?.inflammationScore !== undefined) {
    base += photo.inflammationScore * 0.45;
  }
  if (photo?.oilBalanceScore !== undefined) {
    base += Math.max(0, 55 - photo.oilBalanceScore) * 0.25;
  }

  if (photo?.imageUrl && base === 0) {
    base += 45;
  }

  const stress = profile.signals.stressLevel ?? 0;
  const sleep = profile.signals.sleepScore ?? 0;
  const hydration = profile.signals.hydrationLevel ?? 0;

  if (stress >= 70) base += 12;
  if (sleep > 0 && sleep < 45) base += 10;
  if (hydration > 0 && hydration < 45) base += 6;

  return clamp(base);
}
