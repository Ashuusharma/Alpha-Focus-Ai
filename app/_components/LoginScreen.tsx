"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { writeUserSession } from "@/lib/session/userSession";

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [primaryConcern, setPrimaryConcern] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!consent) {
      setError("Please provide consent to continue");
      return;
    }
    if (!ageRange || !primaryConcern) {
      setError("Please select your age range and primary concern");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, consent, ageRange, primaryConcern }),
      });

      if (!response.ok) {
        setError("Unable to login. Please try again.");
        return;
      }

      writeUserSession(name, consent, { ageRange, primaryConcern });
      onLogin(name);
    } catch {
      setError("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[linear-gradient(180deg,#f8f4eb_0%,#ede3d4_100%)] text-[#1F3D2B] p-4 overflow-hidden"
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#A9CBB7]/25 blur-[130px] rounded-full opacity-50" />
        <div className="absolute bottom-[20%] left-[10%] w-[600px] h-[600px] bg-[#d8b55f]/14 blur-[130px] rounded-full opacity-30" />
        <div className="absolute inset-0 bg-[rgba(248,244,235,0.62)] backdrop-blur-[50px]" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-[linear-gradient(180deg,#fffdf8_0%,#efe6d8_100%)] border border-[#e2d8ca] rounded-3xl p-8 sm:p-10 shadow-[0_30px_80px_rgba(120,97,67,0.18),inset_0_1px_1px_rgba(255,255,255,0.6)] overflow-hidden">
          {/* Decorative Top Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10 relative">
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-[#A9CBB7] rounded-full blur-[20px] opacity-25 group-hover:opacity-40 transition-opacity duration-700" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-white to-[#efe6d8] border border-[#e2d8ca] flex items-center justify-center backdrop-blur-xl rotate-45 shadow-[0_18px_36px_rgba(120,97,67,0.12)]">
                <div className="-rotate-45">
                  <User className="w-8 h-8 text-[#2F6F57] drop-shadow-[0_8px_18px_rgba(47,111,87,0.16)]" strokeWidth={1.5} />
                </div>
              </div>
            </div>
            <h1 className="text-clinical-heading text-3xl font-extrabold text-[#1F3D2B] tracking-tight mb-2">
              System Access
            </h1>
            <p className="text-[#6B665D] text-sm text-center max-w-[280px] leading-relaxed">
              Authenticate to initialize your tailored clinical & recovery protocol.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#6B665D] tracking-wider uppercase ml-1">Identity</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter full name"
                  disabled={loading}
                  className="af-input w-full rounded-xl px-4 py-3.5 focus:outline-none transition-all"
                />
              </div>
              {error && name.trim() === "" && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#6B665D] tracking-wider uppercase ml-1">Range</label>
                <div className="relative">
                  <select
                    value={ageRange}
                    onChange={(e) => {
                      setAgeRange(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="af-input w-full rounded-xl px-4 py-3.5 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#fffaf3] text-[#6B665D]">Age</option>
                    <option value="18-24" className="bg-[#fffaf3]">18-24</option>
                    <option value="25-34" className="bg-[#fffaf3]">25-34</option>
                    <option value="35-44" className="bg-[#fffaf3]">35-44</option>
                    <option value="45+" className="bg-[#fffaf3]">45+</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#6B665D] tracking-wider uppercase ml-1">Primary Focus</label>
                <div className="relative">
                  <select
                    value={primaryConcern}
                    onChange={(e) => {
                      setPrimaryConcern(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="af-input w-full rounded-xl px-4 py-3.5 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#fffaf3] text-[#6B665D]">Target</option>
                    <option value="hair_loss" className="bg-[#fffaf3]">Hair Loss</option>
                    <option value="acne" className="bg-[#fffaf3]">Acne</option>
                    <option value="scalp_health" className="bg-[#fffaf3]">Scalp Health</option>
                    <option value="dark_circles" className="bg-[#fffaf3]">Dark Circles</option>
                    <option value="beard_growth" className="bg-[#fffaf3]">Beard Growth</option>
                    <option value="anti_aging" className="bg-[#fffaf3]">Vitality</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#e2d8ca] bg-[rgba(255,252,246,0.72)] hover:bg-white transition-colors cursor-pointer group mt-2">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="peer appearance-none w-4 h-4 border border-[#bba892] rounded shadow-inner bg-[#f4ede0] checked:bg-[#2F6F57] checked:border-[#2F6F57] transition-all cursor-pointer"
                />
                <svg className="absolute w-2.5 h-2.5 pointer-events-none text-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs text-[#6B665D] group-hover:text-[#1F3D2B] transition-colors leading-relaxed">
                I authorize continuous data telemetry and biometric tracking for absolute protocol personalization.
              </span>
            </label>
            
            {error && name.trim() !== "" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 group relative overflow-hidden rounded-xl bg-[#2F6F57] text-white font-bold py-3.5 sm:py-4 transition-all hover:bg-[#275c48] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_16px_30px_rgba(47,111,87,0.24)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Establishing Link...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Interface</span>
                    <Sparkles className="w-4 h-4 opacity-70" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 text-xs text-[#8C6A5A] justify-center border-t border-[#e2d8ca] pt-6">
            <span className="hover:text-[#1F3D2B] cursor-pointer transition-colors">Secured Connection</span>
            <div className="w-1 h-1 rounded-full bg-[#2F6F57]/50" />
            <span className="hover:text-[#1F3D2B] cursor-pointer transition-colors">v.2.0.4 Alpha</span>
          </div>
        </div>
      </motion.div>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(150%) skewX(-30deg); }
        }
      `}</style>
    </motion.div>
  );
}
