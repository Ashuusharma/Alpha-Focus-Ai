"use client";

import { useContext, useEffect, useState } from "react";
import CommandCenterDashboard from "@/components/dashboard/CommandCenterDashboard";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardPayload } from "@/services/dashboardService";

export default function DashboardPage() {
  const { user, loading } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Missing session token. Please sign in again.");
        return;
      }

      const response = await fetch("/api/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Failed to load dashboard.");
        return;
      }

      setDashboardData(payload.data as DashboardPayload);
    };

    load();
  }, [user]);

  if (loading || !user || !dashboardData) {
    return (
      <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-[#6B665D]">{error || "Loading personalized dashboard..."}</p>
        </div>
      </main>
    );
  }

  return <CommandCenterDashboard data={dashboardData} />;
}
