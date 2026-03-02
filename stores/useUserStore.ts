"use client";

import { create } from "zustand";

interface UserState {
  profile: any;
  alphaSummary: any;
  hydratedUserId: string | null;
  setProfile: (data: any) => void;
  setAlphaSummary: (data: any) => void;
  markHydrated: (userId: string | null) => void;
  resetUserState: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  alphaSummary: null,
  hydratedUserId: null,
  setProfile: (data) => set({ profile: data }),
  setAlphaSummary: (data) => set({ alphaSummary: data }),
  markHydrated: (userId) => set({ hydratedUserId: userId }),
  resetUserState: () =>
    set({
      profile: null,
      alphaSummary: null,
      hydratedUserId: null,
    }),
}));
