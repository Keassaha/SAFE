"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Receipt, CreditCard } from "lucide-react";
import { routes } from "@/lib/routes";
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { GeneralJournalPageView } from "@/app/(app)/journal/general/GeneralJournalPageView";
import { ExpenseJournalPageView } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { FacturationPaiementsView } from "@/app/(app)/facturation/paiements/PaiementsView";
import { tMicro } from "@/lib/motion";

export type ComptabiliteTabId = "general" | "depenses" | "paiements";

const TABS: { id: ComptabiliteTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "Journal général", icon: BookOpen },
  { id: "depenses", label: "Journal des dépenses", icon: Receipt },
  { id: "paiements", label: "Paiements", icon: CreditCard },
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
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ComptabiliteTabId) || "general";
  const effectiveTab = TABS.some((t) => t.id === tab) ? tab : "general";

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Comptabilité"
        description="Journal général, journal des dépenses et paiements en un seul endroit."
      />

      <nav
        className="relative flex gap-1 border-b border-neutral-200"
        aria-label="Onglets comptabilité"
      >
        {TABS.map((t) => {
          const isActive = effectiveTab === t.id;
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={routes.comptabiliteTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium -mb-px transition-colors duration-200 ${
                isActive
                  ? "text-primary-700"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="comptabilite-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"
                  transition={tMicro}
                  aria-hidden
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </Link>
          );
        })}
      </nav>

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
    </div>
  );
}
