export type UserRecord = {
  id: string;
  name: string;
  city?: string;
  recoveryProgramLevel?: "beginner" | "intermediate" | "advanced";
  location: {
    city?: string;
    climateEnabled: boolean;
  };
  xp: number;
  level: number;
  permissions: {
    location: boolean;
    notifications: boolean;
    sleepTracking?: boolean;
    hydrationTracking?: boolean;
    moodTracking?: boolean;
    consent?: boolean;
  };
  sleepLogs: string[];
  hydrationLogs: string[];
  moodLogs: string[];
  scanHistory: string[];
  weeklyReports: string[];
  updatedAt: string;
};

export type SleepLogRecord = {
  id: string;
  userId: string;
  date: string;
  hours: number;
  quality: number;
  bedtime?: string;
  createdAt: string;
};

export type HydrationLogRecord = {
  id: string;
  userId: string;
  date: string;
  intakeMl: number;
  targetMl: number;
  createdAt: string;
};

export type MoodLogRecord = {
  id: string;
  userId: string;
  date: string;
  mood: "calm" | "neutral" | "stressed";
  createdAt: string;
};

export type WeeklyReportRecord = {
  id: string;
  userId: string;
  createdAt: string;
  strengths: string[];
  risks: string[];
  suggestedFocus: string;
  avgSleep: number;
  avgHydration: number;
  compliance: number;
  scoreDelta: number;
};

export type ScanHistoryRecord = {
  id: string;
  userId: string;
  scanDate: string;
  skinScore: number;
  hairScore: number;
  imageUrls: string[];
  analyzerType?: string;
};
