"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Grid3X3, Users, TrendingUp, Calendar, Share2, LayoutDashboard, Landmark, Send, ClipboardList } from "lucide-react";
import { formatDateTimeHeader } from "@/lib/formatDate";
import { routes } from "@/lib/routes";
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
import { GettingStarted } from "./GettingStarted";
import { LawyerProductivityTable } from "./LawyerProductivityTable";
import { ActiveCasesTable } from "./ActiveCasesTable";
import { BillingFollowUpTable } from "./BillingFollowUpTable";
import { AlertsPanel } from "./AlertsPanel";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { DashboardCalendar } from "./DashboardCalendar";
import { DashboardTransactionsList } from "./DashboardTransactionsList";
import { DashboardTasksAndAppointments } from "./DashboardTasksAndAppointments";
import { DossierEvolutionPanel } from "./DossierEvolutionPanel";

export interface DashboardViewProps {
  payload: DashboardPayload;
}

const viewTabs = [
  { id: "overview", labelKey: "tabs.overview", icon: Grid3X3 },
  { id: "clients", labelKey: "tabs.clients", icon: Users },
  { id: "rapports", labelKey: "tabs.reports", icon: TrendingUp },
  { id: "calendrier", labelKey: "tabs.calendar", icon: Calendar },
] as const;

export function DashboardView({ payload }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const {
    visibility,
    kpis,
    revenueChartData,
    lawyerProductivity,
    activeCases,
    billingFollowUp,
    alerts,
    activityFeed,
    transactionItems,
    soldeFideicommis,
    deboursARefacturer,
    deboursNonRembourses,
    upcomingTasks,
    upcomingEvents,
    dossierEvolution,
  } = payload;

  const now = new Date();
  const dateFormatted = formatDateTimeHeader(now, locale);
  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion ? staggerContainerReduced : staggerContainer;
  const itemVariants = reduceMotion ? staggerItemReduced : staggerItem;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl card-glass border border-white/30">
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              const href =
                tab.id === "overview"
                  ? "#"
                  : tab.id === "clients"
                    ? routes.clients
                    : tab.id === "rapports"
                      ? routes.rapports
                      : "/temps";
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-[var(--safe-text-secondary)] hover:bg-white/70 hover:text-[var(--safe-text-title)]"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl card-glass border border-white/30 text-sm font-medium text-[var(--safe-text-title)] hover:bg-white/90 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {t("share")}
        </button>
      </motion.header>

      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-white/90" aria-hidden />
          {t("overview")}
        </h1>
        <p className="text-white/80 text-sm mt-1">{dateFormatted}</p>
      </motion.div>

      {visibility.showFinancialKpis && (
        <motion.section variants={itemVariants}>
          <DashboardKPICards
            kpis={kpis}
            visibility={{
              showFinancialKpis: visibility.showFinancialKpis,
              showExpenses: visibility.showExpenses,
              showTrustBalance: visibility.showTrustBalance,
            }}
          />
        </motion.section>
      )}

      {(soldeFideicommis != null || deboursARefacturer != null || deboursNonRembourses != null) && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 text-sm">
          {soldeFideicommis != null && (
            <Link
              href={routes.comptes}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2.5 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors text-emerald-50"
            >
              <Landmark className="w-4 h-4 opacity-90 shrink-0" aria-hidden />
              <span className="opacity-90">{t("trustBalance")} : </span>
              <span className="font-semibold">{soldeFideicommis}</span>
            </Link>
          )}
          {deboursARefacturer != null && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-4 py-2.5 border border-amber-400/30 text-amber-50">
              <Send className="w-4 h-4 opacity-90 shrink-0" aria-hidden />
              <span className="opacity-90">{t("disbursementsToReinvoice")} : </span>
              <span className="font-semibold">{deboursARefacturer}</span>
            </div>
          )}
          {deboursNonRembourses != null && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500/15 px-4 py-2.5 border border-orange-400/30 text-orange-50">
              <ClipboardList className="w-4 h-4 opacity-90 shrink-0" aria-hidden />
              <span className="opacity-90">{t("unreimbursedDisbursements")} : </span>
              <span className="font-semibold">{deboursNonRembourses}</span>
            </div>
          )}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {visibility.showRevenueChart &&
            (payload.allKpisZero && payload.onboardingChecklist ? (
              <GettingStarted checklist={payload.onboardingChecklist} />
            ) : (
              <RevenueChart data={revenueChartData} />
            ))}
          <DashboardTasksAndAppointments
            tasks={upcomingTasks}
            events={upcomingEvents}
          />
          {visibility.showLawyerProductivity && lawyerProductivity.length > 0 && (
            <LawyerProductivityTable rows={lawyerProductivity} />
          )}
        </div>
        <div className="lg:col-span-4 space-y-6">
          {visibility.showCalendar && (
            <DashboardCalendar
              month={now.getMonth()}
              year={now.getFullYear()}
              today={now.getDate()}
              tasks={upcomingTasks}
              events={upcomingEvents}
            />
          )}
          {visibility.showTransactionsList && (
            <DashboardTransactionsList
              items={transactionItems}
              viewAllHref={routes.rapports}
            />
          )}
        </div>
      </motion.div>

      <motion.section variants={itemVariants}>
        <DossierEvolutionPanel dossiers={dossierEvolution} />
      </motion.section>

      {visibility.showActiveCases && activeCases.length > 0 && (
        <motion.section variants={itemVariants}>
          <ActiveCasesTable rows={activeCases} />
        </motion.section>
      )}

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {visibility.showBillingFollowUp && (
          <motion.div variants={itemVariants}>
            <BillingFollowUpTable rows={billingFollowUp} />
          </motion.div>
        )}
        {visibility.showAlerts && (
          <motion.div variants={itemVariants}>
            <AlertsPanel alerts={alerts} />
          </motion.div>
        )}
        {visibility.showActivityFeed && (
          <motion.div variants={itemVariants}>
            <DashboardActivityFeed items={activityFeed} />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
