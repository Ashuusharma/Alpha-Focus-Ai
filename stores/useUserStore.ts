"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

export type Profile = Record<string, unknown>;
export type AlphaSummary = Record<string, unknown>;
export type AssessmentAnswer = Record<string, unknown>;
export type ClinicalReport = Record<string, unknown>;
export type RoutineLog = Record<string, unknown>;
export type PhotoScan = Record<string, unknown>;
export type ChallengeProgress = Record<string, unknown>;
export type ProductRecommendation = Record<string, unknown>;

interface UserState {
  user: User | null;
  profile: Profile | null;
  alphaSummary: AlphaSummary | null;
  assessments: AssessmentAnswer[];
  reports: ClinicalReport[];
  routines: RoutineLog[];
  scans: PhotoScan[];
  challenges: ChallengeProgress[];
  products: ProductRecommendation[];
  loading: boolean;
  setUserData: (data: Partial<Omit<UserState, "setUserData" | "reset">>) => void;
  reset: () => void;
}

const initialState: Omit<UserState, "setUserData" | "reset"> = {
  user: null,
  profile: null,
  alphaSummary: null,
  assessments: [],
  reports: [],
  routines: [],
  scans: [],
  challenges: [],
  products: [],
  loading: true,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,
  setUserData: (data) => set(data),
  reset: () => set(initialState),
}));
