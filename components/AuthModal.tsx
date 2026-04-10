"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!error && data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
        });
      }

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      alert("Signup success!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      alert("Login success!");
    }

    setLoading(false);
    onClose();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    });

    alert(error ? error.message : "Password reset email sent.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(12,20,14,0.38)] px-4 backdrop-blur-md">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#dbcdb9] bg-[linear-gradient(180deg,#fffdf8_0%,#efe5d8_100%)] shadow-[0_30px_90px_rgba(46,35,20,0.28)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(169,203,183,0.45),transparent_48%),radial-gradient(circle_at_top_left,rgba(216,181,95,0.22),transparent_45%)]" />
        <div className="relative p-7 text-[#1d1d1f]">
          <div className="af-badge-row mb-4">
            <span className="af-badge-chip text-[#0071e3]">Secure access</span>
            <span className="af-badge-chip text-[#A46A2D]">Profile synced</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="mt-1 text-sm text-[#6e6e73]">
                Sign in to continue your recovery dashboard, routines, rewards, and scan history.
              </p>
            </div>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-full border border-[#ddcfbc] bg-white/70 text-[#1d1d1f] hover:bg-white">x</button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-[1.25rem] border border-[#e2d8ca] bg-white/70 p-1.5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${mode === "signin" ? "bg-[#1d1d1f] text-white shadow-[0_12px_22px_rgba(31,61,43,0.16)]" : "text-[#6e6e73]"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${mode === "signup" ? "bg-[#1d1d1f] text-white shadow-[0_12px_22px_rgba(31,61,43,0.16)]" : "text-[#6e6e73]"}`}
            >
              Create account
            </button>
          </div>

          <div className="rounded-[1.6rem] border border-[#e2d8ca] bg-[rgba(255,251,245,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] space-y-3">
            {mode === "signup" && (
              <input
                placeholder="Full Name"
                className="af-input w-full rounded-xl px-4 py-2.5 outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <input
              placeholder="example@mail.com"
              className="af-input w-full rounded-xl px-4 py-2.5 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            <input
              type="password"
              placeholder="Password"
              className="af-input w-full rounded-xl px-4 py-2.5 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-[#0071e3] hover:underline"
            >
              Forgot password?
            </button>

            <button
              onClick={handleAuth}
              className="w-full rounded-xl bg-[#0071e3] py-2.5 font-bold text-white transition hover:bg-[#005bbf] shadow-[0_16px_28px_rgba(47,111,87,0.2)]"
              disabled={loading}
            >
              {loading ? "Processing..." : mode === "signin" ? "Continue to dashboard" : "Create my account"}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-[#6e6e73]">
            {mode === "signin" ? "New user?" : "Already have account?"}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="ml-2 font-semibold text-[#0071e3]"
              type="button"
            >
              {mode === "signin" ? "Create Account" : "Sign In"}
            </button>
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-[#6e6e73]">
            <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Secure auth</div>
            <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Saved routines</div>
            <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Rewards linked</div>
          </div>
        </div>
      </div>
    </div>
  );
}

