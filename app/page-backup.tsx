"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { categories, questions, CategoryId } from "@/lib/questions";
import { AnalysisResult } from "@/lib/analyzeImage";
import Container from "@/app/result/_components/Container";
import CartDrawer from "@/app/result/_components/CartDrawer";
import ProfileDrawer from "@/app/result/_components/ProfileDrawer";
import FloatingChatBubble from "./result/_components/FloatingChatBubble";
import { useAssessments, logActivity } from "@/lib/useUserData";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Shield, Sparkles, Activity, Image as ImageIcon, ChevronRight } from "lucide-react";

type Answers = Record<string, string>;

export default function Home() {
  const router = useRouter();
  const { saveAssessment } = useAssessments();

  const [answers, setAnswers] = useState<Answers>({});
  const [activeCategory, setActiveCategory] =
    useState<CategoryId | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<AnalysisResult | null>(null);
  const [imageAnalyzed, setImageAnalyzed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load saved photo analysis on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("photoAnalysis");
      if (saved) {
        try {
          const analysis = JSON.parse(saved);
          setPhotoAnalysis(analysis);
          setImageAnalyzed(true);
          // Clear after loading to prevent reusing stale data
          sessionStorage.removeItem("photoAnalysis");
        } catch (e) {
          console.error("Failed to load photo analysis:", e);
        }
      }
    }
  }, []);

  /* ================= HELPERS ================= */

  const answeredCount = (categoryId: CategoryId) =>
    questions[categoryId].filter((q) => answers[q.id]).length;

  const categoriesAnswered = categories.filter(
    (cat) => answeredCount(cat.id) > 0
  ).length;

  const totalAnsweredQuestions = Object.keys(answers).length;

  /* ================= QUESTION RULE ================= */

  const questionProgress = (() => {
    if (categoriesAnswered === 0) return 0;

    const maxQuestions = categoriesAnswered * 5;
    const perQuestion = 50 / maxQuestions;

    return Math.min(
      50,
      Math.round(totalAnsweredQuestions * perQuestion)
    );
  })();

  const imageProgress = imageAnalyzed ? 20 : 0;
  const totalProgress = questionProgress + imageProgress;

  /* ================= NAV ================= */

  const handleNext = async () => {
    if (totalAnsweredQuestions === 0 && !imageAnalyzed) return;

    // Calculate progress percentage (0-100)
    const progressPercentage = Math.round(totalProgress * 2); // Convert from 0-50 scale to 0-100

    // Save assessment to localStorage and activity log
    try {
      const assessmentId = `assessment_${Date.now()}`;
      const now = new Date().toISOString();

      await saveAssessment({
        id: assessmentId,
        answers,
        categoryId: activeCategory || "general",
        progress: progressPercentage,
        completedAt: now,
      });

      // Log activity
      const detailsStr = JSON.stringify({
        questionsAnswered: totalAnsweredQuestions,
        categoriesCovered: categoriesAnswered,
        progress: progressPercentage,
        photoAnalyzed: imageAnalyzed,
      });
      logActivity("Assessment completed", "📋", detailsStr);
    } catch (e) {
      console.error("Failed to save assessment:", e);
    }

    // Save to localStorage for recovery persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "oneman_recovery_state",
        JSON.stringify({
          answers,
          lastActiveCategory: activeCategory,
          timestamp: Date.now(),
        })
      );
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("resultAnswers", JSON.stringify(answers));
      if (photoAnalysis) {
        sessionStorage.setItem("photoAnalysis", JSON.stringify(photoAnalysis));
      } else {
        sessionStorage.removeItem("photoAnalysis");
      }
    }

    router.push(`/result`);
  };

  /* ================= RENDER ================= */

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-hidden relative font-sans selection:bg-accent selection:text-black">
      {/* Background Glows */}
      <div className="hero-glow opacity-60" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10 pt-24 pb-12">
        
        {/* HERO HEADER */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-accent/20 shadow-neon"
          >
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase text-accent/80">AI-POWERED GROOMING v2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight relative z-20"
          >
            Unleashing the Power <br/>
            of <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-secondary drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Personal AI</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Transforming your skincare and grooming journey with secure, decentralized, and data-driven insights. Discover your personalized routine today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-30"
          >
            <button 
              onClick={() => document.getElementById('assessment-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-primary text-white font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <button 
              onClick={() => router.push('/learning-center')}
              className="px-8 py-4 rounded-xl glass text-white font-semibold text-lg hover:bg-slate-800/80 transition-all border border-slate-700 hover:border-accent/50">
              Discover How It Works
            </button>
          </motion.div>
        </div>

        {/* PROGRESS BAR - Floating Sticky */}
        {(totalProgress > 0 || imageAnalyzed) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-50 max-w-2xl mx-auto mb-12 glass rounded-2xl p-4 shadow-2xl backdrop-blur-xl border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Analysis Progress</span>
              <span className="text-sm font-bold text-white">{totalProgress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary via-primary to-accent transition-all duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* FEATURES GRID / ASSESSMENT SELECTOR */}
        <div id="assessment-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 scroll-mt-24">
          <div className="col-span-full mb-8 text-center">
             <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
               Why Personalization?
             </h2>
             <p className="text-slate-400">Select an aspect to analyze significantly enhances your results.</p>
          </div>

          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            const completed = answeredCount(cat.id);
            const isComplete = completed === 5;
            
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`
                  relative group cursor-pointer rounded-2xl p-6 transition-all duration-500 overflow-hidden
                  ${isActive 
                    ? 'bg-slate-900/90 ring-1 ring-accent shadow-[0_0_30px_rgba(6,182,212,0.15)] z-20 scale-105' 
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700'}
                `}
              >
                {/* Glow Effect on Card */}
                <div className={`absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isActive ? 'bg-accent text-black' : 'bg-slate-800 text-accent group-hover:text-white'}`}>
                    {idx === 0 ? <Activity size={24} /> : 
                     idx === 1 ? <Shield size={24} /> : 
                     idx === 2 ? <Zap size={24} /> : <Sparkles size={24} />}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${isActive ? 'text-accent' : 'text-white'}`}>
                    {cat.label}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">
                    Analyze your specific needs related to {cat.label.toLowerCase()} for targeted solutions.
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isComplete ? 'text-green-400' : 'text-slate-500'}`}>
                      {isComplete ? 'Completed' : `${completed}/5 Answered`}
                    </span>
                    <ChevronRight className={`transition-transform duration-300 ${isActive ? 'text-accent rotate-90' : 'text-slate-600 group-hover:text-accent'}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* ACTIVE CATEGORY QUESTIONS OVERLAY (Futuristic Panel) */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-24 overflow-hidden"
            >
              <div className="glass rounded-3xl p-8 md:p-12 relative border border-accent/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
                
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-accent">///</span> 
                      Analyze: {categories.find(c => c.id === activeCategory)?.label}
                    </h2>
                    <p className="text-slate-400 mt-2 ml-10">Provide accurate details for the best AI model results.</p>
                  </div>
                  
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid gap-6">
                  {questions[activeCategory].map((q, idx) => (
                    <div key={q.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition group focus-within:border-accent/50 focus-within:bg-slate-900/80">
                      <label className="text-lg font-medium text-slate-200 mb-4 group-hover:text-white transition flex items-start gap-3">
                        <span className="text-accent font-mono mt-1">0{idx + 1}.</span>
                        {q.text}
                      </label>
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full bg-black/40 border border-slate-700 rounded-lg px-4 py-4 text-slate-300 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition hover:bg-black/60 cursor-pointer appearance-none"
                        style={{backgroundImage: 'none'}}
                      >
                         <option value="" className="bg-slate-900 text-slate-500">Select an option...</option>
                         {q.options.map((opt) => (
                           <option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>
                         ))}
                      </select>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="px-6 py-3 bg-accent text-black font-bold rounded-lg hover:bg-accent/80 transition"
                  >
                    Save & Close Category
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IMAGE ANALYZER PROMO (Futuristic Card) */}
        {!imageAnalyzed && (
          <div className="relative rounded-3xl overflow-hidden glass border border-white/5 p-8 md:p-12 mb-20 group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Enhance Precision with Visual Data</h3>
                <p className="text-slate-400 max-w-xl text-lg">
                  Upload a photo to leverage our advanced computer vision algorithms. 
                  Get a scientifically accurate analysis of your skin condition.
                </p>
              </div>
              <button
                onClick={() => router.push('/image-analyzer')}
                className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-accent hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 whitespace-nowrap"
              >
                <ImageIcon size={20} />
                Open Visual Analyzer
              </button>
            </div>
          </div>
        )}

        {/* MAIN CTA */}
        <div className="text-center pb-24 relative z-20">
            <button
              onClick={handleNext}
              disabled={totalProgress === 0 && !imageAnalyzed}
              className={`
                px-12 py-5 rounded-2xl text-xl font-bold tracking-wide transition-all duration-300 w-full md:w-auto
                ${totalProgress > 0 || imageAnalyzed
                  ? 'bg-gradient-to-r from-accent via-primary to-secondary text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:scale-105' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
              `}
            >
              <span className="flex items-center justify-center gap-3">
                 {totalProgress >= 50 ? "✨ Generative Analysis Complete" : "🚀 Generate My Plan"} 
                 {(totalProgress > 0 || imageAnalyzed) && <ArrowRight size={24} />}
              </span>
            </button>

            <p className="mt-4 text-sm text-slate-500 font-mono">
              {totalProgress > 0 ? ">>> Ready to compute personalized vectors..." : ">>> System awaiting user input..."}
            </p>
        </div>

      </Container>
      
      {/* Drawers & Floating UI */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FloatingChatBubble onClick={() => setChatOpen((s) => !s)} open={chatOpen} />
    </div>
  );
}
