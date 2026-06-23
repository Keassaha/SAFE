"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Briefcase } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";
import {
  staggerContainer,
  staggerItem,
  staggerContainerReduced,
  staggerItemReduced,
} from "@/lib/motion";

interface EmployeeSummaryCardsProps {
  total: number;
  active: number;
  inactive: number;
  byRoleCount: number;
}

export function EmployeeSummaryCards({
  total,
  active,
  inactive,
  byRoleCount,
}: EmployeeSummaryCardsProps) {
  const t = useTranslations("employees");
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;

  const cards = [
    {
      title: t("totalEmployees"),
      value: total.toLocaleString("fr-CA"),
      icon: Users,
      sub: null,
    },
    {
      title: t("activeEmployees"),
      value: active.toLocaleString("fr-CA"),
      icon: UserCheck,
      sub: `${activePercent}%`,
      subClassName: "text-si-verified",
    },
    {
      title: t("inactiveEmployees"),
      value: inactive.toLocaleString("fr-CA"),
      icon: UserX,
      sub: null,
    },
    {
      title: t("distinctRoles"),
      value: byRoleCount.toLocaleString("fr-CA"),
      icon: Briefcase,
      sub: null,
    },
  ];

  const iconColors = [
    "bg-si-verified/10 text-si-forest",
    "bg-si-verified/10 text-si-verified",
    "bg-si-canvas text-si-muted",
    "bg-si-verified/10 text-si-forest",
  ] as const;

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
      {cards.map(({ title, value, icon: Icon, sub, subClassName }, i) => (
        <motion.div
          key={title}
          variants={itemVariants}
          className="bg-si-surface border border-si-line rounded-2xl p-5 transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-si-muted uppercase tracking-widest">
                {title}
              </p>
              <p className="mt-1.5 text-2xl font-bold text-si-ink tracking-tight tabular-nums">
                {value}
              </p>
              {sub && (
                <p className={`mt-1 text-sm ${subClassName ?? "text-si-muted"}`}>{sub}</p>
              )}
            </div>
            <div
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${iconColors[i % iconColors.length]}`}
            >
              <Icon className="w-5 h-5" aria-hidden />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
