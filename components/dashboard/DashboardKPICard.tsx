"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Accents unifiés en forêt calme (design safe-interface) — pastille d'icône
// discrète, cohérente avec les autres cartes KPI de l'app.
const ACCENT_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
  emerald: { iconBg: "bg-si-forest/[0.06]", iconColor: "text-si-forest" },
  blue: { iconBg: "bg-si-forest/[0.06]", iconColor: "text-si-forest" },
  amber: { iconBg: "bg-si-forest/[0.06]", iconColor: "text-si-forest" },
  red: { iconBg: "bg-si-forest/[0.06]", iconColor: "text-si-forest" },
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
    ? "bg-si-forest text-si-surface"
    : "bg-si-surface border border-si-line";

  return (
    <motion.div
      className={`overflow-hidden p-5 md:p-6 rounded-2xl ${heroCard} ${className}`}
      whileHover={{
        y: -4,
        boxShadow: "0 12px 32px rgba(31, 42, 36, 0.12)",
        transition: { type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={`text-sm font-medium ${isHero ? "text-si-surface/80" : "text-si-muted"}`}>
          {title}
        </p>
        {icon && (
          <div
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
              isHero ? "bg-si-surface/15 text-si-surface" : `${styles.iconBg} ${styles.iconColor}`
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <p className={`font-mono text-3xl md:text-4xl font-bold tracking-tight tabular-nums ${isHero ? "text-si-surface" : "text-si-ink"}`}>
        {value}
      </p>

      {subtitle && (
        <p className={`text-xs mt-1 ${isHero ? "text-si-surface/60" : "text-si-muted"}`}>{subtitle}</p>
      )}

      {(trend != null || trendLabel) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {trend != null && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                trendUp
                  ? isHero ? "bg-si-verified/25 text-[#9FE3C2]" : "bg-si-verified/10 text-si-verified"
                  : trendDown
                    ? isHero ? "bg-[#B84A3E]/25 text-[#F0B5AC]" : "bg-[#B84A3E]/10 text-[#B84A3E]"
                    : isHero ? "bg-si-surface/10 text-si-surface/70" : "bg-si-canvas text-si-muted"
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
            <span className={`text-xs ${isHero ? "text-si-surface/50" : "text-si-muted"}`}>{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
