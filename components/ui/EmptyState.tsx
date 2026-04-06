"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { fadeIn } from "@/lib/motion";
import { useSafeMotion } from "@/lib/motion";
import { fadeInUpReduced } from "@/lib/motion";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  const { reduceMotion } = useSafeMotion();
  const variants = reduceMotion ? fadeInUpReduced : fadeIn;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-12 h-12 rounded-full bg-white border border-[var(--safe-neutral-border)] flex items-center justify-center text-[var(--safe-icon-default)] mb-4">
        {icon ?? <Inbox className="w-6 h-6" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold safe-text-title tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm safe-text-secondary max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
