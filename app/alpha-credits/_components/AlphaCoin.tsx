"use client";

import { motion } from "framer-motion";

type AlphaCoinProps = {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  animateEarn?: boolean;
};

export function AlphaCoin({ size = "md", className = "", animateEarn = false }: AlphaCoinProps) {
  const sizeClasses = {
    sm: "w-5 h-5 text-[9px]",
    md: "w-8 h-8 text-[12px]",
    lg: "w-12 h-12 text-sm",
    hero: "w-20 h-20 text-3xl",
  };

  return (
    <motion.div
      initial={animateEarn ? { y: 20, scale: 0.5, opacity: 0 } : false}
      animate={animateEarn ? { y: 0, scale: [1.2, 1], opacity: 1 } : false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-full flex items-center justify-center font-black ${sizeClasses[size]} ${className}`}
      style={{
        background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #F59E0B 100%)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15), inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(218,165,32,0.9)",
        border: "1px solid rgba(255, 235, 130, 0.8)",
        color: "#995C00",
        textShadow: "0 1px 1px rgba(255,255,255,0.6)",
      }}
    >
      <span className="drop-shadow-sm pointer-events-none">A$</span>
      
      {/* 3D Depth Inner Ring */}
      <div className="absolute inset-1 rounded-full border border-[rgba(255,255,255,0.3)] pointer-events-none" />

      {/* Pulse Glow */}
      <motion.div
        animate={{
          opacity: [0.1, 0.4, 0.1],
          boxShadow: [
             "0 0 0px rgba(255, 215, 0, 0)",
             "0 0 20px rgba(255, 215, 0, 0.6)",
             "0 0 0px rgba(255, 215, 0, 0)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full pointer-events-none"
      />
    </motion.div>
  );
}
