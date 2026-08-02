"use client";

import { useEffect, useState } from "react";

/** True when running installed as a PWA (standalone/fullscreen/minimal-ui
 * display mode) rather than in a regular browser tab. Used to suppress
 * install prompts (nothing to install if you're already running installed)
 * and to tune transitions for the chrome-less installed context. */
export function useIsStandalone() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
    setStandalone(query.matches || (window.navigator as { standalone?: boolean }).standalone === true);

    const handleChange = (e: MediaQueryListEvent) => setStandalone(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return standalone;
}
