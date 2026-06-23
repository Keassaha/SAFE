"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Users, UserCheck, FolderOpen, DollarSign } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";
import { staggerContainer, staggerItem, staggerContainerReduced, staggerItemReduced } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

interface ClientSummaryCardsProps {
  totalClients: number;
  activeClients: number;
  activeCasesCount: number;
  unbilledAmount: number;
}

export function ClientSummaryCards({
  totalClients,
  activeClients,
  activeCasesCount,
  unbilledAmount,
}: ClientSummaryCardsProps) {
  const t = useTranslations("clients");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const activePercent = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  const cards = [
    {
      title: t("totalClients"),
      value: totalClients.toLocaleString(intlLocale),
      icon: Users,
      sub: null as string | null,
      subTone: "muted" as const,
    },
    {
      title: t("activeClients"),
      value: activeClients.toLocaleString(intlLocale),
      icon: UserCheck,
      sub: `${activePercent}% ${t("ofTotal")}`,
      subTone: "verified" as const,
    },
    {
      title: t("activeMatters"),
      value: activeCasesCount.toLocaleString(intlLocale),
      icon: FolderOpen,
      sub: t("distributedOver", { count: activeCasesCount }),
      subTone: "muted" as const,
    },
    {
      title: t("unbilledAmount"),
      value: formatCurrency(unbilledAmount, "CAD", locale),
      icon: DollarSign,
      sub: null as string | null,
      subTone: "muted" as const,
    },
  ];

  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion ? staggerContainerReduced : staggerContainer;
  const itemVariants = reduceMotion ? staggerItemReduced : staggerItem;

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map(({ title, value, icon: Icon, sub, subTone }) => (
        <motion.div
          key={title}
          variants={itemVariants}
          className="bg-si-surface border border-si-line rounded-2xl p-5 transition-all duration-200 ease-out hover:shadow-si-card hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-si-muted">
                {title}
              </p>
              <p className="mt-2 font-mono text-[26px] leading-none text-si-ink tabular-nums">
                {value}
              </p>
              {sub && (
                <p className={`mt-2 text-[12px] ${subTone === "verified" ? "text-si-verified" : "text-si-muted"}`}>
                  {sub}
                </p>
              )}
            </div>
            <div className="w-10 h-10 shrink-0 rounded-[10px] flex items-center justify-center bg-si-forest/[0.06] text-si-forest">
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
