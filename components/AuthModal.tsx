"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "@/components/auth/AuthForm";
import AuthCard from "@/components/auth/AuthCard";

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(11,42,74,0.32)] px-4 backdrop-blur-md">
      <AuthCard onClose={onClose}>
        <AuthForm onSuccess={onClose} />
      </AuthCard>
    </div>
  );
}
