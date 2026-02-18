"use client";

import { motion } from "framer-motion";

interface ResultHeaderProps {
  progress: number;
  categoriesAnalyzed: number;
  totalCategories: number;
}

export default function ResultHeader({
  progress,
  categoriesAnalyzed,
  totalCategories,
}: ResultHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 bg-black/40 border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400"
          >
            Analysis Complete
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg"
          >
            Your personalized grooming intelligence report
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Categories", value: `${categoriesAnalyzed}/${totalCategories}` },
            { label: "Recovery Score", value: `${progress}%` },
            { label: "Issues Detected", value: categoriesAnalyzed } // Assuming mapped correctly
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1 font-medium">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-300">Optimization Progress</span>
            <span className="text-sm text-primary font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent relative"
            >
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
