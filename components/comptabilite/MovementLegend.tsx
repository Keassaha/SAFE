"use client";

import { useTranslations } from "next-intl";
import type { MovementKind } from "@/lib/accounting/movement-semantics";

/**
 * « Comprendre les mouvements » : une phrase par famille d'écriture.
 *
 * C'était une carte à titre en serif, avec cinq petites cartes portant chacune
 * une icône dans un carré teinté. Une légende se lit en liste : la pastille
 * reprend la couleur du tableau, le nom, la phrase. Demande CEO du 2026-09-12.
 */
const ROWS: { kind: MovementKind; titleKey: string; descKey: string; dot: string }[] = [
  { kind: "INVOICE_ISSUED", titleKey: "legendInvoiceTitle", descKey: "legendInvoiceDesc", dot: "bg-si-amber" },
  { kind: "PAYMENT_RECEIVED", titleKey: "legendPaymentTitle", descKey: "legendPaymentDesc", dot: "bg-si-verified" },
  { kind: "EXPENSE", titleKey: "legendExpenseTitle", descKey: "legendExpenseDesc", dot: "bg-si-danger" },
  { kind: "DISBURSEMENT", titleKey: "legendDisbursementTitle", descKey: "legendDisbursementDesc", dot: "bg-si-muted" },
  { kind: "TRUST_DEPOSIT", titleKey: "legendTrustTitle", descKey: "legendTrustDesc", dot: "bg-si-muted" },
];

export function MovementLegend() {
  const t = useTranslations("accountingUi");
  return (
    <section aria-label={t("understandTitle")} className="border-b border-si-line pb-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">{t("understandTitle")}</p>
      <ul className="mt-2 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {ROWS.map((row) => (
          <li key={row.kind} className="flex items-baseline gap-2 text-[13px] leading-5">
            <span className={`h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-sm ${row.dot}`} aria-hidden />
            <span>
              <span className="font-medium text-si-ink">{t(row.titleKey)}</span>
              <span className="text-si-muted"> · {t(row.descKey)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
