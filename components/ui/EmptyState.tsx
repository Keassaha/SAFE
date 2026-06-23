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
      <div className="w-12 h-12 rounded-full bg-si-canvas border border-si-line flex items-center justify-center text-si-forest mb-4">
        {icon ?? <Inbox className="w-6 h-6" aria-hidden />}
      </div>
      <h3 className="font-serif text-[17px] leading-tight text-si-ink">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-si-muted max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
