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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] px-4">
      <div className="bg-white w-full max-w-[420px] p-6 rounded-2xl shadow-2xl border border-[#E2DDD3]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[#1F3D2B]">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h2>
          <button type="button" onClick={onClose} className="text-[#6B665D] hover:text-[#1F3D2B]">×</button>
        </div>

        {mode === "signup" && (
          <input
            placeholder="Full Name"
            className="w-full border border-[#E2DDD3] p-2.5 mb-3 rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          className="w-full border border-[#E2DDD3] p-2.5 mb-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-[#E2DDD3] p-2.5 mb-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-xs text-[#2F6F57] hover:underline mb-4"
        >
          Forgot password?
        </button>

        <button
          onClick={handleAuth}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg"
          disabled={loading}
        >
          {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>

        <p className="text-sm mt-4 text-center text-[#4A453E]">
          {mode === "signin" ? "New user?" : "Already have account?"}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-green-600 ml-2"
            type="button"
          >
            {mode === "signin" ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}