"use client";

import { useTranslations } from "next-intl";
import { ArrowDownCircle, CalendarRange, Tag, CheckCircle2, FolderOpen, Upload } from "lucide-react";
import { ComptaKpiCard } from "@/components/comptabilite/ComptaKpiCard";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";

export function ExpenseJournalKpis({ data }: { data: ExpenseJournalKpisData }) {
  const t = useTranslations("billingCompUi");

  /* Plus d'entrée en cascade. Six chiffres qui apparaissent l'un après l'autre
     au chargement, c'est du mouvement décoratif : il ne guide rien, ne confirme
     rien et n'éclaircit rien. Il retarde seulement la lecture de chiffres qui
     sont déjà là. Décision CEO du 2026-09-09. */
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
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
    </div>
  );
}
