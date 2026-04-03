"use client";

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
import { RevenueChart } from "./RevenueChart";
import { MonthlyComparisonChart } from "./MonthlyComparisonChart";
import { LawyerProductivityTable } from "./LawyerProductivityTable";
import { OutstandingAccountsTable } from "./OutstandingAccountsTable";
import { IndicatorsPanel } from "./IndicatorsPanel";
import { GettingStarted } from "./GettingStarted";
import { AlertsPanel } from "./AlertsPanel";
import { DashboardTasksAndAppointments } from "./DashboardTasksAndAppointments";
import { BillingPipeline } from "./BillingPipeline";

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[1.75rem] font-bold text-[#1a2e28] tracking-tight">
              SAFE — {t("overview").toUpperCase()}
            </h1>
            <p className="text-sm text-[#6b8f7b] mt-0.5">{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b8f7b]">
            <Database className="w-3 h-3" />
            <span>Sources : Journal de transaction + Fiche de temps + tblClientMaster</span>
          </div>
        </div>
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
        className="text-center text-[11px] text-[#6b8f7b] border-t border-[#e0ebe4] pt-4 pb-2"
      >
        SAFE {now.getFullYear()} — Se met à jour automatiquement — Sources : Journal + Fiche de temps + tblClientMaster
      </motion.footer>
    </motion.div>
  );
}
