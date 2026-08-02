"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useIsStandalone } from "@/app/hooks/useIsStandalone";

type RouteTransitionProps = {
  children: ReactNode;
};

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const isStandalone = useIsStandalone();
  const prefersReducedMotion = useReducedMotion();

  // Installed-PWA mode gets a lighter, GPU-cheaper crossfade - the blur
  // filter reads as premium in a full browser tab but composites poorly on
  // the WebViews some installed Android PWAs run in, showing as a stutter
  // rather than a polish. Regular browser tabs keep the richer transition.
  const variants = prefersReducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : isStandalone
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }
      : {
          initial: { opacity: 0, x: 15, filter: "blur(2px)" },
          animate: { opacity: 1, x: 0, filter: "blur(0px)" },
          exit: { opacity: 0, x: -15, filter: "blur(2px)" },
        };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: isStandalone ? 0.22 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
