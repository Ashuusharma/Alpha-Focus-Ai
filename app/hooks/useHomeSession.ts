"use client";

import { useEffect, useState } from "react";
import { clearUserSession, readUserSession } from "@/lib/session/userSession";

type UseHomeSessionResult = {
  userName: string | null;
  lastLoginAt: string | null;
  loadingAuth: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (open: boolean) => void;
  handleLoginSuccess: (name: string) => void;
  handleLogout: () => Promise<void>;
};

export function useHomeSession(): UseHomeSessionResult {
  const [userName, setUserName] = useState<string | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const userSession = readUserSession();
    if (userSession) {
      setUserName(userSession.name);
      setLastLoginAt(userSession.lastLoginAt);
    }
    setLoadingAuth(false);
  }, []);

  const handleLoginSuccess = (name: string) => {
    setUserName(name);
    setLastLoginAt(new Date().toISOString());
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network logout errors and clear local state anyway
    }
    setUserName(null);
    clearUserSession();
  };

  return {
    userName,
    lastLoginAt,
    loadingAuth,
    showLoginModal,
    setShowLoginModal,
    handleLoginSuccess,
    handleLogout,
  };
}
