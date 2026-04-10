"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { categories, CategoryId, questions } from "@/lib/questions";
import { getClinicalRelevance } from "@/lib/assessmentContentMap";
import { getParentCategoryFromChild, resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryLevelDisplay, normalizeRecoveryLevel, type ProtocolToleranceMode } from "@/lib/protocolTemplates";
import { getRecoveryProgramLevel, saveRecoveryProgramLevel } from "@/lib/userProfile";

const HOUR_24_MS = 24 * 60 * 60 * 1000;

function getCategoryLabel(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId)?.label || categoryId;
}

function getClinicalContextMessage(categoryId: CategoryId, photoMetrics: Record<string, unknown> | null) {
  const baseByCategory: Record<string, string> = {
    scalp_health: "We detected scalp imbalance indicators. Let's validate inflammation, shedding, sleep, and stress triggers.",
    acne: "We detected acne-pattern inflammation. Let's validate hormonal, stress, diet, and pore-congestion drivers.",
    dark_circles: "We detected under-eye stress signals. Let's validate sleep debt, hydration, and vascular stress factors.",
    hair_loss: "We detected hair-density risk patterns. Let's validate shedding rate, hormonal risk, and recovery friction.",
    beard_growth: "We detected beard growth variability. Let's validate density blockers, irritation, and grooming consistency.",
    body_acne: "We detected body-acne markers. Let's validate sweat load, friction, and hygiene consistency.",
    lip_care: "We detected lip barrier stress. Let's validate hydration, pigmentation, and UV exposure patterns.",
    anti_aging: "We detected early aging markers. Let's validate elasticity, UV load, and oxidative stress contributors.",
  };

  const base = baseByCategory[categoryId] || "Let's validate your lifestyle and behavior drivers.";
  if (!photoMetrics) return base;

  const numericValues = Object.values(photoMetrics)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const avgSignal = numericValues.length > 0
    ? Math.round(numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length)
    : null;

  if (avgSignal === null) return base;
  if (avgSignal >= 70) return `${base} Current signal intensity appears elevated.`;
  if (avgSignal >= 45) return `${base} Current signal intensity appears moderate.`;
  return `${base} Current signal intensity appears mild.`;
}

function hasRecentSessionScanForCategory(categoryId: CategoryId) {
  if (typeof window === "undefined") return false;

  const analysisCategory = sessionStorage.getItem("analysisCategory");
  const analysisAt = sessionStorage.getItem("analysisAt");
  const photoAnalysisRaw = sessionStorage.getItem("photoAnalysis");

  if (!analysisCategory || analysisCategory !== categoryId) return false;
  if (!analysisAt || !photoAnalysisRaw) return false;

  const ts = new Date(analysisAt).getTime();
  if (!Number.isFinite(ts)) return false;

  return Date.now() - ts <= HOUR_24_MS;
}

function getRecentSessionCategory(): CategoryId | null {
  if (typeof window === "undefined") return null;

  const analysisCategory = sessionStorage.getItem("analysisCategory") as CategoryId | null;
  const analysisAt = sessionStorage.getItem("analysisAt");
  const photoAnalysisRaw = sessionStorage.getItem("photoAnalysis");

  if (!analysisCategory || !analysisAt || !photoAnalysisRaw) return null;
  if (!questions[analysisCategory]) return null;

  const ts = new Date(analysisAt).getTime();
  if (!Number.isFinite(ts)) return null;
  if (Date.now() - ts > HOUR_24_MS) return null;

  return analysisCategory;
}

function getRecentSessionParentCategory() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("analysisParentCategory");
  return value || null;
}

function getRecentSessionRecoveryLevel() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("recoveryProgramLevel");
  return value ? normalizeRecoveryLevel(value) : null;
}

export default function AssessmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinicalContextMessage, setClinicalContextMessage] = useState<string>("");
  const [flowDiagnosticSource, setFlowDiagnosticSource] = useState<"db_scan" | "session_fallback" | null>(null);
  const [selectedProgramLevel, setSelectedProgramLevel] = useState<ProtocolToleranceMode>("intermediate");

  const categoryQuestions = useMemo(() => {
    if (!activeCategory) return [];
    return questions[activeCategory] || [];
  }, [activeCategory]);

  const answeredCount = useMemo(
    () => categoryQuestions.filter((question) => Boolean(answers[question.id])).length,
    [answers, categoryQuestions]
  );

  const progressPercent = categoryQuestions.length > 0
    ? Math.round((answeredCount / categoryQuestions.length) * 100)
    : 0;

  useEffect(() => {
    async function validateFlow() {
      if (!user) {
        setBlockedMessage("Please log in to continue assessment.");
        setLoading(false);
        return;
      }

      const categoryFromQuery = params?.get("category");
      const levelFromQuery = params?.get("level");

      const { data: activeAnalysis } = await supabase
        .from("user_active_analysis")
        .select("selected_category,parent_category,selected_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const sessionCategory = getRecentSessionCategory();
      const selectedCategory = resolveClinicalChildCategoryFromAny(
        categoryFromQuery || activeAnalysis?.selected_category || null,
        sessionCategory || null
      );
      const parentCategory = selectedCategory
        ? getParentCategoryFromChild(selectedCategory)
        : (getRecentSessionParentCategory() || activeAnalysis?.parent_category || null);
      const resolvedLevel = normalizeRecoveryLevel(levelFromQuery || getRecentSessionRecoveryLevel() || getRecoveryProgramLevel());

      if (!selectedCategory || !questions[selectedCategory]) {
        setBlockedMessage("Start from analyzer and select a valid category first.");
        setLoading(false);
        return;
      }

      const threshold = new Date(Date.now() - HOUR_24_MS).toISOString();
      const { data: latestScan } = await supabase
        .from("photo_scans")
        .select("id,scan_date,image_valid,photo_metrics")
        .eq("user_id", user.id)
        .eq("analyzer_category", selectedCategory)
        .eq("image_valid", true)
        .gte("scan_date", threshold)
        .order("scan_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestScan?.id) {
        const hasSessionScan = hasRecentSessionScanForCategory(selectedCategory);
        if (!hasSessionScan) {
          setBlockedMessage("Assessment is locked. Upload and validate a photo scan for this category within the last 24 hours.");
          setLoading(false);
          return;
        }
      }

      const sessionFallbackMessage = "Live scan row not found yet, using your latest analyzer session data.";
      setClinicalContextMessage(
        latestScan?.id
          ? getClinicalContextMessage(
              selectedCategory,
              (latestScan?.photo_metrics || null) as Record<string, unknown> | null
            )
          : `${getClinicalContextMessage(selectedCategory, null)} ${sessionFallbackMessage}`
      );
          setFlowDiagnosticSource(latestScan?.id ? "db_scan" : "session_fallback");

      await supabase
        .from("user_active_analysis")
        .upsert(
          {
            user_id: user.id,
            selected_category: selectedCategory,
            parent_category: parentCategory,
            selected_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      setActiveCategory(selectedCategory);
      setSelectedProgramLevel(resolvedLevel);
      setBlockedMessage(null);
      setLoading(false);
    }

    validateFlow();
  }, [params, user]);

  const activeQuestion = categoryQuestions[activeQuestionIndex];
  const selectedLevelMeta = getRecoveryLevelDisplay(selectedProgramLevel);

  const handleSelectProgramLevel = (level: ProtocolToleranceMode) => {
    const normalized = normalizeRecoveryLevel(level);
    setSelectedProgramLevel(normalized);
    saveRecoveryProgramLevel(normalized);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("recoveryProgramLevel", normalized);
    }
  };

  const handleSelectAnswer = (label: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: label }));
  };

  const handleContinue = () => {
    if (activeQuestionIndex < categoryQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
      return;
    }
    router.push("/image-analyzer");
  };

  const handleSubmit = async () => {
    if (!user || !activeCategory || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const answersWithScore = categoryQuestions.map((question) => {
        const selectedLabel = answers[question.id];
        const selectedOption = question.options.find((option) => option.label === selectedLabel);
        return {
          question_id: question.id,
          domain: question.domain,
          weight: question.weight,
          selected_label: selectedLabel || null,
          selected_score: selectedOption?.score ?? null,
        };
      });

      const completenessPct = categoryQuestions.length > 0
        ? Math.round((answeredCount / categoryQuestions.length) * 100)
        : 0;

      const fullAssessmentPayload = {
        user_id: user.id,
        category: activeCategory,
        parent_category: getParentCategoryFromChild(activeCategory),
        completed_at: new Date().toISOString(),
        completeness_pct: completenessPct,
        answers,
        answer_scores: answersWithScore,
      };

      let { error: assessmentInsertError } = await supabase.from("assessment_answers").insert(fullAssessmentPayload);

      if (assessmentInsertError) {
        const schemaMissingOptionalColumns = /completeness_pct|parent_category|answer_scores/i.test(assessmentInsertError.message || "");
        if (schemaMissingOptionalColumns) {
          const minimalAssessmentPayload = {
            user_id: user.id,
            category: activeCategory,
            completed_at: new Date().toISOString(),
            answers,
          };
          const retry = await supabase.from("assessment_answers").insert(minimalAssessmentPayload);
          assessmentInsertError = retry.error;
        }
      }

      if (assessmentInsertError) {
        throw new Error(`Could not save assessment: ${assessmentInsertError.message}`);
      }

      await recalculateClinicalScores(user.id, activeCategory);

      await hydrateUserData(user.id);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("recoveryProgramLevel", selectedProgramLevel);
      }
      saveRecoveryProgramLevel(selectedProgramLevel);
      router.push(`/result?category=${activeCategory}&level=${selectedProgramLevel}`);
    } catch (error) {
      console.error("Assessment submit failed", error);
      setBlockedMessage("Could not submit assessment. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

if (loading) {
    return (
      <div className="af-page-shell flex h-full items-center justify-center p-6 text-[#ffffff]">
        <div className="af-surface-card px-6 py-5 text-sm text-[#1d1d1f]">Loading clinical flow validation...</div>
      </div>
    );
  }

  if (blockedMessage || !activeCategory) {
    return (
      <div className="af-page-shell flex h-full items-center justify-center p-6 text-[#ffffff]">
        <div className="max-w-xl w-full rounded-3xl border border-[#d8c4bf] bg-white shadow-[0_24px_60px_rgba(140,106,90,0.12)] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#1d1d1f]">Assessment Locked</h1>
          <p className="text-sm text-[#6e6e73]">{blockedMessage || "Flow validation failed."}</p>
          <button
            onClick={() => router.push("/image-analyzer")}
            className="inline-flex items-center justify-center rounded-full bg-[#0071e3] hover:bg-[#0066cc] text-white border border-[#0071e3] px-6 py-3 text-sm font-semibold transition-colors"
          >
            Go to Analyzer
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = Boolean(activeQuestion && answers[activeQuestion.id]);
  const isLastQuestion = activeQuestionIndex === categoryQuestions.length - 1;

  return (
    <div className="af-page-shell flex flex-col h-full w-full animate-in fade-in duration-700 min-h-screen text-[#ffffff]">
      
      {/* HEADER PROGRESS BAR */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7] border-b border-[#d9d9de]">
        <div className="max-w-3xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-clinical-heading text-xl font-extrabold text-[#1d1d1f] tracking-tight">Clinical Assessment - {getCategoryLabel(activeCategory)}</h1>
              <p className="text-xs text-[#6e6e73]">Category-locked protocol scoring with weighted domain inputs.</p>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-[#0071e3] bg-white px-2 py-1 rounded-md border border-[#0071e3]">{answeredCount}/{categoryQuestions.length} answered</span>
            </div>
          </div>
          
           <div className="af-surface-soft px-4 py-3 text-xs text-[#1d1d1f] flex items-center gap-3">
             <Activity className="w-4 h-4 text-[#0071e3]" />
            {clinicalContextMessage || "We detected early signs. Let's understand your daily behavior drivers."}
          </div>

          <div className="af-surface-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6e73]">Recovery Track</p>
                <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">{selectedLevelMeta.label}</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#6e6e73]">{selectedLevelMeta.description} This selection is saved to your profile and used by the 30-day planner after assessment.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["beginner", "intermediate", "advanced"] as ProtocolToleranceMode[]).map((level) => {
                  const option = getRecoveryLevelDisplay(level);
                  const active = selectedProgramLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleSelectProgramLevel(level)}
                      className={`rounded-xl px-4 py-2 text-left transition-all ${active ? "bg-[#0071e3] text-white" : "af-surface-soft text-[#1d1d1f] hover:text-[#1d1d1f]"}`}
                    >
                      <span className="block text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {flowDiagnosticSource && (
            <p className="text-[10px] uppercase tracking-wider text-[#6e6e73]">
              Diagnostic mode: <span className="text-[#0071e3]">{flowDiagnosticSource === "db_scan" ? "DB scan validated" : "Session fallback"}</span>
            </p>
          )}
          
          <div className="af-progress-track w-full h-1.5 border border-[#e3d8c8]">
            <div className="af-progress-fill transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 relative">
        {/* Glow effect */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#99c9ff]/25 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeQuestion && (
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className="af-surface-card relative p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#e0e0e4] pb-4">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] hover:text-[#1d1d1f] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3]">
                    {getClinicalRelevance(activeQuestion.id)} relevance
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#6e6e73]">
                  <span>Question {activeQuestionIndex + 1} of {categoryQuestions.length}</span>
                  <span>{Math.max(0, categoryQuestions.length - (activeQuestionIndex + 1))} remaining</span>
                </div>
                <div className="inline-block px-2 py-1 rounded border border-[#ddd2c2] bg-[rgba(255,252,246,0.72)] text-[10px] uppercase tracking-wider text-[#6e6e73]">
                  Domain: <span className="text-[#1d1d1f]">{activeQuestion.domain.replace(/_/g, " ")}</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1d1d1f] leading-snug">{activeQuestion.text}</h2>
                <div className="flex items-center gap-4 text-xs text-[#6e6e73]">
                  <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#0071e3]" /> W-{activeQuestion.weight.toFixed(1)}</span>
                  <span className="w-1 h-1 rounded-full bg-[#c8bcab]"></span>
                  <span>Answer based on recent 2-4 weeks.</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {activeQuestion.options.map((option) => {
                  const selected = answers[activeQuestion.id] === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleSelectAnswer(option.label)}
                      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 relative overflow-hidden group ${
                        selected
                          ? "border-[#0071e3] bg-[#eef5ff]"
                          : "border-[#d9d9de] bg-white hover:border-[#bfc2cc] hover:bg-white"
                      }`}
                    >
                      {selected && <div className="absolute inset-0 bg-[#eef5ff] pointer-events-none" />}
                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <span className={`text-sm font-medium transition-colors ${selected ? "text-[#0071e3]" : "text-[#1d1d1f] group-hover:text-[#1d1d1f]"}`}>{option.label}</span>
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-mono px-2 py-1 rounded ${selected ? "bg-[#eef5ff] text-[#0071e3]" : "bg-[#f5f5f7] text-[#1d1d1f]"}`}>SC {option.score}</span>
                           <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? "border-[#0071e3]" : "border-[#b8bac4]"}`}>
                             {selected && <div className="w-2 h-2 bg-[#0071e3] rounded-full" />}
                           </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 flex justify-end">
                {!isLastQuestion ? (
                  <button
                    onClick={handleContinue}
                    disabled={!isAnswered}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] px-8 py-3 text-sm font-bold border border-[#cfd1db] transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Next Query <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isAnswered || isSubmitting || progressPercent < 60}
                    className="relative overflow-hidden inline-flex items-center gap-2 rounded-xl bg-[#0071e3] text-white px-8 py-3 text-sm font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? "Compiling Report..." : "Generate Clinical Report"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

