"use client";

import { motion } from "framer-motion";
import { FolderOpen, FolderCheck, Folder, ListChecks, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSafeMotion } from "@/lib/motion";
import { staggerContainer, staggerItem, staggerContainerReduced, staggerItemReduced } from "@/lib/motion";

interface DossierSummaryCardsProps {
  totalDossiers: number;
  actifsCount: number;
  cloturesCount: number;
  totalActes?: number;
  actesEnCours?: number;
  actesUrgents?: number;
  actesTermines?: number;
}

export function DossierSummaryCards({
  totalDossiers,
  actifsCount,
  cloturesCount,
  totalActes = 0,
  actesEnCours = 0,
  actesUrgents = 0,
  actesTermines = 0,
}: DossierSummaryCardsProps) {
  const t = useTranslations("matters");

  const actifPercent =
    totalDossiers > 0 ? Math.round((actifsCount / totalDossiers) * 100) : 0;
  const terminePercent =
    totalActes > 0 ? Math.round((actesTermines / totalActes) * 100) : 0;

  const cards = [
    {
      title: t("totalMatters"),
      value: totalDossiers.toLocaleString("fr-CA"),
      icon: Folder,
      sub: null as string | null,
      subClassName: undefined as string | undefined,
    },
    {
      title: t("activeMatters"),
      value: actifsCount.toLocaleString("fr-CA"),
      icon: FolderOpen,
      sub: `${actifPercent}${t("ofTotal")}`,
      subClassName: "text-status-success",
    },
    {
      title: t("closedMatters"),
      value: cloturesCount.toLocaleString("fr-CA"),
      icon: FolderCheck,
      sub: null,
      subClassName: undefined,
    },
    {
      title: t("totalActs"),
      value: totalActes.toLocaleString("fr-CA"),
      icon: ListChecks,
      sub: `${terminePercent}${t("completed")}`,
      subClassName: "text-status-success",
    },
    {
      title: t("inProgress"),
      value: actesEnCours.toLocaleString("fr-CA"),
      icon: Clock,
      sub: null,
      subClassName: undefined,
    },
    {
      title: t("urgentOverdue"),
      value: actesUrgents.toLocaleString("fr-CA"),
      icon: AlertTriangle,
      sub: null,
      subClassName: actesUrgents > 0 ? "text-[var(--safe-status-error)]" : undefined,
    },
    {
      title: t("completed2"),
      value: actesTermines.toLocaleString("fr-CA"),
      icon: CheckCircle2,
      sub: null,
      subClassName: undefined,
    },
  ];

  const iconColors = [
    "bg-green-100 text-[var(--safe-icon-default)]",
    "bg-status-success-bg text-status-success",
    "bg-green-100 text-green-700",
    "bg-green-50 text-[var(--safe-icon-accent)]",
    "bg-amber-50 text-amber-600",
    "bg-red-50 text-red-600",
    "bg-emerald-50 text-emerald-600",
  ] as const;

  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion ? staggerContainerReduced : staggerContainer;
  const itemVariants = reduceMotion ? staggerItemReduced : staggerItem;

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map(({ title, value, icon: Icon, sub, subClassName }, i) => (
        <motion.div
          key={title}
          variants={itemVariants}
          className="card-glass rounded-safe-lg p-5 transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold safe-text-secondary uppercase tracking-widest">
                {title}
              </p>
              <p className="mt-1.5 text-2xl font-bold safe-text-metric tracking-tight tabular-nums">
                {value}
              </p>
              {sub && (
                <p className={`mt-1 text-sm ${subClassName ?? "safe-text-secondary"}`}>{sub}</p>
              )}
            </div>
            <div
              className={`w-11 h-11 shrink-0 rounded-safe flex items-center justify-center ${iconColors[i % iconColors.length]}`}
            >
              <Icon className="w-5 h-5" aria-hidden />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
