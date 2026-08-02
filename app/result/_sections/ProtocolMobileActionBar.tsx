"use client";

import { ShoppingBag } from "lucide-react";

/** Mobile-only sticky action bar (Phase 7ZA). Desktop has the sticky TOC for
 * quick navigation; mobile has neither a TOC nor a persistent way back to
 * the highest-conversion section, so this pins one primary action instead.
 * Sits above BottomNav, not on top of it - offset by the nav's own height
 * plus safe-area so the two never overlap. */
export default function ProtocolMobileActionBar() {
  return (
    <div
      className="af-safe-bottom fixed inset-x-0 z-30 border-t border-[var(--border-hairline)] bg-white/95 px-4 pt-3 backdrop-blur-lg md:hidden"
      style={{ bottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))" }}
    >
      <a
        href="#products"
        className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] text-sm font-semibold text-white active:scale-[0.98] transition-transform"
      >
        <ShoppingBag className="h-4 w-4" />
        Shop My Protocol
      </a>
    </div>
  );
}
