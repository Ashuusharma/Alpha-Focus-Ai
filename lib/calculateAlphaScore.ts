export interface AlphaScoreInput {
  skinScore?: number;
  hairScore?: number;
  lifestyleScore?: number;
  streakScore?: number;
  sleepConsistency?: number;
  stressImpact?: number;
  hydrationConsistency?: number;
}

export function calculateAlphaScore(data: AlphaScoreInput): number {
  const skin = data.skinScore ?? 0;
  const hair = data.hairScore ?? 0;
  const lifestyle = data.lifestyleScore ?? 0;
  const consistency = data.streakScore ?? 0;
  const sleepConsistency = data.sleepConsistency ?? lifestyle;
  const hydrationConsistency = data.hydrationConsistency ?? lifestyle;
  const stressImpact = data.stressImpact ?? 50;

  const lifestyleComposite = Math.max(
    0,
    Math.min(
      100,
      sleepConsistency * 0.45 + hydrationConsistency * 0.35 + (100 - stressImpact) * 0.2
    )
  );

  const weightedScore = skin * 0.32 + hair * 0.24 + lifestyleComposite * 0.29 + consistency * 0.15;
  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}
