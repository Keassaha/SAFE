"use client";

import { formatCalendarDate, formatCurrency } from "@/lib/utils/format";
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

const kicker = "text-[10px] font-medium uppercase tracking-[0.18em] text-si-muted";

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
  const fmtDate = (d: Date | string) => formatCalendarDate(d, language);
  const fmtMoney = (n: number) => formatCurrency(n, "CAD", language);

  return (
    <article
      className={`bg-si-surface text-si-ink ${className}`}
      style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
    >
      {/* Une seule couleur d'accent sur le document. */}
      <div className="h-1 bg-si-ink-strong" />

      {/* ── Hero: FACTURE kicker + invoice number + dates ── */}
      <div className="px-10 pt-9 pb-7">
        <div className="flex justify-between items-start gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-si-verified">
                {t.invoiceKicker}
              </p>
              {isDraft && (
                <span className="rounded border border-si-line bg-si-canvas px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-si-muted">
                  {t.draftBadge}
                </span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-[26px] font-medium leading-none tracking-tight tabular-nums text-si-ink">
              {numero || "—"}
            </p>
          </div>
          <div className="text-right space-y-2.5 shrink-0">
            <div>
              <p className={kicker}>{t.issuedOn}</p>
              <p className="mt-0.5 font-mono text-[12.5px] font-medium tabular-nums text-si-ink">
                {fmtDate(dateEmission)}
              </p>
            </div>
            <div>
              <p className={kicker}>{t.dueDate}</p>
              <p className="mt-0.5 font-mono text-[12.5px] font-medium tabular-nums text-si-ink">
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
          <div className="border-t border-si-line pt-4">
            <p className={`${kicker} mb-2`}>{t.issuedBy}</p>
            <p className="text-[13.5px] font-medium leading-tight text-si-ink">
              {cabinet?.nom ?? t.cabinetFallback}
            </p>
            {cabinet?.adresse && (
              <p className="mt-1.5 whitespace-pre-line text-[11.5px] leading-relaxed text-si-muted">
                {cabinet.adresse}
              </p>
            )}
            {(cabinet?.telephone || cabinet?.email) && (
              <div className="mt-1.5 space-y-0.5 text-[11.5px] text-si-muted">
                {cabinet?.telephone && <p>{cabinet.telephone}</p>}
                {cabinet?.email && <p className="truncate">{cabinet.email}</p>}
              </div>
            )}
          </div>

          {/* Recipient */}
          <div className="border-t border-si-ink-strong pt-4">
            <p className={`${kicker} mb-2 text-si-verified`}>{t.billedTo}</p>
            {client ? (
              <>
                <p className="text-[13.5px] font-medium leading-tight text-si-ink">
                  {clientDisplayName(client, t.noClient)}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {formatClientAddress(client).map((line, i) => (
                    <p key={i} className="text-[11.5px] leading-relaxed text-si-muted">
                      {line}
                    </p>
                  ))}
                </div>
                {(client.telephone || client.email) && (
                  <div className="mt-1.5 space-y-0.5 text-[11.5px] text-si-muted">
                    {client.telephone && <p>{client.telephone}</p>}
                    {client.email && <p className="truncate">{client.email}</p>}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12px] italic text-si-muted">{t.noClient}</p>
            )}
          </div>
        </div>

        {dossier && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-si-line px-3 py-1.5">
            <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-si-muted">
              {t.matter}
            </span>
            <span className="text-[12px] font-medium text-si-ink">
              {dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}
              {dossier.intitule}
            </span>
          </div>
        )}
      </div>

      {/* ── Line items table ── */}
      <div className="px-10 pb-5">
        <div className="overflow-hidden border-y border-si-line">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 bg-si-canvas px-5 py-3 text-si-ink">
            <p className="min-w-[80px] text-[10.5px] font-medium uppercase tracking-[0.16em] text-si-muted">
              {t.colDate}
            </p>
            <p className="font-medium text-[10.5px] uppercase tracking-[0.16em]">
              {t.colDescription}
            </p>
            <p className="min-w-[80px] text-right text-[10.5px] font-medium uppercase tracking-[0.16em]">
              {t.colAmount}
            </p>
          </div>

          {/* Rows */}
          <div>
            {items.length > 0 ? (
              items.map((item, i) => {
                const isRabais = item.type === "rabais";
                const isFrais = item.type === "frais_administratifs";
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-start gap-5 px-5 py-3.5 ${
                      i !== items.length - 1 ? "border-b border-si-line" : ""
                    }`}
                  >
                    <p className="min-w-[80px] whitespace-nowrap pt-0.5 font-mono text-[11.5px] tabular-nums text-si-muted">
                      {item.date ? fmtDate(item.date) : "—"}
                    </p>
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        {(isRabais || isFrais) && (
                          <span
                            className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-[0.08em] ${
                              isRabais
                                ? "border border-si-line bg-si-canvas text-si-verified"
                                : "border border-si-line bg-si-canvas text-si-muted"
                            }`}
                          >
                            {isRabais ? t.rabaisLabel : t.fraisLabel}
                          </span>
                        )}
                        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-si-ink">
                          {item.description || "—"}
                        </p>
                        {item.responsableInitiales && (
                          <span
                            className="inline-flex h-5 min-w-[28px] shrink-0 items-center justify-center rounded-md border border-si-line bg-si-canvas px-1.5 text-[9px] font-medium tracking-wide tabular-nums text-si-verified"
                            title={item.responsable ?? undefined}
                          >
                            {item.responsableInitiales}
                          </span>
                        )}
                      </div>
                      {(item.responsable || (item.hours != null && item.hours > 0)) && (
                        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium text-si-muted">
                          {item.hours != null && item.hours > 0 && (
                            <span>
                              {item.hours}h × {item.rate != null ? fmtMoney(item.rate) : "—"}/h
                            </span>
                          )}
                          {item.responsable && (
                            <>
                              {item.hours != null && item.hours > 0 && <span className="text-si-line">·</span>}
                              <span>{t.by} {item.responsable}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <p
                      className={`min-w-[80px] whitespace-nowrap text-right font-mono text-[13px] font-medium tabular-nums ${
                        isRabais ? "text-si-verified" : "text-si-ink"
                      }`}
                    >
                      {fmtMoney(item.amount)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-[12px] italic text-si-muted">
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
              <div className="flex justify-between py-1 text-[12px] text-si-muted">
                <span>{t.totalFrais}</span>
                <span className="font-mono font-medium tabular-nums">+{fmtMoney(totalFrais)}</span>
              </div>
            )}
            {totalRabais > 0 && (
              <div className="flex justify-between py-1 text-[12px] text-si-verified">
                <span>{t.totalRabais}</span>
                <span className="font-mono font-medium tabular-nums">−{fmtMoney(totalRabais)}</span>
              </div>
            )}
            {subtotalTaxable > 0 && (
              <div className="mt-0.5 flex justify-between border-t border-si-line py-1 pt-1.5 text-[12px] text-si-muted">
                <span>{t.subtotal}</span>
                <span className="font-mono font-medium tabular-nums">
                  {fmtMoney(subtotalTaxable)}
                </span>
              </div>
            )}
            {hst > 0 ? (
              <div className="flex justify-between py-1 text-[12px] text-si-muted">
                <span>{t.hst}</span>
                <span className="font-mono font-medium tabular-nums">{fmtMoney(hst)}</span>
              </div>
            ) : (
              <>
                {tps > 0 && (
                  <div className="flex justify-between py-1 text-[12px] text-si-muted">
                    <span>{t.gst}</span>
                    <span className="font-mono font-medium tabular-nums">{fmtMoney(tps)}</span>
                  </div>
                )}
                {tvq > 0 && (
                  <div className="flex justify-between py-1 text-[12px] text-si-muted">
                    <span>{t.qst}</span>
                    <span className="font-mono font-medium tabular-nums">{fmtMoney(tvq)}</span>
                  </div>
                )}
              </>
            )}

            {/* Le total se distingue par un filet, jamais par une tuile colorée. */}
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-si-ink-strong px-1 py-3.5 text-si-ink">
              <span className="font-medium text-[11.5px] uppercase tracking-[0.14em] whitespace-nowrap">
                {t.total}
              </span>
              <span className="whitespace-nowrap font-mono text-[19px] font-medium tracking-tight tabular-nums">
                {fmtMoney(montantTotal)}
              </span>
            </div>

            {montantPaye > 0 && (
              <>
                <div className="flex justify-between pt-2 text-[12px] text-si-muted">
                  <span>{t.alreadyPaid}</span>
                  <span className="font-mono font-medium tabular-nums">
                    −{fmtMoney(montantPaye)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-si-line pt-0.5 text-[13px] font-medium text-si-ink">
                  <span className="pt-1.5">{t.balanceDue}</span>
                  <span className="pt-1.5 font-mono tabular-nums">{fmtMoney(balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Message to client ── */}
      {clientNote && (
        <div className="px-10 pb-6">
          <div className="border-l-2 border-si-ink-strong bg-si-canvas p-4">
            <p className={`${kicker} mb-1.5`}>{t.message}</p>
            <p className="text-[12px] italic leading-relaxed text-si-muted">
              {clientNote}
            </p>
          </div>
        </div>
      )}

      {/* ── Footer: Payment + Thanks ── */}
      <div className="flex items-center justify-between gap-6 border-t border-si-line bg-si-canvas px-10 py-5">
        <div className="min-w-0">
          <p className={kicker}>{t.payment}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-si-muted">
            {t.paymentInstruction}{" "}
            <span className="font-medium text-si-ink">{cabinet?.nom ?? "—"}</span>
          </p>
        </div>
        <p className="whitespace-nowrap text-[11px] italic text-si-muted">
          {t.thanks}
        </p>
      </div>
    </article>
  );
}
