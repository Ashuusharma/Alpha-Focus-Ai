"use client";

import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/lib/supabaseClient";

export default function CoreUserHydrator() {
  const { user } = useContext(AuthContext);
  const reset = useUserStore((state) => state.reset);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }

    void hydrateUserData(user.id, { force: true });
  }, [user?.id, reset]);

  useEffect(() => {
    if (!user) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleHydrate = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void hydrateUserData(user.id, { silent: true, minIntervalMs: 8000 });
      }, 500);
    };

    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alpha_sikka_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleHydrate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routine_logs",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleHydrate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assessment_answers",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleHydrate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photo_scans",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleHydrate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_clinical_scores",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleHydrate();
        }
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return null;
}
