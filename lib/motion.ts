"use client";

import { useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

/** Use in components to respect prefers-reduced-motion */
export function useSafeMotion() {
  const reduceMotion = useReducedMotion();
  return { reduceMotion: !!reduceMotion };
}

/** Easing: professional, soft (no bounce) */
export const easeOut = [0.4, 0, 0.2, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

/** Durations (seconds) */
export const duration = {
  micro: 0.2,
  fast: 0.25,
  normal: 0.35,
  section: 0.45,
  page: 0.55,
} as const;

/** Fade in (opacity only) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Fade in + slight rise */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

/** Stagger container: children delay 50–80ms */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

/** Page enter: for route transitions */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.page, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: duration.fast, ease: easeOut },
  },
};

/** Modal: overlay + panel */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: duration.micro, ease: easeOut },
  },
};

/** Transition configs */
export const tMicro = { duration: duration.micro, ease: easeOut };
export const tFast = { duration: duration.fast, ease: easeOut };
export const tSection = { duration: duration.section, ease: easeOut };

/** When reduced motion: no movement, instant or very short opacity only */
export const fadeInUpReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const staggerContainerReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0 },
  },
  exit: { opacity: 0 },
};

export const staggerItemReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageEnterReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
