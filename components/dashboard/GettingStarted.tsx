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
 * Checklist « Pour bien démarrer » — design safe-interface (si). Pilotée par
 * les données réelles du cabinet (chaque item se coche quand l'action est faite).
 * Affichée sur le tableau de bord tant que l'onboarding n'est pas complet.
 */
export function GettingStarted({ checklist }: GettingStartedProps) {
  const t = useTranslations("dashboard.gettingStarted");
  const completedCount = ITEMS.filter(({ key }) => checklist[key]).length;
  const progressPercent = (completedCount / TOTAL_STEPS) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-si-line border-l-4 border-l-si-forest bg-si-surface p-5 md:p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-1.5 font-serif text-[19px] leading-tight text-si-ink">
          <Sparkles className="w-4 h-4 text-si-forest" strokeWidth={1.5} aria-hidden />
          {t("title")}
        </h3>
        <p className="text-xs mt-1 text-si-muted">{t("subtitle")}</p>
      </div>

      {/* Barre de progression */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5 text-si-muted">
          <span>{t("progressLabel", { current: completedCount, total: TOTAL_STEPS })}</span>
          <span className="font-mono tabular-nums">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-si-canvas">
          <motion.div
            className="h-full rounded-full bg-si-forest"
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
                className={`flex items-center gap-3 rounded-lg border border-si-line px-3 py-2 transition-colors ${
                  done ? "bg-si-canvas text-si-muted" : "bg-transparent text-si-ink hover:bg-si-canvas"
                }`}
                aria-label={done ? t("doneLabel", { label: t(labelKey) }) : t("todoLabel", { label: t(labelKey) })}
              >
                <span
                  className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    done ? "bg-si-forest border-si-forest" : "bg-si-surface border-si-line"
                  }`}
                  aria-hidden
                  role="img"
                  aria-label={done ? t("checked") : t("unchecked")}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-si-surface" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-3 w-3 text-si-muted/50" strokeWidth={2} />
                  )}
                </span>
                <span className={`flex-1 text-sm ${done ? "font-medium" : "font-semibold"}`}>
                  {t(labelKey)}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-si-muted" strokeWidth={1.5} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
