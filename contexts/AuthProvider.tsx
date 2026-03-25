"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/stores/useUserStore";

type Profile = {
  full_name: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

const AUTH_REQUEST_TIMEOUT_MS = 6000;
const PROFILE_FETCH_TIMEOUT_MS = 4500;
const SESSION_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const SESSION_RETRY_DELAYS_MS = [0, 800, 1600] as const;

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, errorMessage: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

async function readSessionWithRetry() {
  let lastError: unknown = null;

  for (const delay of SESSION_RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    const result = await withTimeout(
      supabase.auth.getSession(),
      AUTH_REQUEST_TIMEOUT_MS,
      "Session lookup timed out."
    );
    if (!result.error) {
      return result;
    }

    lastError = result.error;
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to restore session.");
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = useUserStore((state) => (state.profile as Profile | null));
  const setUserData = useUserStore((state) => state.setUserData);
  const reset = useUserStore((state) => state.reset);

  const refreshProfile = useCallback(async (sessionUser?: User | null) => {
    let activeUser = sessionUser ?? null;

    if (!activeUser) {
      try {
        const { data: sessionData } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_REQUEST_TIMEOUT_MS,
          "Profile session lookup timed out."
        );
        activeUser = sessionData.session?.user ?? null;
      } catch {
        setUserData({ profile: null });
        return;
      }
    }

    if (!activeUser) {
      setUserData({ profile: null });
      return;
    }

    let profileData: Profile | null = null;
    let error: Error | null = null;

    try {
      const result = await withTimeout(
        Promise.resolve(
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", activeUser.id)
            .maybeSingle()
        ),
        PROFILE_FETCH_TIMEOUT_MS,
        "Profile lookup timed out."
      );

      profileData = (result.data as Profile | null) ?? null;
      error = result.error;
    } catch (profileError) {
      error = profileError instanceof Error ? profileError : new Error("Profile lookup failed.");
    }

    if (error) {
      setUserData({ profile: null });
      return;
    }

    setUserData({ profile: profileData || null });
  }, [setUserData]);

  const applySessionUser = useCallback(async (sessionUser: User | null) => {
    setUser(sessionUser);
    setUserData({ user: sessionUser, loading: false });

    if (!sessionUser) {
      setUserData({ profile: null, loading: false });
      return;
    }

    void refreshProfile(sessionUser);
  }, [refreshProfile, setUserData]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.refreshSession(),
        AUTH_REQUEST_TIMEOUT_MS,
        "Session refresh timed out."
      );
      if (error) {
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("af:last-session-refresh", String(Date.now()));
      }

      await applySessionUser(data.session?.user ?? null);
    } catch {
      // Keep the current session state until a later retry succeeds.
    }
  }, [applySessionUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    reset();
    setUserData({ loading: false });
  };

  useEffect(() => {
    if (!user) {
      useUserStore.getState().reset();
      useUserStore.getState().setUserData({ loading: false });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data } = await readSessionWithRetry();
        if (!mounted) return;

        await applySessionUser(data.session?.user ?? null);
      } catch {
        if (!mounted) return;
        await applySessionUser(null);
      }

      if (!mounted) return;
      if (mounted) setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      await applySessionUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySessionUser, reset, setUserData]);

  useEffect(() => {
    if (!user) return;

    let timer: number | null = null;
    let cancelled = false;

    const scheduleRefresh = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      const expiresAtMs = (data.session?.expires_at || 0) * 1000;
      const delay = expiresAtMs
        ? Math.max(60_000, expiresAtMs - Date.now() - SESSION_REFRESH_BUFFER_MS)
        : 30 * 60 * 1000;

      timer = window.setTimeout(() => {
        void refreshSession();
      }, delay);
    };

    const handleOnline = () => {
      void refreshSession();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshSession();
      }
    };

    void scheduleRefresh();
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSession, user]);

  if (loading) {
    return (
      <div className="af-page-shell flex min-h-screen items-center justify-center px-6">
        <div className="af-surface-card px-6 py-5 text-sm font-semibold text-[#6B665D]">
          Verifying secure session...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}