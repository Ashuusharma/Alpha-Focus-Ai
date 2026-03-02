export interface UserClinicalProfile {
  userId: string;
  userName?: string;

  assessment?: {
    answers: Record<string, string>;
    completedAt?: string;
  };

  photoAnalysis?: {
    imageUrl?: string;
    densityScore?: number;
    inflammationScore?: number;
    oilBalanceScore?: number;
    uploadedAt?: string;
  };

  metrics: {
    alphaScore: number;
    severityIndex: number;
    confidenceScore: number;
    recoveryProbability: number;
  };

  signals: {
    sleepScore?: number;
    hydrationLevel?: number;
    stressLevel?: number;
    uvIndex?: number;
    routineAdherence?: number;
  };

  projections: {
    estimatedWeeksToImprove: number;
    adherenceImpact: number;
  };

  rewards?: {
    alphaSikka: number;
    tierName: string;
    levelLabel: string;
    nextTierName?: string;
    discountEligibility?: string;
  };

  history?: {
    totalScans: number;
    lastScanAt?: string;
  };

  lastUpdated: string;
}
