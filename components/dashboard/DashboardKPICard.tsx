"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const ACCENT_STYLES: Record<string, { border: string; iconBg: string; iconColor: string; glow: string }> = {
  emerald: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    glow: "0 12px 40px rgba(16, 185, 129, 0.22)",
  },
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    glow: "0 12px 40px rgba(59, 130, 246, 0.22)",
  },
  amber: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    glow: "0 12px 40px rgba(245, 158, 11, 0.22)",
  },
  violet: {
    border: "border-l-violet-500",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    glow: "0 12px 40px rgba(139, 92, 246, 0.22)",
  },
  teal: {
    border: "border-l-teal-500",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
    glow: "0 12px 40px rgba(20, 184, 166, 0.22)",
  },
  orange: {
    border: "border-l-orange-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    glow: "0 12px 40px rgba(249, 115, 22, 0.22)",
  },
};

export interface DashboardKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  accent?: keyof typeof ACCENT_STYLES;
  className?: string;
}

export function DashboardKPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  accent = "emerald",
  className = "",
}: DashboardKPICardProps) {
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;
  const trendNeutral = trend != null && trend === 0;
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.emerald;

  return (
    <motion.div
      className={`card-glass overflow-hidden p-5 md:p-6 border-l-4 ${styles.border} ${className}`}
      whileHover={{
        y: -4,
        boxShadow: styles.glow,
        transition: { type: "tween", duration: 0.2 },
      }}
      transition={{ type: "tween", duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-semibold safe-text-title">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs safe-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.iconColor}`}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-xl md:text-2xl font-bold safe-text-metric tracking-tight">
        {value}
      </p>
      {(trend != null || trendLabel) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {trend != null && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                trendUp
                  ? "text-emerald-600"
                  : trendDown
                    ? "text-red-600"
                    : "text-[var(--safe-text-secondary)]"
              }`}
            >
              {trendUp && <TrendingUp className="w-3.5 h-3.5" aria-hidden />}
              {trendDown && <TrendingDown className="w-3.5 h-3.5" aria-hidden />}
              {trendNeutral && <Minus className="w-3.5 h-3.5" aria-hidden />}
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
          {trendLabel && (
            <span className="text-xs safe-text-secondary">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
