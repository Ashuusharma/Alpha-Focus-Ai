"use client";

import { createContext, useEffect, useState } from "react";
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

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profile = useUserStore((state) => (state.profile as Profile | null));
  const setUserData = useUserStore((state) => state.setUserData);
  const reset = useUserStore((state) => state.reset);

  const refreshProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUser = sessionData.session?.user;

    if (!activeUser) {
      setUserData({ profile: null });
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", activeUser.id)
      .maybeSingle();

    if (error) {
      setUserData({ profile: null });
      return;
    }

    setUserData({ profile: profileData || null });
  };

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
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      setUserData({ user: sessionUser, loading: Boolean(sessionUser) });

      if (mounted) setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      setUserData({ user: sessionUser, loading: Boolean(sessionUser) });

      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [reset, setUserData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Verifying secure session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}