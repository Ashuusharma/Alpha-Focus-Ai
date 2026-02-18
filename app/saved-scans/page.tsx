"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { ArrowLeft, Calendar, Image as ImageIcon, ScanFace } from "lucide-react";

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

const STORAGE_KEY = "oneman_scan_history";

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

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];

      const sorted = [...parsed].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHistory(sorted);

      if (sorted.length > 0) {
        setExpandedScanId(sorted[0].id);
        setCompareLeftId(sorted[0].id);
        setCompareRightId(sorted[1]?.id || sorted[0].id);
      }
    } catch {
      setHistory([]);
    }
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
    <div className="min-h-screen bg-background text-white py-10">
      <Container>
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-5"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <ScanFace className="w-8 h-8 text-primary" />
              Scan Timeline & Comparison
            </h1>
            <p className="text-gray-300">
              Track each scan with original photos, Galaxy hotspots, and compare progress over time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">New Scan</button>
              <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">Open Report</button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="bg-surface border border-white/10 rounded-2xl p-10 text-center">
              <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No scan history yet</h2>
              <p className="text-gray-400 mb-6">Complete your first photo analysis to create timeline entries.</p>
              <button
                onClick={() => router.push("/image-analyzer")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold"
              >
                Start New Scan
              </button>
            </div>
          ) : (
            <>
              <section className="bg-surface border border-white/10 rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Your Scan Timeline</h2>
                  <span className="text-sm text-gray-400">{history.length} scans</span>
                </div>

                <div className="space-y-3">
                  {history.map((scan, idx) => {
                    const expanded = expandedScanId === scan.id;
                    const confidence = scan.finalResult?.confidence ?? 0;

                    return (
                      <div key={scan.id} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                        <button
                          onClick={() => setExpandedScanId(expanded ? null : scan.id)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-white">Scan #{history.length - idx}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(scan.createdAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-200 capitalize">{scan.analyzerType}</p>
                            <p className="text-xs text-primary font-semibold">Confidence: {confidence}%</p>
                          </div>
                        </button>

                        {expanded && (
                          <div className="border-t border-white/10 p-4 space-y-4 bg-black/10">
                            <div>
                              <p className="text-xs text-gray-400 mb-2">Captured Photos</p>
                              <div className="grid grid-cols-3 gap-2">
                                {scan.originalImages.slice(0, 3).map((image, i) => (
                                  <img
                                    key={`${scan.id}-img-${i}`}
                                    src={image}
                                    alt={`scan-${i + 1}`}
                                    className="rounded-lg border border-white/10 w-full h-24 object-cover"
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400 mb-2">Galaxy Annotated Image</p>
                              <div className="relative rounded-xl border border-white/10 overflow-hidden">
                                <img
                                  src={scan.annotatedImageUrl || scan.originalImages[0]}
                                  alt="annotated"
                                  className="w-full h-56 object-cover"
                                />
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
                                    className="px-2 py-1 rounded-md border border-white/15 bg-white/5 text-xs text-gray-200"
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
                <section className="bg-surface border border-white/10 rounded-2xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Before / After Hotspot Comparison</h2>
                    {confidenceDelta !== null && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full border ${
                          confidenceDelta <= 0
                            ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                            : "border-amber-400/40 text-amber-300 bg-amber-500/10"
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
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
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
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
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
                        <div key={scan.id} className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
                          <div className="px-3 py-2 border-b border-white/10 text-xs text-gray-300 flex items-center justify-between">
                            <span>{idx === 0 ? "Before" : "After"}</span>
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

                          <div className="p-3 text-xs text-gray-300 border-t border-white/10">
                            <p>
                              Issues: <span className="text-white">{scan.issues?.length || 0}</span> · Confidence: <span className="text-white">{scan.finalResult?.confidence ?? 0}%</span>
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
      </Container>
    </div>
  );
}
