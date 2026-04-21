"use client";

import { formatCurrency, formatDate } from "@/lib/utils/format";

export type InvoiceCleanItem = {
  id: string;
  description: string;
  amount: number;
  hours?: number | null;
  rate?: number | null;
  date?: string | Date;
  type?: string;
};

export type InvoiceCleanProps = {
  numero: string;
  dateEmission: string | Date;
  dateEcheance: string | Date;
  cabinet?: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    barreauNumero?: string | null;
  } | null;
  client?: {
    raisonSociale: string | null;
    billingAddress?: string | null;
    billingCity?: string | null;
    billingProvince?: string | null;
    billingPostalCode?: string | null;
    billingCountry?: string | null;
    telephone?: string | null;
    email?: string | null;
  } | null;
  dossier?: {
    intitule: string;
    numeroDossier?: string | null;
  } | null;
  items: InvoiceCleanItem[];
  subtotalTaxable?: number;
  tps?: number;
  tvq?: number;
  montantTotal: number;
  montantPaye?: number;
  balanceDue?: number;
  clientNote?: string | null;
  className?: string;
};

function formatClientAddress(client: NonNullable<InvoiceCleanProps["client"]>): string[] {
  const lines: string[] = [];
  if (client.billingAddress) lines.push(client.billingAddress);
  const cityLine = [client.billingCity, client.billingProvince, client.billingPostalCode]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine.trim());
  if (client.billingCountry) lines.push(client.billingCountry);
  return lines;
}

const label = "text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-300";

export function InvoiceTemplateClean({
  numero,
  dateEmission,
  dateEcheance,
  cabinet,
  client,
  dossier,
  items,
  subtotalTaxable = 0,
  tps = 0,
  tvq = 0,
  montantTotal,
  montantPaye = 0,
  balanceDue = 0,
  clientNote,
  className = "",
}: InvoiceCleanProps) {
  return (
    <article
      className={`bg-white text-neutral-700 ${className}`}
      style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
    >
      {/* ── Subtle top accent bar ── */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400" />

      {/* ── Header: Cabinet name + contact info ── */}
      <div className="px-8 pt-7 pb-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight leading-tight">
              {cabinet?.nom ?? "Cabinet"}
            </h1>
            {cabinet?.adresse && (
              <p className="text-neutral-400 mt-1 text-[12px]">{cabinet.adresse}</p>
            )}
          </div>
          <div className="text-right space-y-0.5 text-[12px] text-neutral-400">
            {cabinet?.telephone && <p>{cabinet.telephone}</p>}
            {cabinet?.email && <p>{cabinet.email}</p>}
            {cabinet?.barreauNumero && (
              <p>
                <span className="text-neutral-300">Barreau</span>{" "}
                <span className="font-medium text-neutral-500">{cabinet.barreauNumero}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="mx-8 h-px bg-gradient-to-r from-neutral-200 via-neutral-100 to-transparent" />

      {/* ── Invoice meta + Client ── */}
      <div className="px-8 py-5">
        <div className="grid grid-cols-3 gap-5">
          {/* Invoice number */}
          <div>
            <p className={label}>Facture</p>
            <p className="font-bold text-neutral-900 text-[15px] mt-1 tracking-tight">
              {numero || "—"}
            </p>
          </div>

          {/* Client */}
          <div>
            <p className={label}>Client</p>
            {client ? (
              <div className="mt-1">
                <p className="font-semibold text-neutral-800 text-[13px]">
                  {client.raisonSociale}
                </p>
                {formatClientAddress(client).map((line, i) => (
                  <p key={i} className="text-neutral-400 text-[12px] leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-neutral-300 mt-1 italic text-[12px]">
                Aucun client
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="text-right space-y-3">
            <div>
              <p className={label}>Date</p>
              <p className="text-neutral-700 mt-1 text-[13px]">
                {formatDate(dateEmission)}
              </p>
            </div>
            <div>
              <p className={label}>Échéance</p>
              <p className="text-neutral-700 mt-1 text-[13px]">
                {formatDate(dateEcheance)}
              </p>
            </div>
          </div>
        </div>

        {dossier && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-neutral-50 inline-flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              Dossier
            </span>
            <span className="text-neutral-600 text-[12px] font-medium">
              {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
              {dossier.intitule}
            </span>
          </div>
        )}
      </div>

      {/* ── Table header separator ── */}
      <div className="mx-8 h-px bg-neutral-800" />

      {/* ── Line items table ── */}
      <div className="px-8 py-4">
        <div className="flex justify-between pb-3">
          <p className="font-bold text-neutral-800 text-[12px] uppercase tracking-wider">
            Description
          </p>
          <p className="font-bold text-neutral-800 text-[12px] uppercase tracking-wider">
            Montant
          </p>
        </div>

        <div className="space-y-0">
          {items.length > 0 ? (
            items.map((item, i) => (
              <div
                key={item.id}
                className={`flex justify-between py-3 ${
                  i < items.length - 1
                    ? "border-b border-dotted border-neutral-200"
                    : ""
                }`}
              >
                <div className="flex-1 pr-6">
                  <p className="text-neutral-700 text-[13px]">
                    {item.description || "—"}
                  </p>
                  {item.hours != null && item.hours > 0 && (
                    <p className="text-neutral-300 text-[11px] mt-0.5 font-medium">
                      {item.hours}h × {item.rate != null ? formatCurrency(item.rate) : "—"}/h
                    </p>
                  )}
                </div>
                <p className="text-neutral-800 font-semibold tabular-nums text-[13px] whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-4 text-neutral-300 italic text-[12px] text-center">
              Aucune ligne de facturation
            </div>
          )}
        </div>
      </div>

      {/* ── Taxes ── */}
      {(subtotalTaxable > 0 || tps > 0 || tvq > 0) && (
        <>
          <div className="mx-8 border-t border-dotted border-neutral-200" />
          <div className="px-8 py-3 space-y-1.5">
            {subtotalTaxable > 0 && (
              <div className="flex justify-between text-neutral-400 text-[12px]">
                <span>Sous-total</span>
                <span className="tabular-nums font-medium">{formatCurrency(subtotalTaxable)}</span>
              </div>
            )}
            {tps > 0 && (
              <div className="flex justify-between text-neutral-400 text-[12px]">
                <span>TPS @ 5%</span>
                <span className="tabular-nums font-medium">{formatCurrency(tps)}</span>
              </div>
            )}
            {tvq > 0 && (
              <div className="flex justify-between text-neutral-400 text-[12px]">
                <span>TVQ @ 9,975%</span>
                <span className="tabular-nums font-medium">{formatCurrency(tvq)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Total ── */}
      <div className="mx-8 border-t border-dotted border-neutral-200" />
      <div className="px-8 py-4">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-neutral-900 text-[15px]">Total</span>
          <span className="font-bold text-neutral-900 text-[18px] tabular-nums tracking-tight">
            {formatCurrency(montantTotal)}
          </span>
        </div>
        {montantPaye > 0 && (
          <>
            <div className="flex justify-between text-neutral-400 text-[12px] mt-2">
              <span>Déjà payé</span>
              <span className="tabular-nums font-medium">
                −{formatCurrency(montantPaye)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700 text-[14px] mt-1">
              <span>Solde dû</span>
              <span className="tabular-nums">{formatCurrency(balanceDue)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Separator ── */}
      <div className="mx-8 h-px bg-gradient-to-r from-neutral-200 via-neutral-100 to-transparent" />

      {/* ── Footer: Signature + Note ── */}
      <div className="px-8 py-5">
        <p className="font-semibold text-neutral-800 text-[13px]">{cabinet?.nom}</p>
        {clientNote && (
          <p className="text-neutral-400 text-[11px] mt-1.5 italic leading-relaxed max-w-xs">
            {clientNote}
          </p>
        )}
      </div>

      {/* ── Payment info ── */}
      <div className="mx-8 border-t border-dotted border-neutral-200" />
      <div className="px-8 py-4 pb-6">
        <p className="text-[10px] text-neutral-300 text-center leading-relaxed tracking-wide">
          Paiement par virement bancaire ou chèque à l&apos;ordre de{" "}
          <span className="font-medium text-neutral-400">{cabinet?.nom ?? "—"}</span>
        </p>
      </div>
    </article>
  );
}
