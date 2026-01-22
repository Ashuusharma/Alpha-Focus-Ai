"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { categories, questions, CategoryId } from "@/lib/questions";
import { AnalysisResult } from "@/lib/analyzeImage";
import Container from "@/app/result/_components/Container";
import ImageAnalyzerCTA from "@/app/result/_components/ImageAnalyzerCTA";
import CartDrawer from "@/app/result/_components/CartDrawer";
import ProfileDrawer from "@/app/result/_components/ProfileDrawer";
import FloatingCartBubble from "@/app/result/_components/FloatingCartBubble";
import FloatingChatBubble from "./result/_components/FloatingChatBubble";
import { useAssessments, logActivity } from "@/lib/useUserData";

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

    // Prepare URL with answers and photo analysis
    const params = new URLSearchParams();
    params.append("answers", JSON.stringify(answers));
    
    if (photoAnalysis) {
      params.append("photo", JSON.stringify(photoAnalysis));
    }

    router.push(`/result?${params.toString()}`);
  };

  /* ================= RENDER ================= */

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Container>
        <div className="py-8 md:py-12 px-4 md:px-0">
          
          {/* HERO SECTION */}
          <div className="max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl mb-6 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 14c-5 0-8 2.5-8 5v3h16v-3c0-2.5-3-5-8-5z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">
                Your Personalized Grooming Journey
              </h1>
              <p className="text-lg text-slate-700 mb-8">
                Answer a few questions to get a custom routine tailored to your unique needs
              </p>

              {/* PROGRESS INDICATOR */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-left">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-blue-700">{totalProgress}%</span>
                      <span className="text-slate-600">complete</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {imageAnalyzed && "✓ Photo analyzed  •  "}
                      {totalAnsweredQuestions > 0 && `✓ ${totalAnsweredQuestions} question${totalAnsweredQuestions !== 1 ? 's' : ''} answered`}
                    </p>
                  </div>
                  <div className="w-full md:w-48">
                    <div className="h-3 rounded-full bg-blue-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-slate-700 transition-all duration-500"
                        style={{ width: `${totalProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS & CONTENT SECTION */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT SIDEBAR - CATEGORY LIST */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <span>📋</span>
                    <span>Categories</span>
                  </h3>
                  {categories.map((cat) => {
                    const completed = answeredCount(cat.id);
                    const isActive = activeCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(isActive ? null : cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center justify-between ${
                          isActive
                            ? "bg-gradient-to-r from-blue-700 to-slate-800 text-white shadow-lg"
                            : "bg-blue-100 text-slate-900 hover:bg-blue-200"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-xs font-semibold ${isActive ? "bg-white/30 text-white" : "bg-blue-200 text-slate-700"} px-2 py-1 rounded">
                          {completed}/5
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT CONTENT - QUESTIONS */}
              <div className="lg:col-span-2">
                {activeCategory ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center space-x-3">
                      <span className="text-3xl">❓</span>
                      <span>{categories.find((c) => c.id === activeCategory)?.label}</span>
                    </h2>

                    <div className="space-y-6">
                      {questions[activeCategory].map((q, idx) => (
                        <div key={q.id} className="pb-6 border-b border-blue-200 last:border-0">
                          <label className="block text-sm font-semibold text-slate-900 mb-3">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-600 to-slate-700 text-white rounded-full text-xs font-bold mr-2">{idx + 1}</span>
                            {q.text}
                          </label>
                          <select
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">Choose an option...</option>
                            {q.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border border-blue-300 p-8 text-center">
                    <div className="text-5xl mb-4">👉</div>
                    <p className="text-lg font-bold text-slate-900">Select a category to get started</p>
                    <p className="text-sm text-slate-700 mt-2">Pick any category from the left to begin answering questions</p>
                  </div>
                )}
              </div>
            </div>

            {/* IMAGE ANALYZER PROMO */}
            {!imageAnalyzed && (
              <div className="mt-12 bg-gradient-to-r from-blue-700 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl flex-shrink-0">📸</div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">Enhance Your Assessment</h3>
                      <p className="text-blue-100">Upload a photo to get AI-powered analysis of your skin condition combined with your answers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/image-analyzer")}
                    className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition whitespace-nowrap flex items-center space-x-2 flex-shrink-0"
                  >
                    <span>🚀</span>
                    <span>Open Analyzer</span>
                  </button>
                </div>
              </div>
            )}

            {/* CTA BUTTON */}
            <button
              onClick={handleNext}
              disabled={totalAnsweredQuestions === 0 && !imageAnalyzed}
              className="w-full mt-12 px-6 py-4 bg-gradient-to-r from-blue-700 to-slate-800 text-white font-bold text-lg rounded-xl hover:from-blue-800 hover:to-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{totalProgress >= 50 ? "✨" : "🚀"}</span>
              <span>{totalProgress >= 50 ? "See My Recommendations" : "Continue with Your Assessment"}</span>
            </button>
          </div>
        </div>
      </Container>

      {/* Drawers & Floating UI */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FloatingCartBubble onClick={() => setCartOpen((s) => !s)} />
      <FloatingChatBubble onClick={() => setChatOpen((s) => !s)} open={chatOpen} />
    </div>
  );
}
