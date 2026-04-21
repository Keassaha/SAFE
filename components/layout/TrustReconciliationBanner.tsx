import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

type Props = {
  status: TrustReconciliationStatus;
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
export function TrustReconciliationBanner({ status }: Props) {
  if (!status.isOverdue) return null;

  const headline = status.hasNeverReconciled
    ? "URGENT — Trust account never reconciled"
    : `Trust reconciliation overdue — ${status.daysOverdue} day${status.daysOverdue > 1 ? "s" : ""} past LSO By-Law 9 deadline`;

  const detail = status.hasNeverReconciled
    ? `LSO By-Law 9 sec. 9.01 requires monthly 3-way reconciliation within 25 days of period end. The expected period (${status.expectedPeriode}) has not been certified. Failure to comply exposes the firm to administrative suspension.`
    : `Required period: ${status.expectedPeriode}. Last certified: ${status.lastCertifiedPeriode ?? "never"}. Resolve immediately to maintain LSO compliance.`;

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
          Reconcile Now
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
