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
      subTone: "muted" as "muted" | "verified",
      valueTone: "ink" as "ink" | "amber",
    },
    {
      title: t("activeMatters"),
      value: actifsCount.toLocaleString("fr-CA"),
      icon: FolderOpen,
      sub: `${actifPercent}${t("ofTotal")}`,
      subTone: "verified" as const,
      valueTone: "ink" as const,
    },
    {
      title: t("closedMatters"),
      value: cloturesCount.toLocaleString("fr-CA"),
      icon: FolderCheck,
      sub: null,
      subTone: "muted" as const,
      valueTone: "ink" as const,
    },
    {
      title: t("totalActs"),
      value: totalActes.toLocaleString("fr-CA"),
      icon: ListChecks,
      sub: `${terminePercent}${t("completed")}`,
      subTone: "verified" as const,
      valueTone: "ink" as const,
    },
    {
      title: t("inProgress"),
      value: actesEnCours.toLocaleString("fr-CA"),
      icon: Clock,
      sub: null,
      subTone: "muted" as const,
      valueTone: "ink" as const,
    },
    {
      title: t("urgentOverdue"),
      value: actesUrgents.toLocaleString("fr-CA"),
      icon: AlertTriangle,
      sub: null,
      subTone: "muted" as const,
      valueTone: actesUrgents > 0 ? ("amber" as const) : ("ink" as const),
    },
    {
      title: t("completed2"),
      value: actesTermines.toLocaleString("fr-CA"),
      icon: CheckCircle2,
      sub: null,
      subTone: "muted" as const,
      valueTone: "ink" as const,
    },
  ];

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
      {cards.map(({ title, value, icon: Icon, sub, subTone, valueTone }) => (
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
              <p className={`mt-2 font-mono text-[22px] leading-none tabular-nums ${valueTone === "amber" ? "text-si-amber-ink" : "text-si-ink"}`}>
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
