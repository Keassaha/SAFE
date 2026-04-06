"use client";

import { motion } from "framer-motion";
import { useSafeMotion } from "@/lib/motion";

export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const { reduceMotion } = useSafeMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-full w-full"
    >
      {children}
    </motion.div>
  );
}
