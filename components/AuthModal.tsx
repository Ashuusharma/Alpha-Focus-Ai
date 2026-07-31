"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "@/components/auth/AuthForm";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    checkSession();
  }, [isOpen]);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(12,20,14,0.38)] px-4 backdrop-blur-md">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#dbcdb9] bg-[linear-gradient(180deg,#fffdf8_0%,#efe5d8_100%)] shadow-[0_30px_90px_rgba(46,35,20,0.28)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(169,203,183,0.45),transparent_48%),radial-gradient(circle_at_top_left,rgba(216,181,95,0.22),transparent_45%)]" />
        <div className="relative p-7 text-[#1d1d1f]">
          <div className="af-badge-row mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="af-badge-chip text-[#0071e3]">Secure access</span>
              <span className="af-badge-chip text-[#A46A2D]">Profile synced</span>
            </div>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-full border border-[#ddcfbc] bg-white/70 text-[#1d1d1f] hover:bg-white">x</button>
          </div>

          <AuthForm onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}
