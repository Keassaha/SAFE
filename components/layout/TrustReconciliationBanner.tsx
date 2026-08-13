"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

type Props = {
  status: TrustReconciliationStatus;
  /**
   * Province du cabinet (ex. "QC", "ON"). Pilote uniquement la réglementation
   * citée. La langue de l'interface suit la locale active.
   */
  province?: string | null;
};

/**
 * ⚠️ REMPLACÉ. Plus aucun écran ne monte ce composant.
 *
 * Ce bandeau rouge pleine largeur occupait le haut de chaque page tant qu'un
 * rapprochement restait en retard. Il ne se refermait pas, et il reléguait au
 * second plan l'objectif de la page en cours. Un outil de travail qui vit en
 * état d'alerte permanent finit par n'alerter plus de rien.
 *
 * L'obligation n'a pas disparu : elle est présentée par
 * `components/layout/AlertCenter.tsx`, un point d'entrée discret dans l'en-tête
 * qui porte le nombre d'obligations ouvertes et les liste au calme.
 *
 * Conservé le temps d'un cycle, au cas où le bandeau serait redemandé. À
 * supprimer ensuite, avec les clés `trustBanner` s'il ne reste plus rien qui
 * les emploie (le centre d'alertes les réutilise aujourd'hui).
 */
export function TrustReconciliationBanner({ status, province }: Props) {
  const t = useTranslations("trustBanner");
  const locale = useLocale();
  const pathname = usePathname();

  if (!status.isOverdue) return null;

  const isQuebec = (province ?? "").toUpperCase() === "QC";
  const jurisdiction = isQuebec ? "qc" : "on";
  const state = status.hasNeverReconciled ? "never" : "overdue";
  const headline = t(`${jurisdiction}.${state}.headline`, { days: status.daysOverdue });
  const detail = t(`${jurisdiction}.${state}.detail`, {
    expected: status.expectedPeriode,
    last: status.lastCertifiedPeriode ?? t("never"),
  });
  const isCurrentPage = pathname === "/comptes/rapprochement";

  return (
    <div className="border-b border-status-error/20 bg-status-error-bg px-4 py-3" role="status">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight text-status-error">{headline}</p>
            <p className="mt-1 hidden text-xs leading-snug text-si-muted sm:block">{detail}</p>
          </div>
        </div>
        {!isCurrentPage && (
          <Link
            href="/comptes/rapprochement"
            hrefLang={locale}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-status-error/30 px-3 text-sm font-medium text-status-error transition-colors hover:bg-status-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
          >
            {t("cta")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
