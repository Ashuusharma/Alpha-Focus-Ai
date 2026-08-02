"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const ENGAGEMENT_DELAY_MS = 8000;

/** Shared beforeinstallprompt capture + engagement-gated timing, extracted
 * from app/sections/LandingPage.tsx (Phase 7ZA) so the same install offer
 * can be shown from a global banner instead of only a button buried in the
 * landing page's final CTA section. Trigger conditions unchanged: still
 * requires the browser's own install eligibility signal, a real user
 * interaction (pointer/keyboard/scroll), and an 8s engagement delay before
 * offering - not shown to a user who just landed and hasn't done anything. */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const markEngaged = () => setEngaged(true);
    window.addEventListener("pointerdown", markEngaged, { once: true });
    window.addEventListener("keydown", markEngaged, { once: true });
    window.addEventListener("scroll", markEngaged, { once: true });

    return () => {
      window.removeEventListener("pointerdown", markEngaged);
      window.removeEventListener("keydown", markEngaged);
      window.removeEventListener("scroll", markEngaged);
    };
  }, []);

  useEffect(() => {
    if (!deferredPrompt || !engaged) {
      setEligible(false);
      return;
    }

    const timer = window.setTimeout(() => setEligible(true), ENGAGEMENT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [deferredPrompt, engaged]);

  useEffect(() => {
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setEligible(false);
    };

    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setEligible(false);
    }
  };

  return { eligible, promptInstall };
}
