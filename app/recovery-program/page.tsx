"use client";

import Link from "next/link";
import { useContext, useEffect, useMemo, useState } from "react";
import { CalendarRange, Sparkles } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { supabase } from "@/lib/supabaseClient";
import { categories, type CategoryId } from "@/lib/questions";
import { getCurrentProtocolPhase, getProtocolTemplate } from "@/lib/protocolTemplates";
import TreatmentPlan from "@/app/dashboard/_components/TreatmentPlan";

function toCategoryId(value: unknown): CategoryId | null {
  if (typeof value !== "string") return null;
  const match = categories.find((item) => item.id === value);
  if (!match) return null;
  return getProtocolTemplate(match.id as CategoryId) ? (match.id as CategoryId) : null;
}

function pickCategoryFromRecord(row: Record<string, unknown>): CategoryId | null {
  return (
    toCategoryId(row.selected_category) ||
    toCategoryId(row.analyzer_category) ||
    toCategoryId(row.category) ||
    toCategoryId(row.target_category) ||
    null
  );
}

export default function RecoveryProgramPage() {
  const { user, loading } = useContext(AuthContext);
  const reports = useUserStore((state) => state.reports as Array<Record<string, unknown>>);
  const assessments = useUserStore((state) => state.assessments as Array<Record<string, unknown>>);
  const scans = useUserStore((state) => state.scans as Array<Record<string, unknown>>);

  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [programDay, setProgramDay] = useState(1);
  const [phaseName, setPhaseName] = useState("Stabilization");

  useEffect(() => {
    if (!user) return;
    void hydrateUserData(user.id, { silent: true, force: true });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const loadSelectedCategory = async () => {
      const { data: activeAnalysis } = await supabase
        .from("user_active_analysis")
        .select("selected_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const selectedCategory = toCategoryId(activeAnalysis?.selected_category || null);
      if (!selectedCategory) return;
      setActiveCategory((prev) => prev || selectedCategory);
    };

    void loadSelectedCategory();
  }, [user?.id]);

  const treatmentCategories = useMemo(() => {
    const derived = [
      ...scans.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
      ...assessments.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
      ...reports.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
    ] as CategoryId[];

    const ordered = [activeCategory, ...derived].filter(Boolean) as CategoryId[];
    return ordered.filter((cat, idx) => ordered.indexOf(cat) === idx);
  }, [activeCategory, scans, assessments, reports]);

  useEffect(() => {
    if (activeCategory || treatmentCategories.length === 0) return;
    setActiveCategory(treatmentCategories[0]);
  }, [activeCategory, treatmentCategories]);

  useEffect(() => {
    if (!user || !activeCategory) return;

    const loadDay = async () => {
      const { data: latestScan } = await supabase
        .from("photo_scans")
        .select("scan_date")
        .eq("user_id", user.id)
        .eq("analyzer_category", activeCategory)
        .order("scan_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const dayNumber = latestScan?.scan_date
        ? Math.max(1, Math.min(30, Math.floor((Date.now() - new Date(latestScan.scan_date).getTime()) / (1000 * 60 * 60 * 24)) + 1))
        : 1;
      setProgramDay(dayNumber);

      const template = getProtocolTemplate(activeCategory);
      if (template) setPhaseName(getCurrentProtocolPhase(template, dayNumber).name);
    };

    void loadDay();
  }, [user?.id, activeCategory]);

  if (loading || !user) {
    return (
      <main className="af-page px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-[#6e6e73]">Loading recovery planner...</p>
        </div>
      </main>
    );
  }

  const categoryLabel = activeCategory ? categories.find((c) => c.id === activeCategory)?.label || "Recovery" : "Recovery";

  return (
    <main className="af-page-shell px-4 py-6 sm:px-6 lg:px-8">
      <div className="af-page-frame mx-auto max-w-6xl space-y-6">
        <section className="af-page-hero p-6 md:p-8">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="af-page-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Daily Execution Engine
              </span>
              <h1 className="mt-3 text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Full Recovery Planner</h1>
              <p className="mt-3 text-sm leading-7 text-[#6e6e73]">View the complete protocol timeline, stay anchored to your current phase, and switch categories without leaving the premium dashboard shell.</p>
            </div>
            <div className="flex w-full flex-col gap-3 lg:max-w-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="af-stat-tile">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Current day</p>
                  <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{programDay}</p>
                  <p className="mt-1 text-xs text-[#6e6e73]">Of 30-day protocol</p>
                </div>
                <div className="af-stat-tile">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Current phase</p>
                  <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{phaseName}</p>
                  <p className="mt-1 text-xs text-[#6e6e73]">{categoryLabel}</p>
                </div>
              </div>
              <Link href="/dashboard" className="af-btn-soft px-4 py-3 text-sm text-center">Back to Dashboard</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="af-card-secondary p-4">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <CalendarRange className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">Protocol timing</span>
            </div>
            <p className="mt-2 text-sm text-[#5F5A51]">Use this screen when you need the full day-by-day view rather than the dashboard mission summary.</p>
          </div>
          <div className="af-card-secondary p-4">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <Sparkles className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">Category switching</span>
            </div>
            <p className="mt-2 text-sm text-[#5F5A51]">Switch categories here to audit how each track maps into its own execution plan.</p>
          </div>
          <div className="af-card-secondary p-4">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <Sparkles className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">Goal</span>
            </div>
            <p className="mt-2 text-sm text-[#5F5A51]">Keep this page focused on execution structure, not secondary analytics already covered on the dashboard.</p>
          </div>
        </div>

        <TreatmentPlan
          categoryLabel={categoryLabel}
          phaseName={phaseName}
          dayNumber={programDay}
          category={activeCategory}
          availableCategories={treatmentCategories}
          userId={user.id}
          onCategoryChange={setActiveCategory}
          mode="full"
        />
      </div>
    </main>
  );
}

