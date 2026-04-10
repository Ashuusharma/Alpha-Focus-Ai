"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { ArrowLeft, BookOpen, ChevronDown, Compass, FileText, ScanFace, ShieldCheck } from "lucide-react";
import { categories, questions, type CategoryId } from "@/lib/questions";

const categoryInsights: Partial<Record<CategoryId, { headline: string; guidance: string[] }>> = {
  scalp_health: {
    headline: "Scalp recovery improves when inflammation and oil balance are managed together.",
    guidance: [
      "Track itch, redness, and flake frequency weekly to monitor trends.",
      "Match wash frequency to sweat/oil burden rather than fixed routines.",
      "Avoid abrupt product switches during active flare windows."
    ],
  },
  acne: {
    headline: "Acne outcomes improve with inflammation control and pore management.",
    guidance: [
      "Track lesion count and post-mark activity separately for clarity.",
      "Keep routines non-comedogenic and consistent for at least 4-6 weeks.",
      "Prioritize UV protection to reduce post-inflammatory pigmentation."
    ],
  },
  dark_circles: {
    headline: "Under-eye changes are usually multifactorial: vascular, pigment, sleep, and hydration.",
    guidance: [
      "Compare morning and evening appearance to identify fluid vs pigment dominance.",
      "Improve sleep regularity before escalating product complexity.",
      "Use hydration and UV protection as baseline control variables."
    ],
  },
  hair_loss: {
    headline: "Hair loss tracking should focus on pattern progression and shedding behavior.",
    guidance: [
      "Track frontal, temporal, and crown photos in consistent lighting.",
      "Correlate shed spikes with stress, sleep, and routine changes.",
      "Assess outcomes in monthly windows instead of daily checks."
    ],
  },
  beard_growth: {
    headline: "Beard growth quality depends on density, irritation control, and grooming hygiene.",
    guidance: [
      "Reduce ingrown triggers with gentle exfoliation and shaving technique.",
      "Maintain hydration to improve texture and perceived fullness.",
      "Review patchy zones over 4-week intervals for reliable trend detection."
    ],
  },
  body_acne: {
    headline: "Body acne frequently reflects sweat retention, friction load, and hygiene timing.",
    guidance: [
      "Prioritize post-sweat cleansing and breathable fabrics.",
      "Track lesion density by area: back, chest, shoulders.",
      "Keep laundry and towel cadence consistent to reduce bacterial load."
    ],
  },
  lip_care: {
    headline: "Lip recovery requires barrier support, UV defense, and hydration consistency.",
    guidance: [
      "Limit irritant exposure during active dryness/cracking.",
      "Use protective balms with regular reapplication intervals.",
      "Track pigmentation changes over multi-week periods."
    ],
  },
  anti_aging: {
    headline: "Aging signals respond best to cumulative daily protection and repair.",
    guidance: [
      "Use consistent SPF and antioxidant protection as foundation care.",
      "Support elasticity with night repair and sleep quality.",
      "Measure progress by texture, tone, and line depth trends monthly."
    ],
  },
};

export default function LearningCenterPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const guidance = [
    {
      id: "questions",
      title: "How to answer assessment questions",
      icon: FileText,
      text: "Answer based on your last 2-4 weeks, not your best day. Accurate baselines improve recommendation precision and routine sequencing.",
    },
    {
      id: "analyzer",
      title: "How to capture stronger analyzer photos",
      icon: ScanFace,
      text: "Use neutral lighting, no harsh shadows, and keep framing consistent across angles. Stable quality improves hotspot confidence and trend comparability.",
    },
    {
      id: "platform",
      title: "How to use this platform weekly",
      icon: Compass,
      text: "Run one assessment update weekly, one photo scan every 7-14 days, and review progress trends before changing products or routines.",
    },
  ];

  return (
    <div className="af-page-shell py-12 text-[#ffffff]">
      <Container>
        <div className="af-page-frame mx-auto max-w-6xl">
          <div className="af-page-stack">
          <section className="nv-section-white">
            <div className="relative z-10 space-y-6">
            <button
              onClick={() => router.back()}
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[#1d1d1f] transition-colors hover:bg-white hover:text-[#1d1d1f]"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Back</span>
            </button>
            <div className="space-y-3">
              <span className="af-page-kicker">
                <BookOpen className="h-3.5 w-3.5" />
                Guided Learning
              </span>
              <h1 className="text-clinical-heading text-4xl font-extrabold tracking-tight text-[#1d1d1f]">Clinical guidance, protocol education, and category-specific execution in one hub.</h1>
              <p className="max-w-2xl text-sm font-medium leading-7 text-[#6e6e73]">The learning center now carries the same premium shell as the operational pages, so education sits inside the product journey instead of outside it.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Knowledge paths</p>
                <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">3</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Baseline, execution, optimization</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Categories covered</p>
                <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{categories.length}</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Mapped to assessment prompts</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Best use cadence</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">Weekly before routine changes</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Use with report and scan reviews</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => router.push("/assessment")} className="af-quick-action border border-[#0071e3] text-[#0071e3] bg-white">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="af-quick-action border border-[#0071e3] text-[#0071e3] bg-white">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="af-btn-primary px-5 py-3 text-sm">Open Report</button>
            </div>
          </div>
          </section>

          <section className="af-card-secondary p-8">
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Protocol Learning Paths</h2>
            <p className="text-sm text-[#6e6e73] mb-6">Choose your current phase and follow the shortest path to execution quality.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4">
                <p className="text-xs uppercase tracking-wider text-[#8C877D]">Path 1</p>
                <p className="font-semibold mt-1">Baseline Week</p>
                <p className="text-xs text-[#6e6e73] mt-1">Focus on analyzer quality + complete first full assessment cycle.</p>
                <button onClick={() => router.push("/image-analyzer")} className="mt-3 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white">Start Baseline</button>
              </div>
              <div className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4">
                <p className="text-xs uppercase tracking-wider text-[#8C877D]">Path 2</p>
                <p className="font-semibold mt-1">Execution Week</p>
                <p className="text-xs text-[#6e6e73] mt-1">Use challenge loops to convert your report into daily completed actions.</p>
                <button onClick={() => router.push("/challenges")} className="mt-3 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white">Open Challenges</button>
              </div>
              <div className="rounded-xl border border-[#d9d9de] bg-[#F8F6F3] p-4">
                <p className="text-xs uppercase tracking-wider text-[#8C877D]">Path 3</p>
                <p className="font-semibold mt-1">Optimization Week</p>
                <p className="text-xs text-[#6e6e73] mt-1">Refine routine and product fit based on measurable trend movement.</p>
                <button onClick={() => router.push("/dashboard")} className="mt-3 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white">Track Progress</button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
            {guidance.map((item) => {
              const isOpen = selectedGuide === item.id;
              return (
                <div key={item.id} className="cursor-pointer" onClick={() => setSelectedGuide(isOpen ? null : item.id)}>
                   <div className={`relative border transition-all duration-300 overflow-hidden ${
                     isOpen 
                       ? "bg-white border-[#0071e3]" 
                       : "bg-white border-[#5a5a5a]"
                   }`}>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`p-3 rounded-xl border transition-colors ${
                          isOpen ? "bg-transparent border-[#0071e3] text-[#0071e3]" : "bg-white border-[#5a5a5a] text-[#1a1a1a]"
                        }`}>
                          <item.icon className="w-6 h-6" />
                        </span>
                        <h3 className={`font-semibold text-lg leading-tight ${isOpen ? "text-[#1d1d1f]" : "text-[#1d1d1f]"}`}>{item.title}</h3>
                      </div>
                      <div className={`text-sm text-[#6e6e73] leading-relaxed transition-all duration-300 ${isOpen ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}>
                        {item.text}
                      </div>
                      <div className={`absolute top-6 right-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                         <ChevronDown className="w-5 h-5 text-[#0071e3]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="af-card-secondary p-8">
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Category Knowledge Library</h2>
            <p className="text-[#6e6e73] mb-8">Expand each domain to read focused guidance and key question themes.</p>

            <div className="space-y-4">
              {categories.map((category) => {
                const isOpen = selectedCategory === category.id;
                const insight = categoryInsights[category.id] || {
                  headline: "Category guidance is being refreshed.",
                  guidance: ["Complete analyzer and assessment to unlock structured tips."],
                };
                const topQuestions = questions[category.id].slice(0, 3);

                return (
                  <div key={category.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                        ? "bg-white border-[#0071e3] shadow-md"
                        : "bg-white border-[#d9d9de] hover:bg-white"
                  }`}>
                    <button
                      onClick={() => setSelectedCategory(isOpen ? null : category.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          isOpen ? "bg-[#0071e3] border-[#0071e3] text-white" : "bg-white border-[#d9d9de] text-[#1d1d1f]"
                        }`}>
                          <span className="text-sm font-bold">{category.label.charAt(0)}</span>
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${isOpen ? "text-[#1d1d1f]" : "text-[#1d1d1f]"}`}>{category.label}</p>
                          <p className="text-xs text-[#6e6e73] font-medium">{questions[category.id].length} assessment prompts</p>
                        </div>
                      </div>
                      <span className={`p-2 rounded-full transition-all ${isOpen ? "bg-[#eef5ff] text-[#0071e3] rotate-180" : "bg-transparent text-[#0071e3]"}`}>
                        <ChevronDown className="w-5 h-5" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2">
                        <div className="border border-[#5a5a5a] bg-white p-6 mb-4">
                          <p className="font-semibold text-[#1d1d1f] mb-3 flex items-start gap-2">
                            <Compass className="w-5 h-5 text-[#0071e3] shrink-0" />
                            {insight.headline}
                          </p>
                          <ul className="space-y-3 text-sm text-[#4A4641] pl-7">
                            {insight.guidance.map((point) => (
                              <li key={point} className="list-disc marker:text-[#0071e3]">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          {topQuestions.map((question) => (
                            <div key={question.id} className="border border-[#5a5a5a] bg-white p-4 text-sm text-[#1a1a1a]">
                              "{question.text}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

