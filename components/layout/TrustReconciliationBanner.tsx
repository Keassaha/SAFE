import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

type Props = {
  status: TrustReconciliationStatus;
  /**
   * Province du cabinet (ex. "QC", "ON"). Pilote la réglementation citée et la
   * langue de la bannière. QC → Règlement B-1, r.5 (Barreau du Québec), en
   * français. Toute autre valeur (ou absente) → LSO By-Law 9 (Ontario), en
   * anglais — comportement historique inchangé.
   */
  province?: string | null;
};

/**
 * Persistent banner shown at the top of every app page when the cabinet
 * is overdue on its monthly trust account reconciliation.
 *
 * Hidden when:
 * - status === null (no trust activity at all)
 * - !status.isOverdue
 *
 * Visual: red banner with one-click action to start reconciliation.
 * Wording adapts whether the cabinet has never reconciled vs occasionally late.
 */
export function TrustReconciliationBanner({ status, province }: Props) {
  if (!status.isOverdue) return null;

  const isQuebec = (province ?? "").toUpperCase() === "QC";

  const headline = isQuebec
    ? status.hasNeverReconciled
      ? "URGENT — Compte en fidéicommis jamais rapproché"
      : `Rapprochement du fidéicommis en retard — ${status.daysOverdue} jour${status.daysOverdue > 1 ? "s" : ""} après l'échéance (B-1, r.5)`
    : status.hasNeverReconciled
      ? "URGENT — Trust account never reconciled"
      : `Trust reconciliation overdue — ${status.daysOverdue} day${status.daysOverdue > 1 ? "s" : ""} past LSO By-Law 9 deadline`;

  const detail = isQuebec
    ? status.hasNeverReconciled
      ? `Le Règlement sur la comptabilité et les normes d'exercice professionnel des avocats (B-1, r.5) exige un rapprochement mensuel à trois voies. La période attendue (${status.expectedPeriode}) n'a pas été certifiée. Un manquement peut exposer le cabinet à des sanctions du Barreau du Québec.`
      : `Période requise : ${status.expectedPeriode}. Dernière certifiée : ${status.lastCertifiedPeriode ?? "jamais"}. À régulariser sans délai pour rester conforme au Barreau du Québec.`
    : status.hasNeverReconciled
      ? `LSO By-Law 9 sec. 9.01 requires monthly 3-way reconciliation within 25 days of period end. The expected period (${status.expectedPeriode}) has not been certified. Failure to comply exposes the firm to administrative suspension.`
      : `Required period: ${status.expectedPeriode}. Last certified: ${status.lastCertifiedPeriode ?? "never"}. Resolve immediately to maintain LSO compliance.`;

  const ctaLabel = isQuebec ? "Rapprocher maintenant" : "Reconcile Now";

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="bg-red-100 p-1.5 rounded-full shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-red-800 font-semibold text-sm leading-tight">{headline}</p>
            <p className="text-red-700 text-xs mt-1 leading-snug">{detail}</p>
          </div>
        </div>
        <Link
          href="/comptes/rapprochement"
          className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 shadow-sm"
        >
          {ctaLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
