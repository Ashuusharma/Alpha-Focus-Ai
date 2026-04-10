"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Send, Check, Layers } from "lucide-react";
import { categories, questions, CategoryId, Question } from "@/lib/questions";

interface Props {
  onSubmit: (answers: Record<string, string>, severities: Record<string, string>) => void;
}

const categoryIcons: Partial<Record<CategoryId, string>> = {
  scalp_health: " ",
  acne: "",
  dark_circles: "",
  hair_loss: "",
  beard_growth: "",
  body_acne: "",
  body_odor: "",
  lip_care: "",
  anti_aging: "â³",
  skin_dullness: "â˜€",
  energy_fatigue: "",
  fitness_recovery: "",
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
    <div className="af-page-shell min-h-screen text-[#ffffff] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        {/* Progress Bar */}
        <div className="mb-8 af-card-secondary p-4">
          <div className="flex justify-between text-sm text-[#1a1a1a] mb-3">
            <span className="font-medium">
              {phase === "categories" 
                ? "Step 1: Select Categories" 
                : `Question ${step + 1} of ${allQuestions.length}`}
            </span>
            <span className="text-[#0071e3] font-bold">{totalProgress}%</span>
          </div>
          <div className="h-2 bg-[#1b2219] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#0071e3] rounded-full"
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {phase === "questions" && (
            <p className="text-xs text-[#1a1a1a] mt-3">
               Photo analysis complete  -  Answering questions for {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>

        {/* PHASE: CATEGORY SELECTION */}
        {phase === "categories" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="af-card-secondary p-8 mb-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-transparent border border-[#0071e3] flex items-center justify-center">
                  <Layers className="w-6 h-6 text-[#0071e3]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">Select Analysis Areas</h2>
                  <p className="text-sm text-[#1a1a1a]">Choose specific categories for deeper insights</p>
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
                          ? "bg-white border-[#0071e3]"
                          : "bg-white border-[#5a5a5a]"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <span className="text-2xl filter drop-shadow-md">{categoryIcons[cat.id]}</span>
                        <span className={`font-semibold text-sm transition-colors ${isSelected ? "text-[#0071e3]" : "text-[#1a1a1a] group-hover:text-black"}`}>
                          {cat.label}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-[#0071e3]" />
                        </motion.div>
                      )}
                      
                      <p className="text-[10px] text-[#1a1a1a] uppercase tracking-wider relative z-10">
                        {questions[cat.id].length} questions
                      </p>
                    </button>
                  );
                })}
              </div>  
            </div>

            {/* Selected Summary */}
            <div className="af-card-secondary px-6 py-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a] uppercase tracking-wider mb-1">Total Questions</p>
                <p className="text-xl font-bold text-[#0071e3]">
                  {selectedCategories.reduce((sum, catId) => sum + questions[catId].length, 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#1a1a1a] uppercase tracking-wider mb-1">Estimated Time</p>
                <p className="text-lg font-bold text-black">
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
                  ? "btn-primary text-[#000000] shadow-[0_16px_30px_rgba(47,111,87,0.18)] hover:shadow-[0_18px_34px_rgba(47,111,87,0.26)]"
                  : "bg-white border border-[#5a5a5a] text-[#1a1a1a] cursor-not-allowed opacity-50"
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
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#0071e3] text-xs font-bold text-[#0071e3] uppercase tracking-wider">
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
                <div className="af-card-secondary p-8 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#0071e3]" />
                  
                  <h2 className="text-2xl font-bold text-black mb-8 leading-snug">
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
                                ? "bg-white border-[#0071e3] text-[#0071e3]"
                                : "bg-white border-[#5a5a5a] text-[#1a1a1a]"
                          }`}
                          onClick={() => handleAnswer(opt.label)}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              selected ? "border-[#0071e3] bg-[#0071e3]" : "border-[#1a1a1a] bg-transparent group-hover:border-black"
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
                  className="af-card-secondary p-6 mb-6"
                >
                  <label className="block font-semibold mb-3 text-xs text-[#1a1a1a] uppercase tracking-wider">
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
                                ? `${sev.color.replace('10', '20')} ring-1 ring-white/30`
                                : "bg-white border-[#5a5a5a] text-[#1a1a1a]"
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
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#0071e3] text-[#1a1a1a] font-medium transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 0 ? "Back" : "Prev"}
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[current.question.id]}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                  !answers[current.question.id]
                    ? "bg-white border border-[#5a5a5a] text-[#1a1a1a] cursor-not-allowed opacity-50 shadow-none"
                    : "bg-transparent border border-[#0071e3] text-[#1a1a1a]"
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


