"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

/**
 * Carte de synthèse du cockpit comptable — anatomie unique (icône + badge +
 * montant + phrase + lien), déclinée par ton. Toute la carte est cliquable et
 * mène vers la page concernée. Inspirée de l'encart « Fidéicommis ».
 */

export type SummaryTone = "neutral" | "positive" | "warning" | "negative" | "trust";

const TONES: Record<
  SummaryTone,
  { card: string; hover: string; iconBg: string; iconText: string; badge: string }
> = {
  neutral: {
    card: "border-si-line bg-si-surface",
    hover: "hover:border-si-forest/30",
    iconBg: "bg-si-forest/[0.06]",
    iconText: "text-si-forest",
    badge: "border-si-line text-si-muted",
  },
  positive: {
    card: "border-si-line bg-si-surface",
    hover: "hover:border-si-verified/40",
    iconBg: "bg-si-verified/10",
    iconText: "text-si-verified",
    badge: "border-si-verified/30 text-si-verified",
  },
  warning: {
    card: "border-si-line bg-si-surface",
    hover: "hover:border-si-amber/40",
    iconBg: "bg-si-amber/[0.13]",
    iconText: "text-si-amber",
    badge: "border-si-amber/40 text-si-amber-ink",
  },
  negative: {
    card: "border-si-line bg-si-surface",
    hover: "hover:border-[#B84A3E]/40",
    iconBg: "bg-[#B84A3E]/10",
    iconText: "text-[#B84A3E]",
    badge: "border-[#B84A3E]/30 text-[#B84A3E]",
  },
  trust: {
    card: "border-si-amber/30 bg-si-amber/[0.05]",
    hover: "hover:border-si-amber/50",
    iconBg: "bg-si-amber/[0.16]",
    iconText: "text-si-amber-ink",
    badge: "border-si-amber/50 text-si-amber-ink",
  },
};

export interface SummaryCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  amount: number;
  explanation: string;
  badge: string;
  linkLabel: string;
  tone?: SummaryTone;
  className?: string;
}

export function SummaryCard({
  href,
  icon: Icon,
  title,
  amount,
  explanation,
  badge,
  linkLabel,
  tone = "neutral",
  className = "",
}: SummaryCardProps) {
  const tn = TONES[tone];
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border ${tn.card} ${tn.hover} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-si-card ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${tn.iconBg}`}>
          <Icon className={`h-[18px] w-[18px] ${tn.iconText}`} strokeWidth={1.75} aria-hidden />
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${tn.badge}`}>
          {badge}
        </span>
      </div>

      <p className="mt-3 text-[13px] font-medium text-si-ink">{title}</p>
      <p className="mt-1 font-mono text-[26px] font-semibold leading-none tabular-nums text-si-ink">
        {formatCurrency(amount)}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-si-muted">{explanation}</p>

      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-si-forest">
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
