"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeImage, AnalysisResult } from "@/lib/analyzeImage";
import { analyzeWithAI, CombinedAnalysis } from "@/lib/aiAnalysisEngine";
import Container from "@/app/result/_components/Container";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ScanFace, FileText, CheckCircle2, ArrowRight, Activity, Sparkles, Server, Lock } from "lucide-react";

export default function AITestPage() {
  const router = useRouter();
  const [demoStep, setDemoStep] = useState(0);
  const [photoAnalysis, setPhotoAnalysis] = useState<AnalysisResult | null>(null);
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Sample questionnaire answers
  const sampleAnswers = {
    skin_type: "Oily",
    skin_concern: "Acne and dryness",
    skin_severity: "Moderate",
    hair_concern: "Hair fall",
    hair_type: "Dry",
    beard_issue: "Itching and dryness",
    beard_coverage: "Patchy",
  };

  const runDemo = async () => {
    setLoading(true);

    // Step 1: Simulate photo analysis
    const photo = await analyzeImage("", "skin");
    setPhotoAnalysis(photo);
    setDemoStep(1);

    // Wait a moment
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: Combine with questionnaire
    const combined = analyzeWithAI(photo, sampleAnswers);
    setCombinedAnalysis(combined);
    setDemoStep(2);

    setLoading(false);
  };

  const goToFullResult = () => {
    const params = new URLSearchParams();
    params.append("answers", JSON.stringify(sampleAnswers));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("resultAnswers", JSON.stringify(sampleAnswers));
      if (photoAnalysis) {
        sessionStorage.setItem("photoAnalysis", JSON.stringify(photoAnalysis));
      } else {
        sessionStorage.removeItem("photoAnalysis");
      }
    }
    router.push(`/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--lux-bg-primary)] py-12 relative overflow-hidden text-[var(--lux-text-primary)]">
      {/* Tech Background */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[var(--lux-accent)]/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
         <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#0066ff]/5 blur-[120px] rounded-full opacity-30" />
      </div>

      <Container>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--lux-accent)]/10 border border-[var(--lux-accent)]/20 text-[var(--lux-accent)] mb-6"
            >
               <Brain className="w-5 h-5" />
               <span className="text-sm font-bold tracking-wider uppercase">Architecture v2.0</span>
            </motion.div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-[var(--lux-text-secondary)] mb-6">
              AI Analysis Engine
            </h1>
            <p className="text-[var(--lux-text-muted)] text-lg max-w-2xl mx-auto">
              Visualizing how our multi-modal AI combines computer vision with clinical heuristics to generate personalized recovery plans.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             {/* LEFT COLUMN: Steps Visualization */}
             <div className="lg:col-span-1 space-y-4">
               {[
                 { id: 0, title: "Input Processing", icon: ScanFace, desc: "Image normalization & survey data" },
                 { id: 1, title: "Computer Vision", icon: Sparkles, desc: "Feature extraction & classification" },
                 { id: 2, title: "Heuristic Engine", icon: Brain, desc: "Rule-based synthesis & planing" }
               ].map((step, i) => (
                 <div 
                   key={i}
                   className={`p-6 rounded-2xl border transition-all duration-500 ${
                     demoStep >= i 
                       ? "bg-[var(--lux-accent)]/10 border-[var(--lux-accent)]/50 shadow-[0_0_20px_var(--lux-accent)]" 
                       : "lux-card opacity-50"
                   }`}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-xl ${demoStep >= i ? "bg-[var(--lux-accent)] text-black" : "bg-[var(--lux-bg-secondary)] text-[var(--lux-text-muted)]"}`}>
                       <step.icon className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className={`font-bold ${demoStep >= i ? "text-[var(--lux-text-primary)]" : "text-[var(--lux-text-muted)]"}`}>{step.title}</h3>
                       <p className="text-xs text-[var(--lux-text-muted)] mt-1">{step.desc}</p>
                     </div>
                     {demoStep > i && <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />}
                     {demoStep === i && loading && <Activity className="w-5 h-5 text-[var(--lux-accent)] ml-auto animate-pulse" />}
                   </div>
                 </div>
               ))}
               
               {demoStep === 0 && !loading && (
                 <button
                    onClick={runDemo}
                    className="w-full py-4 text-black rounded-xl font-bold transition shadow-[0_0_20px_var(--lux-accent)] hover:shadow-[0_0_30px_var(--lux-accent)] flex items-center justify-center gap-2 mt-8 bg-[var(--lux-accent)]"
                 >
                    <Activity className="w-5 h-5" />
                    Start Simulation
                 </button>
               )}
             </div>

             {/* RIGHT COLUMN: Terminal Output */}
             <div className="lg:col-span-2">
               <div className="bg-[#060b14] border border-[var(--lux-glass-border)] rounded-2xl overflow-hidden shadow-2xl h-[600px] flex flex-col relative">
                 {/* Terminal Header */}
                 <div className="bg-[var(--lux-bg-secondary)] px-6 py-4 flex items-center justify-between border-b border-[var(--lux-glass-border)]">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                   </div>
                   <div className="text-xs font-mono text-[var(--lux-text-muted)] flex items-center gap-2">
                     <Lock className="w-3 h-3" />
                     SECURE CONNECTION
                   </div>
                 </div>
                 
                 {/* Terminal Body */}
                 <div className="p-8 flex-1 overflow-y-auto font-mono text-sm space-y-6 scrollbar-thin scrollbar-thumb-[var(--lux-bg-elevated)]">
                   {demoStep === 0 && (
                     <div className="text-[var(--lux-text-muted)]">
                       <span className="text-emerald-400">root@ai-engine:~$</span> waiting for input stream...<br/>
                       <span className="text-blue-400/50">Ready to initialize analysis sequence.</span>
                     </div>
                   )}

                   {/* Step 1 Output */}
                   <AnimatePresence>
                   {demoStep >= 1 && photoAnalysis && (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                     >
                       <div className="text-[var(--lux-accent)] border-l-2 border-[var(--lux-accent)]/50 pl-4 py-1">
                         <span className="text-[var(--lux-text-primary)] font-bold opacity-100">[MODULE_CV]</span> Image Processing Complete
                       </div>
                       
                       <div className="bg-[var(--lux-bg-secondary)] rounded-lg p-4 grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-[var(--lux-text-muted)] block text-xs uppercase mb-1">Detected Type</span>
                            <span className="text-emerald-400">{photoAnalysis.type}</span>
                         </div>
                         <div>
                            <span className="text-[var(--lux-text-muted)] block text-xs uppercase mb-1">Confidence</span>
                            <span className="text-[var(--lux-accent)]">{photoAnalysis.confidence}%</span>
                         </div>
                         <div>
                            <span className="text-[var(--lux-text-muted)] block text-xs uppercase mb-1">Severity</span>
                            <span className="text-yellow-400">{photoAnalysis.severity}</span>
                         </div>
                         <div className="col-span-2">
                            <span className="text-[var(--lux-text-muted)] block text-xs uppercase mb-1">Issues Identified</span>
                            <div className="flex gap-2 flex-wrap">
                                {photoAnalysis.detectedIssues.map((issue, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-[var(--lux-bg-elevated)] rounded text-xs text-[var(--lux-text-primary)]">{issue.name}</span>
                                ))}
                            </div>
                         </div>
                       </div>
                     </motion.div>
                   )}
                   </AnimatePresence>
                   
                   {/* Step 2 Output */}
                   <AnimatePresence>
                   {demoStep >= 2 && combinedAnalysis && (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4 pt-4 border-t border-[var(--lux-glass-border)]"
                     >
                       <div className="text-purple-400 border-l-2 border-purple-500/50 pl-4 py-1">
                         <span className="text-[var(--lux-text-primary)] font-bold opacity-100">[MODULE_SYNTHESIS]</span> Recommendations Generated
                       </div>

                       <div className="bg-gradient-to-br from-[var(--lux-accent)]/10 to-purple-500/10 rounded-lg p-6 border border-[var(--lux-glass-border)]">
                          <h4 className="text-[var(--lux-text-primary)] font-bold mb-4 flex items-center gap-2">
                             <Sparkles className="w-4 h-4 text-yellow-400" />
                             Optimization Complete
                          </h4>
                          <div className="space-y-2">
                             {combinedAnalysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex gap-3 text-[var(--lux-text-muted)] text-xs">
                                   <span className="text-[var(--lux-accent)]">→</span>
                                   {rec.title}
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="pt-4">
                          <button 
                             onClick={goToFullResult}
                             className="group flex items-center gap-2 text-black bg-[var(--lux-accent)] hover:bg-[var(--lux-accent)]/80 px-6 py-3 rounded-lg font-bold transition-all w-full justify-center shadow-[0_0_20px_var(--lux-accent)]"
                          >
                             View Full Report
                             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                       </div>
                     </motion.div>
                   )}
                   </AnimatePresence>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
