import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, X } from "lucide-react";

type AuthCardProps = {
  children: ReactNode;
  onClose?: () => void;
};

/** Shared glass card chrome for both /login and the AuthModal overlay -
 * previously each hand-rolled an near-identical warm-cream card with raw
 * hex values; now one definition using Phase 7B tokens + the glass-card
 * utility. */
export default function AuthCard({ children, onClose }: AuthCardProps) {
  return (
    <div className="glass-card relative w-full max-w-[430px] overflow-hidden !rounded-[2rem] !border-[var(--border-hairline)] p-0 shadow-[0_30px_90px_rgba(11,42,74,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(0,113,227,0.16),transparent_48%),radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_45%)]" />

      <div className="relative p-7">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="af-badge-chip text-[var(--accent-blue)]">
              <ShieldCheck className="h-3 w-3" /> Secure access
            </span>
            <span className="af-badge-chip text-[var(--accent-green)]">
              <Sparkles className="h-3 w-3" /> Profile synced
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign-in dialog"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-white/70 text-[var(--ink)] transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
