"use client";

import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/lib/analyzeImage";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ArrowRight, RotateCcw, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReanalyze: () => void;
}

export default function AnalysisResults({
  result,
  onReanalyze,
}: AnalysisResultsProps) {
  const router = useRouter();

  const handleFullAssessment = () => {
    // Save the photo analysis and redirect to questionnaire
    const photoData = JSON.stringify(result);
    sessionStorage.setItem("photoAnalysis", photoData);
    router.push("/image-analyzer/analyzer-questions");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", bar: "bg-emerald-400" };
      case "moderate":
        return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", bar: "bg-amber-400" };
      case "high":
        return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", bar: "bg-red-400" };
      default:
        return { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", bar: "bg-slate-400" };
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "minor":
        return "from-emerald-500/20 to-emerald-500/5 border-l-emerald-500";
      case "moderate":
        return "from-amber-500/20 to-amber-500/5 border-l-amber-500";
      case "significant":
        return "from-red-500/20 to-red-500/5 border-l-red-500";
      default:
        return "from-slate-500/20 to-slate-500/5 border-l-slate-500";
    }
  };

  const analyzerLabels: Record<string, string> = {
    skin: "Skin Analysis",
    hair: "Hair Analysis",
    beard: "Beard Analysis",
    acne: "Acne Analysis",
    dark_circles: "Dark Circles Analysis",
    aging: "Anti-Aging Analysis",
    scalp: "Scalp Analysis",
    teeth: "Teeth & Smile Analysis",
    body_acne: "Body Acne Analysis",
    lips: "Lip Care Analysis",
  };

  const severityColors = getSeverityColor(result.severity);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/10 text-white rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium tracking-wider uppercase text-blue-200">AI Analysis Complete</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Your {analyzerLabels[result.type]} Results
          </h2>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${severityColors.bg} ${severityColors.border} ${severityColors.text}`}>
              {result.confidence}% Confidence
            </div>
          </div>
        </div>
      </motion.div>

      {/* Severity Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur-sm relative overflow-hidden`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${severityColors.bar} shadow-[0_0_15px_currentColor]`} />
        
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <p className="text-white/60 text-sm font-semibold mb-2 uppercase tracking-wide">Overall Severity</p>
            <h3 className={`text-5xl font-bold capitalize mb-4 ${severityColors.text} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
              {result.severity}
            </h3>
            <p className="text-white/80 leading-relaxed max-w-xl">
              {result.severity === "low"
                ? "Your condition is mild. Maintenance products recommended."
                : result.severity === "moderate"
                ? "Your condition requires consistent treatment. Results in 4 weeks."
                : "Your condition is significant. Professional treatment recommended."}
            </p>
          </div>
          
          <div className="w-full md:w-48 h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: result.severity === 'low' ? '33%' : result.severity === 'moderate' ? '66%' : '100%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full ${severityColors.bar} shadow-[0_0_10px_currentColor]`}
            />
          </div>
        </div>
      </motion.div>

      {/* Detected Issues */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          Detected Issues ({result.detectedIssues.length})
        </h3>
        <div className="grid gap-4">
          {result.detectedIssues.map((issue, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={idx} 
              className={`rounded-xl p-6 bg-gradient-to-r border-l-4 border-y border-r border-y-white/5 border-r-white/5 ${getImpactColor(issue.impact)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-white">{issue.name}</h4>
                <span className="text-xs font-bold bg-black/40 text-white/70 px-2 py-1 rounded backdrop-blur border border-white/10">
                  {issue.confidence}% match
                </span>
              </div>
              <p className="text-white/70 leading-relaxed text-sm">
                {issue.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommendations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-blue-200 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            Recommended Products
          </h3>
          <ul className="space-y-4">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-white/80 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs text-center">âœ“</span>
                </div>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Pro Tips */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-purple-200 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            Pro Tips for Success
          </h3>
          <ul className="space-y-4">
            {result.tips.map((tip, idx) => (
              <li key={idx} className="flex gap-3 text-white/80 items-start">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs"> - </span>
                </div>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Next Steps */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8"
      >
        <h3 className="text-lg font-bold text-white mb-6"> Next Steps</h3>
        <div className="grid gap-4">
          {[
            { title: "Review Results", desc: "Understand your detected issues and severity" },
            { title: "Take Full Assessment", desc: "Answer our detailed questionnaire for personalized product recommendations" },
            { title: "Get Routine Plan", desc: "Receive AI-generated daily routine with specific products and timeline" },
            { title: "Track Progress", desc: "Monitor improvements with photo comparisons and recovery score" }
          ].map((step, i) => (
            <div key={i} className="flex gap-4 items-center group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                {i + 1}
              </div>
              <div className="flex-1">
                <strong className="text-white block group-hover:text-blue-300 transition-colors">{step.title}</strong>
                <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4 pt-4"
      >
        <button
          onClick={onReanalyze}
          className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 group"
        >
          <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
          Re-analyze
        </button>
        <button
          onClick={handleFullAssessment}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition flex items-center justify-center gap-2 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12" />
          <span className="relative flex items-center gap-2">
            Take Full Assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </motion.div>
    </div>
  );
}

