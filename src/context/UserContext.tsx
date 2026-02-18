"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type UserPermissions = {
  location: boolean;
  notifications: boolean;
  sleepTracking: boolean;
  hydrationTracking: boolean;
  moodTracking: boolean;
  consent: boolean;
};

type LifestyleData = {
  sleepHours?: number;
  hydrationMl?: number;
  mood?: "calm" | "neutral" | "stressed";
};

type UserProfile = {
  id: string;
  name: string;
  city?: string;
};

type UserContextValue = {
  profile: UserProfile | null;
  permissions: UserPermissions;
  lifestyle: LifestyleData;
  setProfile: (profile: UserProfile | null) => void;
  setPermissions: (permissions: Partial<UserPermissions>) => void;
  setLifestyle: (lifestyle: Partial<LifestyleData>) => void;
  syncWithBackend: () => Promise<boolean>;
};

const USER_CONTEXT_KEY = "oneman_user_context_v1";

const defaultPermissions: UserPermissions = {
  location: false,
  notifications: false,
  sleepTracking: true,
  hydrationTracking: true,
  moodTracking: true,
  consent: false,
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [permissions, setPermissionsState] = useState<UserPermissions>(defaultPermissions);
  const [lifestyle, setLifestyleState] = useState<LifestyleData>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(USER_CONTEXT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        profile: UserProfile | null;
        permissions: UserPermissions;
        lifestyle: LifestyleData;
      };
      setProfileState(parsed.profile ?? null);
      setPermissionsState(parsed.permissions ?? defaultPermissions);
      setLifestyleState(parsed.lifestyle ?? {});
    } catch {
      setProfileState(null);
      setPermissionsState(defaultPermissions);
      setLifestyleState({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      USER_CONTEXT_KEY,
      JSON.stringify({ profile, permissions, lifestyle })
    );
  }, [profile, permissions, lifestyle]);

  const setProfile = (nextProfile: UserProfile | null) => {
    setProfileState(nextProfile);
  };

  const setPermissions = (nextPermissions: Partial<UserPermissions>) => {
    setPermissionsState((prev) => ({ ...prev, ...nextPermissions }));
  };

  const setLifestyle = (nextLifestyle: Partial<LifestyleData>) => {
    setLifestyleState((prev) => ({ ...prev, ...nextLifestyle }));
  };

  const syncWithBackend = useCallback(async () => {
    try {
      const payload = { profile, permissions, lifestyle };
      const response = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, [profile, permissions, lifestyle]);

  const value = useMemo(
    () => ({ profile, permissions, lifestyle, setProfile, setPermissions, setLifestyle, syncWithBackend }),
    [profile, permissions, lifestyle, syncWithBackend]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used inside UserProvider");
  }
  return context;
}
