"use client";

import { useTranslations } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export type InvoiceTemplateItem = {
  id: string;
  type: string;
  description: string;
  date: string | Date;
  hours: number | null;
  rate: number | null;
  amount: number;
  userNom?: string | null;
};

export type InvoiceTemplateProps = {
  numero: string;
  dateEmission: string | Date;
  dateEcheance: string | Date;
  statut?: string;
  cabinet?: {
    nom: string;
    adresse?: string | null;
  } | null;
  client?: {
    raisonSociale: string;
    billingAddress?: string | null;
    billingCity?: string | null;
    billingProvince?: string | null;
    billingPostalCode?: string | null;
    billingCountry?: string | null;
  } | null;
  dossier?: {
    intitule: string;
    numeroDossier?: string | null;
  } | null;
  items: InvoiceTemplateItem[];
  subtotalTaxable?: number;
  tps?: number;
  tvq?: number;
  deboursNonTaxableTotal?: number;
  montantTotal: number;
  montantPaye?: number;
  balanceDue?: number;
  clientNote?: string | null;
  compact?: boolean;
  className?: string;
};

function formatClientAddress(client: NonNullable<InvoiceTemplateProps["client"]>): string[] {
  const lines: string[] = [];
  if (client.billingAddress) lines.push(client.billingAddress);
  const cityLine = [client.billingCity, client.billingProvince, client.billingPostalCode]
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine.trim());
  if (client.billingCountry) lines.push(client.billingCountry);
  return lines;
}

export function InvoiceTemplate({
  numero,
  dateEmission,
  dateEcheance,
  statut,
  cabinet,
  client,
  dossier,
  items,
  subtotalTaxable = 0,
  tps = 0,
  tvq = 0,
  deboursNonTaxableTotal = 0,
  montantTotal,
  montantPaye = 0,
  balanceDue = 0,
  clientNote,
  compact = false,
  className = "",
}: InvoiceTemplateProps) {
  const tf = useTranslations("facturation");
  const tc = useTranslations("common");

  const typeLabel: Record<string, string> = {
    honoraires: tf("typeHonoraires"),
    frais_rappel: tf("typeFrais"),
    debours_taxable: tf("taxableDisbursement"),
    debours_non_taxable: tf("nonTaxableDisbursement"),
    interets: tf("typeInterets"),
    rabais: tf("typeRabais"),
  };

  const isDueOnReceipt =
    typeof dateEmission === "string" && typeof dateEcheance === "string"
      ? new Date(dateEmission).toDateString() === new Date(dateEcheance).toDateString()
      : false;

  const totalRabais = items
    .filter((i) => i.type === "rabais")
    .reduce((s, i) => s + Math.abs(i.amount), 0);

  return (
    <article
      className={`invoice-template bg-[var(--safe-neutral-surface)] text-[var(--safe-text-title)] overflow-hidden rounded-[var(--safe-radius-xl)] border border-[var(--safe-neutral-border)] shadow-[var(--safe-shadow-lg)] print:shadow-none print:border print:rounded-lg ${className}`}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <header className="relative bg-[var(--safe-green-900)] text-white px-6 py-5 sm:px-8 sm:py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--safe-green-800)] to-[var(--safe-green-950)] opacity-95" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[var(--safe-green-600)]/20 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[var(--safe-green-100)] text-xs font-semibold uppercase tracking-widest mb-1">
              {tf("invoice")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {numero}
            </h1>
            {dossier && (
              <p className="mt-1 text-white/80 text-sm">
                {tf("matter")} : {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
                {dossier.intitule}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {statut && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--safe-green-600)]/90 text-white">
                {statut}
              </span>
            )}
            <div className="flex gap-6 text-sm text-white/90">
              <span>
                <span className="text-white/60">{tf("issueLabel")} : </span>
                {formatDate(dateEmission)}
              </span>
              <span>
                <span className="text-white/60">{tf("dueDateLabel")} : </span>
                {isDueOnReceipt ? tf("dueOnReceipt") : formatDate(dateEcheance)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5 sm:px-8 sm:py-6 border-b border-[var(--safe-neutral-border)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--safe-green-700)] mb-2">
            {tf("issuer")}
          </p>
          <p className="font-semibold text-[var(--safe-text-title)]">
            {cabinet?.nom ?? "Cabinet"}
          </p>
          {cabinet?.adresse && (
            <p className="mt-1 text-sm text-[var(--safe-text-secondary)] whitespace-pre-line">
              {cabinet.adresse}
            </p>
          )}
        </div>
        <div className="md:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--safe-green-700)] mb-2">
            {tf("billedTo")}
          </p>
          <p className="font-semibold text-[var(--safe-text-title)]">
            {client?.raisonSociale ?? tc("client")}
          </p>
          {client && formatClientAddress(client).length > 0 && (
            <div className="mt-1 text-sm text-[var(--safe-text-secondary)]">
              {formatClientAddress(client).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={compact ? "px-4 py-3" : "px-6 py-5 sm:px-8 sm:py-6"}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--safe-green-600)]">
              <th className="text-left py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)]">
                {tf("dateTask")}
              </th>
              <th className="text-left py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)]">
                {tc("description")}
              </th>
              <th className="text-left py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)] hidden sm:table-cell">
                {tc("type")}
              </th>
              <th className="text-right py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)]">
                {tf("hours")}
              </th>
              <th className="text-right py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)]">
                {tf("rate")}
              </th>
              <th className="text-right py-3 px-3 font-semibold text-[var(--safe-green-800)] bg-[var(--safe-green-50)]">
                {tc("total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isRabais = item.type === "rabais";
              const displayAmount = isRabais ? -Math.abs(item.amount) : item.amount;
              return (
                <tr
                  key={item.id}
                  className={
                    isRabais
                      ? "bg-[var(--safe-green-50)]/60"
                      : index % 2 === 0
                        ? "bg-[var(--safe-neutral-surface)]"
                        : "bg-[var(--safe-green-50)]/40"
                  }
                >
                  <td className="py-3 px-3 border-b border-[var(--safe-neutral-border)] text-[var(--safe-text-secondary)] whitespace-nowrap">
                    {item.date ? formatDate(item.date) : "—"}
                  </td>
                  <td className="py-3 px-3 border-b border-[var(--safe-neutral-border)]">
                    <span className={`font-medium ${isRabais ? "text-[var(--safe-green-800)]" : "text-[var(--safe-text-title)]"}`}>
                      {item.description}
                    </span>
                    {item.userNom && !isRabais && (
                      <p className="text-xs text-[var(--safe-text-secondary)] mt-0.5">
                        {item.userNom}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 border-b border-[var(--safe-neutral-border)] hidden sm:table-cell text-[var(--safe-text-secondary)]">
                    {typeLabel[item.type] ?? item.type}
                  </td>
                  <td className="py-3 px-3 border-b border-[var(--safe-neutral-border)] text-right text-[var(--safe-text-secondary)]">
                    {item.hours != null ? `${item.hours.toFixed(1)} h` : "—"}
                  </td>
                  <td className="py-3 px-3 border-b border-[var(--safe-neutral-border)] text-right text-[var(--safe-text-secondary)]">
                    {item.rate != null ? formatCurrency(item.rate) : "—"}
                  </td>
                  <td className={`py-3 px-3 border-b border-[var(--safe-neutral-border)] text-right font-medium tabular-nums ${isRabais ? "text-[var(--safe-green-700)]" : ""}`}>
                    {formatCurrency(displayAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 sm:px-8 sm:py-5 bg-[var(--safe-neutral-100)] border-t border-[var(--safe-neutral-border)]">
        <div className="max-w-xs ml-auto space-y-1.5 text-sm">
          {totalRabais > 0 && (
            <div className="flex justify-between text-[var(--safe-green-700)] font-medium">
              <span>{tf("totalDiscounts")}</span>
              <span className="tabular-nums">−{formatCurrency(totalRabais)}</span>
            </div>
          )}
          {subtotalTaxable > 0 && (
            <div className="flex justify-between text-[var(--safe-text-secondary)]">
              <span>{tf("subtotalTaxable")}</span>
              <span className="tabular-nums">{formatCurrency(subtotalTaxable)}</span>
            </div>
          )}
          {tps > 0 && (
            <div className="flex justify-between text-[var(--safe-text-secondary)]">
              <span>{tf("tpsLabel")}</span>
              <span className="tabular-nums">{formatCurrency(tps)}</span>
            </div>
          )}
          {tvq > 0 && (
            <div className="flex justify-between text-[var(--safe-text-secondary)]">
              <span>{tf("tvqLabel")}</span>
              <span className="tabular-nums">{formatCurrency(tvq)}</span>
            </div>
          )}
          {deboursNonTaxableTotal > 0 && (
            <div className="flex justify-between text-[var(--safe-text-secondary)]">
              <span>{tf("nonTaxableDisbursements")}</span>
              <span className="tabular-nums">{formatCurrency(deboursNonTaxableTotal)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-[var(--safe-green-800)] pt-2 border-t border-[var(--safe-neutral-border)]">
            <span>{tc("total")}</span>
            <span className="tabular-nums text-lg">{formatCurrency(montantTotal)}</span>
          </div>
          {montantPaye > 0 && (
            <div className="flex justify-between text-[var(--safe-text-secondary)]">
              <span>{tf("alreadyPaid")}</span>
              <span className="tabular-nums">−{formatCurrency(montantPaye)}</span>
            </div>
          )}
          {(balanceDue > 0 || (montantPaye > 0 && balanceDue === 0)) && (
            <div className="flex justify-between font-semibold text-[var(--safe-text-title)] pt-1">
              <span>{tf("balanceDue")}</span>
              <span
                className={`tabular-nums ${balanceDue > 0 ? "text-[var(--safe-green-700)]" : "text-[var(--safe-status-success)]"}`}
              >
                {formatCurrency(balanceDue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {clientNote && (
        <footer className="px-6 py-4 sm:px-8 border-t border-[var(--safe-neutral-border)]">
          <p className="text-sm text-[var(--safe-text-secondary)] italic">
            {clientNote}
          </p>
        </footer>
      )}

      <div
        className="h-1 bg-gradient-to-r from-[var(--safe-green-700)] via-[var(--safe-green-600)] to-[var(--safe-green-700)]"
        aria-hidden
      />
    </article>
  );
}
