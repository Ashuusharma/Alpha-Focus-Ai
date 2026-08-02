"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Activity, Sparkles, Clock } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { categories, CategoryId, questions } from "@/lib/questions";
import { getClinicalRelevance } from "@/lib/assessmentContentMap";
import { getParentCategoryFromChild, resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryLevelDisplay, normalizeRecoveryLevel, type ProtocolToleranceMode } from "@/lib/protocolTemplates";
import { getRecoveryProgramLevel, saveRecoveryProgramLevel } from "@/lib/userProfile";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import Button from "@/components/ui/Button";

const HOUR_24_MS = 24 * 60 * 60 * 1000;
// Presentational only — an estimate shown to set expectations, not tied to
// any real timing measurement or business logic.
const SECONDS_PER_QUESTION_ESTIMATE = 15;

type SubmitStage = "idle" | "preparing" | "profile" | "generating" | "validating" | "ready";

// Every stage is tied to a real, already-existing await in handleSubmit
// (see the matching comment at each call site) - no fabricated progress.
// "ready" is the one exception: a brief terminal beat shown only after
// success is already confirmed, before the redirect - not a claim about
// work still happening.
const SUBMIT_STAGE_COPY: Record<Exclude<SubmitStage, "idle">, string> = {
  preparing: "Understanding your clinical profile",
  profile: "Building your daily protocol",
  generating: "Selecting your ingredients",
  validating: "Final quality review",
  ready: "Ready",
};

function getCategoryLabel(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId)?.label || categoryId;
}

// Encouraging microcopy tied to real progress milestones — not decorative
// filler, each threshold reflects the actual answeredCount/total ratio.
function getEncouragementCopy(progressPercent: number, isLastQuestion: boolean): string {
  if (isLastQuestion) return "Last one — you're about to unlock your protocol.";
  if (progressPercent >= 75) return "Almost there — final stretch.";
  if (progressPercent >= 50) return "Great pace — you're halfway through.";
  if (progressPercent >= 25) return "You're doing great, keep going.";
  return "Let's get to know your recovery profile.";
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
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [clinicalContextMessage, setClinicalContextMessage] = useState<string>("");
  const [flowDiagnosticSource, setFlowDiagnosticSource] = useState<"db_scan" | "session_fallback" | null>(null);
  const [selectedProgramLevel, setSelectedProgramLevel] = useState<ProtocolToleranceMode>("intermediate");
  // Purely presentational gate — a Welcome/orientation moment before the
  // question flow starts. No data implications; flips once per page load.
  const [hasStarted, setHasStarted] = useState(false);

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

  const estimatedMinutes = Math.max(1, Math.ceil((categoryQuestions.length * SECONDS_PER_QUESTION_ESTIMATE) / 60));
  const estimatedMinutesRemaining = Math.max(
    0,
    Math.ceil(((categoryQuestions.length - activeQuestionIndex) * SECONDS_PER_QUESTION_ESTIMATE) / 60)
  );

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

  // Section grouping: consecutive questions sharing the same domain are
  // presented as one visual "section" (no change to the underlying flow —
  // still one question at a time, same order).
  const currentSectionStartIndex = useMemo(() => {
    if (!activeQuestion) return activeQuestionIndex;
    let start = activeQuestionIndex;
    while (start > 0 && categoryQuestions[start - 1]?.domain === activeQuestion.domain) start -= 1;
    return start;
  }, [activeQuestion, activeQuestionIndex, categoryQuestions]);
  const isNewSection = activeQuestionIndex === currentSectionStartIndex;

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
    setSubmitStage("preparing"); // Stage 1: about to build + insert the assessment payload below.

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

      setSubmitStage("profile"); // Stage 2: recalculating clinical scores + hydrating store data below.
      await recalculateClinicalScores(user.id, activeCategory);
      await hydrateUserData(user.id);

      setSubmitStage("generating"); // Stage 3: the actual AI protocol generation call below.
      const protocolHeaders = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const shouldUseAsyncProtocolGeneration = true;
      console.info("[assessment] sending_generate_request", {
        asyncValue: shouldUseAsyncProtocolGeneration,
        nodeEnv: process.env.NODE_ENV,
      });
      const protocolResponse = await fetch("/api/protocol/generate", {
        method: "POST",
        headers: protocolHeaders,
        body: JSON.stringify({
          finalSubmission: true,
          category: activeCategory,
          answers,
          async: shouldUseAsyncProtocolGeneration,
          programContext: {
            toleranceMode: selectedProgramLevel,
          },
        }),
      });

      console.info("[assessment] generate_response", {
        status: protocolResponse.status,
        ok: protocolResponse.ok,
      });

      setSubmitStage("validating"); // Stage 4: validating the response below, same checks as before.
      const protocolPayload = (await protocolResponse.json()) as {
        ok?: boolean;
        reportId?: string;
        error?: string;
      };

      if (!protocolResponse.ok || !protocolPayload?.ok || !protocolPayload.reportId) {
        throw new Error(protocolPayload?.error || "protocol_generate_failed");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("recoveryProgramLevel", selectedProgramLevel);
        sessionStorage.setItem("protocolReportId", protocolPayload.reportId);
      }
      saveRecoveryProgramLevel(selectedProgramLevel);

      // Success is already confirmed at this point - "ready" is a brief
      // completion beat, not a claim about pending work.
      setSubmitStage("ready");
      await new Promise((resolve) => setTimeout(resolve, 550));
      router.push(`/result?category=${activeCategory}&level=${selectedProgramLevel}`);
    } catch (error) {
      console.error("Assessment submit failed", error);
      setBlockedMessage("Could not submit assessment. Please retry.");
      setSubmitStage("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="af-page flex h-full min-h-screen items-center justify-center p-6">
        <div className="af-surface-card px-6 py-5 text-sm text-[var(--ink)]">Loading clinical flow validation...</div>
      </div>
    );
  }

  if (blockedMessage || !activeCategory) {
    return (
      <div className="af-page flex h-full min-h-screen items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-[var(--border-hairline)] bg-white shadow-[var(--shadow-raised)] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--ink)]">Assessment Locked</h1>
          <p className="text-sm text-[var(--ink-soft)]">{blockedMessage || "Flow validation failed."}</p>
          <Button onClick={() => router.push("/image-analyzer")} variant="primary">
            Go to Analyzer
          </Button>
        </div>
      </div>
    );
  }

  const isAnswered = Boolean(activeQuestion && answers[activeQuestion.id]);
  const isLastQuestion = activeQuestionIndex === categoryQuestions.length - 1;
  const belowSubmitThreshold = progressPercent < 60;

  // Protocol generation in progress — a dedicated staged loading journey
  // (Phase 7F, restyled 7ZB), replacing the old inline "Compiling Report..."
  // button text with named, human stages instead of technical status text.
  if (isSubmitting) {
    const stageOrder: Exclude<SubmitStage, "idle">[] = ["preparing", "profile", "generating", "validating", "ready"];
    const currentIndex = submitStage === "idle" ? 0 : stageOrder.indexOf(submitStage);
    const isReady = submitStage === "ready";

    return (
      <div className="af-page flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        <div className="glass-card relative p-8">
          <AnimatePresence mode="wait">
            {isReady ? (
              <motion.div
                key="ready"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-green)]/15"
              >
                <CheckCircle2 className="h-12 w-12 text-[var(--accent-green)]" />
                {/* Completion celebration — small sparks bursting outward from
                    the checkmark, once, on the same success confirmation. */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  return (
                    <motion.span
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]"
                      style={{ top: "50%", left: "50%" }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * 56,
                        y: Math.sin(angle) * 56,
                        opacity: 0,
                        scale: 0.4,
                      }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="spinning" className="relative h-24 w-24">
                <div className="h-24 w-24 animate-spin rounded-full border-4 border-[var(--border-hairline)] border-t-[var(--accent-blue)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 animate-pulse text-[var(--accent-blue)]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 max-w-xl space-y-2" role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.h2
              key={submitStage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-bold text-[var(--ink)]"
            >
              {submitStage === "idle" ? "Getting started" : SUBMIT_STAGE_COPY[submitStage]}
            </motion.h2>
          </AnimatePresence>
          <p className="text-sm text-[var(--ink-soft)]">
            {isReady ? "Taking you to your recovery protocol." : "This usually takes under a minute. Please keep this tab open."}
          </p>
        </div>

        <div className="glass-card mt-6 w-full max-w-md p-5">
          <div className="flex items-center gap-1.5">
            {stageOrder.map((stage, index) => (
              <div
                key={stage}
                className={`h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-hairline)]`}
              >
                <motion.div
                  className={`h-full rounded-full ${index <= currentIndex ? "bg-[var(--accent-blue)]" : ""}`}
                  initial={{ width: index < currentIndex ? "100%" : "0%" }}
                  animate={{ width: index <= currentIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Step {Math.min(currentIndex + 1, stageOrder.length)} of {stageOrder.length}
          </p>
        </div>
      </div>
    );
  }

  // Welcome / orientation moment — shown once before the question flow
  // starts. Purely presentational; flips a local boolean, no data changes.
  if (!hasStarted) {
    return (
      <div className="af-page min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="af-card-primary w-full p-8 md:p-10">
            <span className="af-page-kicker mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              {getCategoryLabel(activeCategory)} Assessment
            </span>
            <h1 className="text-clinical-heading mt-4 text-3xl font-extrabold text-[var(--ink)]">Let's build your recovery plan</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{clinicalContextMessage}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="af-surface-soft flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                <div className="text-left">
                  <p className="text-lg font-bold text-[var(--ink)]">{categoryQuestions.length}</p>
                  <p className="text-xs text-[var(--ink-soft)]">Questions</p>
                </div>
              </div>
              <div className="af-surface-soft flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                <div className="text-left">
                  <p className="text-lg font-bold text-[var(--ink)]">~{estimatedMinutes} min</p>
                  <p className="text-xs text-[var(--ink-soft)]">Estimated time</p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs text-[var(--ink-soft)]">
              Answer honestly based on the last 2-4 weeks — this shapes every recommendation in your protocol.
            </p>

            <Button onClick={() => setHasStarted(true)} variant="primary" size="lg" className="mt-6 w-full justify-center">
              Begin Assessment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="af-page flex min-h-screen w-full flex-col animate-in fade-in duration-700">
      {/* HEADER PROGRESS BAR */}
      <div className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-white/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Recovery avatar — a progress-reactive orb standing in for the
                  emerging recovery profile, not a real user photo/identity. */}
              <motion.div
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent-blue) ${progressPercent * 3.6}deg, var(--border-hairline) 0deg)`,
                }}
                animate={{ scale: isNewSection ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Sparkles className="h-4 w-4 text-[var(--accent-blue)]" />
                </div>
              </motion.div>
              <div className="space-y-1">
                <h1 className="text-clinical-heading text-xl font-extrabold text-[var(--ink)] tracking-tight">Clinical Assessment - {getCategoryLabel(activeCategory)}</h1>
                <p className="text-xs text-[var(--ink-soft)]">Category-locked protocol scoring with weighted domain inputs.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs font-bold text-[var(--accent-blue)] bg-white px-2 py-1 rounded-md border border-[var(--accent-blue)]">{answeredCount}/{categoryQuestions.length} answered</span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--ink-soft)]">
                <Clock className="h-3 w-3" /> ~{estimatedMinutesRemaining} min left
              </span>
            </div>
          </div>

           <div className="af-surface-soft px-4 py-3 text-xs text-[var(--ink)] flex items-center gap-3">
             <Activity className="w-4 h-4 text-[var(--accent-blue)]" />
            {clinicalContextMessage || "We detected early signs. Let's understand your daily behavior drivers."}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={getEncouragementCopy(progressPercent, isLastQuestion)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-semibold text-[var(--accent-green)]"
            >
              {getEncouragementCopy(progressPercent, isLastQuestion)}
            </motion.p>
          </AnimatePresence>

          <div className="af-surface-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Recovery Track</p>
                <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{selectedLevelMeta.label}</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--ink-soft)]">{selectedLevelMeta.description} This selection is saved to your profile and used by the 30-day planner after assessment.</p>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Recovery track">
                {(["beginner", "intermediate", "advanced"] as ProtocolToleranceMode[]).map((level) => {
                  const option = getRecoveryLevelDisplay(level);
                  const active = selectedProgramLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleSelectProgramLevel(level)}
                      className={`rounded-xl px-4 py-2 text-left transition-all ${active ? "bg-[var(--accent-blue)] text-white" : "af-surface-soft text-[var(--ink)] hover:text-[var(--ink)]"}`}
                    >
                      <span className="block text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {flowDiagnosticSource && (
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
              Diagnostic mode: <span className="text-[var(--accent-blue)]">{flowDiagnosticSource === "db_scan" ? "DB scan validated" : "Session fallback"}</span>
            </p>
          )}

          <div
            className="af-progress-track w-full h-1.5 border border-[var(--border-hairline)]"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Assessment progress"
          >
            <div className="af-progress-fill transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 relative pb-28 md:pb-10">
        {/* Glow effect */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--accent-blue-soft)]/25 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeQuestion && (
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="af-surface-card relative p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent-blue)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-blue-soft)] animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                    {getClinicalRelevance(activeQuestion.id)} relevance
                  </span>
                </div>
              </div>

              {/* Section marker — only shown when the topic domain changes,
                  giving a "moving through distinct sections" feel without
                  altering the underlying one-question-at-a-time flow. */}
              {isNewSection && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-green)]">
                  Section - {activeQuestion.domain.replace(/_/g, " ")}
                </p>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">
                  <span>Question {activeQuestionIndex + 1} of {categoryQuestions.length}</span>
                  <span>{Math.max(0, categoryQuestions.length - (activeQuestionIndex + 1))} remaining</span>
                </div>
                <div className="inline-block px-2 py-1 rounded border border-[var(--border-hairline)] bg-[var(--tint-warm)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
                  Domain: <span className="text-[var(--ink)]">{activeQuestion.domain.replace(/_/g, " ")}</span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--ink)] leading-snug">{activeQuestion.text}</h2>
                <div className="flex items-center gap-4 text-xs text-[var(--ink-soft)]">
                  <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[var(--accent-blue)]" /> W-{activeQuestion.weight.toFixed(1)}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--border-hairline)]"></span>
                  <span>Answer based on recent 2-4 weeks.</span>
                </div>
              </div>

              <div className="space-y-3 pt-4" role="radiogroup" aria-label={activeQuestion.text}>
                {activeQuestion.options.map((option) => {
                  const selected = answers[activeQuestion.id] === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleSelectAnswer(option.label)}
                      role="radio"
                      aria-checked={selected}
                      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 relative overflow-hidden group ${
                        selected
                          ? "border-[var(--accent-blue)] bg-[var(--bg-wash-start)]"
                          : "border-[var(--border-hairline)] bg-white hover:border-[var(--ink-soft)]/40 hover:bg-white"
                      }`}
                    >
                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <span className={`text-sm font-medium transition-colors ${selected ? "text-[var(--accent-blue)]" : "text-[var(--ink)]"}`}>{option.label}</span>
                        <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${selected ? "border-[var(--accent-blue)]" : "border-[var(--ink-soft)]/40"}`}>
                          {selected && <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sticky on mobile so Next/Submit stays reachable without
                  scrolling back down a long option list; static on desktop. */}
              <div className="sticky bottom-4 z-10 -mx-6 -mb-6 flex flex-col gap-2 border-t border-[var(--border-hairline)] bg-white/95 px-6 py-4 backdrop-blur md:static md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:p-0 md:pt-6">
                {isLastQuestion && belowSubmitThreshold && (
                  <p className="text-xs text-[var(--ink-soft)]">
                    Answer at least 60% of questions to generate your protocol ({answeredCount}/{categoryQuestions.length} so far).
                  </p>
                )}
                <div className="flex justify-end">
                  {!isLastQuestion ? (
                    <Button onClick={handleContinue} disabled={!isAnswered} variant="soft">
                      Next Question <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={!isAnswered || belowSubmitThreshold} variant="primary">
                      <CheckCircle2 className="w-4 h-4" />
                      Generate Clinical Report
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
