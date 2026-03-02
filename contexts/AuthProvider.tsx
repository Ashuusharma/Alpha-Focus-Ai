"use client";

import { createContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { syncAllLocalStateWithSupabase } from "@/lib/supabaseStateSync";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreProfile = useUserStore((state) => state.setProfile);
  const resetUserState = useUserStore((state) => state.resetUserState);

  const refreshProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeUser = sessionData.session?.user;

    if (!activeUser) {
      setProfile(null);
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", activeUser.id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return;
    }

    const nextProfile = { full_name: profileData?.full_name ?? null };
    setProfile(nextProfile);
    setStoreProfile(profileData || null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    resetUserState();

    if (typeof window !== "undefined") {
      localStorage.removeItem("oneman_user_name");
      localStorage.removeItem("oneman_user_id");
      localStorage.removeItem("oneman_user_email");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (typeof window !== "undefined") {
        if (sessionUser) {
          localStorage.setItem("oneman_user_name", sessionUser.id);
          localStorage.setItem("oneman_user_id", sessionUser.id);
          if (sessionUser.email) localStorage.setItem("oneman_user_email", sessionUser.email);
          await syncAllLocalStateWithSupabase(sessionUser.id);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", sessionUser.id)
            .maybeSingle();
          const nextProfile = { full_name: profileData?.full_name ?? null };
          setProfile(nextProfile);
          setStoreProfile(profileData || null);
        } else {
          localStorage.removeItem("oneman_user_name");
          localStorage.removeItem("oneman_user_id");
          localStorage.removeItem("oneman_user_email");
          setProfile(null);
          resetUserState();
        }
      }

      if (mounted) setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (typeof window !== "undefined") {
        if (sessionUser) {
          localStorage.setItem("oneman_user_name", sessionUser.id);
          localStorage.setItem("oneman_user_id", sessionUser.id);
          if (sessionUser.email) localStorage.setItem("oneman_user_email", sessionUser.email);
          await syncAllLocalStateWithSupabase(sessionUser.id);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", sessionUser.id)
            .maybeSingle();
          const nextProfile = { full_name: profileData?.full_name ?? null };
          setProfile(nextProfile);
          setStoreProfile(profileData || null);
        } else {
          localStorage.removeItem("oneman_user_name");
          localStorage.removeItem("oneman_user_id");
          localStorage.removeItem("oneman_user_email");
          setProfile(null);
          resetUserState();
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [resetUserState, setStoreProfile]);

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