"use client";

import { useTranslations } from "next-intl";
import type { GuardWarning } from "@/lib/accounting/anti-erreurs";

/**
 * Les avertissements comptables, enfin montrés.
 *
 * `createPayment` en calcule depuis sa création, la route les renvoie au
 * navigateur, et aucun écran ne les lisait : ils tombaient dans le vide. Ce
 * bandeau les affiche, APRÈS l'écriture — l'argent est déjà au journal quand il
 * paraît, et il ne prétend donc jamais empêcher quoi que ce soit.
 *
 * L'ambre plutôt que le rouge : ce sont des états permis mais risqués, pas des
 * erreurs. La doctrine §8 les distingue des blocages, qui eux lèvent.
 *
 * Le texte vient du code de l'avertissement, pas de la chaîne du serveur : le
 * service parle français, l'écran parle la langue de l'utilisateur. La chaîne du
 * serveur reste le repli pour tout code que l'écran ne connaît pas encore.
 *
 * Demande CEO du 2026-09-14.
 */
export function AvertissementsComptables({
  warnings,
  onDeclarerTransmission,
  onFermer,
}: {
  warnings: GuardWarning[];
  /** Proposé seulement sur l'avertissement de transmission, qui vise une facture. */
  onDeclarerTransmission?: (invoiceId: string, numero?: string) => void;
  onFermer: () => void;
}) {
  const t = useTranslations("billingUi");
  if (warnings.length === 0) return null;

  const texte = (w: GuardWarning): string => {
    if (w.code === "PAYMENT_ON_UNDELIVERED_INVOICE") {
      return w.invoiceNumero
        ? t("warnPaymentOnUndeliveredInvoice", { numero: w.invoiceNumero })
        : t("warnPaymentOnUndeliveredInvoiceNoNumber");
    }
    return w.message;
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-3 border-l-2 border-si-amber bg-status-warning-bg px-4 py-3.5"
    >
      <div className="min-w-0 flex-1 space-y-2">
        {warnings.map((w, i) => (
          <div key={`${w.code}-${i}`} className="min-w-0">
            <p className="text-sm font-medium text-si-amber-ink">{texte(w)}</p>
            {w.code === "PAYMENT_ON_UNDELIVERED_INVOICE" ? (
              <p className="mt-0.5 max-w-[80ch] text-[12.5px] leading-relaxed text-si-muted">
                {t("warnUndeliveredDetail")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* Le geste de réparation, sur place. C'est ce qui évite d'aller
            chercher la facture dans un autre écran. */}
        {onDeclarerTransmission
          ? warnings
              .filter((w) => w.code === "PAYMENT_ON_UNDELIVERED_INVOICE" && w.invoiceId)
              .slice(0, 1)
              .map((w) => (
                <button
                  key={w.invoiceId}
                  type="button"
                  onClick={() => onDeclarerTransmission(w.invoiceId as string, w.invoiceNumero)}
                  className="min-h-tap inline-flex items-center rounded-md bg-si-ink px-3 text-[13px] font-medium text-si-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
                >
                  {t("declareDelivery")}
                </button>
              ))
          : null}
        <button
          type="button"
          onClick={onFermer}
          aria-label={t("warnClose")}
          className="min-h-tap inline-flex items-center rounded-md px-2 text-[12.5px] text-si-muted underline decoration-si-line underline-offset-2 hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
        >
          {t("warnDismiss")}
        </button>
      </div>
    </div>
  );
}
