"use client";

import { useTranslations } from "next-intl";
import { FileText, Wallet, Receipt, HandCoins, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MovementKind } from "@/lib/accounting/movement-semantics";

/**
 * Panneau « Comprendre les mouvements » — explique en une phrase ce que fait
 * chaque grande famille d'écriture. Pédagogie pour avocat·e non comptable.
 */

type LegendRow = {
  kind: MovementKind;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  /** Pastille de couleur cohérente avec le tableau. */
  dot: string;
};

const ROWS: LegendRow[] = [
  { kind: "INVOICE_ISSUED", icon: FileText, titleKey: "legendInvoiceTitle", descKey: "legendInvoiceDesc", dot: "bg-si-amber" },
  { kind: "PAYMENT_RECEIVED", icon: Wallet, titleKey: "legendPaymentTitle", descKey: "legendPaymentDesc", dot: "bg-si-verified" },
  { kind: "EXPENSE", icon: Receipt, titleKey: "legendExpenseTitle", descKey: "legendExpenseDesc", dot: "bg-[#B84A3E]" },
  { kind: "DISBURSEMENT", icon: HandCoins, titleKey: "legendDisbursementTitle", descKey: "legendDisbursementDesc", dot: "bg-si-muted" },
  { kind: "TRUST_DEPOSIT", icon: Landmark, titleKey: "legendTrustTitle", descKey: "legendTrustDesc", dot: "bg-si-muted" },
];

export function MovementLegend() {
  const t = useTranslations("accountingUi");

  return (
    <section className="rounded-lg border border-si-line bg-si-surface p-5 md:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
        {t("understandEyebrow")}
      </p>
      <h2 className="mt-1 font-serif text-[20px] leading-tight text-si-ink">
        {t("understandTitle")}
      </h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.kind}
              className="flex gap-3 rounded-md border border-si-line bg-si-canvas p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-si-forest/[0.06] text-si-forest">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-medium text-si-ink">
                  <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} aria-hidden />
                  {t(row.titleKey)}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-si-muted">{t(row.descKey)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
