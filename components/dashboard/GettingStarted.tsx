"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Circle, Sparkles, ArrowRight } from "lucide-react";
import { routes } from "@/lib/routes";
import type { OnboardingChecklist } from "@/lib/dashboard/types";

export interface GettingStartedProps {
  checklist: OnboardingChecklist;
}

const ITEMS: {
  key: keyof OnboardingChecklist;
  href: string;
  labelKey: string;
}[] = [
  { key: "cabinetConfigured", href: routes.parametres, labelKey: "configureCabinet" },
  { key: "hasClient", href: routes.clientNouveau, labelKey: "addFirstClient" },
  { key: "hasDossier", href: routes.dossierNouveau(), labelKey: "createFirstDossier" },
  { key: "hasTimeEntry", href: routes.temps, labelKey: "logFirstHours" },
  { key: "hasInvoice", href: routes.facturationFactureNouvelle, labelKey: "createFirstInvoice" },
];

const TOTAL_STEPS = ITEMS.length;

/**
 * Éditorial Chaleureux onboarding — sand-50 card with forest-green progress
 * and check affordance. No white-alpha, no dark-mode overlays.
 */
export function GettingStarted({ checklist }: GettingStartedProps) {
  const t = useTranslations("dashboard.gettingStarted");
  const completedCount = ITEMS.filter(({ key }) => checklist[key]).length;
  const progressPercent = (completedCount / TOTAL_STEPS) * 100;

  return (
    <div
      className="overflow-hidden p-5 md:p-6"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderLeft: "4px solid var(--brand-800)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div className="mb-4">
        <h3
          className="flex items-center gap-1.5 tracking-tight"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--zinc-950)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          <Sparkles
            className="w-4 h-4"
            strokeWidth={1.5}
            style={{ color: "var(--brand-800)" }}
            aria-hidden
          />
          {t("title")}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--sand-600)" }}>
          {t("subtitle")}
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mb-5">
        <div
          className="flex justify-between text-xs mb-1.5"
          style={{ color: "var(--sand-700)" }}
        >
          <span>
            {t("progressLabel", { current: completedCount, total: TOTAL_STEPS })}
          </span>
          <span className="tabular-nums">{Math.round(progressPercent)}%</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--sand-200)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--brand-800)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "tween", duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <ul className="space-y-2" role="list">
        {ITEMS.map(({ key, href, labelKey }) => {
          const done = checklist[key];
          return (
            <li key={key}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                style={{
                  background: done ? "var(--sand-100)" : "transparent",
                  color: done ? "var(--sand-700)" : "var(--zinc-950)",
                  border: "1px solid var(--sand-300)",
                  textDecoration: "none",
                }}
                aria-label={
                  done
                    ? t("doneLabel", { label: t(labelKey) })
                    : t("todoLabel", { label: t(labelKey) })
                }
              >
                <motion.span
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: done ? "var(--brand-800)" : "var(--sand-50)",
                    border: `1.5px solid ${done ? "var(--brand-800)" : "var(--sand-400)"}`,
                  }}
                  aria-hidden
                  role="img"
                  aria-label={done ? t("checked") : t("unchecked")}
                  animate={
                    done
                      ? {
                          boxShadow: [
                            "0 0 0 0 rgba(31,58,46,0)",
                            "0 0 10px 2px rgba(31,58,46,0.30)",
                            "0 0 6px 1px rgba(31,58,46,0.18)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    done
                      ? { duration: 0.4, times: [0, 0.6, 1] }
                      : {}
                  }
                >
                  {done ? (
                    <motion.span
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                    >
                      <Check
                        className="h-3.5 w-3.5"
                        strokeWidth={2.5}
                        style={{ color: "var(--sand-50)" }}
                      />
                    </motion.span>
                  ) : (
                    <Circle
                      className="h-3 w-3"
                      strokeWidth={2}
                      style={{ color: "var(--sand-500, #BCAD8D)" }}
                    />
                  )}
                </motion.span>
                <span
                  className="flex-1 text-sm"
                  style={{ fontWeight: done ? 500 : 600 }}
                >
                  {t(labelKey)}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.5}
                  style={{ color: "var(--sand-600)" }}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
