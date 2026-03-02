import { UserClinicalProfile } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computeConfidence(profile: UserClinicalProfile): number {
  let score = 65;

  const hasPhoto = Boolean(profile.photoAnalysis?.imageUrl);
  if (hasPhoto) score += 10;

  const answerCount = Object.keys(profile.assessment?.answers || {}).length;
  if (answerCount >= 5) score += 5;
  if (answerCount >= 12) score += 5;

  if ((profile.signals.routineAdherence ?? 0) >= 50) score += 5;

  return clamp(score, 35, 99);
}
