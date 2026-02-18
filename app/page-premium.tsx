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
import { ArrowRight, Sparkles, Activity, Shield, Zap, Camera, ChevronRight, Check, X } from "lucide-react";

type Answers = Record<string, string>;

// Decorative Particles Component
const Particles = () => (
  <div className="particles">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="particle" />
    ))}
  </div>
);

// Organic Blob Background
const BlobBackground = () => (
  <div className="blob-bg">
    <div className="blob blob-1" />
    <div className="blob blob-2" />
    <div className="blob blob-3" />
  </div>
);

export default function Home() {
  const router = useRouter();
  const { saveAssessment } = useAssessments();

  const [answers, setAnswers] = useState<Answers>({});
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
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

  /* ================= PROGRESS CALCULATION ================= */
  const questionProgress = (() => {
    if (categoriesAnswered === 0) return 0;
    const maxQuestions = categoriesAnswered * 5;
    const perQuestion = 50 / maxQuestions;
    return Math.min(50, Math.round(totalAnsweredQuestions * perQuestion));
  })();

  const imageProgress = imageAnalyzed ? 20 : 0;
  const totalProgress = questionProgress + imageProgress;

  /* ================= NAVIGATION ================= */
  const handleNext = async () => {
    if (totalAnsweredQuestions === 0 && !imageAnalyzed) return;

    const progressPercentage = Math.round(totalProgress * 2);

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

  const categoryIcons = [Activity, Shield, Zap, Sparkles];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030711] via-[#0a1628] to-[#0d192d] text-white overflow-hidden relative font-sans">
      {/* Premium Background Effects */}
      <BlobBackground />
      <Particles />

      <Container className="relative z-10 pt-20 pb-12">
        
        {/* ================= HERO SECTION ================= */}
        <div className="text-center max-w-4xl mx-auto mb-24">
          {/* Premium Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 badge-premium badge-premium-glow mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-POWERED GROOMING v2.0</span>
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight"
          >
            Your Personal
            <br />
            <span className="text-gradient-premium">AI Grooming</span>
            <br />
            Assistant
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Experience intelligent skincare analysis with our calm, precise AI. 
            Get personalized routines crafted just for you.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => document.getElementById('assessment-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-premium btn-premium-primary flex items-center gap-3"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => router.push('/learning-center')}
              className="btn-premium btn-premium-ghost"
            >
              How It Works
            </button>
          </motion.div>
        </div>

        {/* ================= FLOATING PROGRESS BAR ================= */}
        <AnimatePresence>
          {(totalProgress > 0 || imageAnalyzed) && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="sticky top-4 z-50 max-w-2xl mx-auto mb-16 glass-premium-strong rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] flex items-center justify-center">
                    <Activity className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Analysis Progress</span>
                </div>
                <span className="text-lg font-bold text-gradient-premium">{totalProgress}%</span>
              </div>
              <div className="progress-premium">
                <div className="progress-premium-bar" style={{ width: `${totalProgress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
                <span>{categoriesAnswered} categories • {totalAnsweredQuestions} questions</span>
                <span>{imageAnalyzed ? "✓ Photo analyzed" : "Photo pending"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= CATEGORY CARDS ================= */}
        <div id="assessment-section" className="mb-16 scroll-mt-24">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gradient-calm mb-4">
              Personalize Your Analysis
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Select categories to answer targeted questions. More data means better recommendations.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.id;
              const completed = answeredCount(cat.id);
              const isComplete = completed === 5;
              const IconComponent = categoryIcons[idx];
              
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`
                    relative cursor-pointer rounded-2xl p-6 transition-all duration-500 overflow-hidden
                    ${isActive 
                      ? 'glass-premium-strong ring-1 ring-[var(--accent-cyan)] scale-[1.02]' 
                      : 'glass-card'}
                  `}
                >
                  {/* Completion Indicator */}
                  {isComplete && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`icon-premium mb-5 ${isActive ? 'bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black' : ''}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                    {cat.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-[var(--text-muted)] mb-5 line-clamp-2">
                    Analyze your {cat.label.toLowerCase()} for personalized recommendations.
                  </p>

                  {/* Progress */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <div 
                            key={n}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${n <= completed ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--bg-surface)]'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{completed}/5</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-all ${isActive ? 'text-[var(--accent-cyan)] rotate-90' : 'text-[var(--text-subtle)]'}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* ================= QUESTIONS PANEL ================= */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mb-20 overflow-hidden"
            >
              <div className="glass-premium-strong rounded-3xl p-8 md:p-10 relative">
                {/* Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-blue)] to-[var(--accent-violet)] rounded-t-3xl" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--glass-border)]">
                  <div className="flex items-center gap-4">
                    <div className="icon-premium">
                      {categoryIcons[categories.findIndex(c => c.id === activeCategory)]({ className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                        {categories.find(c => c.id === activeCategory)?.label}
                      </h2>
                      <p className="text-sm text-[var(--text-muted)]">Answer for better accuracy</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="p-3 rounded-xl glass-card hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Questions Grid */}
                <div className="grid gap-5">
                  {questions[activeCategory].map((q, idx) => (
                    <motion.div 
                      key={q.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`glass-card p-5 transition-all ${answers[q.id] ? 'ring-1 ring-[var(--accent-cyan)]/30' : ''}`}
                    >
                      <label className="block mb-4">
                        <span className="flex items-start gap-3">
                          <span className="text-[var(--accent-cyan)] font-mono text-sm mt-0.5">0{idx + 1}</span>
                          <span className="text-[var(--text-primary)] font-medium">{q.text}</span>
                        </span>
                      </label>
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="input-premium w-full cursor-pointer"
                      >
                         <option value="" className="bg-[var(--bg-deep)]">Select an option...</option>
                         {q.options.map((opt) => (
                           <option key={opt} value={opt} className="bg-[var(--bg-deep)]">{opt}</option>
                         ))}
                      </select>
                    </motion.div>
                  ))}
                </div>
                
                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="btn-premium btn-premium-primary"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= PHOTO ANALYZER PROMO ================= */}
        {!imageAnalyzed && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative glass-premium-strong rounded-3xl p-8 md:p-12 mb-20 overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-cyan)]/10 rounded-full blur-[100px] group-hover:bg-[var(--accent-cyan)]/20 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="badge-premium inline-flex mb-4">
                  <Camera className="w-3 h-3" />
                  <span>Visual AI Analysis</span>
                </div>
                <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                  Enhance with Photo Analysis
                </h3>
                <p className="text-[var(--text-secondary)] max-w-xl text-lg">
                  Our computer vision AI analyzes your skin in detail for scientifically accurate insights.
                </p>
              </div>
              <button
                onClick={() => router.push('/image-analyzer')}
                className="btn-premium btn-premium-primary whitespace-nowrap flex items-center gap-3"
              >
                <Camera className="w-5 h-5" />
                Open Analyzer
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= MAIN CTA ================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center pb-20"
        >
          <button
            onClick={handleNext}
            disabled={totalProgress === 0 && !imageAnalyzed}
            className={`
              px-14 py-5 rounded-2xl text-lg font-bold tracking-wide transition-all duration-500 w-full md:w-auto
              ${totalProgress > 0 || imageAnalyzed
                ? 'btn-premium-primary bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-teal)] to-[var(--accent-blue)]' 
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--glass-border)]'}
            `}
          >
            <span className="flex items-center justify-center gap-3">
              {totalProgress >= 50 ? "Generate Complete Analysis" : "Generate My Plan"} 
              {(totalProgress > 0 || imageAnalyzed) && <ArrowRight className="w-5 h-5" />}
            </span>
          </button>

          <p className="mt-5 text-sm text-[var(--text-subtle)]">
            {totalProgress > 0 
              ? `${totalAnsweredQuestions} questions answered • Ready to analyze` 
              : "Complete at least one category or upload a photo to continue"}
          </p>
        </motion.div>

      </Container>
      
      {/* Drawers & Floating UI */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FloatingChatBubble onClick={() => setChatOpen((s) => !s)} open={chatOpen} />
    </div>
  );
}
