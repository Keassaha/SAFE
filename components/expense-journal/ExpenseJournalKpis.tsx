"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowDownCircle, CalendarRange, Tag, CheckCircle2, FolderOpen, Upload } from "lucide-react";
import { staggerContainer, staggerContainerReduced, useSafeMotion } from "@/lib/motion";
import { ComptaKpiCard } from "@/components/comptabilite/ComptaKpiCard";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";

export function ExpenseJournalKpis({ data }: { data: ExpenseJournalKpisData }) {
  const t = useTranslations("billingCompUi");
  const { reduceMotion } = useSafeMotion();

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      variants={reduceMotion ? staggerContainerReduced : staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <ComptaKpiCard
        label={t("expensesThisMonth")}
        value={data.totalMonth}
        format="currency"
        icon={ArrowDownCircle}
        semantic="debit"
        trend={
          data.variation != null
            ? { value: -(data.variation), label: t("vsPreviousMonth") }
            : undefined
        }
      />

      <ComptaKpiCard
        label={t("expensesThisYear")}
        value={data.totalYear}
        format="currency"
        icon={CalendarRange}
        semantic="debit"
      />

      <ComptaKpiCard
        label={t("uncategorized")}
        value={data.uncategorizedCount}
        format="integer"
        icon={Tag}
        semantic={data.uncategorizedCount > 0 ? "alert" : "neutral"}
      />

      <ComptaKpiCard
        label={t("toValidate")}
        value={data.toValidateCount}
        format="integer"
        icon={CheckCircle2}
        semantic={data.toValidateCount > 0 ? "alert" : "neutral"}
      />

      <ComptaKpiCard
        label={t("topCategory")}
        value={data.topCategoryAmount}
        format="currency"
        icon={FolderOpen}
        semantic="debit"
        subText={data.topCategoryName ?? "—"}
      />

      <ComptaKpiCard
        label={t("importedThisMonth")}
        value={data.importedThisMonth}
        format="integer"
        icon={Upload}
        semantic="neutral"
        subText={t("transactions")}
      />
    </motion.div>
  );
}
