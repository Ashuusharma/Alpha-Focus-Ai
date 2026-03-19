"use client";

import { motion } from "framer-motion";

type AlphaCoinProps = {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

export function AlphaCoin({ size = "md", className = "" }: AlphaCoinProps) {
  const sizeClasses = {
    sm: "w-5 h-5 text-[9px]",
    md: "w-7 h-7 text-[12px]",
    lg: "w-10 h-10 text-sm",
    hero: "w-16 h-16 text-xl",
  };

  return (
    <motion.div
      initial={{ rotateY: -180, scale: 0.8 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-full flex items-center justify-center font-black ${sizeClasses[size]} ${className}`}
      style={{
        background: "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)",
        boxShadow: "0 0 15px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(218,165,32,0.8)",
        border: "1px solid rgba(255,215,0,0.8)",
        color: "#B8860B",
        textShadow: "0 1px 1px rgba(255,255,255,0.5)",
      }}
    >
      <span className="drop-shadow-sm pointer-events-none">A$</span>
      
      {/* Soft Glow */}
      <div className="absolute inset-0 rounded-full animate-pulse blur-[4px] bg-[#FFD700] opacity-30 pointer-events-none" />
    </motion.div>
  );
}
