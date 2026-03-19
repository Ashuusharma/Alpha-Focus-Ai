"use client";

import { useContext, useEffect } from "react";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { getIndiaDateParts } from "@/lib/alphaWallet";
import { applyRealtimeAlphaInsert, applyRealtimeAlphaStreak, refreshAlphaWallet } from "@/lib/alphaWalletClient";
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

    const { dateKey } = getIndiaDateParts(new Date());
    const claimKey = `alpha-login-claim:${user.id}:${dateKey}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(claimKey)) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/alpha-sikka/earn", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "daily_login" }),
        });

        const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        const shouldPersistClaim = Boolean(
          response.ok && (payload?.ok || payload?.error === "already_awarded" || payload?.error === "daily_discipline_cap_reached")
        );

        if (!shouldPersistClaim) {
          return;
        }
      } catch {
        return;
      }

      if (!cancelled && typeof window !== "undefined") {
        window.sessionStorage.setItem(claimKey, "1");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            applyRealtimeAlphaInsert(payload.new as Record<string, unknown>);
            return;
          }
          void refreshAlphaWallet(user.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_streaks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            applyRealtimeAlphaStreak(payload.new as Record<string, unknown>);
            return;
          }
          void refreshAlphaWallet(user.id);
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
