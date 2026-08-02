"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/ui/Button";

type AuthFormProps = {
  onSuccess: () => void;
  /** Shown in the header area; callers style their own wrapper/chrome. */
  title?: { signin: string; signup: string };
};

type StatusMessage = { kind: "error" | "success"; text: string } | null;

export default function AuthForm({ onSuccess, title }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const handleAuth = async () => {
    setStatus(null);

    if (!email || !password) {
      setStatus({ kind: "error", text: "Please enter email and password." });
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setStatus({ kind: "error", text: "Please enter your full name." });
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
        setStatus({ kind: "error", text: error.message });
        setLoading(false);
        return;
      }

      setStatus({ kind: "success", text: "Account created. Signing you in..." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus({ kind: "error", text: error.message });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSuccess();
  };

  const handleForgotPassword = async () => {
    setStatus(null);

    if (!email) {
      setStatus({ kind: "error", text: "Enter your email first, then tap Forgot password again." });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    });

    setStatus(
      error
        ? { kind: "error", text: error.message }
        : { kind: "success", text: "Password reset email sent - check your inbox." }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          {mode === "signin" ? title?.signin ?? "Welcome Back" : title?.signup ?? "Create Account"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Sign in to continue your recovery dashboard, routines, rewards, and scan history.
        </p>
      </div>

      <div className="relative mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--border-hairline)] bg-white/70 p-1.5">
        {(["signin", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setMode(tab); setStatus(null); }}
            className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-colors ${mode === tab ? "text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}
          >
            {mode === tab && (
              <motion.span
                layoutId="auth-tab-pill"
                className="absolute inset-0 rounded-xl bg-[var(--ink)] shadow-[0_12px_22px_rgba(11,42,74,0.18)]"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            <span className="relative z-10">{tab === "signin" ? "Sign in" : "Create account"}</span>
          </button>
        ))}
      </div>

      <div className="glass-card space-y-3 !rounded-[1.6rem] p-4">
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
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          className="af-input w-full rounded-xl px-4 py-2.5 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {status && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
              status.kind === "error"
                ? "bg-[var(--warning-bg)] text-[var(--warning-text)]"
                : "bg-[var(--accent-green)]/12 text-[var(--ink)]"
            }`}
          >
            {status.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-green)]" />
            )}
            {status.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-xs font-semibold text-[var(--accent-blue)] hover:underline"
        >
          Forgot password?
        </button>

        <Button onClick={handleAuth} variant="primary" size="md" disabled={loading} className="w-full justify-center">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Processing..." : mode === "signin" ? "Continue to dashboard" : "Create my account"}
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
        {mode === "signin" ? "New user?" : "Already have account?"}
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setStatus(null); }}
          className="ml-2 font-semibold text-[var(--accent-blue)]"
          type="button"
        >
          {mode === "signin" ? "Create Account" : "Sign In"}
        </button>
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-[var(--ink-soft)]">
        <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Secure auth</div>
        <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Saved routines</div>
        <div className="rounded-xl bg-white/70 px-3 py-2 text-center font-semibold">Rewards linked</div>
      </div>
    </div>
  );
}
