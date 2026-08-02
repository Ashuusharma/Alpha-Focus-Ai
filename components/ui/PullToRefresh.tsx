"use client";

import { useRef, useState, type ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

const PULL_THRESHOLD_PX = 70;
const MAX_PULL_PX = 110;

type PullToRefreshProps = {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
};

/** Touch-only pull-to-refresh (Phase 7ZA) - only arms when the touch starts
 * at document scrollTop 0, so it never fights normal scrolling or the
 * swipeable tab gestures elsewhere on the page. Desktop/mouse users are
 * unaffected (no pointer/mouse handlers registered). */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const trackingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0]?.clientY ?? null;
    trackingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!trackingRef.current || startYRef.current === null) return;
    const currentY = e.touches[0]?.clientY ?? startYRef.current;
    const delta = currentY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    // Rubber-band resistance so it doesn't feel like a 1:1 drag.
    setPullDistance(Math.min(MAX_PULL_PX, delta * 0.5));
  };

  const handleTouchEnd = async () => {
    trackingRef.current = false;
    startYRef.current = null;

    if (pullDistance >= PULL_THRESHOLD_PX) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD_PX);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const indicatorProgress = Math.min(1, pullDistance / PULL_THRESHOLD_PX);

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => void handleTouchEnd()}>
      <div
        aria-hidden="true"
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: refreshing ? PULL_THRESHOLD_PX : pullDistance }}
      >
        <RefreshCcw
          className={`h-5 w-5 text-[var(--accent-blue)] ${refreshing ? "animate-spin" : ""}`}
          style={{
            opacity: refreshing ? 1 : indicatorProgress,
            transform: refreshing ? undefined : `rotate(${indicatorProgress * 220}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
