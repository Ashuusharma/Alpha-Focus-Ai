"use client";

import { Recommendation } from "@/lib/recommendationRules";
import { Sparkles, Activity, CheckCircle, AlertOctagon } from "lucide-react";

interface IssueSummaryProps {
  recommendations: Recommendation[];
}

export default function IssueSummary({
  recommendations,
}: IssueSummaryProps) {
  if (!recommendations.length) return null;

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="bg-black/40 border border-white/10 p-6 rounded-xl hover:bg-white/5 transition-colors backdrop-blur-sm group"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {rec.title}
            </h3>
            <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold rounded-full border border-white/10">
                {rec.category}
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
             <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/10">
                <h4 className="font-semibold text-red-200 text-sm mb-2 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    Root Cause
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {rec.cause}
                </p>
             </div>

             <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/10">
                <h4 className="font-semibold text-green-200 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Recommended Solution
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {rec.solution}
                </p>
             </div>
          </div>

          {rec.steps && rec.steps.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Action Plan
                </h4>
                <div className="flex flex-wrap gap-2">
                  {rec.steps.map((step, idx) => (
                    <span key={idx} className="bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg text-xs border border-white/5">
                        {step}
                    </span>
                  ))}
                </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
