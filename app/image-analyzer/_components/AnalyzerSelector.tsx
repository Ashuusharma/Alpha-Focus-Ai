"use client";

import { AnalyzerType } from "@/lib/analyzeImage";
import { motion } from "framer-motion";
import { User, Scissors, CircleDot, Eye, Clock, Brain, ShirtIcon, Droplet, SunMedium, BatteryMedium, Dumbbell } from "lucide-react";

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
      type: "anti_aging",
      label: "Anti-Aging",
      icon: Clock,
      description: "Fine lines, wrinkles, firmness loss & sun damage",
      color: "from-amber-400 to-orange-400",
    },
    {
      type: "hair_loss",
      label: "Hair Loss",
      icon: User,
      description: "Hairline recession, thinning, density & pattern baldness",
      color: "from-purple-400 to-pink-400",
    },
    {
      type: "scalp_health",
      label: "Scalp Health",
      icon: Brain,
      description: "Dandruff, dryness, flaking, product buildup & irritation",
      color: "from-teal-400 to-emerald-400",
    },
    {
      type: "beard_growth",
      label: "Beard Growth",
      icon: Scissors,
      description: "Patchiness, density, ingrown hairs & texture issues",
      color: "from-emerald-400 to-teal-400",
    },
    {
      type: "body_acne",
      label: "Body Acne",
      icon: ShirtIcon,
      description: "Back acne, chest breakouts, folliculitis & body marks",
      color: "from-rose-400 to-red-400",
    },
    {
      type: "body_odor",
      label: "Body Odor / Sweat",
      icon: ShirtIcon,
      description: "Sweat load, odor retention, underarm stress & fabric smell buildup",
      color: "from-cyan-400 to-sky-400",
    },
    {
      type: "lip_care",
      label: "Lip Care",
      icon: Droplet,
      description: "Dryness, cracking, pigmentation & lip health analysis",
      color: "from-pink-400 to-rose-400",
    },
    {
      type: "skin_dullness",
      label: "Skin Dullness",
      icon: SunMedium,
      description: "Tan, tired tone, rough texture, pollution stress and low glow",
      color: "from-yellow-400 to-amber-400",
    },
    {
      type: "energy_fatigue",
      label: "Energy / Fatigue",
      icon: BatteryMedium,
      description: "Sleep debt, midday crashes, hydration gaps and tired-face signals",
      color: "from-lime-400 to-emerald-400",
    },
    {
      type: "fitness_recovery",
      label: "Fitness / Recovery",
      icon: Dumbbell,
      description: "Soreness, poor recovery, hydration, protein gaps and training stress",
      color: "from-orange-400 to-red-400",
    },
  ];

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-[#1E4D3A] mb-2 flex items-center gap-2">
        <span className="w-1 h-7 bg-[#0071e3] rounded-full" />
        Choose Analysis Type
      </h3>
      <p className="text-[#0071e3] text-sm mb-8 ml-4">Select the concern you want to evaluate. You will then capture guided photo angles.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              className={`relative group p-6 rounded-2xl border transition-all duration-300 text-left min-h-[190px] ${
                isSelected
                  ? "bg-white/80 backdrop-blur-md border-[#0071e3] shadow-md"
                  : "bg-white/40 backdrop-blur-md border-white/40 hover:bg-white/60 hover:border-[#0071e3]/40"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Tag Badge */}
              {option.tag && (
                <div className="absolute -top-2 -right-2 bg-[#F4EED7] text-[#6e6e73] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E0CE97]">
                  {option.tag}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-[#0071e3] rounded-full animate-pulse" />
              )}

              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-br " + option.color + " shadow-lg"
                    : "bg-white/40 group-hover:bg-white/80"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isSelected ? "text-white" : "text-[#6E9F87] group-hover:text-[#0071e3]"
                  }`}
                />
              </div>

              {/* Text Content */}
              <h4
                className={`text-sm font-bold mb-1 transition-colors leading-tight ${
                  isSelected ? "text-[#1d1d1f]" : "text-[#1d1d1f]"
                }`}
              >
                {option.label}
              </h4>
              <p className="text-xs text-[#0071e3] leading-relaxed transition-colors line-clamp-3">
                {option.description}
              </p>

              {/* Hover Glow Effect */}
              <div
                className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${option.color} ${
                  isSelected ? "opacity-10" : "opacity-0 group-hover:opacity-[0.06]"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

