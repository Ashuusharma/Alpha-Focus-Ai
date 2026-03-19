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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071318] text-white p-4 overflow-hidden"
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-green-500/10 blur-[130px] rounded-full opacity-40 mix-blend-screen" />
         <div className="absolute bottom-[20%] left-[10%] w-[600px] h-[600px] bg-blue-500/5 blur-[130px] rounded-full opacity-30 mix-blend-screen" />
         <div className="absolute inset-0 bg-[#071318]/60 backdrop-blur-[50px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-gradient-to-br from-[#0a1a1f] to-[#040b0e] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
          {/* Decorative Top Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10 relative">
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl rotate-45">
                <div className="-rotate-45">
                  <User className="w-8 h-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" strokeWidth={1.5} />
                </div>
              </div>
            </div>
            <h1 className="text-clinical-heading text-3xl font-extrabold text-white tracking-tight mb-2">
              System Access
            </h1>
            <p className="text-zinc-300 text-sm text-center max-w-[280px] leading-relaxed">
              Authenticate to initialize your tailored clinical & recovery protocol.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300 tracking-wider uppercase ml-1">Identity</label>
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 focus:bg-black/60 shadow-inner transition-all hover:border-white/20"
                />
              </div>
              {error && name.trim() === "" && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300 tracking-wider uppercase ml-1">Range</label>
                <div className="relative">
                  <select
                    value={ageRange}
                    onChange={(e) => {
                      setAgeRange(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer hover:border-white/20"
                  >
                    <option value="" className="bg-[#0a1a1f] text-zinc-300">Age</option>
                    <option value="18-24" className="bg-[#0a1a1f]">18-24</option>
                    <option value="25-34" className="bg-[#0a1a1f]">25-34</option>
                    <option value="35-44" className="bg-[#0a1a1f]">35-44</option>
                    <option value="45+" className="bg-[#0a1a1f]">45+</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300 tracking-wider uppercase ml-1">Primary Focus</label>
                <div className="relative">
                  <select
                    value={primaryConcern}
                    onChange={(e) => {
                      setPrimaryConcern(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer hover:border-white/20"
                  >
                    <option value="" className="bg-[#0a1a1f] text-zinc-300">Target</option>
                    <option value="hair_loss" className="bg-[#0a1a1f]">Hair Loss</option>
                    <option value="acne" className="bg-[#0a1a1f]">Acne</option>
                    <option value="scalp_health" className="bg-[#0a1a1f]">Scalp Health</option>
                    <option value="dark_circles" className="bg-[#0a1a1f]">Dark Circles</option>
                    <option value="beard_growth" className="bg-[#0a1a1f]">Beard Growth</option>
                    <option value="anti_aging" className="bg-[#0a1a1f]">Vitality</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group mt-2">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="peer appearance-none w-4 h-4 border border-zinc-600 rounded shadow-inner bg-black/50 checked:bg-green-500 checked:border-green-500 transition-all cursor-pointer"
                />
                <svg className="absolute w-2.5 h-2.5 pointer-events-none text-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs text-zinc-300 group-hover:text-white transition-colors leading-relaxed">
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
              className="w-full mt-4 group relative overflow-hidden rounded-xl bg-green-500 text-black font-bold py-3.5 sm:py-4 transition-all hover:bg-green-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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

          <div className="mt-8 flex items-center gap-4 text-xs text-zinc-500 justify-center border-t border-white/5 pt-6">
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">Secured Connection</span>
            <div className="w-1 h-1 rounded-full bg-green-500/50" />
            <span className="hover:text-zinc-300 cursor-pointer transition-colors">v.2.0.4 Alpha</span>
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
