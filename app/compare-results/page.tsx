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
    <div className="af-page-shell report-page min-h-screen py-12 relative overflow-hidden text-[#1F3D2B]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A9CBB7]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d8b55f]/14 rounded-full blur-[120px]" />
      </div>
      
      <Container>
        <div className="max-w-4xl mx-auto relative z-10">
          {/* HEADER */}
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-[#6B665D] hover:text-[#1F3D2B] transition group mb-6"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold flex items-center gap-4 mb-2">
              <span className="p-3 bg-[#00f2ff]/10 rounded-xl border border-[#00f2ff]/20">
                <BarChart2 className="w-8 h-8 text-[var(--lux-accent)]" />
              </span>
              <span className="lux-text-gradient">
                Compare Results
              </span>
            </h1>
            <p className="text-[#6B665D] ml-16">
              Track your recovery progress over time against previous assessments.
            </p>
          </div>

          {!hasComparison ? (
            <div className="lux-card p-16 text-center border-white/10">
              <div className="w-24 h-24 bg-[#f3ecdf] border border-[#e2d8ca] rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart2 className="w-10 h-10 text-[#8C6A5A]" />
              </div>
              <p className="text-xl font-bold text-[#1F3D2B] mb-2">Not enough data</p>
              <p className="text-[#6B665D] mb-8 max-w-sm mx-auto">
                Complete at least 2 assessments to unlock detailed progress comparison and analytics.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gradient-to-r from-[#2F6F57] to-[#567b63] hover:shadow-[0_16px_30px_rgba(47,111,87,0.24)] text-white rounded-xl font-bold transition transform hover:scale-105"
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
              <div className="lux-card p-8 border-white/10">
                <h3 className="text-sm font-bold text-[#8C6A5A] mb-6 uppercase tracking-wider">Comparing Assessment Dates</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 w-full bg-[#E8EFEA] border border-[#C8DACF] rounded-xl p-6 text-center relative overflow-hidden group">
                    <p className="text-sm text-[var(--lux-accent)] font-bold mb-1">Latest</p>
                    <p className="text-3xl font-bold text-[#1F3D2B] mb-1">{new Date(current.completedAt).toLocaleDateString()}</p>
                    <span className="text-xs text-[#6B665D]">Current Status</span>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-12 h-12 text-[var(--lux-accent)]" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f3ecdf] border border-[#e2d8ca] text-[#8C6A5A] font-bold">VS</div>
                  
                  <div className="flex-1 w-full bg-[#f7f1e7] border border-[#e2d8ca] rounded-xl p-6 text-center relative overflow-hidden group">
                    <p className="text-sm text-[#8C6A5A] font-bold mb-1">Previous</p>
                    <p className="text-3xl font-bold text-[#1F3D2B] mb-1">{new Date(previous.completedAt).toLocaleDateString()}</p>
                    <span className="text-xs text-[#6B665D]">Baseline</span>
                     <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-12 h-12 text-[#8C6A5A]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPARISON CHARTS */}
              <div className="space-y-6">
                {comparisons.map((item, idx) => (
                  <div key={idx} className="lux-card p-8 border-white/10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-[#1F3D2B]">{item.metric}</h3>
                      <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                          item.change >= 0 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
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
                           <span className="text-sm text-[#6B665D]">Current Score</span>
                           <span className="text-2xl font-bold text-[var(--lux-accent)]">{item.jan}%</span>
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
                           <span className="text-sm text-[#8C6A5A]">Previous Score</span>
                           <span className="text-xl font-bold text-[#6B665D]">{item.dec}%</span>
                         </div>
                         <div className="af-progress-track h-4 border border-[#e2d8ca]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.dec}%` }}
                              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                              className="h-full bg-[linear-gradient(90deg,#e8ded0_0%,#c8bcab_100%)]" 
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
