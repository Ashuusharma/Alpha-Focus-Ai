"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";

export default function DashboardPage() {
  const { user, loading } = useContext(AuthContext);
  const storeLoading = useUserStore((state) => state.loading);
  const profile = useUserStore((state) => state.profile);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const reports = useUserStore((state) => state.reports as Array<Record<string, unknown>>);
  const assessments = useUserStore((state) => state.assessments as Array<Record<string, unknown>>);
  const routines = useUserStore((state) => state.routines as Array<Record<string, unknown>>);
  const products = useUserStore((state) => state.products as Array<Record<string, unknown>>);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setRefreshing(true);
      await hydrateUserData(user.id);
      setRefreshing(false);
    };

    void run();
  }, [user?.id]);

  const balance = Number(alphaSummary?.current_balance ?? 0);
  const alphaScore = Number((reports[0]?.alpha_score as number | undefined) ?? 0);
  const reportCount = reports.length;
  const assessmentCount = assessments.length;
  const routineCount = routines.length;
  const recommendationCount = products.length;

  if (loading || storeLoading || refreshing || !user) {
    return (
      <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-[#6B665D]">Loading personalized dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm text-[#6B665D]">All values are loaded from your Supabase user records.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Alpha Score</p><p className="mt-2 text-3xl font-bold">{alphaScore}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Alpha Sikka</p><p className="mt-2 text-3xl font-bold">{balance} A$</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Reports</p><p className="mt-2 text-3xl font-bold">{reportCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Assessments</p><p className="mt-2 text-3xl font-bold">{assessmentCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Routine Logs</p><p className="mt-2 text-3xl font-bold">{routineCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Products</p><p className="mt-2 text-3xl font-bold">{recommendationCount}</p></article>
        </section>

        {reportCount === 0 && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Run first scan
          </section>
        )}

        {routineCount === 0 && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Start routine
          </section>
        )}

        {!profile && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Complete Profile
          </section>
        )}
      </div>
    </main>
  );
}
