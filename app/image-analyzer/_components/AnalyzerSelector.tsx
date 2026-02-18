"use client";

import { AnalyzerType } from "@/lib/analyzeImage";
import { motion } from "framer-motion";
import { ScanFace, User, Scissors, CircleDot, Eye, Clock, Brain, Smile, ShirtIcon, Droplet } from "lucide-react";

interface AnalyzerSelectorProps {
  selected: AnalyzerType | null;
  onSelect: (type: AnalyzerType) => void;
  disabled?: boolean;
}

export default function AnalyzerSelector({
  selected,
  onSelect,
  disabled = false,
}: AnalyzerSelectorProps) {
  const options: Array<{
    type: AnalyzerType;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
    tag?: string;
  }> = [
    {
      type: "skin",
      label: "Skin Health",
      icon: ScanFace,
      description: "Texture, tone, pores, oiliness, dehydration & sensitivity",
      color: "from-blue-400 to-cyan-400",
      tag: "Most Popular",
    },
    {
      type: "acne",
      label: "Acne Analysis",
      icon: CircleDot,
      description: "Cystic, comedonal, hormonal acne & post-acne marks",
      color: "from-red-400 to-pink-400",
    },
    {
      type: "dark_circles",
      label: "Dark Circles",
      icon: Eye,
      description: "Under-eye hollows, puffiness, pigmentation & fatigue signs",
      color: "from-indigo-400 to-violet-400",
    },
    {
      type: "aging",
      label: "Anti-Aging",
      icon: Clock,
      description: "Fine lines, wrinkles, firmness loss & sun damage",
      color: "from-amber-400 to-orange-400",
    },
    {
      type: "hair",
      label: "Hair Loss",
      icon: User,
      description: "Hairline recession, thinning, density & pattern baldness",
      color: "from-purple-400 to-pink-400",
    },
    {
      type: "scalp",
      label: "Scalp Health",
      icon: Brain,
      description: "Dandruff, dryness, flaking, product buildup & irritation",
      color: "from-teal-400 to-emerald-400",
    },
    {
      type: "beard",
      label: "Beard Growth",
      icon: Scissors,
      description: "Patchiness, density, ingrown hairs & texture issues",
      color: "from-emerald-400 to-teal-400",
    },
    {
      type: "teeth",
      label: "Teeth & Smile",
      icon: Smile,
      description: "Staining, alignment, gum health & whitening potential",
      color: "from-sky-400 to-blue-400",
      tag: "New",
    },
    {
      type: "body_acne",
      label: "Body Acne",
      icon: ShirtIcon,
      description: "Back acne, chest breakouts, folliculitis & body marks",
      color: "from-rose-400 to-red-400",
    },
    {
      type: "lips",
      label: "Lip Care",
      icon: Droplet,
      description: "Dryness, cracking, pigmentation & lip health analysis",
      color: "from-pink-400 to-rose-400",
    },
  ];

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--lux-accent)] rounded-full shadow-[0_0_10px_var(--lux-accent)]" />
        Choose Analysis Type
      </h3>
      <p className="text-slate-400 text-sm mb-8 ml-4">Select what you want to analyze — our AI will guide you through the right photo angles</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {options.map((option, idx) => {
          const isSelected = selected === option.type;
          const Icon = option.icon;

          // Override color maps for luxury theme consistency where appropriate, 
          // or keep them if semantic value is high. 
          // Keeping them for now but ensuring the container feels premium.

          return (
            <motion.button
              key={option.type}
              onClick={() => onSelect(option.type)}
              disabled={disabled}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.96 }}
              className={`relative group p-5 rounded-2xl border transition-all duration-300 text-left ${
                isSelected
                  ? "lux-card border-[var(--lux-accent)] shadow-[0_0_25px_rgba(0,242,255,0.25)] bg-[#0c1626]"
                  : "lux-card border-white/5 hover:bg-[#0c1626] hover:border-white/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Tag Badge */}
              {option.tag && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#00f2ff] to-[#0066cc] text-[#060b14] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  {option.tag}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-[var(--lux-accent)] rounded-full shadow-[0_0_10px_var(--lux-accent)] animate-pulse" />
              )}

              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-br " + option.color + " shadow-lg"
                    : "lux-bg-elevated group-hover:bg-white/10"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isSelected ? "text-white" : "text-slate-400 group-hover:text-white"
                  }`}
                />
              </div>

              {/* Text Content */}
              <h4
                className={`text-sm font-bold mb-1 transition-colors leading-tight ${
                  isSelected ? "text-white" : "text-slate-300"
                }`}
              >
                {option.label}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors line-clamp-2">
                {option.description}
              </p>

              {/* Hover Glow Effect */}
              <div
                className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${option.color} ${
                  isSelected ? "opacity-10" : "opacity-0 group-hover:opacity-5"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
