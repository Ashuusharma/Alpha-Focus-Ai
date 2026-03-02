import { UserClinicalProfile } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computeRecovery(profile: UserClinicalProfile) {
  const severity = profile.metrics.severityIndex;
  const adherence = profile.signals.routineAdherence ?? 0;
  const sleep = profile.signals.sleepScore ?? 0;

  const baseProbability = clamp(92 - severity * 0.6);
  const adherenceBoost = adherence > 0 ? Math.min(12, adherence * 0.12) : 0;
  const sleepBoost = sleep > 0 ? Math.min(8, (sleep - 50) * 0.1) : 0;

  const probability = clamp(baseProbability + adherenceBoost + sleepBoost, 15, 98);

  const estimatedWeeks = Math.max(4, Math.round(4 + (severity / 12) - adherenceBoost / 6));

  return {
    recoveryProbability: probability,
    estimatedWeeksToImprove: estimatedWeeks,
    adherenceImpact: Number((adherenceBoost / 12).toFixed(2)),
  };
}
