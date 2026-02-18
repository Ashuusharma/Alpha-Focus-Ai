export type MoodType = "calm" | "neutral" | "stressed";

export type TrackingLog<T> = {
  date: string;
  value: T;
};

export type SleepLog = TrackingLog<{ hours: number; quality: number }>;
export type HydrationLog = TrackingLog<{ intakeMl: number; targetMl: number }>;
export type MoodLog = TrackingLog<{ mood: MoodType }>;
