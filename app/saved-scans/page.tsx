"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { ArrowLeft, Calendar, Image as ImageIcon, ScanFace } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Hotspot = {
  x: number;
  y: number;
  label: string;
  severity?: "low" | "medium" | "high";
};

type Issue = {
  name: string;
  confidence: number;
};

type HistoryEntry = {
  id: string;
  createdAt: string;
  analyzerType: string;
  selectedCategories: string[];
  originalImages: string[];
  annotatedImageUrl?: string;
  hotspots: Hotspot[];
  issues: Issue[];
  finalResult?: {
    confidence?: number;
    severity?: "low" | "moderate" | "high";
  };
};

function normSpot(spot: Hotspot): { left: number; top: number } {
  const left = spot.x <= 1 ? spot.x * 100 : spot.x;
  const top = spot.y <= 1 ? spot.y * 100 : spot.y;
  return {
    left: Math.max(2, Math.min(95, left)),
    top: Math.max(3, Math.min(95, top)),
  };
}

function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString()}`;
}

export default function SavedScansPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;

      if (!sessionUser) {
        setHistory([]);
        return;
      }

      const { data } = await supabase
        .from("photo_scans")
        .select("id,scan_date,image_url")
        .eq("user_id", sessionUser.id)
        .order("scan_date", { ascending: false })
        .limit(100);

      const mapped: HistoryEntry[] = (data || []).map((row: { id: string; scan_date: string; image_url?: string | null }) => ({
        id: row.id,
        createdAt: row.scan_date,
        analyzerType: "scan",
        selectedCategories: [],
        originalImages: row.image_url ? [row.image_url] : [],
        annotatedImageUrl: row.image_url || undefined,
        hotspots: [],
        issues: [],
        finalResult: {
          confidence: 0,
          severity: "moderate",
        },
      }));

      setHistory(mapped);

      if (mapped.length > 0) {
        setExpandedScanId(mapped[0].id);
        setCompareLeftId(mapped[0].id);
        setCompareRightId(mapped[1]?.id || mapped[0].id);
      }
    };

    load();
  }, []);

  const compareLeft = useMemo(
    () => history.find((scan) => scan.id === compareLeftId) || null,
    [history, compareLeftId]
  );

  const compareRight = useMemo(
    () => history.find((scan) => scan.id === compareRightId) || null,
    [history, compareRightId]
  );

  const confidenceDelta = useMemo(() => {
    if (!compareLeft || !compareRight) return null;
    const left = compareLeft.finalResult?.confidence ?? 0;
    const right = compareRight.finalResult?.confidence ?? 0;
    return right - left;
  }, [compareLeft, compareRight]);

  if (!mounted) return null;

  return (
    <div className="af-page-shell text-[#1F3D2B] py-10">
      <Container>
        <div className="af-page-frame mx-auto max-w-5xl">
          <div className="af-page-stack">
          <section className="af-page-hero p-6 md:p-8">
            <div className="relative z-10 space-y-5">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <div className="space-y-3">
              <span className="af-page-kicker">
                <ScanFace className="h-3.5 w-3.5" />
                Scan Archive
              </span>
              <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Review every scan, compare checkpoints, and reopen your progress story fast.</h1>
              <p className="max-w-2xl text-sm leading-7 text-[#6B665D]">This page now uses the same premium page shell as the rest of the journey so scan history feels like an active recovery console, not an old utility screen.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Total scans</p>
                <p className="mt-2 text-3xl font-bold text-[#1F3D2B]">{history.length}</p>
                <p className="mt-1 text-xs text-[#6B665D]">Saved comparison points</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Confidence shift</p>
                <p className="mt-2 text-3xl font-bold text-[#1F3D2B]">{confidenceDelta == null ? "--" : `${confidenceDelta > 0 ? "+" : ""}${confidenceDelta}%`}</p>
                <p className="mt-1 text-xs text-[#6B665D]">Between selected comparison scans</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Latest capture</p>
                <p className="mt-2 text-base font-semibold text-[#1F3D2B]">{history[0] ? formatDate(history[0].createdAt) : "No scans yet"}</p>
                <p className="mt-1 text-xs text-[#6B665D]">Ready for timeline review</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => router.push("/assessment")} className="af-quick-action">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="af-quick-action">New Scan</button>
              <button onClick={() => router.push("/result")} className="af-btn-primary px-4 py-3 text-sm">Open Report</button>
            </div>
          </div>
          </section>

          {history.length === 0 ? (
            <div className="af-card-primary p-10 text-center">
              <ImageIcon className="w-12 h-12 text-[#6B665D] mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No scan history yet</h2>
              <p className="text-[#6B665D] mb-6">Complete your first photo analysis to create timeline entries.</p>
              <button
                onClick={() => router.push("/image-analyzer")}
                className="px-6 py-3 rounded-xl bg-[#1F3D2B] text-white font-semibold hover:bg-[#2A5239] shadow-sm transition-colors"
              >
                Start New Scan
              </button>
            </div>
          ) : (
            <>
              <section className="af-card-secondary p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Your Scan Timeline</h2>
                  <span className="text-sm text-[#6B665D]">{history.length} scans</span>
                </div>

                <div className="space-y-3">
                  {history.map((scan, idx) => {
                    const expanded = expandedScanId === scan.id;
                    const confidence = scan.finalResult?.confidence ?? 0;

                    return (
                      <div key={scan.id} className="overflow-hidden rounded-2xl border border-white/50 bg-[rgba(255,252,246,0.72)] shadow-[0_12px_24px_rgba(31,61,43,0.06)]">
                        <button
                          onClick={() => setExpandedScanId(expanded ? null : scan.id)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/40 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-[#1F3D2B]">Scan #{history.length - idx}</p>
                            <p className="text-xs text-[#6B665D] flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(scan.createdAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-[#6B665D] capitalize">{scan.analyzerType}</p>
                            <p className="text-xs text-[#1F3D2B] font-semibold">Confidence: {confidence}%</p>
                          </div>
                        </button>

                        {expanded && (
                          <div className="border-t border-white/40 p-4 space-y-4 bg-white/40">
                            <div>
                              <p className="text-xs text-[#6B665D] mb-2">Captured Photos</p>
                              <div className="grid grid-cols-3 gap-2">
                                {scan.originalImages.slice(0, 3).map((image, i) => (
                                  <img
                                    key={`${scan.id}-img-${i}`}
                                    src={image}
                                    alt={`scan-${i + 1}`}
                                    className="rounded-lg border border-white/40 w-full h-24 object-cover"
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-[#6B665D] mb-2">Galaxy Annotated Image</p>
                              <div className="relative rounded-xl border border-white/40 overflow-hidden">
                                {scan.annotatedImageUrl || scan.originalImages[0] ? (
                                  <img
                                    src={scan.annotatedImageUrl || scan.originalImages[0]}
                                    alt="annotated"
                                    className="w-full h-56 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-56 bg-white/60 flex items-center justify-center text-xs text-[#6B665D]">
                                    No image available
                                  </div>
                                )}
                                {scan.hotspots?.map((spot, i) => {
                                  const { left, top } = normSpot(spot);
                                  return (
                                    <div
                                      key={`${scan.id}-spot-${i}`}
                                      className="absolute"
                                      style={{ left: `${left}%`, top: `${top}%` }}
                                    >
                                      <div className="relative -translate-x-1/2 -translate-y-1/2">
                                        <span className="block w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                        <span className="absolute mt-1 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-white whitespace-nowrap border border-white/10">
                                          {spot.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {scan.selectedCategories?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {scan.selectedCategories.map((cat, i) => (
                                  <span
                                    key={`${scan.id}-cat-${i}`}
                                    className="px-2 py-1 rounded-md border border-white/40 bg-white/60 text-xs text-[#6B665D]"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {history.length >= 2 && (
                <section className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-5 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Before / After Hotspot Comparison</h2>
                    {confidenceDelta !== null && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${
                          confidenceDelta <= 0
                            ? "border-emerald-400/40 text-emerald-700 bg-emerald-500/10"
                            : "border-amber-400/40 text-amber-700 bg-amber-500/10"
                        }`}
                      >
                        Confidence Δ: {confidenceDelta > 0 ? `+${confidenceDelta}` : confidenceDelta}
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <select
                      value={compareLeftId}
                      onChange={(e) => setCompareLeftId(e.target.value)}
                      className="bg-white/60 border border-white/40 rounded-lg px-3 py-2 text-sm text-[#1F3D2B] outline-none focus:border-[#1F3D2B]/30"
                    >
                      {history.map((scan) => (
                        <option key={`left-${scan.id}`} value={scan.id}>
                          {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()} ({scan.analyzerType})
                        </option>
                      ))}
                    </select>

                    <select
                      value={compareRightId}
                      onChange={(e) => setCompareRightId(e.target.value)}
                      className="bg-white/60 border border-white/40 rounded-lg px-3 py-2 text-sm text-[#1F3D2B] outline-none focus:border-[#1F3D2B]/30"
                    >
                      {history.map((scan) => (
                        <option key={`right-${scan.id}`} value={scan.id}>
                          {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()} ({scan.analyzerType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {[compareLeft, compareRight].map((scan, idx) => {
                      if (!scan) return null;

                      return (
                        <div key={scan.id} className="rounded-xl border border-white/40 overflow-hidden bg-[#EFE8DD]/50">
                          <div className="px-3 py-2 border-b border-white/40 text-xs text-[#6B665D] flex items-center justify-between">
                            <span className="font-medium">{idx === 0 ? "Before" : "After"}</span>
                            <span>{formatDate(scan.createdAt)}</span>
                          </div>

                          <div className="relative">
                            <img
                              src={scan.annotatedImageUrl || scan.originalImages[0]}
                              alt="compare"
                              className="w-full h-64 object-cover"
                            />

                            {scan.hotspots?.map((spot, i) => {
                              const { left, top } = normSpot(spot);
                              return (
                                <div
                                  key={`${scan.id}-compare-spot-${i}`}
                                  className="absolute"
                                  style={{ left: `${left}%`, top: `${top}%` }}
                                >
                                  <span className="block w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-[0_0_10px_rgba(239,68,68,0.8)] -translate-x-1/2 -translate-y-1/2" />
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3 text-xs text-[#6B665D] border-t border-white/40">
                            <p>
                              Issues: <span className="text-[#1F3D2B] font-medium">{scan.issues?.length || 0}</span> · Confidence: <span className="text-[#1F3D2B] font-medium">{scan.finalResult?.confidence ?? 0}%</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
          </div>
        </div>
      </Container>
    </div>
  );
}
