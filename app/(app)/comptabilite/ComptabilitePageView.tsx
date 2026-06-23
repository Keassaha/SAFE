"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BookOpen, Receipt, CreditCard, Wallet, ShieldCheck, Download } from "lucide-react";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
// Types Prisma générés (pas d'instance prisma sur le namespace @prisma/client)
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { GeneralJournalPageView } from "@/app/(app)/journal/general/GeneralJournalPageView";
import { ExpenseJournalPageView } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { FacturationPaiementsView } from "@/app/(app)/facturation/paiements/PaiementsView";
import { tMicro } from "@/lib/motion";

export type ComptabiliteTabId = "general" | "depenses" | "paiements";

const TABS: {
  id: ComptabiliteTabId;
  labelKey: "tabGeneralJournal" | "tabExpenseJournal" | "tabPayments";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "general", labelKey: "tabGeneralJournal", icon: BookOpen },
  { id: "depenses", labelKey: "tabExpenseJournal", icon: Receipt },
  { id: "paiements", labelKey: "tabPayments", icon: CreditCard },
];

/** Actions du hub comptable — l'argent compréhensible avant les journaux. */
const HUB: {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { href: routes.comptabiliteTab("paiements"), label: "hubEncaisser", desc: "hubEncaisserDesc", icon: Wallet },
  { href: routes.comptabiliteTab("depenses"), label: "hubDepenses", desc: "hubDepensesDesc", icon: Receipt },
  { href: "/comptes/rapprochement", label: "hubControle", desc: "hubControleDesc", icon: ShieldCheck },
  { href: routes.comptabiliteTab("general"), label: "hubExport", desc: "hubExportDesc", icon: Download },
];

type SessionWithCount = BankImportSession & { _count: { transactions: number } };

interface ComptabilitePageViewProps {
  cabinetId: string;
  initialJournalKpis: JournalKpiData;
  expenseData: {
    kpis: ExpenseJournalKpisData;
    sessions: SessionWithCount[];
    categories: ExpenseCategory[];
    transactions: BankImportTransaction[];
  };
}

export function ComptabilitePageView({
  cabinetId,
  initialJournalKpis,
  expenseData,
}: ComptabilitePageViewProps) {
  const t = useTranslations("accountingUi");
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ComptabiliteTabId) || "general";
  const effectiveTab = TABS.some((tab_) => tab_.id === tab) ? tab : "general";
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="max-w-[1180px] w-full mx-auto px-2 pb-24 pt-4 font-sans space-y-6 animate-fade-in">
      <PageHeader title={t("pageTitle")} />

      {/* ── Intro doctrinale : ce que SAFE fait / ne fait pas ── */}
      <div className="rounded-2xl border border-si-line border-l-4 border-l-si-forest bg-si-surface p-5 md:p-6">
        <h2 className="font-serif text-[19px] leading-tight text-si-ink">{t("doctrineTitle")}</h2>
        <p className="mt-1.5 text-sm text-si-muted max-w-3xl">{t("doctrineText")}</p>
      </div>

      {/* ── Hub d'actions (avant les journaux) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {HUB.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="group flex flex-col gap-2 rounded-2xl border border-si-line bg-si-surface p-4 transition-all hover:border-si-forest/30 hover:shadow-si-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-si-forest/[0.06] text-si-forest">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-sm font-medium text-si-ink">{t(a.label)}</span>
              <span className="text-xs text-si-muted">{t(a.desc)}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Mode expert : journaux ── */}
      <div className="pt-2">
        <h2 className="font-serif text-[19px] leading-tight text-si-ink">{t("expertModeTitle")}</h2>
        <p className="mt-0.5 text-xs text-si-muted">{t("expertModeDesc")}</p>
      </div>

      {/* ── Tab strip ──────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        className="relative flex gap-8 border-b-[0.5px] border-si-line mb-8"
        aria-label={t("tabsAriaLabel")}
      >
        {TABS.map((tab_) => {
          const isActive = effectiveTab === tab_.id;
          const Icon = tab_.icon;
          return (
            <Link
              key={tab_.id}
              href={routes.comptabiliteTab(tab_.id)}
              className={`relative flex items-center gap-2 py-3 text-[13px] transition-colors duration-200 ${
                isActive
                  ? "font-medium text-si-ink"
                  : "text-si-muted hover:text-si-ink"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="comptabilite-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-si-forest"
                  transition={tMicro}
                  aria-hidden
                />
              )}
              <Icon className="w-4 h-4 relative z-10" strokeWidth={1.75} />
              <span className="relative z-10 font-sans">{t(tab_.labelKey)}</span>
            </Link>
          );
        })}
      </motion.nav>

      <motion.div
        key={effectiveTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease, delay: 0.05 }}
      >
        {effectiveTab === "general" && (
          <GeneralJournalPageView initialKpis={initialJournalKpis} />
        )}
        {effectiveTab === "depenses" && (
          <ExpenseJournalPageView
            cabinetId={cabinetId}
            kpis={expenseData.kpis}
            sessions={expenseData.sessions}
            categories={expenseData.categories}
            transactions={expenseData.transactions}
          />
        )}
        {effectiveTab === "paiements" && (
          <FacturationPaiementsView
            cabinetId={cabinetId}
            embeddedInComptabilite
          />
        )}
      </motion.div>
    </div>
  );
}
