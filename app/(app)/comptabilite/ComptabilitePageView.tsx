"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  FileClock,
  FileText,
  Landmark,
  Receipt,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { MovementLegend } from "@/components/comptabilite/MovementLegend";
// Types Prisma générés (pas d'instance prisma sur le namespace @prisma/client)
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { GeneralJournalPageView } from "@/app/(app)/journal/general/GeneralJournalPageView";
import { ExpenseJournalPageView } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { FacturationPaiementsView } from "@/app/(app)/facturation/paiements/PaiementsView";

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Menu de section (remplace la barre d'onglets) — façon méga-menu, thème si-*.
  // Colonne « Journaux » = pilote la vue in-page ; « Raccourcis » = navigation liée.
  const journalItems = [
    { id: "general" as const, label: t("tabGeneralJournal"), desc: "Toutes les écritures du cabinet", icon: BookOpen },
    { id: "depenses" as const, label: t("tabExpenseJournal"), desc: "Débours et dépenses", icon: Receipt },
    { id: "paiements" as const, label: t("tabPayments"), desc: "Encaissements et allocations", icon: CreditCard },
  ];
  const shortcutItems = [
    { label: "Facturation", desc: "Factures et honoraires", icon: FileText, href: routes.facturation },
    ...(isSafeInc
      ? []
      : [{ label: "Fidéicommis et comptes", desc: "Soldes en fiducie", icon: Landmark, href: routes.comptes }]),
    { label: "Créances", desc: "Âge des comptes clients", icon: FileClock, href: routes.facturationCreancesAging },
  ];
  const currentJournal = journalItems.find((j) => j.id === effectiveTab) ?? journalItems[0];
  const CurrentIcon = currentJournal.icon;

  // Synthèse financière en liste dense plutôt qu'en cartes KPI.
  // Doctrine interface intérieure §6 et §7 : pas de boîtes à ombre pour porter un
  // total, et tous les montants alignés sur un même bord droit (règle L2) pour
  // qu'ils se comparent d'un coup d'œil.
  const summaryRows = [
    {
      href: routes.facturation,
      title: t("cardBilledTitle"),
      amount: k.totalFacture,
      explanation: t("cardBilledExpl"),
      trust: false,
    },
    {
      href: routes.facturationPaiements,
      title: t("cardCollectedTitle"),
      amount: k.totalEncaisse,
      explanation: t("cardCollectedExpl"),
      trust: false,
    },
    {
      href: routes.facturationCreancesAging,
      title: t("cardReceivableTitle"),
      amount: k.comptesARecevoir,
      explanation: t("cardReceivableExpl"),
      trust: false,
    },
    {
      href: routes.journalDepenses,
      title: t("cardExpensesTitle"),
      amount: k.totalDepenses,
      explanation: t("cardExpensesExpl"),
      trust: false,
    },
    // Fidéicommis : masqué en mode consultant SAFE Inc. (non pertinent).
    // Hors de ce mode il reste toujours visible, sans interaction (doctrine §7).
    ...(isSafeInc
      ? []
      : [
          {
            href: routes.comptes,
            title: t("cardTrustTitle"),
            amount: k.soldeFideicommis,
            explanation: t("cardTrustExpl"),
            trust: true,
          },
        ]),
  ];

  return (
    <div className="max-w-[1180px] w-full mx-auto px-2 pb-24 pt-4 font-sans space-y-6 animate-fade-in">
      {/* Variante compacte : garde la signature forêt du design safe-interface
          (cohérence M5) tout en rendant de la hauteur utile au travail. */}
      <PageHeader
        variant="compact"
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

        <div className="mt-3 border-t border-si-line">
          {summaryRows.map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 border-b border-si-line px-2 py-2.5 transition-colors duration-150 hover:bg-si-canvas"
            >
              <span className="min-w-0">
                <span className="text-[13px] font-medium text-si-ink group-hover:text-si-forest">
                  {row.title}
                </span>
                {row.trust && (
                  <span className="ml-2 align-middle text-[11px] font-medium text-si-amber-ink">
                    {t("cardTrustBadge")}
                  </span>
                )}
                <span className="mt-0.5 block truncate text-[12px] text-si-muted">
                  {row.explanation}
                </span>
              </span>
              <span className="justify-self-end text-right font-mono text-[15px] tabular-nums text-si-ink">
                {formatCurrency(row.amount)}
              </span>
            </Link>
          ))}
        </div>

        {showHelp && (
          <div className="mt-4">
            <MovementLegend />
          </div>
        )}
      </section>

      {/* ── Bloc 2 : détails et journaux (zone expert, non dominante) ── */}
      <section className="pt-2">
        {/* L'action principale du journal remonte ici, sur la ligne de titre de sa
            propre section (fond clair), plutôt que de flotter au milieu de la page.
            Le journal y projette sa barre d'actions via #compta-journal-actions. */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-[18px] leading-tight text-si-ink">{t("detailsTitle")}</h2>
            <p className="mt-0.5 text-xs text-si-muted">{t("detailsDesc")}</p>
          </div>
          <div id="compta-journal-actions" className="flex shrink-0 flex-wrap items-center justify-end gap-2" />
        </div>

        {/* Menu de section (remplace les onglets) — façon méga-menu, thème si-* */}
        <div className="relative mt-4 mb-8" onMouseLeave={() => setMenuOpen(false)}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={t("tabsAriaLabel")}
            className="inline-flex items-center gap-2.5 rounded-[10px] border-[0.5px] border-si-line bg-si-surface px-4 py-2.5 text-[13px] text-si-ink transition-colors duration-200 hover:border-si-forest/40"
          >
            <CurrentIcon className="w-4 h-4 text-si-forest" strokeWidth={1.75} />
            <span className="font-medium font-sans">{currentJournal.label}</span>
            <ChevronDown
              className="w-4 h-4 text-si-muted transition-transform duration-200"
              style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease }}
                className="absolute left-0 top-full z-30 mt-2 w-[min(640px,calc(100vw-2rem))] rounded-[16px] border-[0.5px] border-si-line bg-si-surface p-5 shadow-si-card"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.07em] text-si-muted">
                      Journaux
                    </h4>
                    {journalItems.map((j) => {
                      const Icon = j.icon;
                      const active = effectiveTab === j.id;
                      return (
                        <Link
                          key={j.id}
                          href={routes.comptabiliteTab(j.id)}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 transition-colors duration-150 ${
                            active ? "bg-si-canvas" : "hover:bg-si-canvas"
                          }`}
                        >
                          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-si-canvas text-si-forest">
                            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-sans text-[13px] font-medium text-si-ink">{j.label}</span>
                            <span className="block font-sans text-[12px] text-si-muted">{j.desc}</span>
                          </span>
                          {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-si-forest" aria-hidden />}
                        </Link>
                      );
                    })}
                  </div>
                  <div>
                    <h4 className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.07em] text-si-muted">
                      Raccourcis
                    </h4>
                    {shortcutItems.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.href}
                          href={s.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 transition-colors duration-150 hover:bg-si-canvas"
                        >
                          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-si-canvas text-si-forest">
                            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-sans text-[13px] font-medium text-si-ink">{s.label}</span>
                            <span className="block font-sans text-[12px] text-si-muted">{s.desc}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
