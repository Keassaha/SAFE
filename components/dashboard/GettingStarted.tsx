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

export function GettingStarted({ checklist }: GettingStartedProps) {
  const t = useTranslations("dashboard.gettingStarted");
  const completedCount = ITEMS.filter(({ key }) => checklist[key]).length;
  const progressPercent = (completedCount / TOTAL_STEPS) * 100;

  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-amber-500">
      <div className="mb-4">
        <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5 tracking-tight">
          <Sparkles className="w-4 h-4 text-amber-600" aria-hidden />
          {t("title")}
        </h3>
        <p className="text-xs safe-text-secondary mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-xs safe-text-secondary mb-1.5">
          <span>{t("progressLabel", { current: completedCount, total: TOTAL_STEPS })}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "tween", duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <ul className="space-y-3" role="list">
        {ITEMS.map(({ key, href, labelKey }) => {
          const done = checklist[key];
          return (
            <li key={key}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-safe px-3 py-2 transition-colors ${
                  done
                    ? "bg-white/10 text-[var(--safe-text-secondary)]"
                    : "bg-white/5 hover:bg-white/10 text-[var(--safe-text-title)]"
                }`}
                aria-label={done ? t("doneLabel", { label: t(labelKey) }) : t("todoLabel", { label: t(labelKey) })}
              >
                <motion.span
                  className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    done ? "border-emerald-500 bg-emerald-500/20" : "border-[var(--safe-neutral-border)]"
                  }`}
                  aria-hidden
                  role="img"
                  aria-label={done ? t("checked") : t("unchecked")}
                  animate={
                    done
                      ? {
                          boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0)", "0 0 12px 2px rgba(16, 185, 129, 0.4)", "0 0 8px 1px rgba(16, 185, 129, 0.25)"],
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
                      <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-[var(--safe-neutral-border)]" strokeWidth={2} />
                  )}
                </motion.span>
                <span className="flex-1 text-sm font-medium">{t(labelKey)}</span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
