"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface Action {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface QuickActionsProps {
  actions: Action[];
  className?: string;
}

const MotionLink = motion(Link);

/**
 * Primary-style quick action buttons: white background, green icon, subtle shadow.
 * Hover: icon rotates slightly, arrow slides in from left.
 */
export function QuickActions({ actions, className = "" }: QuickActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {actions.map(({ href, label, icon: Icon }) => (
        <MotionLink
          key={href}
          href={href}
          className="group/btn relative flex flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-safe bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden"
          initial="initial"
          whileHover="hover"
        >
          <motion.span
            className="absolute left-2 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none"
            variants={{
              initial: { x: -8, opacity: 0 },
              hover: { x: 0, opacity: 1 },
            }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </motion.span>
          <motion.div
            className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 group-hover/btn:bg-primary-100 transition-colors"
            variants={{
              initial: { rotate: 0 },
              hover: { rotate: 8 },
            }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <Icon className="w-5 h-5" aria-hidden />
          </motion.div>
          <span className="text-xs font-medium text-neutral-text-primary">{label}</span>
        </MotionLink>
      ))}
    </div>
  );
}
