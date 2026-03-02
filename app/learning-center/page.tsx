"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { ArrowLeft, BookOpen, ChevronDown, Compass, FileText, ScanFace, ShieldCheck } from "lucide-react";
import { categories, questions, type CategoryId } from "@/lib/questions";

const categoryInsights: Record<CategoryId, { headline: string; guidance: string[] }> = {
  hairCare: {
    headline: "Hair recovery is driven by scalp stability and consistency.",
    guidance: [
      "Keep cleansing frequency aligned to oil level and sweat exposure.",
      "Use treatment products in measurable cycles of 6-8 weeks.",
      "Track shedding and density monthly instead of day-to-day."
    ],
  },
  skinCare: {
    headline: "Barrier-first skincare reduces noise and improves response to actives.",
    guidance: [
      "Prioritize cleanser + moisturizer + SPF before adding intense actives.",
      "Introduce one new product at a time and observe for 10-14 days.",
      "Use objective indicators: redness frequency, breakout count, texture changes."
    ],
  },
  beardCare: {
    headline: "Beard quality depends on skin comfort, not only growth products.",
    guidance: [
      "Exfoliate and hydrate the skin beneath facial hair to reduce irritation.",
      "Use trimming intervals to maintain shape and reduce mechanical stress.",
      "Address ingrown-prone zones with gentle anti-inflammatory care."
    ],
  },
  bodyCare: {
    headline: "Body skin responds strongly to friction, sweat, and cleansing quality.",
    guidance: [
      "Use breathable fabrics and post-workout cleansing to limit congestion.",
      "Treat roughness with consistent hydration and mild exfoliation cycles.",
      "Keep products simple and fragrance-balanced when sensitivity is present."
    ],
  },
  healthCare: {
    headline: "Sleep, stress, and nutrition visibly influence skin and scalp outcomes.",
    guidance: [
      "Target stable sleep timing before adding complex supplement stacks.",
      "Use hydration and protein baselines as non-negotiable daily anchors.",
      "Reduce routine volatility by keeping weekday behavior predictable."
    ],
  },
  fitness: {
    headline: "Training quality and recovery quality should improve together.",
    guidance: [
      "Balance intensity with recovery to avoid inflammation-driven setbacks.",
      "Support training with nutrition timing and adequate hydration.",
      "Track consistency rate weekly, not just single-session performance."
    ],
  },
  fragrance: {
    headline: "Signature scent strategy works best with context-aware selection.",
    guidance: [
      "Match fragrance concentration to climate and event duration.",
      "Use pulse-point placement and controlled sprays for cleaner projection.",
      "Build a small rotation: office-safe, evening, and all-season options."
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
    <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] py-12 text-[#1F3D2B]">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B] transition-colors mb-6 px-4 py-2 rounded-full hover:bg-white/40"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-4xl font-bold flex items-center gap-4 mb-2 text-[#1F3D2B]">
              <span className="p-3 bg-white/60 backdrop-blur-md rounded-xl border border-white/40 shadow-sm">
                <BookOpen className="w-8 h-8 text-[#2F6F57]" />
              </span>
              <span>Learning Center</span>
            </h1>
            <p className="text-[#6B665D] ml-16 max-w-2xl font-medium">
              Clinical guidance hub for assessment quality, photo analyzer accuracy, and category-specific routines.
            </p>
            <div className="ml-16 mt-6 flex flex-wrap gap-3">
              <button onClick={() => router.push("/assessment")} className="px-5 py-2.5 rounded-xl border border-white/40 bg-white/40 backdrop-blur-md text-sm font-semibold text-[#2F6F57] hover:bg-white/60 transition-all shadow-sm">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-5 py-2.5 rounded-xl border border-white/40 bg-white/40 backdrop-blur-md text-sm font-semibold text-[#2F6F57] hover:bg-white/60 transition-all shadow-sm">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="px-5 py-2.5 rounded-xl bg-[#2F6F57] text-sm font-semibold text-white shadow-lg shadow-[#2F6F57]/20 hover:bg-[#1F4D3B] transition-all">Open Report</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {guidance.map((item) => {
              const isOpen = selectedGuide === item.id;
              return (
                <div key={item.id} className="relative group/card cursor-pointer" onClick={() => setSelectedGuide(isOpen ? null : item.id)}>
                   <div className={`absolute inset-0 bg-gradient-to-br from-white/60 to-white/30 rounded-2xl blur-xl transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-70'}`} />
                   <div className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                     isOpen 
                       ? "bg-white/80 backdrop-blur-xl border-[#A9CBB7] shadow-lg ring-1 ring-[#2F6F57]/20" 
                       : "bg-white/60 backdrop-blur-md border-white/40 shadow-sm hover:shadow-md hover:bg-white/70"
                   }`}>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`p-3 rounded-xl border transition-colors ${
                          isOpen ? "bg-[#2F6F57] border-[#2F6F57] text-white" : "bg-white/50 border-white/40 text-[#2F6F57]"
                        }`}>
                          <item.icon className="w-6 h-6" />
                        </span>
                        <h3 className={`font-semibold text-lg leading-tight ${isOpen ? "text-[#1F3D2B]" : "text-[#1F3D2B]"}`}>{item.title}</h3>
                      </div>
                      <div className={`text-sm text-[#6B665D] leading-relaxed transition-all duration-300 ${isOpen ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"}`}>
                        {item.text}
                      </div>
                      <div className={`absolute top-6 right-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                         <ChevronDown className="w-5 h-5 text-[#A9CBB7]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-md p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1F3D2B] mb-2">Category Knowledge Library</h2>
            <p className="text-[#6B665D] mb-8">Expand each domain to read focused guidance and key question themes.</p>

            <div className="space-y-4">
              {categories.map((category) => {
                const isOpen = selectedCategory === category.id;
                const insight = categoryInsights[category.id];
                const topQuestions = questions[category.id].slice(0, 3);

                return (
                  <div key={category.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-white/80 border-[#A9CBB7] shadow-md"
                      : "bg-white/40 border-white/40 hover:bg-white/60"
                  }`}>
                    <button
                      onClick={() => setSelectedCategory(isOpen ? null : category.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          isOpen ? "bg-[#2F6F57] border-[#2F6F57] text-white" : "bg-white/50 border-white/40 text-[#6B665D]"
                        }`}>
                          <span className="text-sm font-bold">{category.label.charAt(0)}</span>
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${isOpen ? "text-[#1F3D2B]" : "text-[#1F3D2B]"}`}>{category.label}</p>
                          <p className="text-xs text-[#6B665D] font-medium">{questions[category.id].length} assessment prompts</p>
                        </div>
                      </div>
                      <span className={`p-2 rounded-full transition-all ${isOpen ? "bg-[#E8EFEA] text-[#2F6F57] rotate-180" : "bg-transparent text-[#A9CBB7]"}`}>
                        <ChevronDown className="w-5 h-5" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2">
                        <div className="rounded-xl border border-[#E2DDD4]/60 bg-[#F4EFE6]/50 p-6 mb-4">
                          <p className="font-semibold text-[#1F3D2B] mb-3 flex items-start gap-2">
                            <Compass className="w-5 h-5 text-[#2F6F57] shrink-0" />
                            {insight.headline}
                          </p>
                          <ul className="space-y-3 text-sm text-[#4A4641] pl-7">
                            {insight.guidance.map((point) => (
                              <li key={point} className="list-disc marker:text-[#2F6F57]">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          {topQuestions.map((question) => (
                            <div key={question.id} className="rounded-xl border border-white/60 bg-white/40 p-4 text-sm text-[#6B665D] hover:bg-white/60 transition-colors">
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
      </Container>
    </div>
  );
}
