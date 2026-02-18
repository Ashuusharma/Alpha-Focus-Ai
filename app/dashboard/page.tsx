"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActivityLog, getProgressData, AssessmentData } from "@/lib/useUserData";
import { motion } from "framer-motion";
import { Activity, Calendar, Award, ChevronLeft, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { activities } = useActivityLog();
  const [data, setData] = useState({
    assessments: [] as AssessmentData[],
    averageProgress: 0,
    totalAnsweredQuestions: 0,
    totalAssessments: 0
  });

  useEffect(() => {
    // Only access sessionStorage/localStorage on mount
    const progress = getProgressData();
    setData(progress);
  }, []);

  const stats = [
    { label: "Avg. Recovery", value: `${data.averageProgress}%`, icon: Activity, color: "text-primary" },
    { label: "Assessments", value: data.totalAssessments, icon: Calendar, color: "text-accent" },
    { label: "Questions", value: data.totalAnsweredQuestions, icon: Award, color: "text-purple-400" },
  ];

    return (
        <div className="min-h-screen bg-[#030917] text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[var(--lux-accent)]/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
         <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#0066ff]/5 blur-[120px] rounded-full opacity-30" />
      </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        
        {/* HEADER */}
        <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="group flex items-center space-x-2 text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] transition-colors mb-6"
            >
              <div className="p-1.5 rounded-lg bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] group-hover:border-[var(--lux-accent)]/50 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--lux-text-secondary)] mb-2">
                    My Dashboard
                    </h1>
                    <p className="text-[var(--lux-text-muted)]">Real-time tracking of your recovery journey</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
                  <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Run Scan</button>
                  <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">View Report</button>
                                    <button onClick={() => router.push("/tracking")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Track Lifestyle</button>
                                    <button onClick={() => router.push("/reports/weekly")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Weekly AI Report</button>
                                    <button onClick={() => router.push("/data-settings")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Data Settings</button>
                </div>
            </motion.div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, idx) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="lux-card p-6 relative overflow-hidden group hover:border-[var(--lux-accent)]/30 transition-colors"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon className="w-24 h-24" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl bg-[var(--lux-bg-secondary)] flex items-center justify-center mb-4 border border-[var(--lux-glass-border)]`}>
                            <stat.icon className={`w-6 h-6 ${
                                stat.label === "Avg. Recovery" ? "text-[var(--lux-accent)]" :
                                stat.label === "Assessments" ? "text-blue-400" : "text-purple-400"
                            }`} />
                        </div>
                        <h3 className="text-sm font-medium text-[var(--lux-text-muted)] uppercase tracking-wider mb-1">{stat.label}</h3>
                        <p className="text-3xl font-bold text-[var(--lux-text-primary)]">{stat.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* PROGRESS CHART */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lux-card p-8 border border-[var(--lux-glass-border)]"
            >
                <h2 className="text-xl font-bold text-[var(--lux-text-primary)] mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--lux-accent)]" />
                    Assessment History
                </h2>

                {data.assessments.length > 0 ? (
                    <div className="space-y-6">
                        {data.assessments.map((assessment, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-medium text-[var(--lux-text-muted)]">
                                        {new Date(assessment.completedAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm font-bold text-[var(--lux-text-primary)]">{assessment.progress}%</span>
                                </div>
                                <div className="h-2 bg-[var(--lux-bg-secondary)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${assessment.progress}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                        className="h-full bg-gradient-to-r from-[#0066ff] to-[var(--lux-accent)] relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-[var(--lux-text-muted)]">
                        No assessment history found.
                    </div>
                )}
            </motion.div>

            {/* RECENT ACTIVITY */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lux-card p-8 border border-[var(--lux-glass-border)]"
            >
                <h2 className="text-xl font-bold text-[var(--lux-text-primary)] mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--lux-accent)]" />
                     Recent Activity
                </h2>

                <div className="space-y-4">
                    {activities.slice(0, 5).map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] hover:border-[var(--lux-accent)]/30 transition-colors group">
                            <div className="mt-1 p-2 rounded-lg bg-[var(--lux-bg-secondary)] text-[var(--lux-accent)]">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[var(--lux-text-primary)] font-medium group-hover:text-[var(--lux-accent)] transition-colors">
                                    {activity.action}
                                </p>
                                <p className="text-xs text-[var(--lux-text-muted)] mt-1">
                                    {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[var(--lux-text-muted)] group-hover:text-[var(--lux-text-primary)] transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                    ))}
                    
                    {activities.length === 0 && (
                        <div className="text-center py-12 text-[var(--lux-text-muted)]">
                            No recent activity.
                        </div>
                    )}
                </div>
            </motion.div>

        </div>
      </div>
    </div>
  );
}
