"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * LazyMotion provider — loads only the DOM animation features (~15KB vs ~60KB full).
 * Wrap the app once; all child `m.div` / `motion.div` components benefit.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
