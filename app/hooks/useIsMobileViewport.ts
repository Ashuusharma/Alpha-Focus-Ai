"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 639px)";

/** Matches Tailwind's `sm` breakpoint (640px) - used where a component must
 * mount only one of two variants (not just CSS-hide one), e.g. so two
 * role="dialog" landmarks never coexist in the DOM at once. */
export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
