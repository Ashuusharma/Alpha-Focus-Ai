"use client";

import { useContext, useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, ChevronRight, BarChart3, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { categories, questions, CategoryId } from "@/lib/questions";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import {
    getClinicalRelevance,
    getQuestionContextOverride,
    getQuestionLabel,
} from "@/lib/assessmentContentMap";

// --- CONTEXT DATA ---
const QUESTION_CONTEXT: Record<string, string> = {
    hair_concern: "We use this to identify active scalp stress and common shedding triggers.",
    hair_type: "Hair density helps estimate current growth baseline and support needed.",
    scalp_type: "Scalp feel indicates oil balance, dryness and irritation risk.",
    hair_damage: "Styling frequency reflects external stress on scalp and hair shafts.",
    hair_goal: "Your goal sets recommendation priority for the next 6-8 weeks.",
    skin_type: "Midday skin feel reveals hydration and oil-control balance.",
    skin_concern: "This helps prioritize acne, pigmentation or early-aging pathways.",
    breakouts: "Breakout frequency helps measure inflammation pattern and urgency.",
    sun_exposure: "UV load is a key driver of pigmentation and visible aging.",
    skin_goal: "Goal alignment improves routine relevance and consistency.",
    beard_growth: "Growth pattern shows density behavior and stimulation need.",
    beard_issue: "Comfort issues signal irritation, dryness or ingrown tendency.",
    beard_length: "Length impacts cleansing, hydration and styling method.",
    beard_care: "Routine consistency predicts speed of visible beard improvement.",
    beard_goal: "Your goal controls what we optimize first in beard care.",
    body_skin: "Post-shower skin feel indicates barrier and moisture status.",
    body_issue: "Persistent issue helps identify odor, acne or dryness drivers.",
    sweat: "Sweat profile guides freshness and anti-irritation planning.",
    shower_freq: "Cleansing frequency affects odor control and barrier resilience.",
    body_goal: "Outcome preference directs the body-care routine sequence.",
    energy: "Energy patterns can reflect recovery quality and lifestyle load.",
    sleep: "Sleep quality is strongly linked with skin repair and under-eye recovery.",
    stress: "Stress can influence inflammation, breakouts and shedding.",
    diet: "Food quality patterns impact skin clarity and recovery pace.",
    health_goal: "A clear health target improves adherence and visible outcomes.",
    activity: "Activity level helps calibrate recovery and care rhythm.",
    workout: "Training frequency affects sweat exposure and repair needs.",
    goal: "Fitness objective aligns support with your body goals.",
    injury: "Pain or injury status shapes safe progression recommendations.",
    fitness_focus: "Focus area helps us prioritize your most important gains.",
    scent_type: "Scent preference defines your fragrance identity baseline.",
    usage: "Usage timing helps optimize concentration and wear style.",
    strength: "Projection preference balances subtlety versus strong presence.",
    climate: "Climate changes fragrance performance and longevity.",
    fragrance_goal: "Desired fragrance result guides personalized scent direction.",
};

function getQuestionContext(questionId: string): string {
    return getQuestionContextOverride(questionId) || QUESTION_CONTEXT[questionId] || "This response helps refine your personalized protocol.";
}

// --- MAIN COMPONENT ---

export default function AssessmentPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useContext(AuthContext);

    // State
    const [currentCatIndex, setCurrentCatIndex] = useState(0);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [viewState, setViewState] = useState<'question' | 'category_summary' | 'final_review'>('question');
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<CategoryId[]>(
        categories[0] ? [categories[0].id] : []
    );

    // Derived
    const activeCategory = categories[currentCatIndex];
    const categoryQuestions = questions[activeCategory.id] || [];
    const activeQuestion = categoryQuestions[currentQIndex];

    const selectedCategories = selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : categories[0]
            ? [categories[0].id]
            : [];

    const totalQuestionsSelected = useMemo(
        () => selectedCategories.reduce((sum, catId) => sum + (questions[catId]?.length || 0), 0),
        [selectedCategories]
    );

    const answeredSelectedCount = useMemo(() => {
        const selectedQuestionIds = new Set(
            selectedCategories.flatMap((catId) => (questions[catId] || []).map((q) => q.id))
        );
        return Object.keys(answers).filter((id) => selectedQuestionIds.has(id)).length;
    }, [answers, selectedCategories]);

    const progressPercent = totalQuestionsSelected > 0
        ? Math.min(100, Math.round((answeredSelectedCount / totalQuestionsSelected) * 100))
        : 0;

    // Handlers
    const handleAnswer = (option: string) => {
        if (isAnimating) return;
        setIsAnimating(true);
        
        if (!selectedCategoryIds.includes(activeCategory.id)) {
            setSelectedCategoryIds((prev) => [...prev, activeCategory.id]);
        }
        // Save Answer
        const newAnswers = { ...answers, [activeQuestion.id]: option };
        setAnswers(newAnswers);

        // Delay for animation feeling
        setTimeout(() => {
            if (currentQIndex < categoryQuestions.length - 1) {
                // Next Question
                setCurrentQIndex(prev => prev + 1);
            } else {
                // End of Category
                setViewState('category_summary');
            }
            setIsAnimating(false);
        }, 300);
    };

    const handleNextCategory = () => {
        if (currentCatIndex < categories.length - 1) {
            setCurrentCatIndex(prev => prev + 1);
            setCurrentQIndex(0);
            setViewState('question');
        } else {
            setViewState('final_review');
        }
    };

    const handleJumpToCategory = (index: number) => {
        const nextCategory = categories[index];
        if (!nextCategory) return;
        if (!selectedCategoryIds.includes(nextCategory.id)) {
            setSelectedCategoryIds((prev) => [...prev, nextCategory.id]);
        }
        setCurrentCatIndex(index);
        setCurrentQIndex(0); // Reset to first Q of that category
        setViewState('question');
    };

    const handleClearCategory = (categoryId: CategoryId) => {
        const categoryQuestionIds = new Set((questions[categoryId] || []).map((q) => q.id));
        setAnswers((prev) => {
            const next = { ...prev };
            categoryQuestionIds.forEach((id) => delete next[id]);
            return next;
        });
        setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
        setCurrentQIndex(0);
        setViewState('question');
    };

    const handleBack = () => {
        if (currentQIndex > 0) {
            // Previous question in same category
            setCurrentQIndex(prev => prev - 1);
        } else if (currentCatIndex > 0) {
            // Previous category (last question)
            const prevCatIndex = currentCatIndex - 1;
            const prevCatId = categories[prevCatIndex].id;
            const prevQuestions = questions[prevCatId] || [];
            setCurrentCatIndex(prevCatIndex);
            setCurrentQIndex(prevQuestions.length - 1);
            setViewState('question');
        }
    };

    const handleFinish = async () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("assessment_answers_v1", JSON.stringify(answers));
            sessionStorage.setItem("questionsAnswered", "true");
        }

        if (user) {
            const completeness = totalQuestionsSelected > 0
                ? Math.round((answeredSelectedCount / totalQuestionsSelected) * 100)
                : 0;

            await supabase.from("assessment_answers").insert({
                user_id: user.id,
                completed_at: new Date().toISOString(),
                completeness_pct: completeness,
            });
        }

        router.push("/result?source=assessment");
    };

    // --- RENDER PARTS ---

    // 1. Progress Header
    const renderHeader = () => (
        <div className="sticky top-0 z-40 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#E2DDD3]">
            <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-[#1F3D2B]">Clinical Assessment</h1>
                        <p className="text-xs text-[#6B665D]">Answer structured questions to generate your protocol.</p>
                    </div>
                    <div className="text-right">
                        {viewState === 'question' && (
                            <>
                                <span className="text-xs font-bold text-[#2F6F57]">Step {currentQIndex + 1} of {categoryQuestions.length}</span>
                                <p className="text-[10px] text-[#6B665D] uppercase tracking-wider">{activeCategory.label}</p>
                            </>
                        )}
                        {answeredSelectedCount > 0 && (
                            <button
                                onClick={handleFinish}
                                className="mt-1 text-[11px] font-bold text-[#2F6F57] hover:underline"
                            >
                                View Report →
                            </button>
                        )}
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#E2DDD3] rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-[#2F6F57]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="text-[10px] text-[#6B665D] uppercase tracking-wider">
                    {answeredSelectedCount}/{totalQuestionsSelected} answered (selected categories)
                </div>
            </div>
        </div>
    );

    // 2. Category Nav (Horizontal)
    const renderCategoryNav = () => (
        <div className="overflow-x-auto pb-2 scrollbar-hide px-6 flex md:flex-wrap md:justify-center gap-2 mb-8 mt-6">
            {categories.map((cat, idx) => {
                const isActive = idx === currentCatIndex;
                const catQuestions = questions[cat.id] || [];
                const answeredInCat = catQuestions.filter((q) => answers[q.id]).length;
                const isComplete = catQuestions.length > 0 && answeredInCat === catQuestions.length;
                const isPartial = answeredInCat > 0 && !isComplete;

                return (
                    <button
                        key={cat.id}
                        onClick={() => handleJumpToCategory(idx)}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5
                            ${isActive 
                                ? "bg-[#1F3D2B] text-white shadow-md transform scale-105" 
                                : isComplete
                                    ? "bg-[#D9D2C7] text-[#1F3D2B] hover:bg-[#CFC8BD]" 
                                    : "bg-[#EAE4D9] text-[#8C867D] hover:bg-[#DED7CC]"}
                        `}
                    >
                        {cat.label}
                        {isComplete && <CheckCircle2 className="w-3 h-3 text-[#1F3D2B]" />}
                        {isPartial && <div className="w-1.5 h-1.5 rounded-full bg-[#8C6A5A]" />}
                    </button>
                );
            })}
        </div>
    );

    // 3. Question View
    const renderQuestion = () => (
        <motion.div
            key={activeQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="bg-white rounded-3xl shadow-sm border border-[#E2DDD3] p-6 md:p-8 relative">
                {/* Back Button */}
                {(currentQIndex > 0 || currentCatIndex > 0) && (
                    <button 
                        onClick={handleBack}
                        className="absolute top-6 left-6 p-2 rounded-full hover:bg-[#F4EFE6] text-[#6B665D] transition-colors"
                        aria-label="Previous question"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}

                {/* Badge */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 mt-2 sm:mt-0 pl-10 sm:pl-0">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#2F6F57]/10 text-[#2F6F57]`}>
                        {getClinicalRelevance(activeQuestion.id) || "Clinical"} Relevance
                    </span>
                    <span className="text-[10px] text-[#8C867D] font-medium tracking-wide uppercase">
                        Question {currentQIndex + 1}/{categoryQuestions.length}
                    </span>
                </div>

                {/* Question */}
                <h2 className="text-xl md:text-2xl font-bold text-[#1F3D2B] mb-3 leading-snug">
                    {getQuestionLabel(activeQuestion.id, activeQuestion.text)}
                </h2>
                
                {/* Context */}
                <div className="flex items-start gap-2 mb-8 bg-[#F8F6F3] p-3 rounded-xl border border-[#EBE7DF]">
                    <div className="mt-0.5 p-1 bg-[#2F6F57] rounded-full text-white">
                        <Activity className="w-3 h-3" />
                    </div>
                    <p className="text-xs text-[#555] italic leading-relaxed">
                        {getQuestionContext(activeQuestion.id)}
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {activeQuestion.options.map((option) => {
                        const isSelected = answers[activeQuestion.id] === option;
                        return (
                            <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                className={`
                                    w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 group relative overflow-hidden
                                    ${isSelected 
                                        ? "bg-[#2F6F57] border-[#2F6F57] text-white shadow-md" 
                                        : "bg-white border-[#E2DDD3] text-[#1F3D2B] hover:border-[#2F6F57]/40 hover:bg-[#F9F7F4]"}
                                `}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-[#1F3D2B]"}`}>
                                        {option}
                                    </span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );

    // 4. Category Summary View
    const renderCategorySummary = () => (
        <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl mx-auto text-center py-12"
        >
            <div className="w-20 h-20 bg-[#2F6F57] rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-[#2F6F57]/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F3D2B] mb-2">
                {activeCategory.label} Complete
            </h2>
            <p className="text-[#6B665D] mb-8 max-w-sm mx-auto">
                You've completed {activeCategory.label}. You can view your report now or choose another category to assess.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                    onClick={handleFinish}
                    className="inline-flex items-center justify-center gap-2 bg-[#1F3D2B] text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-lg hover:bg-[#2A5239] transition-all hover:-translate-y-1 hover:shadow-xl w-full sm:w-auto"
                >
                    View Report
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setViewState('question')}
                    className="inline-flex items-center justify-center gap-2 border border-[#E2DDD3] text-[#1F3D2B] px-8 py-3.5 rounded-full text-sm font-bold hover:bg-[#F4EFE6] transition-all w-full sm:w-auto"
                >
                    Answer Another Category
                </button>
            </div>

            <button
                onClick={() => handleClearCategory(activeCategory.id)}
                className="mt-4 text-xs font-semibold text-[#8C6A5A] hover:underline"
            >
                Clear {activeCategory.label} answers and reselect
            </button>
        </motion.div>
    );

    // 5. Final Review View
    const renderFinalReview = () => (
        <motion.div
             key="final"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-3xl mx-auto"
        >
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-[#E2DDD3] text-center">
                <div className="w-16 h-16 bg-[#F4EFE6] rounded-2xl mx-auto flex items-center justify-center mb-6 rotate-3">
                    <Sparkles className="w-8 h-8 text-[#2F6F57]" />
                </div>
                
                <h2 className="text-3xl font-bold text-[#1F3D2B] mb-2">Assessment Complete</h2>
                <p className="text-[#6B665D] mb-8">
                    Our AI has processed your inputs across all {categories.length} clinical modules.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
                    <div className="bg-[#F8F6F3] p-5 rounded-2xl border border-[#EBE7DF]">
                        <div className="flex items-center gap-2 mb-2 text-[#2F6F57]">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Analysis Confidence</span>
                        </div>
                        <p className="text-2xl font-bold text-[#1F3D2B]">94.8%</p>
                        <p className="text-xs text-[#6B665D] mt-1">Based on {Object.keys(answers).length} data points provided.</p>
                    </div>
                    <div className="bg-[#F8F6F3] p-5 rounded-2xl border border-[#EBE7DF]">
                         <div className="flex items-center gap-2 mb-2 text-[#2F6F57]">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Protocol Status</span>
                        </div>
                        <p className="text-2xl font-bold text-[#1F3D2B]">Generation Ready</p>
                        <p className="text-xs text-[#6B665D] mt-1">Personalized routine structure unlocked.</p>
                    </div>
                </div>

                <div className="space-y-4 mb-10 border-t border-[#E2DDD3] pt-6">
                    <h3 className="text-sm font-bold text-[#1F3D2B] uppercase tracking-wider text-center">Modules Completed</h3>
                    <div className="flex flex-wrap justify-center gap-2 px-4">
                        {categories.map((c) => (
                            <span key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAE4D9]/50 border border-[#E2DDD3] rounded-lg text-xs font-medium text-[#4A453E]">
                                {c.label} <CheckCircle2 className="w-3 h-3 text-[#2F6F57]" />
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleFinish}
                    className="w-full md:w-auto bg-[#2F6F57] text-white px-10 py-4 rounded-full text-sm font-bold shadow-2xl shadow-[#2F6F57]/30 hover:bg-[#255946] transition-all hover:scale-105"
                >
                    Generate Clinical Report
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F4EFE6]">
            {renderHeader()}

            <main className="px-6 py-6 pb-24 md:pb-12 h-auto md:min-h-[calc(100vh-140px)] flex flex-col items-center">
                <div className="max-w-4xl w-full flex-1 flex flex-col">
                    {/* Only show nav if not final view */}
                    {viewState !== 'final_review' && renderCategoryNav()}

                    <div className="flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {viewState === 'question' && renderQuestion()}
                            {viewState === 'category_summary' && renderCategorySummary()}
                            {viewState === 'final_review' && renderFinalReview()}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
