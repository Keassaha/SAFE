"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const ACCENT_STYLES: Record<string, { iconBg: string; iconColor: string; trendBg: string; trendText: string; border: string }> = {
  emerald: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    trendBg: "bg-emerald-50",
    trendText: "text-emerald-700",
    border: "border-l-emerald-500",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    trendBg: "bg-blue-50",
    trendText: "text-blue-700",
    border: "border-l-blue-500",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    trendBg: "bg-amber-50",
    trendText: "text-amber-700",
    border: "border-l-amber-500",
  },
  red: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    trendBg: "bg-red-50",
    trendText: "text-red-700",
    border: "border-l-red-400",
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
  isHero?: boolean;
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
  isHero = false,
}: DashboardKPICardProps) {
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;
  const trendNeutral = trend != null && trend === 0;
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.emerald;

  const heroCard = isHero
    ? "bg-[#1a3c2d] text-white"
    : "bg-white border border-[#d0ddd6]";

  return (
    <motion.div
      className={`overflow-hidden p-5 md:p-6 rounded-2xl shadow-sm ${heroCard} ${className}`}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px rgba(26, 46, 40, 0.1)",
        transition: { type: "tween", duration: 0.2 },
      }}
      transition={{ type: "tween", duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={`text-sm font-medium ${isHero ? "text-white/80" : "text-[#4a6a5c]"}`}>
          {title}
        </p>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isHero ? "bg-white/15 text-white" : `${styles.iconBg} ${styles.iconColor}`
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <p className={`font-heading text-3xl md:text-4xl font-bold tracking-tight ${isHero ? "text-white" : "text-[#1a2e28]"}`}>
        {value}
      </p>

      {subtitle && (
        <p className={`text-xs mt-1 ${isHero ? "text-white/60" : "text-[#6b8f7b]"}`}>{subtitle}</p>
      )}

      {(trend != null || trendLabel) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {trend != null && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                trendUp
                  ? isHero ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                  : trendDown
                    ? isHero ? "bg-red-400/20 text-red-200" : "bg-red-50 text-red-700"
                    : isHero ? "bg-white/10 text-white/70" : "bg-gray-100 text-gray-600"
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
            <span className={`text-xs ${isHero ? "text-white/50" : "text-[#6b8f7b]"}`}>{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
