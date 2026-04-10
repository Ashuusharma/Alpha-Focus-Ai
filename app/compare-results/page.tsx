"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { useAssessments } from "@/lib/useUserData";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CompareResultsPage() {
  const router = useRouter();
  const { assessments } = useAssessments();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sorted = [...assessments].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const current = sorted[0];
  const previous = sorted[1];

  const hasComparison = current && previous;

  const comparisons = hasComparison
    ? [
        {
          metric: "Overall Progress",
          jan: current.progress,
          dec: previous.progress,
          change: current.progress - previous.progress,
        },
      ]
    : [];

  return (
    <div className="af-page-shell report-page min-h-screen py-12 relative overflow-hidden text-[#1d1d1f]">
      <div className="fixed inset-0 pointer-events-none" />
      
      <Container>
        <div className="af-page-frame max-w-4xl mx-auto relative z-10 space-y-8">
          <section className="nv-section-white">
            <div className="relative z-10 space-y-5">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[#1d1d1f] hover:text-[#1d1d1f] transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <span className="af-page-kicker">
                <BarChart2 className="h-3.5 w-3.5" />
                Progress Comparison
              </span>
              <div className="max-w-3xl">
                <h1 className="text-clinical-heading text-4xl font-extrabold tracking-tight">Compare Results</h1>
                <p className="mt-3 text-sm leading-7 text-[#6e6e73]">Track movement between assessment checkpoints with the same premium analysis shell used across the rest of the recovery journey.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="af-stat-tile">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Assessments loaded</p>
                  <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{sorted.length}</p>
                  <p className="mt-1 text-xs text-[#6e6e73]">Available comparison points</p>
                </div>
                <div className="af-stat-tile">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Current score</p>
                  <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{current?.progress ?? "--"}%</p>
                  <p className="mt-1 text-xs text-[#6e6e73]">Latest result</p>
                </div>
                <div className="af-stat-tile">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Change</p>
                  <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{hasComparison ? `${comparisons[0].change > 0 ? "+" : ""}${comparisons[0].change}%` : "--"}</p>
                  <p className="mt-1 text-xs text-[#6e6e73]">Vs previous assessment</p>
                </div>
              </div>
            </div>
          </section>

          {!hasComparison ? (
            <div className="af-card-primary p-16 text-center">
              <div className="w-24 h-24 bg-[#f3ecdf] border border-[#e2d8ca] rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart2 className="w-10 h-10 text-[#6e6e73]" />
              </div>
              <p className="text-xl font-bold text-[#1d1d1f] mb-2">Not enough data</p>
              <p className="text-[#6e6e73] mb-8 max-w-sm mx-auto">
                Complete at least 2 assessments to unlock detailed progress comparison and analytics.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-[#0071e3] text-white rounded-xl font-bold transition"
              >
                New Assessment
              </button>
            </div>
          ) : (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-8"
            >
              {/* TIME PERIOD SELECTOR */}
              <div className="af-card-secondary p-8">
                <h3 className="text-sm font-bold text-[#1d1d1f] mb-6 uppercase tracking-wider">Comparing Assessment Dates</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 w-full bg-white border border-[#d9d9de] rounded-xl p-6 text-center relative overflow-hidden group">
                    <p className="text-sm text-[#0071e3] font-bold mb-1">Latest</p>
                    <p className="text-3xl font-bold text-[#1d1d1f] mb-1">{new Date(current.completedAt).toLocaleDateString()}</p>
                    <span className="text-xs text-[#6e6e73]">Current Status</span>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-12 h-12 text-[#0071e3]" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f3ecdf] border border-[#e2d8ca] text-[#6e6e73] font-bold">VS</div>
                  
                  <div className="flex-1 w-full bg-[#f7f1e7] border border-[#e2d8ca] rounded-xl p-6 text-center relative overflow-hidden group">
                    <p className="text-sm text-[#6e6e73] font-bold mb-1">Previous</p>
                    <p className="text-3xl font-bold text-[#1d1d1f] mb-1">{new Date(previous.completedAt).toLocaleDateString()}</p>
                    <span className="text-xs text-[#6e6e73]">Baseline</span>
                     <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-12 h-12 text-[#6e6e73]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPARISON CHARTS */}
              <div className="space-y-6">
                {comparisons.map((item, idx) => (
                  <div key={idx} className="af-card-secondary p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-[#1d1d1f]">{item.metric}</h3>
                        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                          item.change >= 0 
                          ? "bg-[#eef5ff] border-[#c2d8f6] text-[#0071e3]" 
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                        {item.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        <span className="font-bold text-lg">{item.change > 0 && "+"}{item.change}%</span>
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="space-y-6">
                       {/* Current Bar */}
                       <div>
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-sm text-[#6e6e73]">Current Score</span>
                           <span className="text-2xl font-bold text-[#0071e3]">{item.jan}%</span>
                         </div>
                         <div className="af-progress-track h-4 border border-[#e2d8ca]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.jan}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="af-progress-fill" 
                            />
                         </div>
                       </div>

                       {/* Previous Bar */}
                       <div>
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-sm text-[#6e6e73]">Previous Score</span>
                           <span className="text-xl font-bold text-[#6e6e73]">{item.dec}%</span>
                         </div>
                         <div className="af-progress-track h-4 border border-[#e2d8ca]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.dec}%` }}
                              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                              className="h-full bg-[#7a869a]" 
                            />
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
}

