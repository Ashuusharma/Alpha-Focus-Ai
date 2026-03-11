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
    <div className="fixed inset-0 bg-[#08130f]/70 backdrop-blur-sm flex items-center justify-center z-[70] px-4">
      <div className="relative w-full max-w-[430px] rounded-3xl overflow-hidden border border-[#A9CBB7]/35 shadow-[0_20px_80px_rgba(12,45,34,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(92,173,120,0.45),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(52,120,84,0.55),transparent_48%),linear-gradient(160deg,#0c2b23,#133f32_42%,#0f352b)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.16),rgba(255,255,255,0.06))]" />
        <div className="relative p-7 text-[#E9F5EF]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-[#B9D8C7] mt-1">
                Transform your appearance. Build confidence. Become Alpha Focus.
              </p>
            </div>
            <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white">×</button>
          </div>

          <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-xl p-4 space-y-3">
            {mode === "signup" && (
              <input
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/35 bg-[#0f3a2f]/70 px-4 py-2.5 text-white placeholder:text-[#AFCFBF] outline-none focus:border-[#79D95B]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <input
              placeholder="example@mail.com"
              className="w-full rounded-xl border border-white/35 bg-[#0f3a2f]/70 px-4 py-2.5 text-white placeholder:text-[#AFCFBF] outline-none focus:border-[#79D95B]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-white/35 bg-[#0f3a2f]/70 px-4 py-2.5 text-white placeholder:text-[#AFCFBF] outline-none focus:border-[#79D95B]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[#C8EFD8] hover:underline"
            >
              Forgot password?
            </button>

            <button
              onClick={handleAuth}
              className="w-full rounded-xl bg-[#5FCF45] text-[#123425] py-2.5 font-bold hover:bg-[#79D95B] transition"
              disabled={loading}
            >
              {loading ? "Processing..." : mode === "signin" ? "SIGN IN" : "SIGN UP"}
            </button>
          </div>

          <p className="text-sm mt-4 text-center text-[#C8EFD8]">
            {mode === "signin" ? "New user?" : "Already have account?"}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-[#79D95B] ml-2 font-semibold"
              type="button"
            >
              {mode === "signin" ? "Create Account" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}