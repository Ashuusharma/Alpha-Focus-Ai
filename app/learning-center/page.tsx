"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { ArrowLeft, BookOpen, Atom, Target, Calendar, CheckCircle2, FlaskConical, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LearningCenterPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: "ingredients",
      title: "Key Ingredients",
      icon: FlaskConical,
      color: "text-[var(--lux-accent)]",
      bg: "bg-[#00f2ff]/10",
      border: "border-[#00f2ff]/50",
      description: "Learn about the active ingredients analyzing and treating your condition",
      items: [
        { name: "Retinol", benefit: "Reduces fine lines and improves skin texture", icon: Sparkles },
        { name: "Hyaluronic Acid", benefit: "Deep hydration and moisture retention", icon: Atom },
        { name: "Niacinamide", benefit: "Strengthens skin barrier and reduces pores", icon: ShieldCheck },
        { name: "Vitamin C", benefit: "Brightens and protects from free radicals", icon: CheckCircle2 },
      ],
    },
    {
      id: "techniques",
      title: "Best Practices",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/50",
      description: "Proven grooming techniques and consistent routines",
      items: [
        { name: "Proper Application", benefit: "Apply products in correct order for maximum efficacy", icon: CheckCircle2 },
        { name: "Consistency", benefit: "Stick to your routine for best results", icon: Clock },
        { name: "Sun Protection", benefit: "Always use SPF to protect your skin", icon: ShieldCheck },
        { name: "Hydration", benefit: "Drink water and use hydrating products", icon: Atom },
      ],
    },
    {
      id: "timeline",
      title: "Results Timeline",
      icon: Calendar,
      color: "text-slate-300",
      bg: "bg-slate-500/10",
      border: "border-slate-500/50",
      description: "Realistic recovery expectations and milestones",
      items: [
        { name: "Week 1-2", benefit: "Skin feels smoother and more hydrated", icon: CheckCircle2 },
        { name: "Week 3-4", benefit: "Noticeable improvement in texture and tone", icon: Sparkles },
        { name: "Month 2-3", benefit: "Significant reduction in problem areas", icon: Target },
        { name: "Month 3+", benefit: "Sustained improvement and maintained health", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#060b14] py-12 relative overflow-hidden text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00f2ff]/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] mix-blend-screen" />
      </div>
      
      <Container>
        <div className="max-w-5xl mx-auto relative z-10">
          {/* HEADER */}
          <div className="mb-12">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition group mb-6"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold flex items-center gap-4 mb-2">
              <span className="p-3 bg-[#00f2ff]/10 rounded-xl border border-[#00f2ff]/20">
                <BookOpen className="w-8 h-8 text-[var(--lux-accent)]" />
              </span>
              <span className="lux-text-gradient">
                Learning Center
              </span>
            </h1>
            <p className="text-slate-400 ml-16 max-w-xl">
              Master the knowledge behind your grooming routine with our expert-curated guides.
            </p>
            <div className="ml-16 mt-5 flex flex-wrap gap-2">
              <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">Open Report</button>
            </div>
          </div>

          {/* CATEGORIES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`relative overflow-hidden text-left rounded-2xl p-6 transition-all duration-300 border group ${
                    isSelected
                      ? `lux-card border-[var(--lux-accent)] shadow-[0_0_30px_rgba(0,242,255,0.1)] scale-[1.02]`
                      : "lux-card border-white/5 hover:border-[#00f2ff]/30 hover:bg-[#0c1626]"
                  }`}
                >
                  <div className={`text-4xl mb-4 p-4 rounded-xl inline-block transition-colors duration-300 ${isSelected ? cat.bg : 'bg-white/5'}`}>
                    <Icon className={`w-8 h-8 ${isSelected ? cat.color : 'text-slate-400 group-hover:text-white'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 transition-colors ${isSelected ? 'text-white' : 'text-slate-200'}`}>{cat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{cat.description}</p>
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-cyan-500/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SELECTED CATEGORY CONTENT */}
          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lux-card p-8 border border-white/10 relative overflow-hidden"
              >
                {categories.map(
                  (cat) =>
                    cat.id === selectedCategory && (
                      <div key={cat.id}>
                        <div className="flex items-center gap-4 mb-8">
                          <cat.icon className={`w-8 h-8 ${cat.color}`} />
                          <h2 className="text-3xl font-bold text-white">
                            {cat.title}
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {cat.items.map((item, idx) => (
                                <div key={idx} className="bg-[#0c1626]/50 rounded-xl p-6 border border-white/5 hover:border-white/10 transition flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${cat.bg}`}>
                                        <item.icon className={`w-6 h-6 ${cat.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{item.name}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">{item.benefit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                    )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
}
