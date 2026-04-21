"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  CreditCard,
  FileWarning,
  Percent,
  Clock,
  FileCheck,
  UserCheck,
  Bell,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Landmark,
  Send,
  FileText,
  FileX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDateTimeHeader } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/utils/format";
import { useSafeMotion } from "@/lib/motion";
import {
  staggerContainer,
  staggerItem,
  staggerContainerReduced,
  staggerItemReduced,
} from "@/lib/motion";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { GettingStarted } from "./GettingStarted";
import { DashboardTasksAndAppointments } from "./DashboardTasksAndAppointments";
import { BillingPipeline } from "./BillingPipeline";
import { routes } from "@/lib/routes";

/* Lazy-load heavy recharts */
const RevenueChart = dynamic(
  () => import("./RevenueChart").then((m) => ({ default: m.RevenueChart })),
  { loading: () => <div style={{ height: 288, borderRadius: 20, background: "rgba(255,255,255,0.5)" }} className="animate-pulse" /> }
);
const MonthlyComparisonChart = dynamic(
  () => import("./MonthlyComparisonChart").then((m) => ({ default: m.MonthlyComparisonChart })),
  { loading: () => <div style={{ height: 288, borderRadius: 20, background: "rgba(255,255,255,0.5)" }} className="animate-pulse" /> }
);

/* ─────────────────────────────────────────────────── */
/*  Shared inline styles (bypass CSS variables)        */
/* ─────────────────────────────────────────────────── */

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
};

const glassHero: React.CSSProperties = {
  background: "linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)",
  borderRadius: 20,
  border: "none",
  boxShadow: "0 8px 32px rgba(5,150,105,0.25), 0 2px 8px rgba(0,0,0,0.06)",
  color: "#fff",
};

/* ─────────────────────────────────────────────────── */
/*  Sub-components                                     */
/* ─────────────────────────────────────────────────── */

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  accentBg,
  accentText,
  hero,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  hero?: boolean;
}) {
  const up = trend != null && trend > 0;
  const down = trend != null && trend < 0;

  return (
    <div
      style={hero ? glassHero : glass}
      className="p-5 md:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: hero ? "rgba(255,255,255,0.7)" : "#9ca3af" }}
        >
          {title}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: hero ? "rgba(255,255,255,0.15)" : accentBg,
          }}
        >
          <span style={{ color: hero ? "#fff" : accentText }}>{icon}</span>
        </div>
      </div>
      <p
        className="text-3xl md:text-4xl font-extrabold tracking-tight tabular-nums"
        style={{ color: hero ? "#fff" : "#1f2937" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[12px] mt-1" style={{ color: hero ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
          {subtitle}
        </p>
      )}
      {trend != null && (
        <div className="flex items-center gap-2 mt-3">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: hero
                ? "rgba(255,255,255,0.15)"
                : up
                  ? "#ecfdf5"
                  : down
                    ? "#fef2f2"
                    : "#f3f4f6",
              color: hero
                ? (up ? "#a7f3d0" : down ? "#fca5a5" : "rgba(255,255,255,0.6)")
                : up
                  ? "#059669"
                  : down
                    ? "#ef4444"
                    : "#6b7280",
            }}
          >
            {up && <TrendingUp className="w-3 h-3" />}
            {down && <TrendingDown className="w-3 h-3" />}
            {trend === 0 && <Minus className="w-3 h-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
          {trendLabel && (
            <span className="text-[11px]" style={{ color: hero ? "rgba(255,255,255,0.4)" : "#d1d5db" }}>
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Main DashboardView                                 */
/* ─────────────────────────────────────────────────── */

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

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <motion.div
      className="space-y-8 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  HERO HEADER                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={itemVariants}
        style={{
          ...glass,
          padding: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(110,231,183,0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -20,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(147,197,253,0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, padding: "32px 36px" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#10b981",
                  marginBottom: 4,
                }}
              >
                {greeting}
              </p>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Vue d&apos;ensemble
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <CalendarDays size={14} style={{ color: "#9ca3af" }} />
                <span style={{ fontSize: 14, color: "#9ca3af" }}>{dateFormatted}</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.6)",
                borderRadius: 999,
                padding: "6px 14px",
                border: "1px solid rgba(255,255,255,0.8)",
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} className="animate-pulse" />
              Données en temps réel
            </div>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  KPI GRID — 2 rows of 4                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {visibility.showFinancialKpis && (
        <motion.section variants={itemVariants}>
          {payload.allKpisZero && payload.onboardingChecklist ? (
            <GettingStarted checklist={payload.onboardingChecklist} />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title={t("kpi.revenueInvoiced")}
                  value={kpis.revenueThisMonth.value}
                  subtitle={kpis.revenueThisMonth.subtitle}
                  trend={kpis.revenueThisMonth.trend}
                  trendLabel={kpis.revenueThisMonth.trendLabel}
                  icon={<DollarSign className="w-5 h-5" />}
                  accentBg="#d1fae5"
                  accentText="#059669"
                  hero
                />
                <KpiCard
                  title={t("kpi.revenueCollected")}
                  value={kpis.paymentsReceived.value}
                  subtitle={kpis.paymentsReceived.subtitle}
                  trend={kpis.paymentsReceived.trend}
                  trendLabel={kpis.paymentsReceived.trendLabel}
                  icon={<CreditCard className="w-5 h-5" />}
                  accentBg="#dbeafe"
                  accentText="#2563eb"
                />
                <KpiCard
                  title={t("kpi.cashNotReceived")}
                  value={kpis.cashNotReceived.value}
                  subtitle={kpis.cashNotReceived.subtitle}
                  icon={<FileWarning className="w-5 h-5" />}
                  accentBg="#fef3c7"
                  accentText="#d97706"
                />
                <KpiCard
                  title={t("kpi.recoveryRate")}
                  value={kpis.recoveryRate.value}
                  subtitle={kpis.recoveryRate.subtitle}
                  icon={<Percent className="w-5 h-5" />}
                  accentBg="#cffafe"
                  accentText="#0891b2"
                />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title={t("kpi.hoursWorked")}
                  value={kpis.hoursWorked.value}
                  subtitle={kpis.hoursWorked.subtitle}
                  icon={<Clock className="w-5 h-5" />}
                  accentBg="#ede9fe"
                  accentText="#7c3aed"
                />
                <KpiCard
                  title={t("kpi.hoursBilled")}
                  value={kpis.hoursBilled.value}
                  subtitle={kpis.hoursBilled.subtitle}
                  icon={<FileCheck className="w-5 h-5" />}
                  accentBg="#dbeafe"
                  accentText="#2563eb"
                />
                <KpiCard
                  title={t("kpi.billingRate")}
                  value={kpis.billingRate.value}
                  subtitle={kpis.billingRate.subtitle}
                  icon={<Percent className="w-5 h-5" />}
                  accentBg="#d1fae5"
                  accentText="#059669"
                />
                <KpiCard
                  title={t("kpi.revenuePerLawyer")}
                  value={kpis.revenuePerLawyer.value}
                  subtitle={kpis.revenuePerLawyer.subtitle}
                  icon={<UserCheck className="w-5 h-5" />}
                  accentBg="#cffafe"
                  accentText="#0891b2"
                />
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  REVENUE CHART                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {visibility.showRevenueChart && !payload.allKpisZero && (
        <motion.section variants={itemVariants}>
          <RevenueChart data={revenueChartData} />
        </motion.section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  LAWYER PRODUCTIVITY                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} style={glass} className="p-6 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Users className="w-4 h-4" style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                {t("performance.title")}
              </h3>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                {t("performance.subtitle")}
              </p>
            </div>
          </div>
          <Link
            href={routes.temps}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2563eb",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 10,
              background: "#eff6ff",
            }}
          >
            {t("viewTimesheets")}
          </Link>
        </div>

        {lawyerProductivity.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db", fontSize: 14 }}>
            {t("noProductivityData")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {[t("performance.lawyer"), t("performance.hours"), t("performance.amount"), t("performance.billableHours"), t("performance.billingRate")].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 0 ? "left" : "right",
                        padding: "10px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#9ca3af",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lawyerProductivity.slice(0, 10).map((row) => (
                  <tr key={row.userId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600, color: "#111827" }}>{row.lawyerName}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", color: "#6b7280" }}>{row.hoursWorked.toFixed(1)} h</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600, color: "#111827" }}>{formatCurrency(row.valueBillable, "CAD", locale)}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", color: "#6b7280" }}>{row.billableHours.toFixed(1)} h</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: row.billingRate >= 80 ? "#ecfdf5" : row.billingRate >= 50 ? "#fffbeb" : "#fef2f2",
                          color: row.billingRate >= 80 ? "#059669" : row.billingRate >= 50 ? "#d97706" : "#ef4444",
                        }}
                      >
                        {row.billingRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  INDICATORS & TRUST                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} style={glass} className="p-6 md:p-7">
        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Landmark className="w-4 h-4" style={{ color: "#059669" }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
            {t("indicators.title")}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
          {[
            { label: t("indicators.invoicesSent"), value: indicators.invoicesSent, icon: Send, bg: "#ecfdf5", color: "#059669" },
            { label: t("indicators.invoicesPending"), value: indicators.invoicesPending, icon: Clock, bg: "#fffbeb", color: "#d97706" },
            { label: t("indicators.timeEntries"), value: indicators.timeEntries, icon: FileText, bg: "#eff6ff", color: "#2563eb" },
            { label: t("indicators.unbilledEntries"), value: indicators.unbilledEntries, icon: FileX, bg: "#fef2f2", color: "#ef4444" },
            { label: t("indicators.accruedInterest"), value: formatCurrency(indicators.accruedInterest, "CAD"), icon: Percent, bg: "#fff7ed", color: "#ea580c" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  textAlign: "center",
                  background: `linear-gradient(135deg, ${item.bg} 0%, rgba(255,255,255,0.8) 100%)`,
                  border: "1px solid rgba(255,255,255,0.7)",
                  transition: "all 0.2s ease",
                }}
                className="hover:scale-[1.03] hover:shadow-md"
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.8)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: item.color }} className="tabular-nums">{item.value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 4 }}>{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Trust bar */}
        <div
          style={{
            borderRadius: 14,
            padding: "16px 20px",
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #a7f3d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5" style={{ color: "#059669" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>
              {t("indicators.activeTrust")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: 20, fontWeight: 800, color: "#059669" }} className="tabular-nums">
              {indicators.activeTrustAccounts}
            </span>
            {soldeFideicommis && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#059669",
                  background: "rgba(255,255,255,0.6)",
                  padding: "4px 12px",
                  borderRadius: 10,
                }}
                className="tabular-nums"
              >
                {soldeFideicommis}
              </span>
            )}
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MONTHLY COMPARISON CHART                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {visibility.showRevenueChart && !payload.allKpisZero && (
        <motion.section variants={itemVariants}>
          <MonthlyComparisonChart rows={monthlyComparison} />
        </motion.section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  ALERTS + TASKS  (side by side)                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts */}
        {visibility.showAlerts && (
          <div style={glass} className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: alerts.length > 0 ? "#fef3c7" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell className="w-4 h-4" style={{ color: alerts.length > 0 ? "#d97706" : "#059669" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
                {t("alerts")}
              </h3>
              {alerts.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 999 }}>
                  {alerts.length}
                </span>
              )}
            </div>

            {alerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#10b981" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{t("noAlerts")}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Tout est en ordre</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {alerts.map((alert, i) => (
                  <li key={`${alert.type}-${i}`}>
                    <Link
                      href={alert.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #fffbeb 0%, rgba(255,255,255,0.8) 100%)",
                        border: "1px solid #fde68a",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="group hover:shadow-md hover:border-amber-300"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#d97706" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>{alert.type}</p>
                        <p style={{ fontSize: 12, color: "#d97706", margin: "2px 0 0" }}>{alert.message}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#fbbf24" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Tasks & Appointments */}
        <DashboardTasksAndAppointments tasks={upcomingTasks} events={upcomingEvents} />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  BILLING PIPELINE                                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {visibility.showBillingFollowUp && (
        <motion.section variants={itemVariants}>
          <BillingPipeline rows={billingFollowUp} />
        </motion.section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  FOOTER                                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.footer
        variants={itemVariants}
        style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", paddingTop: 16 }}
      >
        SAFE {now.getFullYear()} — Mise à jour automatique
      </motion.footer>
    </motion.div>
  );
}
