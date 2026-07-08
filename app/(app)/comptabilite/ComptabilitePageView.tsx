"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowDownRight,
  BookOpen,
  CreditCard,
  FileClock,
  FileText,
  Landmark,
  Receipt,
  Wallet,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { MovementLegend } from "@/components/comptabilite/MovementLegend";
import { SummaryCard } from "@/components/comptabilite/SummaryCard";
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
  /** Mode consultant SAFE Inc. : masque le fidéicommis (non pertinent). */
  isSafeInc?: boolean;
}

export function ComptabilitePageView({
  cabinetId,
  initialJournalKpis,
  expenseData,
  isSafeInc = false,
}: ComptabilitePageViewProps) {
  const t = useTranslations("accountingUi");
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ComptabiliteTabId) || "general";
  const effectiveTab = TABS.some((tab_) => tab_.id === tab) ? tab : "general";
  const ease = [0.16, 1, 0.3, 1] as const;
  const k = initialJournalKpis;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="max-w-[1180px] w-full mx-auto px-2 pb-24 pt-4 font-sans space-y-6 animate-fade-in">
      <PageHeader
        title={t("pageTitle")}
        description={
          isSafeInc
            ? "Une vue claire des flux : cash, factures, créances et dépenses."
            : t("pageDescription")
        }
      />

      {/* ── Bloc 1 : synthèse financière (cartes cliquables) ── */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[20px] leading-tight text-si-ink">{t("snapshotTitle")}</h2>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="shrink-0 text-[12px] font-medium text-si-forest hover:underline"
          >
            {showHelp ? t("hideHelp") : t("showHelp")}
          </button>
        </div>

        <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isSafeInc ? "xl:grid-cols-4" : "xl:grid-cols-5"} gap-3`}>
          <SummaryCard
            href={routes.facturation}
            icon={FileText}
            title={t("cardBilledTitle")}
            amount={k.totalFacture}
            explanation={t("cardBilledExpl")}
            badge={t("cardBilledBadge")}
            linkLabel={t("cardBilledLink")}
            tone="neutral"
          />
          <SummaryCard
            href={routes.facturationPaiements}
            icon={Wallet}
            title={t("cardCollectedTitle")}
            amount={k.totalEncaisse}
            explanation={t("cardCollectedExpl")}
            badge={t("cardCollectedBadge")}
            linkLabel={t("cardCollectedLink")}
            tone="positive"
          />
          <SummaryCard
            href={routes.facturationCreancesAging}
            icon={FileClock}
            title={t("cardReceivableTitle")}
            amount={k.comptesARecevoir}
            explanation={t("cardReceivableExpl")}
            badge={t("cardReceivableBadge")}
            linkLabel={t("cardReceivableLink")}
            tone="warning"
          />
          <SummaryCard
            href={routes.journalDepenses}
            icon={ArrowDownRight}
            title={t("cardExpensesTitle")}
            amount={k.totalDepenses}
            explanation={t("cardExpensesExpl")}
            badge={t("cardExpensesBadge")}
            linkLabel={t("cardExpensesLink")}
            tone="negative"
          />
          {/* Fidéicommis : masqué en mode consultant SAFE Inc. (non pertinent). */}
          {!isSafeInc && (
            <SummaryCard
              href={routes.comptes}
              icon={Landmark}
              title={t("cardTrustTitle")}
              amount={k.soldeFideicommis}
              explanation={t("cardTrustExpl")}
              badge={t("cardTrustBadge")}
              linkLabel={t("cardTrustLink")}
              tone="trust"
            />
          )}
        </div>

        {showHelp && (
          <div className="mt-4">
            <MovementLegend />
          </div>
        )}
      </section>

      {/* ── Bloc 2 : détails et journaux (zone expert, non dominante) ── */}
      <section className="pt-2">
        <h2 className="font-serif text-[18px] leading-tight text-si-ink">{t("detailsTitle")}</h2>
        <p className="mt-0.5 text-xs text-si-muted">{t("detailsDesc")}</p>

        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="relative mt-4 flex gap-8 border-b-[0.5px] border-si-line mb-8"
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
                  isActive ? "font-medium text-si-ink" : "text-si-muted hover:text-si-ink"
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
            <GeneralJournalPageView initialKpis={initialJournalKpis} embedded />
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
            <FacturationPaiementsView cabinetId={cabinetId} embeddedInComptabilite />
          )}
        </motion.div>
      </section>
    </div>
  );
}
