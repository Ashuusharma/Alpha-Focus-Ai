"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Send, Check, Layers } from "lucide-react";
import { categories, questions, CategoryId, Question } from "@/lib/questions";

interface Props {
  onSubmit: (answers: Record<string, string>, severities: Record<string, string>) => void;
}

const categoryIcons: Partial<Record<CategoryId, string>> = {
  scalp_health: "🧠",
  acne: "🔴",
  dark_circles: "🟣",
  hair_loss: "💇",
  beard_growth: "🧔",
  body_acne: "🧴",
  body_odor: "🧼",
  lip_care: "💧",
  anti_aging: "⏳",
  skin_dullness: "☀️",
  energy_fatigue: "🔋",
  fitness_recovery: "🏋️",
};

export default function AnalyzerQuestionsPage({ onSubmit }: Props) {
  // Phase: "categories" | "questions"
  const [phase, setPhase] = useState<"categories" | "questions">("categories");
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [severities, setSeverities] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  // Build question list based on selected categories only
  const allQuestions = useMemo(() => {
    const list: { category: CategoryId; question: Question }[] = [];
    selectedCategories.forEach((catId) => {
      questions[catId].forEach((q) => {
        list.push({ category: catId, question: q });
      });
    });
    return list;
  }, [selectedCategories]);

  // Progress logic:
  // - After photos captured (entering this page): 50%
  // - Questions progress: 50% + (answered/total) * 50%
  const baseProgress = 50;
  const questionProgress = allQuestions.length > 0 
    ? Math.round(((step + 1) / allQuestions.length) * 50) 
    : 0;
  const totalProgress = phase === "categories" ? baseProgress : baseProgress + questionProgress;

  const current = allQuestions[step];

  // Category Selection Handlers
  const toggleCategory = (catId: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleContinueToQuestions = () => {
    if (selectedCategories.length === 0) return;
    setPhase("questions");
    setStep(0);
  };

  // Question Handlers
  const handleAnswer = (option: string) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.question.id]: option }));
  };

  const handleSeverity = (sev: string) => {
    if (!current) return;
    setSeverities((prev) => ({ ...prev, [current.question.id]: sev }));
  };

  const handleNext = () => {
    if (step < allQuestions.length - 1) {
      setStep(step + 1);
    } else {
      // Save selected categories to sessionStorage
      sessionStorage.setItem("selectedCategories", JSON.stringify(selectedCategories));
      sessionStorage.setItem("questionsAnswered", "true");
      onSubmit(answers, severities);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      // Go back to category selection
      setPhase("categories");
    }
  };

  return (
    <div className="af-page-shell min-h-screen text-[var(--lux-text-primary)] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[var(--lux-accent)]/16 blur-[120px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#d8b55f]/14 blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        {/* Progress Bar */}
        <div className="mb-8 lux-card p-4">
          <div className="flex justify-between text-sm text-[var(--lux-text-muted)] mb-3">
            <span className="font-medium">
              {phase === "categories" 
                ? "Step 1: Select Categories" 
                : `Question ${step + 1} of ${allQuestions.length}`}
            </span>
            <span className="text-[var(--lux-accent)] font-bold">{totalProgress}%</span>
          </div>
          <div className="h-2 bg-[var(--lux-bg-secondary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--lux-accent-secondary)] to-[var(--lux-accent)] rounded-full shadow-[0_0_10px_var(--lux-accent)]"
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {phase === "questions" && (
            <p className="text-xs text-[var(--lux-text-subtle)] mt-3">
              📸 Photo analysis complete • Answering questions for {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>

        {/* PHASE: CATEGORY SELECTION */}
        {phase === "categories" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="lux-card p-8 mb-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--lux-accent)]/10 border border-[var(--lux-accent)]/20 flex items-center justify-center shadow-[0_14px_28px_rgba(47,111,87,0.14)]">
                  <Layers className="w-6 h-6 text-[var(--lux-accent)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--lux-text-primary)]">Select Analysis Areas</h2>
                  <p className="text-sm text-[var(--lux-text-secondary)]">Choose specific categories for deeper insights</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden group ${
                        isSelected
                          ? "bg-[var(--lux-accent)]/10 border-[var(--lux-accent)] shadow-[0_16px_30px_rgba(47,111,87,0.12)]"
                          : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] hover:bg-[var(--lux-bg-secondary)] hover:border-[var(--lux-accent)]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <span className="text-2xl filter drop-shadow-md">{categoryIcons[cat.id]}</span>
                        <span className={`font-semibold text-sm transition-colors ${isSelected ? "text-[var(--lux-accent)]" : "text-[var(--lux-text-secondary)] group-hover:text-[var(--lux-text-primary)]"}`}>
                          {cat.label}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-[var(--lux-accent)]" />
                        </motion.div>
                      )}
                      
                      <p className="text-[10px] text-[var(--lux-text-muted)] uppercase tracking-wider relative z-10">
                        {questions[cat.id].length} questions
                      </p>
                    </button>
                  );
                })}
              </div>  
            </div>

            {/* Selected Summary */}
            <div className="lux-card px-6 py-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--lux-text-muted)] uppercase tracking-wider mb-1">Total Questions</p>
                <p className="text-xl font-bold text-[var(--lux-accent)]">
                  {selectedCategories.reduce((sum, catId) => sum + questions[catId].length, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--lux-text-muted)] uppercase tracking-wider mb-1">Estimated Time</p>
                <p className="text-lg font-bold text-[var(--lux-text-primary)]">
                  ~{Math.ceil(selectedCategories.reduce((sum, catId) => sum + questions[catId].length, 0) * 0.5)} min
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinueToQuestions}
              disabled={selectedCategories.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
                selectedCategories.length > 0
                  ? "lux-btn-primary shadow-[0_16px_30px_rgba(47,111,87,0.18)] hover:shadow-[0_18px_34px_rgba(47,111,87,0.26)]"
                  : "bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] cursor-not-allowed opacity-50"
              }`}
            >
              Continue to Questions
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* PHASE: QUESTIONS */}
        {phase === "questions" && current && (
          <>
            {/* Category Tag */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--lux-accent)]/10 border border-[var(--lux-accent)]/20 text-xs font-bold text-[var(--lux-accent)] uppercase tracking-wider shadow-[0_10px_20px_rgba(47,111,87,0.12)]">
                <span>{categoryIcons[current.category]}</span>
                {categories.find((c) => c.id === current.category)?.label || current.category}
              </span>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="lux-card p-8 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--lux-accent)] to-transparent" />
                  
                  <h2 className="text-2xl font-bold text-[var(--lux-text-primary)] mb-8 leading-snug">
                    {current.question.text}
                  </h2>

                  <div className="space-y-3">
                    {current.question.options.map((opt) => {
                      const selected = answers[current.question.id] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          className={`block w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 font-medium text-sm group ${
                            selected
                              ? "bg-[var(--lux-accent)]/10 border-[var(--lux-accent)] text-[var(--lux-accent)] shadow-[0_12px_24px_rgba(47,111,87,0.1)]"
                              : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] text-[var(--lux-text-secondary)] hover:bg-[var(--lux-bg-secondary)] hover:border-[var(--lux-accent)]/30 hover:text-[var(--lux-text-primary)]"
                          }`}
                          onClick={() => handleAnswer(opt.label)}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              selected ? "border-[var(--lux-accent)] bg-[var(--lux-accent)] shadow-[0_8px_18px_rgba(47,111,87,0.14)]" : "border-[var(--lux-text-muted)] bg-transparent group-hover:border-[var(--lux-text-secondary)]"
                            }`}>
                              {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#fffdf9]" />}
                            </span>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity Selection */}
                {/* Only show if answered */}
                {answers[current.question.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }} 
                  className="lux-card p-6 mb-6"
                >
                  <label className="block font-semibold mb-3 text-xs text-[var(--lux-text-muted)] uppercase tracking-wider">
                    Severity / Impact
                  </label>
                  <div className="flex gap-3">
                    {[
                      { label: "Mild", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
                      { label: "Moderate", color: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" },
                      { label: "Severe", color: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" },
                    ].map((sev) => {
                      const selected = severities[current.question.id] === sev.label;
                      return (
                        <button
                          key={sev.label}
                          className={`flex-1 px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                            selected
                              ? `${sev.color.replace('10', '20')} shadow-[0_12px_24px_rgba(120,97,67,0.12)] ring-1 ring-white/30`
                              : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] hover:bg-[var(--lux-bg-secondary)]"
                          }`}
                          onClick={() => handleSeverity(sev.label)}
                        >
                          {sev.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pb-20">
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] text-[var(--lux-text-secondary)] hover:text-[var(--lux-text-primary)] hover:bg-[var(--lux-bg-secondary)] font-medium transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 0 ? "Back" : "Prev"}
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[current.question.id]}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                  !answers[current.question.id]
                    ? "bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] cursor-not-allowed opacity-50 shadow-none"
                    : step === allQuestions.length - 1
                      ? "bg-gradient-to-r from-[var(--lux-accent)] to-[var(--lux-accent-secondary)] text-[#fffdf9] shadow-[0_16px_28px_rgba(47,111,87,0.18)] hover:shadow-[0_20px_34px_rgba(47,111,87,0.24)] hover:scale-105"
                      : "bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] text-[var(--lux-text-primary)] hover:border-[var(--lux-accent)]/50 hover:bg-[var(--lux-bg-elevated)]"
                }`}
              >
                {step === allQuestions.length - 1 ? (
                  <>
                    Complete Analysis
                    <Send className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
