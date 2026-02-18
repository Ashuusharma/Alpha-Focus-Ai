"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, X, Instagram, Twitter, Copy, Check, Sparkles } from "lucide-react";

interface ShareResultsCardProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  issuesCount: number;
  topIssue?: string;
  userName?: string;
}

export default function ShareResultsCard({
  isOpen,
  onClose,
  score,
  issuesCount,
  topIssue = "General Care",
  userName = "User",
}: ShareResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      // Dynamic import html2canvas (needs: npm install html2canvas)
      // @ts-ignore - html2canvas is an optional dependency
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0B0F19",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `oneman-skin-score-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("To enable image download, install: npm install html2canvas");
    }

    setDownloading(false);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/result?share=true`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `💪 Just got my grooming analysis from Oneman AI! My skin score is ${score}/100. Check yours too!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const getScoreColor = () => {
    if (score >= 80) return "from-emerald-400 to-green-500";
    if (score >= 60) return "from-yellow-400 to-amber-500";
    if (score >= 40) return "from-orange-400 to-red-500";
    return "from-red-400 to-rose-500";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Shareable Card */}
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E293B] rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black text-white">ONEMAN</span>
              </div>

              {/* Score Circle */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 552.92} 552.92`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
                    {score}
                  </span>
                  <span className="text-gray-400 text-sm">/100</span>
                  <span className={`mt-1 text-sm font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
                    {getScoreLabel()}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                  <p className="text-2xl font-bold text-white">{issuesCount}</p>
                  <p className="text-xs text-gray-500 uppercase">Issues Found</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                  <p className="text-sm font-bold text-cyan-400 truncate">{topIssue}</p>
                  <p className="text-xs text-gray-500 uppercase">Top Focus</p>
                </div>
              </div>

              {/* User Name & Date */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Analyzed for <span className="text-white font-medium">{userName}</span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {new Date().toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric" 
                  })}
                </p>
              </div>

              {/* Watermark */}
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-gray-600">
                  Get your free analysis at <span className="text-cyan-500">oneman.ai</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold hover:bg-cyan-400 transition disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {downloading ? "Generating..." : "Download Image"}
              </button>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    // Instagram sharing typically requires native app
                    alert("Save the image and share to Instagram!");
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  <Instagram className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
