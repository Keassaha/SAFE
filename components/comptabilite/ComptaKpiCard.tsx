"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { staggerItem, staggerItemReduced, useSafeMotion } from "@/lib/motion";

export type ComptaKpiSemantic = "neutral" | "credit" | "debit" | "warning" | "alert";
export type ComptaKpiFormat = "currency" | "integer";

export interface ComptaKpiCardProps {
  label: string;
  value: number;
  format: ComptaKpiFormat;
  icon: LucideIcon;
  semantic?: ComptaKpiSemantic;
  trend?: { value: number; label: string };
  subText?: string;
  animated?: boolean;
  className?: string;
}

const SEMANTIC_STYLES: Record<
  ComptaKpiSemantic,
  { iconBg: string; iconColor: string; valueColor: string; ring: string }
> = {
  neutral: { iconBg: "bg-slate-100",  iconColor: "text-slate-600",  valueColor: "text-slate-900", ring: "" },
  credit:  { iconBg: "bg-forest-50",  iconColor: "text-forest-700", valueColor: "text-forest-700", ring: "" },
  debit:   { iconBg: "bg-red-50",     iconColor: "text-red-600",    valueColor: "text-red-600",    ring: "" },
  warning: { iconBg: "bg-amber-50",   iconColor: "text-amber-600",  valueColor: "text-slate-900",  ring: "" },
  alert:   { iconBg: "bg-amber-50",   iconColor: "text-amber-600",  valueColor: "text-amber-600",  ring: "ring-1 ring-amber-300" },
};

export function ComptaKpiCard({
  label,
  value,
  format,
  icon: Icon,
  semantic = "neutral",
  trend,
  subText,
  animated = true,
  className = "",
}: ComptaKpiCardProps) {
  const { reduceMotion } = useSafeMotion();
  const styles = SEMANTIC_STYLES[semantic];

  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;
  const trendPillClass = trendPositive
    ? "bg-forest-50 text-forest-700"
    : trendNegative
    ? "bg-red-50 text-red-600"
    : "bg-slate-100 text-slate-500";

  return (
    <motion.div
      variants={reduceMotion ? staggerItemReduced : staggerItem}
      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(26,46,40,0.10)" }}
      className={`bg-white border-[0.5px] border-slate-200 rounded-safe-md p-5 overflow-hidden transition-shadow duration-300 ${styles.ring} ${className}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 leading-tight">
          {label}
        </p>
        <span className={`w-8 h-8 rounded-safe-sm flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          <Icon className={`w-4 h-4 ${styles.iconColor}`} strokeWidth={1.75} />
        </span>
      </div>

      {/* Value */}
      <div className={`mt-3 text-[24px] font-semibold tabular-nums leading-none ${styles.valueColor}`}>
        {animated ? (
          format === "currency" ? (
            <AnimatedNumber value={value} decimals={2} suffix={"\u00a0$"} />
          ) : (
            <AnimatedNumber value={value} decimals={0} />
          )
        ) : format === "currency" ? (
          <span>{value.toFixed(2)}{"\u00a0$"}</span>
        ) : (
          <span>{value}</span>
        )}
      </div>

      {/* Trend pill */}
      {trend != null && (
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${trendPillClass}`}>
            <TrendIcon className="w-3 h-3" strokeWidth={2} />
            {trend.value > 0 ? "+" : ""}
            {trend.value.toFixed(1)}% {trend.label}
          </span>
        </div>
      )}

      {/* SubText */}
      {subText && (
        <p className="mt-1.5 text-[12px] text-slate-500 truncate" title={subText}>
          {subText}
        </p>
      )}
    </motion.div>
  );
}
