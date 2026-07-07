"use client";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import { clientDisplayName } from "@/lib/clients/normalize-name";

export type InvoiceLanguage = "fr" | "en";

const LABELS = {
  fr: {
    invoiceKicker: "Facture",
    draftBadge: "Brouillon",
    issuedOn: "Émise le",
    dueDate: "Échéance",
    issuedBy: "Émise par",
    billedTo: "Adressée à",
    noClient: "Aucun client sélectionné",
    matter: "Dossier",
    colDescription: "Description",
    colDate: "Date",
    colAmount: "Montant",
    noLines: "Aucune ligne de facturation",
    subtotal: "Sous-total",
    subtotalHonoraires: "Sous-total honoraires",
    rabaisLabel: "Rabais",
    fraisLabel: "Frais",
    totalRabais: "Rabais accordé",
    totalFrais: "Frais administratifs",
    gst: "TPS (5%)",
    qst: "TVQ (9,975%)",
    hst: "TVH (13%)",
    total: "Total",
    alreadyPaid: "Déjà payé",
    balanceDue: "Solde dû",
    message: "Message",
    payment: "Règlement",
    paymentInstruction: "Virement ou chèque à l'ordre de",
    thanks: "Merci de votre confiance.",
    by: "Par",
    cabinetFallback: "Cabinet",
  },
  en: {
    invoiceKicker: "Invoice",
    draftBadge: "Draft",
    issuedOn: "Issued on",
    dueDate: "Due date",
    issuedBy: "From",
    billedTo: "Billed to",
    noClient: "No client selected",
    matter: "Matter",
    colDescription: "Description",
    colDate: "Date",
    colAmount: "Amount",
    noLines: "No billing lines",
    subtotal: "Subtotal",
    subtotalHonoraires: "Fees subtotal",
    rabaisLabel: "Discount",
    fraisLabel: "Fee",
    totalRabais: "Discount applied",
    totalFrais: "Administrative fees",
    gst: "GST (5%)",
    qst: "QST (9.975%)",
    hst: "HST (13%)",
    total: "Total",
    alreadyPaid: "Already paid",
    balanceDue: "Balance due",
    message: "Message",
    payment: "Payment",
    paymentInstruction: "Wire transfer or cheque payable to",
    thanks: "Thank you for your business.",
    by: "By",
    cabinetFallback: "Firm",
  },
} as const;

export type InvoiceCleanItem = {
  id: string;
  description: string;
  amount: number;
  hours?: number | null;
  rate?: number | null;
  date?: string | Date;
  type?: string;
  /** Full name of the responsible lawyer (e.g. "Me M.-A. Derisier"). */
  responsable?: string | null;
  /** Short form (e.g. "MD") — rendered when space is tight. */
  responsableInitiales?: string | null;
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
    prenom?: string | null;
    nom?: string | null;
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
  /** Total des rabais accordés sur la facture (positif). Affiché s'il > 0. */
  totalRabais?: number;
  /** Total des frais administratifs (positif). Affiché s'il > 0. */
  totalFrais?: number;
  /** Quebec GST (TPS 5%). Leave at 0 for Ontario / HST cabinets. */
  tps?: number;
  /** Quebec QST (TVQ 9,975%). Leave at 0 for Ontario / HST cabinets. */
  tvq?: number;
  /** Ontario HST (13%). When > 0, takes precedence over TPS/TVQ in the display. */
  hst?: number;
  montantTotal: number;
  montantPaye?: number;
  balanceDue?: number;
  clientNote?: string | null;
  className?: string;
  /** Display language for all localized labels. Defaults to "fr". */
  language?: InvoiceLanguage;
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

const kicker = "text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400";

export function InvoiceTemplateClean({
  numero,
  dateEmission,
  dateEcheance,
  cabinet,
  client,
  dossier,
  items,
  subtotalTaxable = 0,
  totalRabais = 0,
  totalFrais = 0,
  tps = 0,
  tvq = 0,
  hst = 0,
  montantTotal,
  montantPaye = 0,
  balanceDue = 0,
  clientNote,
  className = "",
  language = "fr",
}: InvoiceCleanProps) {
  const t = LABELS[language];
  const isDraft = !numero || numero === "BROUILLON" || numero === "—";
  const fmtDate = (d: Date | string) => formatDate(d, language);
  const fmtMoney = (n: number) => formatCurrency(n, "CAD", language);

  return (
    <article
      className={`bg-white text-neutral-800 ${className}`}
      style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
    >
      {/* ── Top accent bar ── */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

      {/* ── Hero: FACTURE kicker + invoice number + dates ── */}
      <div className="px-10 pt-9 pb-7">
        <div className="flex justify-between items-start gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
                {t.invoiceKicker}
              </p>
              {isDraft && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-[0.14em]">
                  {t.draftBadge}
                </span>
              )}
            </div>
            <p className="font-bold text-neutral-900 text-[26px] tracking-tight mt-1.5 tabular-nums leading-none">
              {numero || "—"}
            </p>
          </div>
          <div className="text-right space-y-2.5 shrink-0">
            <div>
              <p className={kicker}>{t.issuedOn}</p>
              <p className="text-neutral-800 text-[12.5px] mt-0.5 font-semibold tabular-nums">
                {fmtDate(dateEmission)}
              </p>
            </div>
            <div>
              <p className={kicker}>{t.dueDate}</p>
              <p className="text-neutral-800 text-[12.5px] mt-0.5 font-semibold tabular-nums">
                {fmtDate(dateEcheance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── From / To ── */}
      <div className="px-10 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Issuer */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-100">
            <p className={`${kicker} mb-2`}>{t.issuedBy}</p>
            <p className="font-bold text-neutral-900 text-[13.5px] leading-tight">
              {cabinet?.nom ?? t.cabinetFallback}
            </p>
            {cabinet?.adresse && (
              <p className="text-neutral-500 text-[11.5px] mt-1.5 leading-relaxed whitespace-pre-line">
                {cabinet.adresse}
              </p>
            )}
            {(cabinet?.telephone || cabinet?.email) && (
              <div className="mt-1.5 space-y-0.5 text-[11.5px] text-neutral-500">
                {cabinet?.telephone && <p>{cabinet.telephone}</p>}
                {cabinet?.email && <p className="truncate">{cabinet.email}</p>}
              </div>
            )}
          </div>

          {/* Recipient */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/70">
            <p className={`${kicker} text-emerald-700 mb-2`}>{t.billedTo}</p>
            {client ? (
              <>
                <p className="font-bold text-neutral-900 text-[13.5px] leading-tight">
                  {clientDisplayName(client, t.noClient)}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {formatClientAddress(client).map((line, i) => (
                    <p key={i} className="text-neutral-500 text-[11.5px] leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                {(client.telephone || client.email) && (
                  <div className="mt-1.5 space-y-0.5 text-[11.5px] text-neutral-500">
                    {client.telephone && <p>{client.telephone}</p>}
                    {client.email && <p className="truncate">{client.email}</p>}
                  </div>
                )}
              </>
            ) : (
              <p className="text-neutral-300 italic text-[12px]">{t.noClient}</p>
            )}
          </div>
        </div>

        {dossier && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/[0.03] border border-neutral-100">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              {t.matter}
            </span>
            <span className="text-neutral-700 text-[12px] font-medium">
              {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
              {dossier.intitule}
            </span>
          </div>
        )}
      </div>

      {/* ── Line items table ── */}
      <div className="px-10 pb-5">
        <div className="rounded-xl overflow-hidden border border-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 bg-neutral-900 text-white px-5 py-3">
            <p className="font-semibold text-[10.5px] uppercase tracking-[0.16em] text-neutral-300 min-w-[80px]">
              {t.colDate}
            </p>
            <p className="font-semibold text-[10.5px] uppercase tracking-[0.16em]">
              {t.colDescription}
            </p>
            <p className="font-semibold text-[10.5px] uppercase tracking-[0.16em] text-right min-w-[80px]">
              {t.colAmount}
            </p>
          </div>

          {/* Rows */}
          <div>
            {items.length > 0 ? (
              items.map((item, i) => {
                const isRabais = item.type === "rabais";
                const isFrais = item.type === "frais_administratifs";
                const rowBg = isRabais
                  ? "bg-emerald-50/50"
                  : isFrais
                    ? "bg-amber-50/40"
                    : i % 2 === 1
                      ? "bg-neutral-50/40"
                      : "bg-white";
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-start gap-5 px-5 py-3.5 ${
                      i !== items.length - 1 ? "border-b border-neutral-100" : ""
                    } ${rowBg}`}
                  >
                    <p className="text-neutral-500 text-[11.5px] tabular-nums whitespace-nowrap min-w-[80px] pt-0.5">
                      {item.date ? fmtDate(item.date) : "—"}
                    </p>
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        {(isRabais || isFrais) && (
                          <span
                            className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-[0.08em] ${
                              isRabais
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isRabais ? t.rabaisLabel : t.fraisLabel}
                          </span>
                        )}
                        <p className="text-neutral-800 text-[12.5px] leading-snug flex-1 min-w-0">
                          {item.description || "—"}
                        </p>
                        {item.responsableInitiales && (
                          <span
                            className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-[20px] px-1.5 rounded-md bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-700 tracking-wide tabular-nums"
                            title={item.responsable ?? undefined}
                          >
                            {item.responsableInitiales}
                          </span>
                        )}
                      </div>
                      {(item.responsable || (item.hours != null && item.hours > 0)) && (
                        <p className="text-neutral-400 text-[10.5px] mt-1 font-medium flex items-center gap-1.5 flex-wrap">
                          {item.hours != null && item.hours > 0 && (
                            <span>
                              {item.hours}h × {item.rate != null ? fmtMoney(item.rate) : "—"}/h
                            </span>
                          )}
                          {item.responsable && (
                            <>
                              {item.hours != null && item.hours > 0 && <span className="text-neutral-200">·</span>}
                              <span>{t.by} {item.responsable}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <p
                      className={`font-semibold tabular-nums text-[13px] whitespace-nowrap text-right min-w-[80px] ${
                        isRabais ? "text-emerald-700" : "text-neutral-900"
                      }`}
                    >
                      {fmtMoney(item.amount)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-neutral-300 italic text-[12px] text-center">
                {t.noLines}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Taxes + Total (right-aligned column) ── */}
      <div className="px-10 pb-6">
        <div className="flex justify-end">
          <div className="w-full sm:w-[58%] space-y-1">
            {totalFrais > 0 && (
              <div className="flex justify-between text-amber-700 text-[12px] py-1">
                <span>{t.totalFrais}</span>
                <span className="tabular-nums font-medium">+{fmtMoney(totalFrais)}</span>
              </div>
            )}
            {totalRabais > 0 && (
              <div className="flex justify-between text-emerald-700 text-[12px] py-1">
                <span>{t.totalRabais}</span>
                <span className="tabular-nums font-medium">−{fmtMoney(totalRabais)}</span>
              </div>
            )}
            {subtotalTaxable > 0 && (
              <div className="flex justify-between text-neutral-500 text-[12px] py-1 border-t border-neutral-100/60 pt-1.5 mt-0.5">
                <span>{t.subtotal}</span>
                <span className="tabular-nums font-medium">
                  {fmtMoney(subtotalTaxable)}
                </span>
              </div>
            )}
            {hst > 0 ? (
              <div className="flex justify-between text-neutral-500 text-[12px] py-1">
                <span>{t.hst}</span>
                <span className="tabular-nums font-medium">{fmtMoney(hst)}</span>
              </div>
            ) : (
              <>
                {tps > 0 && (
                  <div className="flex justify-between text-neutral-500 text-[12px] py-1">
                    <span>{t.gst}</span>
                    <span className="tabular-nums font-medium">{fmtMoney(tps)}</span>
                  </div>
                )}
                {tvq > 0 && (
                  <div className="flex justify-between text-neutral-500 text-[12px] py-1">
                    <span>{t.qst}</span>
                    <span className="tabular-nums font-medium">{fmtMoney(tvq)}</span>
                  </div>
                )}
              </>
            )}

            {/* Total — hero tile */}
            <div className="mt-3 flex justify-between items-baseline gap-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-3.5 shadow-lg shadow-emerald-500/25">
              <span className="font-bold text-[11.5px] uppercase tracking-[0.14em] whitespace-nowrap">
                {t.total}
              </span>
              <span className="font-bold text-[19px] tabular-nums tracking-tight whitespace-nowrap">
                {fmtMoney(montantTotal)}
              </span>
            </div>

            {montantPaye > 0 && (
              <>
                <div className="flex justify-between text-neutral-500 text-[12px] pt-2">
                  <span>{t.alreadyPaid}</span>
                  <span className="tabular-nums font-medium">
                    −{fmtMoney(montantPaye)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 text-[13px] font-bold pt-0.5 border-t border-emerald-100 mt-1">
                  <span className="pt-1.5">{t.balanceDue}</span>
                  <span className="tabular-nums pt-1.5">{fmtMoney(balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Message to client ── */}
      {clientNote && (
        <div className="px-10 pb-6">
          <div className="p-4 rounded-xl bg-neutral-50 border-l-2 border-emerald-400">
            <p className={`${kicker} mb-1.5`}>{t.message}</p>
            <p className="text-neutral-600 text-[12px] leading-relaxed italic">
              {clientNote}
            </p>
          </div>
        </div>
      )}

      {/* ── Footer: Payment + Thanks ── */}
      <div className="bg-neutral-50/70 border-t border-neutral-100 px-10 py-5 flex justify-between items-center gap-6">
        <div className="min-w-0">
          <p className={kicker}>{t.payment}</p>
          <p className="text-neutral-600 text-[12px] mt-1 leading-relaxed">
            {t.paymentInstruction}{" "}
            <span className="font-semibold text-neutral-800">{cabinet?.nom ?? "—"}</span>
          </p>
        </div>
        <p className="text-neutral-400 text-[11px] italic whitespace-nowrap">
          {t.thanks}
        </p>
      </div>
    </article>
  );
}
