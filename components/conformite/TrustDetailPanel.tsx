import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Scale, ExternalLink } from "lucide-react";

/**
 * Détail fidéicommis pour la vue conformité (étape 3) : solde par dossier + total
 * + état du prochain rapprochement. Alimente « le détail derrière le score fiducie ».
 * Les soldes proviennent du registre append-only (source de vérité).
 */

export type TrustDetailLine = {
  clientId: string;
  dossierId: string | null;
  label: string;
  balance: number;
};

export type TrustDetail = {
  total: number;
  reconciliationStatus: "ok" | "overdue" | "critical";
  expectedPeriode: string;
  lastCertified: string | null;
  lines: TrustDetailLine[];
};

const MAX_LINES = 8;

export async function TrustDetailPanel({
  detail,
  isQuebec,
}: {
  detail: TrustDetail;
  isQuebec: boolean;
}) {
  const t = await getTranslations("conformite");
  const locale = isQuebec ? "fr-CA" : "en-CA";
  const money = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "CAD" }).format(n);

  const reconLabel =
    detail.reconciliationStatus === "critical"
      ? t("stReconOverdue")
      : detail.reconciliationStatus === "overdue"
        ? t("stReconDueSoon")
        : t("stReconUpToDate");
  const reconTone =
    detail.reconciliationStatus === "critical"
      ? "text-[#B84A3E]"
      : detail.reconciliationStatus === "overdue"
        ? "text-si-amber-ink"
        : "text-si-verified";

  const shown = detail.lines.slice(0, MAX_LINES);
  const remaining = detail.lines.length - shown.length;

  return (
    <div className="rounded-[var(--safe-radius-lg)] border border-si-line bg-si-surface p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-si-ink" aria-hidden />
          <h3 className="text-sm font-semibold text-si-ink">{t("trustDetailTitle")}</h3>
        </div>
        <span className="text-sm font-bold tabular-nums text-si-ink">{money(detail.total)}</span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-si-muted">{t("trustNextRecon", { periode: detail.expectedPeriode })}</span>
        <span className={`font-medium ${reconTone}`}>{reconLabel}</span>
      </div>

      {detail.lines.length === 0 ? (
        <p className="text-xs text-si-muted">{t("trustNoActivity")}</p>
      ) : (
        <ul className="divide-y divide-si-line">
          {shown.map((l) => {
            const inner = (
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-sm text-si-ink truncate">{l.label}</span>
                <span
                  className={`text-sm font-medium tabular-nums shrink-0 ${
                    l.balance < 0 ? "text-[#B84A3E]" : "text-si-ink"
                  }`}
                >
                  {money(l.balance)}
                </span>
              </div>
            );
            return (
              <li key={`${l.clientId}:${l.dossierId ?? "none"}`}>
                {l.dossierId ? (
                  <Link
                    href={`/dossiers/${l.dossierId}`}
                    className="block hover:bg-si-canvas/60 rounded px-1 -mx-1"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/comptes/rapprochement"
        className="inline-flex items-center gap-1 text-xs font-medium text-si-forest hover:underline"
      >
        {t("trustSeeReconciliation")}
        <ExternalLink className="w-3 h-3" aria-hidden />
        {remaining > 0 && <span className="text-si-muted ml-1">· {t("trustMore", { count: remaining })}</span>}
      </Link>
    </div>
  );
}
