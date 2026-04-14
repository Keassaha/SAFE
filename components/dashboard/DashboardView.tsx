"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Database } from "lucide-react";
import { formatDateTimeHeader } from "@/lib/formatDate";
import { useSafeMotion } from "@/lib/motion";
import {
  staggerContainer,
  staggerItem,
  staggerContainerReduced,
  staggerItemReduced,
} from "@/lib/motion";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { DashboardKPICards } from "./DashboardKPICards";
import { GettingStarted } from "./GettingStarted";
import { AlertsPanel } from "./AlertsPanel";
import { IndicatorsPanel } from "./IndicatorsPanel";

/* Heavy chart/table components — lazy-loaded to reduce initial JS bundle */
const RevenueChart = dynamic(() => import("./RevenueChart").then(m => ({ default: m.RevenueChart })), {
  loading: () => <div className="bg-white rounded-safe p-6 shadow-xs"><div className="h-64 bg-neutral-50 rounded animate-pulse" /></div>,
});
const MonthlyComparisonChart = dynamic(() => import("./MonthlyComparisonChart").then(m => ({ default: m.MonthlyComparisonChart })), {
  loading: () => <div className="bg-white rounded-safe p-6 shadow-xs"><div className="h-64 bg-neutral-50 rounded animate-pulse" /></div>,
});
const LawyerProductivityTable = dynamic(() => import("./LawyerProductivityTable").then(m => ({ default: m.LawyerProductivityTable })));
const OutstandingAccountsTable = dynamic(() => import("./OutstandingAccountsTable").then(m => ({ default: m.OutstandingAccountsTable })));
const DashboardTasksAndAppointments = dynamic(() => import("./DashboardTasksAndAppointments").then(m => ({ default: m.DashboardTasksAndAppointments })));
const BillingPipeline = dynamic(() => import("./BillingPipeline").then(m => ({ default: m.BillingPipeline })));

export interface DashboardViewProps {
  payload: DashboardPayload;
}

export function DashboardView({ payload }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const {
    visibility,
    kpis,
    revenueChartData,
    monthlyComparison,
    lawyerProductivity,
    outstandingAccounts,
    billingFollowUp,
    alerts,
    soldeFideicommis,
    upcomingTasks,
    upcomingEvents,
    indicators,
  } = payload;

  const now = new Date();
  const dateFormatted = formatDateTimeHeader(now, locale);
  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion ? staggerContainerReduced : staggerContainer;
  const itemVariants = reduceMotion ? staggerItemReduced : staggerItem;

  return (
    <motion.div
      className="space-y-6 md:space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HEADER                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                SAFE — {t("overview").toUpperCase()}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">{dateFormatted}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Database className="w-3 h-3" />
              <span>Sources : Journal de transaction + Fiche de temps + tblClientMaster</span>
            </div>
          </div>
        </header>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  KPI ROW 1 & 2 (8 cards in 2 rows of 4)                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {visibility.showFinancialKpis && (
        <motion.section variants={itemVariants}>
          {payload.allKpisZero && payload.onboardingChecklist ? (
            <GettingStarted checklist={payload.onboardingChecklist} />
          ) : (
            <DashboardKPICards
              kpis={kpis}
              visibility={{
                showFinancialKpis: visibility.showFinancialKpis,
                showExpenses: visibility.showExpenses,
                showTrustBalance: visibility.showTrustBalance,
              }}
            />
          )}
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Revenu encaissé par mois (area chart)                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {visibility.showRevenueChart && !payload.allKpisZero && (
        <motion.section variants={itemVariants}>
          <RevenueChart data={revenueChartData} />
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TABLEAU 2: Performance Avocats                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants}>
        <LawyerProductivityTable rows={lawyerProductivity} />
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  SECTION 3: Top 10 Comptes en souffrance                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {visibility.showFinancialKpis && outstandingAccounts.length > 0 && (
        <motion.section variants={itemVariants}>
          <OutstandingAccountsTable rows={outstandingAccounts} />
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  SECTION 4: Indicateurs & Fidéicommis                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants}>
        <IndicatorsPanel indicators={indicators} soldeFideicommis={soldeFideicommis} />
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Facturé vs Encaissé (grouped bar chart)                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {visibility.showRevenueChart && !payload.allKpisZero && (
        <motion.section variants={itemVariants}>
          <MonthlyComparisonChart rows={monthlyComparison} />
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Alerts + Tasks/Appointments                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibility.showAlerts && <AlertsPanel alerts={alerts} />}
        <DashboardTasksAndAppointments tasks={upcomingTasks} events={upcomingEvents} />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  Billing Pipeline                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {visibility.showBillingFollowUp && (
        <motion.section variants={itemVariants}>
          <BillingPipeline rows={billingFollowUp} />
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FOOTER                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.footer
        variants={itemVariants}
        className="text-center text-xs text-[var(--safe-text-muted)] border-t border-[var(--safe-neutral-100)] pt-4 pb-2"
      >
        SAFE {now.getFullYear()} — Se met à jour automatiquement — Sources : Journal + Fiche de temps + tblClientMaster
      </motion.footer>
    </motion.div>
  );
}
