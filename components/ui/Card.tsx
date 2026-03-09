"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-glass safe-hover-lift overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/** Card wrapped in motion.div for use inside stagger containers (e.g. dashboard, summary grids) */
export function MotionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={`card-glass safe-hover-lift overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  action,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-b border-[var(--safe-neutral-border)]/60 flex justify-between items-center ${className}`}>
      <h2 className="text-base font-semibold safe-text-title tracking-tight">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 text-[var(--safe-text-title)] ${className}`}>{children}</div>;
}
