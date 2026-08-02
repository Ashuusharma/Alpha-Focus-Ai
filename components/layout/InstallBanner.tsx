"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Sparkles, X } from "lucide-react";
import { useInstallPrompt } from "@/app/hooks/useInstallPrompt";
import { useIsStandalone } from "@/app/hooks/useIsStandalone";

const DISMISS_KEY = "af-install-banner-dismissed-at";
const DISMISS_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // don't re-nag for a week after "Not now"

/** Global install banner (Phase 7ZA) - previously the only install affordance
 * was a plain button buried in the landing page's final CTA section, shown
 * to whoever happened to scroll that far. This surfaces the same browser
 * install eligibility (unchanged trigger conditions, see useInstallPrompt)
 * as a real dismissible banner on any page, with the dismissal remembered
 * so it doesn't nag every visit. */
export default function InstallBanner() {
  const { eligible, promptInstall } = useInstallPrompt();
  const isStandalone = useIsStandalone();
  const prefersReducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const lastDismissed = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    setDismissed(Date.now() - lastDismissed < DISMISS_SNOOZE_MS);
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const visible = eligible && !dismissed && !isStandalone;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="af-safe-bottom fixed inset-x-3 z-30 sm:inset-x-auto sm:right-4 sm:w-[380px]"
          style={{ bottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
          role="dialog"
          aria-label="Install Alpha Focus"
        >
          <div className="glass-card flex items-start gap-3 !rounded-2xl p-4 shadow-[0_20px_50px_rgba(11,42,74,0.25)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ink)] text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--ink)]">Install Alpha Focus</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-soft)]">
                Add it to your home screen for faster access, offline scan history, and push reminders.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--accent-blue)] px-3.5 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="af-tap-target -m-2 flex shrink-0 items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
