"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ArrowRight, Gift } from "lucide-react";

import { getRewardCountdownLabel } from "@/lib/rewardUnlockService";

import { AlphaCoin } from "./AlphaCoin";

export type RewardUnlockModalData = {
  discountPercent: number;
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
  expiresAt?: string | null;
  productName?: string | null;
};

type RewardUnlockModalProps = {
  data: RewardUnlockModalData | null;
  onClose: () => void;
  onPrimaryClick?: () => void;
};

export function RewardUnlockModal({ data, onClose, onPrimaryClick }: RewardUnlockModalProps) {
  const particles = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    angle: (i * 360) / 16,
    distance: 80 + Math.random() * 60,
    delay: Math.random() * 0.2,
    scale: 0.5 + Math.random() * 0.8,
  }));

  return (
    <AnimatePresence>
      {data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F1F15]/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-10 text-center shadow-[0_30px_100px_rgba(255,215,0,0.15)] ring-1 ring-white/20"
          >
            {/* Celebration burst effect */}
            <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-40 w-40 rounded-full border-4 border-[#FFD700] mix-blend-overlay"
              />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1.8, 1] }}
              transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
              className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-[#FFD700] opacity-50 blur-3xl animate-pulse" />
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: p.scale }}
                  animate={{ 
                    x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                    y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                    opacity: 0 
                  }}
                  transition={{ duration: 1, delay: p.delay, ease: "easeOut" }}
                  className="absolute h-3 w-3 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]"
                />
              ))}
              <div className="z-10 scale-[1.3] relative">
                <AlphaCoin size="hero" />
              </div>
            </motion.div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFECA1] bg-[#FFF5D8] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#A96C00] shadow-[0_0_20px_rgba(255,215,0,0.2)]">
              <Sparkles className="h-4 w-4 text-[#FFD700]" />
              <span>You just unlocked {data.discountPercent}% OFF</span>
            </div>

            <h2 className="mb-2 text-3xl font-black text-[#111]">Reward claimed</h2>
            <p className="mb-5 text-[#666] text-sm px-4">
              {data.body}
              {data.expiresAt && (
                <span className="mt-2 block font-semibold text-[#A96C00]">
                  Expires in {getRewardCountdownLabel(data.expiresAt)}
                </span>
              )}
            </p>

            {data.productName && (
              <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-[#E2DDD3] bg-gradient-to-br from-[#F8F6F3] to-white p-4 text-left shadow-sm">
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#2F6F57]">
                    <Gift className="h-3.5 w-3.5" /> Featured Reward
                  </p>
                  <p className="mt-1.5 text-sm font-bold leading-tight text-[#1F3D2B]">{data.productName}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#6B665D]">Apply your {data.discountPercent}% directly</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                   <div className="h-8 w-8 opacity-40"><AlphaCoin size="sm" /></div>
                </div>
              </div>
            )}

            <Link href={data.href} className="block w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1A3626] to-[#2F6F57] py-4 text-lg font-bold text-white shadow-[0_8px_30px_rgba(47,111,87,0.3)] transition-all"
                onClick={() => {
                  onPrimaryClick?.();
                  onClose();
                }}
              >
                Use Now <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}