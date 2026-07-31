"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthFormProps = {
  onSuccess: () => void;
  /** Shown in the header area; callers style their own wrapper/chrome. */
  title?: { signin: string; signup: string };
};

export default function AuthForm({ onSuccess, title }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

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
    }

    setLoading(false);
    onSuccess();
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === "signin" ? title?.signin ?? "Welcome Back" : title?.signup ?? "Create Account"}
        </h2>
        <p className="mt-1 text-sm text-[#6e6e73]">
          Sign in to continue your recovery dashboard, routines, rewards, and scan history.
        </p>
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
  );
}
